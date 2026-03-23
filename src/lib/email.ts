import nodemailer from "nodemailer";

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "mail.allbag.pl",
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false, // STARTTLS
    auth: {
      user: process.env.SMTP_USER ?? "",
      pass: process.env.SMTP_PASS ?? "",
    },
  });
}

const FROM_ADDRESS =
  process.env.SMTP_FROM ?? "Kalkulator 2026 <kalkulator@allbag.pl>";
const BASE_URL = process.env.AUTH_URL ?? "http://localhost/kalkulator2026";

function emailTemplate(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#080812;font-family:'Inter',Arial,sans-serif;color:#f0f0ff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#080812;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background-color:rgba(17,17,51,0.8);border:1px solid rgba(99,102,241,0.2);border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:24px 32px;border-bottom:1px solid rgba(99,102,241,0.15);">
              <span style="font-size:18px;font-weight:700;color:#f0f0ff;">Kalkulator 2026</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;border-top:1px solid rgba(99,102,241,0.15);text-align:center;">
              <span style="font-size:12px;color:#606080;">ALLBAG &mdash; System Zarządzania Biznesem</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendPasswordResetEmail(
  to: string,
  token: string
): Promise<void> {
  const resetUrl = `${BASE_URL}/reset-password?token=${token}`;

  const bodyHtml = `
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#f0f0ff;">Reset hasła</h2>
    <p style="margin:0 0 24px;color:#a0a0c0;line-height:1.6;">
      Otrzymaliśmy prośbę o reset hasła dla Twojego konta. Kliknij poniższy przycisk, aby ustawić nowe hasło.
    </p>
    <p style="margin:0 0 24px;">
      <a href="${resetUrl}"
         style="display:inline-block;padding:12px 28px;background-color:#6366f1;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
        Resetuj hasło
      </a>
    </p>
    <p style="margin:0 0 8px;color:#606080;font-size:13px;">Link jest ważny przez 1 godzinę.</p>
    <p style="margin:0;color:#606080;font-size:13px;">
      Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość.
    </p>
  `;

  const transport = createTransport();
  await transport.sendMail({
    from: FROM_ADDRESS,
    to,
    subject: "Reset hasła — Kalkulator 2026",
    html: emailTemplate("Reset hasła", bodyHtml),
  });
}

export async function sendVerificationEmail(
  to: string,
  token: string
): Promise<void> {
  const verifyUrl = `${BASE_URL}/verify-email?token=${token}`;

  const bodyHtml = `
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#f0f0ff;">Potwierdź adres email</h2>
    <p style="margin:0 0 24px;color:#a0a0c0;line-height:1.6;">
      Dziękujemy za rejestrację w systemie Kalkulator 2026. Kliknij poniższy przycisk, aby potwierdzić swój adres email.
    </p>
    <p style="margin:0 0 24px;">
      <a href="${verifyUrl}"
         style="display:inline-block;padding:12px 28px;background-color:#6366f1;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
        Potwierdź email
      </a>
    </p>
    <p style="margin:0;color:#606080;font-size:13px;">
      Jeśli nie rejestrowałeś się w tym systemie, zignoruj tę wiadomość.
    </p>
  `;

  const transport = createTransport();
  await transport.sendMail({
    from: FROM_ADDRESS,
    to,
    subject: "Potwierdź adres email — Kalkulator 2026",
    html: emailTemplate("Potwierdzenie email", bodyHtml),
  });
}

export async function sendQuotationEmail(opts: {
  to: string;
  quotationNumber: string;
  customerName: string;
  pdfBuffer: Buffer;
  pdfFilename: string;
}): Promise<void> {
  const bodyHtml = `
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#f0f0ff;">Wycena ${opts.quotationNumber}</h2>
    <p style="margin:0 0 24px;color:#a0a0c0;line-height:1.6;">
      Szanowny/a ${opts.customerName},<br>
      w załączeniu przesyłamy wycenę nr <strong style="color:#f0f0ff;">${opts.quotationNumber}</strong>.
    </p>
    <p style="margin:0;color:#606080;font-size:13px;">
      W razie pytań prosimy o kontakt — zespół ALLBAG.
    </p>
  `;
  const transport = createTransport();
  await transport.sendMail({
    from: FROM_ADDRESS,
    to: opts.to,
    subject: `Wycena ${opts.quotationNumber} — ALLBAG`,
    html: emailTemplate(`Wycena ${opts.quotationNumber}`, bodyHtml),
    attachments: [
      {
        filename: opts.pdfFilename,
        content: opts.pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
}
