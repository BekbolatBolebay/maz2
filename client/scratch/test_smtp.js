const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

async function testSmtp() {
    console.log('--- SMTP Diagnostic Tool ---');
    
    // Attempt to manually parse .env if dotenv is tricky
    const envPath = '/home/bekbolat/Жүктемелер/mazirapp-main/client/.env';
    console.log('Reading .env from:', envPath);
    
    if (!fs.existsSync(envPath)) {
        console.error('❌ .env file NOT FOUND at expected path');
        // Let's check parent dir just in case
        const parentEnv = '/home/bekbolat/Жүктемелер/mazirapp-main/.env';
        if (fs.existsSync(parentEnv)) {
             console.log('Found .env in root! Using it instead.');
             // Proceed with parentEnv
        } else {
            return;
        }
    }

    const targetPath = fs.existsSync(envPath) ? envPath : '/home/bekbolat/Жүктемелер/mazirapp-main/.env';
    const envContent = fs.readFileSync(targetPath, 'utf8');
    const env = {};
    envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            env[key.trim()] = valueParts.join('=').trim().replace(/"/g, '').replace(/'/g, '');
        }
    });

    const user = env.SMTP_USER || env.EMAIL_USER;
    const pass = env.SMTP_PASS || env.EMAIL_PASS;
    const host = env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(env.SMTP_PORT) || 465;

    console.log(`Config: host=${host}, port=${port}, user=${user}, hasPass=${!!pass}`);

    if (!user || !pass) {
        console.error('❌ Missing credentials in .env');
        return;
    }

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
            user,
            pass
        },
        tls: {
            rejectUnauthorized: false
        },
        debug: true,
        logger: true
    });

    console.log('Verifying connection...');
    try {
        await transporter.verify();
        console.log('✅ SMTP Connection verified successfully!');
        
        console.log('Attempting to send test email to target user...');
        // We will try to send a real test mail to the user themselves if they follow along
        const info = await transporter.sendMail({
            from: env.SMTP_FROM || `Mazir App <${user}>`,
            to: user, 
            subject: 'SMTP Test from Mazir App',
            text: 'If you see this, your SMTP configuration is correct and emails are being delivered.'
        });
        console.log('✅ Test email sent:', info.messageId);
    } catch (err) {
        console.error('❌ SMTP FAILURE:', err);
        if (err.message.includes('Invalid login') || err.message.includes('Username and Password not accepted')) {
            console.log('\n💡 HINT: If using Gmail, you MUST use an "App Password".\n1. Go to Google Account -> Security.\n2. Enable 2-Step Verification.\n3. Search for "App Passwords".\n4. Generate one for "Mail" and use that 16-character code as your SMTP_PASS.');
        }
    }
}

testSmtp();
