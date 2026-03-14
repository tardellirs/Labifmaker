interface EmailLayoutProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  bodyHtml: string;
  accent?: string;
}

function renderLayout({
  eyebrow,
  title,
  subtitle,
  bodyHtml,
  accent = "#0077b6"
}: EmailLayoutProps) {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
      </head>
      <body style="margin:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#0f172a;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:28px;overflow:hidden;box-shadow:0 20px 60px rgba(15,23,42,0.10);">
                <tr>
                  <td style="background:linear-gradient(135deg, ${accent}, #ff7a18);padding:32px;">
                    <div style="display:inline-block;padding:8px 12px;border-radius:999px;background:rgba(255,255,255,0.16);font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#ffffff;">${eyebrow}</div>
                    <h1 style="margin:18px 0 8px;font-size:30px;line-height:1.1;color:#ffffff;">${title}</h1>
                    <p style="margin:0;font-size:16px;line-height:1.6;color:rgba(255,255,255,0.88);">${subtitle}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px;">
                    ${bodyHtml}
                    <p style="margin:28px 0 0;font-size:14px;line-height:1.7;color:#475569;">
                      LabIF Maker Jacarei<br />
                      Instituto Federal de Sao Paulo
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

interface NewBookingEmailProps {
  professorNome: string;
  professorEmail: string;
  equipamento: string;
  dataSolicitada: string;
  detalhesTecnicos: string;
}

export function renderCoordinatorNewBookingEmail({
  professorNome,
  professorEmail,
  equipamento,
  dataSolicitada,
  detalhesTecnicos
}: NewBookingEmailProps) {
  return renderLayout({
    eyebrow: "Novo Agendamento",
    title: "Novo pedido aguardando avaliacao",
    subtitle: "A coordenacao recebeu uma nova solicitacao enviada pelo portal do LabIF Maker.",
    bodyHtml: `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#334155;">Um novo agendamento foi registrado e precisa de validacao.</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0 12px;">
        <tr><td style="padding:18px;border-radius:18px;background:#f8fafc;"><strong>Professor</strong><br />${professorNome}<br />${professorEmail}</td></tr>
        <tr><td style="padding:18px;border-radius:18px;background:#f8fafc;"><strong>Equipamento</strong><br />${equipamento}</td></tr>
        <tr><td style="padding:18px;border-radius:18px;background:#f8fafc;"><strong>Data solicitada</strong><br />${dataSolicitada}</td></tr>
        <tr><td style="padding:18px;border-radius:18px;background:#f8fafc;"><strong>Detalhes tecnicos</strong><br />${detalhesTecnicos}</td></tr>
      </table>
    `
  });
}

interface BookingStatusEmailProps {
  professorNome: string;
  status: "aprovado" | "rejeitado";
  equipamento: string;
  dataSolicitada: string;
  comentario?: string;
}

export function renderBookingStatusEmail({
  professorNome,
  status,
  equipamento,
  dataSolicitada,
  comentario
}: BookingStatusEmailProps) {
  const approved = status === "aprovado";

  return renderLayout({
    eyebrow: approved ? "Agendamento Aprovado" : "Agendamento Rejeitado",
    title: approved ? "Seu horario foi aprovado" : "Seu pedido precisa de ajustes",
    subtitle: approved
      ? "A coordenacao confirmou o uso do equipamento solicitado."
      : "A coordenacao analisou a solicitacao e registrou um retorno no portal.",
    accent: approved ? "#2b6f67" : "#c2410c",
    bodyHtml: `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#334155;">Ola, ${professorNome}. Segue o retorno do seu pedido.</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0 12px;">
        <tr><td style="padding:18px;border-radius:18px;background:#f8fafc;"><strong>Equipamento</strong><br />${equipamento}</td></tr>
        <tr><td style="padding:18px;border-radius:18px;background:#f8fafc;"><strong>Data solicitada</strong><br />${dataSolicitada}</td></tr>
        <tr><td style="padding:18px;border-radius:18px;background:#f8fafc;"><strong>Status</strong><br />${approved ? "Aprovado" : "Rejeitado"}</td></tr>
        ${
          comentario
            ? `<tr><td style="padding:18px;border-radius:18px;background:#fff7ed;"><strong>Comentario da coordenacao</strong><br />${comentario}</td></tr>`
            : ""
        }
      </table>
    `
  });
}
