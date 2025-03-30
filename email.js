import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendVerdictEmail(to, username, verdict, type, message) {
  if (!to || !username || !verdict || !type) {
    throw new Error("Missing required email parameters.");
  }

  const subject = `Your ${type} appeal has been ${verdict}`;
  const html = `
    <p>Hello ${username},</p>
    <p>Your <strong>${type}</strong> appeal has been <strong>${verdict}</strong>.</p>
    ${message ? `<p><em>Staff notes:</em><br/>${message}</p>` : ""}
    <p>Thanks,<br/>Torrent Network Staff</p>
  `;

  return transporter.sendMail({
    from: process.env.EMAIL_SENDAS,
    to,
    subject,
    html,
  });
}
