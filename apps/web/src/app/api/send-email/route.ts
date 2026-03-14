import { NextResponse } from "next/server";
import { z } from "zod";

import {
  renderBookingStatusEmail,
  renderCoordinatorNewBookingEmail
} from "@/lib/email/templates";
import { sendTransactionalEmail } from "@/lib/email/sender";

const sendEmailSchema = z.discriminatedUnion("template", [
  z.object({
    template: z.literal("novo-agendamento"),
    to: z.string().email(),
    payload: z.object({
      professorNome: z.string(),
      professorEmail: z.string().email(),
      equipamento: z.string(),
      dataSolicitada: z.string(),
      detalhesTecnicos: z.string()
    })
  }),
  z.object({
    template: z.literal("status-agendamento"),
    to: z.string().email(),
    payload: z.object({
      professorNome: z.string(),
      status: z.union([z.literal("aprovado"), z.literal("rejeitado")]),
      equipamento: z.string(),
      dataSolicitada: z.string(),
      justificativa: z.string().optional()
    })
  })
]);

export async function POST(request: Request) {
  try {
    const body = sendEmailSchema.parse(await request.json());

    const subject =
      body.template === "novo-agendamento"
        ? `Novo agendamento | ${body.payload.equipamento}`
        : `Status do agendamento | ${body.payload.status === "aprovado" ? "Aprovado" : "Rejeitado"}`;

    const html =
      body.template === "novo-agendamento"
        ? renderCoordinatorNewBookingEmail(body.payload)
        : renderBookingStatusEmail(body.payload);

    await sendTransactionalEmail({
      to: body.to,
      subject,
      html
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Falha ao enviar e-mail." }, { status: 400 });
  }
}
