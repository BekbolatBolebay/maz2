const nodemailer = require('nodemailer');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

async function test() {
    console.log('SMTP_USER:', process.env.SMTP_USER);
    console.log('SMTP_PASS length:', process.env.SMTP_PASS?.length);
    console.log('SMTP_FROM:', process.env.SMTP_FROM);

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    try {
        await transporter.verify();
        console.log('SMTP connection successful!');

        await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: process.env.SMTP_USER,
            subject: 'Test OTP',
            text: 'Your test code is 123456',
        });
        console.log('Test email sent successfully!');
    } catch (error) {
        console.error('SMTP Error:', error);
    }
}

test();
