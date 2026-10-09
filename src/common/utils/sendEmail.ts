import nodemailer from "nodemailer";
import { env } from "../../config/env";
import { logger } from "../../config/logger";

const transporter =
  env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS
    ? nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT ?? 587,
        secure: false,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
      })
    : null;

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({ to, subject, html }: SendEmailOptions): Promise<void> => {
  if (!transporter) {
    logger.warn(`SMTP not configured. Skipping email to ${to} - "${subject}"`);
    return;
  }

  await transporter.sendMail({ from: env.SMTP_FROM, to, subject, html });
};
