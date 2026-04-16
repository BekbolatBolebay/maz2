'use server'

import nodemailer from 'nodemailer'
import { createAdminClient } from '@/lib/supabase/admin'
import { Database } from '@/lib/supabase/types'

// Transporter will be created dynamically based on config

export async function sendCustomOtp(email: string, fullName: string = '', phone: string = '') {
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes

    const supabase = createAdminClient()

    // Save OTP to DB
    const { error: dbError } = await (supabase
        .from('otp_codes') as any)
        .insert({
            email,
            code,
            full_name: fullName,
            phone,
            expires_at: expiresAt
        })

    if (dbError) {
        console.error('Error saving OTP:', dbError)
        throw new Error('Қате орын алды. Қайта көріңіз.')
    }

    // Send Email
    try {
        console.log(`[OTP] Preparing to send code ${code} to ${email}`);
        
        if (process.env.MOCK_MAIL === 'true' || process.env.NODE_ENV === 'development' && !process.env.SMTP_USER) {
            console.log('--- MAIL MOCK MODE ACTIVE ---');
            console.log(`Target Email: ${email}`);
            console.log(`OTP Code: ${code}`);
            return { success: true, mock: true };
        }

        const smtpUser = (process.env.SMTP_USER || process.env.EMAIL_USER || '').trim();
        const smtpPass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || '').trim();
        const smtpHost = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
        const smtpPort = Number(process.env.SMTP_PORT) || 465;

        if (!smtpUser || !smtpPass) {
            console.error('[SMTP] Missing credentials!');
            throw new Error('SMTP баптаулары табылмады (.env тексеріңіз)');
        }

        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465, 
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
            tls: {
                rejectUnauthorized: false,
                // Some providers need this
                minVersion: 'TLSv1.2'
            },
            connectionTimeout: 10000, // 10s
            greetingTimeout: 10000,
            socketTimeout: 15000,
            debug: true,
            logger: true
        });

        console.log(`[SMTP] Sending from ${smtpUser}...`);
        
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || `Mazir App <${smtpUser}>`,
            to: email,
            subject: `Mazir App: Растау коды - ${code}`,
            html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 20px auto; padding: 30px; border-radius: 20px; background-color: #ffffff; border: 1px solid #eee;">
          <h2 style="color: #ff385c; text-align: center; font-size: 24px;">Mazir App</h2>
          <p style="font-size: 16px; color: #333;">Жүйеге кіру коды:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; border-radius: 12px; color: #ff385c; margin: 20px 0;">
            ${code}
          </div>
          <p style="font-size: 12px; color: #999; text-align: center;">Код 10 минут ішінде жарамды.</p>
        </div>
      `,
        });

        console.log('[SMTP] Mail sent successfully:', info.messageId);
        return { success: true }
    } catch (emailError: any) {
        console.error('[SMTP] Fatal error:', emailError);
        const errorMessage = emailError.message || 'Белгісіз қате';
        
        // Return a clean error message that can be shown in a toast
        if (errorMessage.includes('Invalid login') || errorMessage.includes('AUTH')) {
            throw new Error('SMTP: Логин немесе пароль қате (Gmail App Password тексеріңіз)');
        }
        if (errorMessage.includes('ETIMEDOUT') || errorMessage.includes('ECONNREFUSED')) {
            throw new Error(`SMTP: Байланыс қатесі (${smtpHost}:${smtpPort})`);
        }
        
        throw new Error(`Почта жіберу мүмкін болмады: ${errorMessage}`);
    }
}

export async function verifyCustomOtp(email: string, code: string) {
    const supabase = createAdminClient()

    // 1. Check OTP in our table
    const { data: otpData, error: otpError } = await (supabase
        .from('otp_codes') as any)
        .select('*')
        .eq('email', email)
        .eq('code', code)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    if (otpError || !otpData) {
        throw new Error('Код қате немесе уақыты өтіп кеткен')
    }

    // 2. Use Supabase Admin to create/sign in the user
    const { data: authData, error: authError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
        options: {
            data: {
                full_name: (otpData as any).full_name,
                phone: (otpData as any).phone
            }
        }
    })

    if (authError) {
        console.error('Auth magic link error:', authError)
        throw new Error('Жүйеге кіру кезінде қате шықты')
    }

    // 3. Delete the used OTP code
    await (supabase.from('otp_codes') as any).delete().eq('id', (otpData as any).id)

    // Return the properties needed for the client to complete sign in
    return {
        token_hash: authData.properties.hashed_token,
        email: email
    }
}
