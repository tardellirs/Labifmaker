import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentSession } from "@/lib/auth/guards";
import { renderBookingStatusEmail } from "@/lib/email/templates";
import { sendTransactionalEmail } from "@/lib/email/sender";
import { getAdminDb } from "@/lib/firebase/admin";
import { removeBookingCalendarEvent, upsertBookingCalendarEvent } from "@/lib/google-calendar/sync";

const decisionSchema = z.object({
  decision: z.union([z.literal("aprovado"), z.literal("rejeitado")]),
  justificativa: z.string().trim().optional()
});

function formatBookingSlot(date: string, horaInicio: string, horaFim: string) {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year} · ${horaInicio} - ${horaFim}`;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ bookingId: string }> }
) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "Sessao invalida." }, { status: 401 });
  }

  if (session.papel !== "coordenador") {
    return NextResponse.json({ error: "Acesso restrito a coordenadores." }, { status: 403 });
  }

  const { bookingId } = await context.params;

  try {
    const payload = decisionSchema.parse(await request.json());
    const db = getAdminDb();
    const bookingRef = db.collection("agendamentos").doc(bookingId);
    const bookingSnapshot = await bookingRef.get();

    if (!bookingSnapshot.exists) {
      return NextResponse.json({ error: "Agendamento nao encontrado." }, { status: 404 });
    }

    const booking = bookingSnapshot.data();

    if (!booking) {
      return NextResponse.json({ error: "Agendamento invalido." }, { status: 400 });
    }

    if (booking.status !== "pendente") {
      return NextResponse.json(
        { error: "Este agendamento ja foi avaliado anteriormente." },
        { status: 409 }
      );
    }

    const comment = payload.justificativa?.trim() || undefined;

    await bookingRef.set(
      {
        status: payload.decision,
        justificativa: comment ?? FieldValue.delete(),
        avaliadorNome: session.nome,
        avaliadorEmail: session.email,
        avaliadoEm: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );

    try {
      if (payload.decision === "rejeitado") {
        await removeBookingCalendarEvent(
          typeof booking.googleCalendarEventId === "string" ? booking.googleCalendarEventId : undefined
        );

        await bookingRef.set(
          {
            googleCalendarEventId: FieldValue.delete(),
            googleCalendarHtmlLink: FieldValue.delete(),
            googleCalendarSyncedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
          },
          { merge: true }
        );
      } else {
        const calendarEvent = await upsertBookingCalendarEvent({
          id: bookingId,
          solicitanteUid: String(booking.solicitanteUid ?? ""),
          solicitanteNome: String(booking.solicitanteNome ?? ""),
          solicitanteEmail: String(booking.solicitanteEmail ?? ""),
          disponibilidadeId:
            typeof booking.disponibilidadeId === "string" ? booking.disponibilidadeId : undefined,
          equipamentoId: String(booking.equipamentoId ?? ""),
          equipamentoNome: String(booking.equipamentoNome ?? ""),
          equipamentoTipo: (booking.equipamentoTipo as "impressora_3d" | "laser" | "cnc" | "outro") ?? "outro",
          status: payload.decision,
          dataSolicitada: String(booking.dataSolicitada ?? ""),
          horaInicio: String(booking.horaInicio ?? ""),
          horaFim: String(booking.horaFim ?? ""),
          projeto: String(booking.projeto ?? ""),
          descricao: String(booking.descricao ?? ""),
          sabeOperarEquipamento: Boolean(booking.sabeOperarEquipamento),
          detalhesTecnicos:
            typeof booking.detalhesTecnicos === "object" && booking.detalhesTecnicos
              ? (booking.detalhesTecnicos as Record<string, string | number | boolean | null | undefined>)
              : {},
          justificativa: comment,
          avaliadorNome: session.nome,
          avaliadorEmail: session.email,
          googleCalendarEventId:
            typeof booking.googleCalendarEventId === "string"
              ? booking.googleCalendarEventId
              : undefined
        });

        if (calendarEvent?.id) {
          await bookingRef.set(
            {
              googleCalendarEventId: calendarEvent.id,
              googleCalendarHtmlLink:
                typeof calendarEvent.htmlLink === "string"
                  ? calendarEvent.htmlLink
                  : FieldValue.delete(),
              googleCalendarSyncedAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp()
            },
            { merge: true }
          );
        }
      }
    } catch (calendarError) {
      console.error("Falha ao sincronizar decisao com Google Calendar.", calendarError);
    }

    try {
      await sendTransactionalEmail({
        to: String(booking.solicitanteEmail ?? ""),
        subject: `Status do agendamento | ${payload.decision === "aprovado" ? "Aprovado" : "Rejeitado"}`,
        html: renderBookingStatusEmail({
          professorNome: String(booking.solicitanteNome ?? "Professor"),
          status: payload.decision,
          equipamento: String(booking.equipamentoNome ?? "Equipamento"),
          dataSolicitada: formatBookingSlot(
            String(booking.dataSolicitada ?? ""),
            String(booking.horaInicio ?? ""),
            String(booking.horaFim ?? "")
          ),
          comentario: comment
        })
      });
    } catch (emailError) {
      console.error("Falha ao enviar email de status do agendamento.", emailError);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Falha ao avaliar o agendamento."
      },
      { status: 400 }
    );
  }
}
