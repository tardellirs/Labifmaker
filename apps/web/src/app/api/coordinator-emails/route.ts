import { NextResponse } from "next/server";
import { z } from "zod";

import {
  addCoordinatorEmail,
  getCoordinatorEmails,
  getNotificationRecipientEmails,
  removeCoordinatorEmail,
  setNotificationRecipientEmails
} from "@/lib/auth/access";
import { getCurrentSession } from "@/lib/auth/guards";

const bodySchema = z.object({
  email: z.string().email()
});

const notificationBodySchema = z.object({
  emails: z.array(z.string().email())
});

function ensureCoordinator(session: Awaited<ReturnType<typeof getCurrentSession>>) {
  if (!session || session.papel !== "coordenador") {
    return false;
  }

  return true;
}

export async function GET() {
  const session = await getCurrentSession();

  if (!ensureCoordinator(session)) {
    return NextResponse.json({ error: "Acesso restrito a coordenadores." }, { status: 403 });
  }

  return NextResponse.json({
    emails: await getCoordinatorEmails(),
    notificationRecipients: await getNotificationRecipientEmails()
  });
}

export async function POST(request: Request) {
  const session = await getCurrentSession();

  if (!ensureCoordinator(session)) {
    return NextResponse.json({ error: "Acesso restrito a coordenadores." }, { status: 403 });
  }

  try {
    const payload = bodySchema.parse(await request.json());
    const emails = await addCoordinatorEmail(payload.email);

    return NextResponse.json({
      ok: true,
      emails,
      notificationRecipients: await getNotificationRecipientEmails()
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Falha ao adicionar coordenador."
      },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getCurrentSession();

  if (!ensureCoordinator(session)) {
    return NextResponse.json({ error: "Acesso restrito a coordenadores." }, { status: 403 });
  }

  try {
    const payload = bodySchema.parse(await request.json());
    const emails = await removeCoordinatorEmail(payload.email);

    return NextResponse.json({
      ok: true,
      emails,
      notificationRecipients: await getNotificationRecipientEmails()
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Falha ao remover coordenador."
      },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await getCurrentSession();

  if (!ensureCoordinator(session)) {
    return NextResponse.json({ error: "Acesso restrito a coordenadores." }, { status: 403 });
  }

  try {
    const payload = notificationBodySchema.parse(await request.json());
    const notificationRecipients = await setNotificationRecipientEmails(payload.emails);

    return NextResponse.json({ ok: true, notificationRecipients });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Falha ao atualizar destinatarios."
      },
      { status: 400 }
    );
  }
}
