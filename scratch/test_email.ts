import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env') });

const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = Number(process.env.SMTP_PORT) || 465;

console.log('Testing SMTP with:', { smtpUser, smtpHost, smtpPort, passLength: smtpPass?.length });

async function main() {
  if (!smtpUser || !smtpPass) {
    console.error('SMTP credentials missing');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: smtpUser,
      to: smtpUser, // Send to self
      subject: 'Mazir App SMTP Test',
      text: 'This is a test email to verify SMTP configuration.',
    });
    console.log('Email sent:', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

main();
