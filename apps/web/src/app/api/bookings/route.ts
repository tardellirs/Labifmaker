import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

import { getNotificationRecipientEmails } from "@/lib/auth/access";
import { getCurrentSession } from "@/lib/auth/guards";
import { formatBookingDetails } from "@/lib/bookings/serializers";
import { createBookingSchema } from "@/lib/bookings/schema";
import { getEquipmentCatalog } from "@/lib/equipment/catalog";
import { renderCoordinatorNewBookingEmail } from "@/lib/email/templates";
import { sendTransactionalEmail } from "@/lib/email/sender";
import { getAdminDb } from "@/lib/firebase/admin";
import { upsertBookingCalendarEvent } from "@/lib/google-calendar/sync";
import type { Booking } from "@/types";

function getEquipmentDisplayDate(rawDate: string, horaInicio: string, horaFim: string) {
  const [year, month, day] = rawDate.split("-");
  const dateLabel = `${day}/${month}/${year}`;

  return `${dateLabel} · ${horaInicio} - ${horaFim}`;
}

export async function POST(request: Request) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "Sessao invalida." }, { status: 401 });
  }

  try {
    const payload = createBookingSchema.parse(await request.json());
    const equipmentCatalog = await getEquipmentCatalog();
    const equipment = equipmentCatalog.find((item) => item.id === payload.equipamentoId);

    if (!equipment) {
      return NextResponse.json({ error: "Equipamento nao encontrado." }, { status: 404 });
    }

    if (equipment.status === "manutencao") {
      return NextResponse.json(
        { error: "Este equipamento esta em manutencao e nao aceita novos pedidos." },
        { status: 409 }
      );
    }

    const db = getAdminDb();
    const bookingRef = db.collection("agendamentos").doc();
    const availabilityRef = db.collection("disponibilidades").doc(payload.disponibilidadeId);
    const availabilitySnapshot = await availabilityRef.get();

    if (!availabilitySnapshot.exists) {
      return NextResponse.json({ error: "Horario disponivel nao encontrado." }, { status: 404 });
    }

    const availability = availabilitySnapshot.data();

    if (
      !availability ||
      availability.ativo === false ||
      availability.data !== payload.dataSolicitada
    ) {
      return NextResponse.json(
        { error: "O horario selecionado nao esta mais disponivel." },
        { status: 409 }
      );
    }

    if (
      payload.horaInicio < availability.horaInicio ||
      payload.horaFim > availability.horaFim ||
      payload.horaInicio >= payload.horaFim
    ) {
      return NextResponse.json(
        { error: "O horario solicitado deve estar contido dentro da disponibilidade publicada." },
        { status: 409 }
      );
    }

    const detalhesTecnicos = {};

    const bookingRecord = {
      solicitanteUid: session.uid,
      solicitanteNome: session.nome,
      solicitanteEmail: session.email,
      disponibilidadeId: payload.disponibilidadeId,
      equipamentoId: equipment.id,
      equipamentoNome: equipment.nome,
      equipamentoTipo: equipment.tipo,
      status: "pendente",
      dataSolicitada: payload.dataSolicitada,
      horaInicio: payload.horaInicio,
      horaFim: payload.horaFim,
      projeto: payload.projeto,
      descricao: payload.descricao,
      sabeOperarEquipamento: payload.sabeOperarEquipamento,
      detalhesTecnicos,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };

    await bookingRef.set(bookingRecord);

    try {
      const bookingForCalendar: Booking = {
        id: bookingRef.id,
        solicitanteUid: session.uid,
        solicitanteNome: session.nome,
        solicitanteEmail: session.email,
        disponibilidadeId: payload.disponibilidadeId,
        equipamentoId: equipment.id,
        equipamentoNome: equipment.nome,
        equipamentoTipo: equipment.tipo,
        status: "pendente",
        dataSolicitada: payload.dataSolicitada,
        horaInicio: payload.horaInicio,
        horaFim: payload.horaFim,
        projeto: payload.projeto,
        descricao: payload.descricao,
        sabeOperarEquipamento: payload.sabeOperarEquipamento,
        detalhesTecnicos
      };
      const calendarEvent = await upsertBookingCalendarEvent({
        ...bookingForCalendar
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
    } catch (calendarError) {
      console.error("Falha ao sincronizar agendamento com Google Calendar.", calendarError);
    }

    const notificationRecipients = await getNotificationRecipientEmails();
    const fallbackCoordinationEmail = process.env.LABIF_COORDINATION_EMAIL;
    const recipientList = [
      ...new Set([
        ...notificationRecipients,
        ...(fallbackCoordinationEmail ? [fallbackCoordinationEmail] : [])
      ])
    ];

    if (recipientList.length > 0) {
      try {
        await sendTransactionalEmail({
          to: recipientList,
          subject: `Novo agendamento | ${equipment.nome}`,
          html: renderCoordinatorNewBookingEmail({
            professorNome: session.nome,
            professorEmail: session.email,
            equipamento: equipment.nome,
            dataSolicitada: getEquipmentDisplayDate(
              payload.dataSolicitada,
              payload.horaInicio,
              payload.horaFim
            ),
            detalhesTecnicos: formatBookingDetails({
              projeto: payload.projeto,
              descricao: payload.descricao
            })
          })
        });
      } catch (emailError) {
        console.error("Falha ao enviar email de novo agendamento.", emailError);
      }
    }

    return NextResponse.json({
      ok: true,
      bookingId: bookingRef.id
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Falha ao criar o agendamento." }, { status: 400 });
  }
}
