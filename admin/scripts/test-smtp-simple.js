
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function testSmtp() {
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

    console.log('SMTP User:', smtpUser);
    console.log('SMTP Pass length:', smtpPass ? smtpPass.length : 0);

    if (!smtpUser || !smtpPass) {
        console.error('SMTP credentials missing');
        return;
    }

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
    });

    try {
        console.log('Verifying transporter...');
        await transporter.verify();
        console.log('Transporter verified successfully');
    } catch (error) {
        console.error('SMTP Verification Error:', error);
    }
}

testSmtp();
