import nodemailer from "nodemailer";

export function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE) === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendResetEmail(resetLink) {
  const transporter = getTransporter();

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: process.env.RESET_EMAIL,
    subject: "Admin password reset",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6">
        <h2>Admin Password Reset</h2>
        <p>You requested to reset the admin password.</p>
        <p>Click the link below to set a new password:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>This link will expire in 30 minutes.</p>
      </div>
    `,
  });
}