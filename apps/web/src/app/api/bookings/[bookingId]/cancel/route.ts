import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth/guards";
import { getAdminDb } from "@/lib/firebase/admin";
import { removeBookingCalendarEvent } from "@/lib/google-calendar/sync";

export async function POST(
  _request: Request,
  context: { params: Promise<{ bookingId: string }> }
) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
  }

  const { bookingId } = await context.params;

  try {
    const db = getAdminDb();
    const bookingRef = db.collection("agendamentos").doc(bookingId);
    const bookingSnapshot = await bookingRef.get();

    if (!bookingSnapshot.exists) {
      return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
    }

    const booking = bookingSnapshot.data();

    if (!booking) {
      return NextResponse.json({ error: "Agendamento inválido." }, { status: 400 });
    }

    if (String(booking.solicitanteUid) !== session.uid) {
      return NextResponse.json(
        { error: "Você só pode cancelar agendamentos feitos por você." },
        { status: 403 }
      );
    }

    if (booking.status !== "pendente" && booking.status !== "aprovado") {
      return NextResponse.json(
        { error: "Apenas agendamentos pendentes ou aprovados podem ser cancelados." },
        { status: 409 }
      );
    }

    await bookingRef.set(
      {
        status: "cancelado",
        justificativa: FieldValue.delete(),
        avaliadorNome: FieldValue.delete(),
        avaliadorEmail: FieldValue.delete(),
        avaliadoEm: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );

    try {
      await removeBookingCalendarEvent(
        typeof booking.googleCalendarEventId === "string"
          ? booking.googleCalendarEventId
          : undefined
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
    } catch (calendarError) {
      console.error("Falha ao remover agendamento do Google Calendar.", calendarError);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Falha ao cancelar o agendamento." },
      { status: 400 }
    );
  }
}

