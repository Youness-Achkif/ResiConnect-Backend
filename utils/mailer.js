const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendActivationEmail = async (email, nom, lien) => {
  await transporter.sendMail({
    from: `"ResiConnect" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Activez votre compte ResiConnect',
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="background:#6366f1;padding:32px 40px;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">ResiConnect</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 16px;font-size:16px;color:#111827;">Bonjour <strong>${nom}</strong>,</p>
              <p style="margin:0 0 32px;font-size:15px;color:#374151;line-height:1.6;">
                Vous avez été invité(e) à rejoindre votre résidence sur ResiConnect.
                Cliquez sur le bouton ci-dessous pour activer votre compte et définir votre mot de passe.
              </p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:6px;background:#6366f1;">
                    <a href="${lien}" target="_blank"
                       style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:6px;">
                      Activer mon compte
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:32px 0 0;font-size:13px;color:#6b7280;">
                Ce lien expire dans <strong>48 heures</strong>. Si vous n'êtes pas à l'origine de cette invitation, ignorez cet email.
              </p>
              <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;word-break:break-all;">
                Lien direct : <a href="${lien}" style="color:#6366f1;">${lien}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  });
};

module.exports = { sendActivationEmail };
