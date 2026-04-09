'use server'

import nodemailer from 'nodemailer'
import { createAdminClient } from '@/lib/supabase/admin'
import { Database } from '@/lib/supabase/types'

// Transporter will be created dynamically based on config

export async function sendCustomOtp(email: string, fullName: string, phone: string) {
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
        if (process.env.MOCK_MAIL === 'true') {
            console.log('--- MAIL MOCK MODE ---')
            console.log(`Target Email: ${email}`)
            console.log(`OTP Code: ${code}`)
            console.log('----------------------')
            return { success: true, mock: true }
        }

        const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER
        const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS
        const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
        const smtpPort = Number(process.env.SMTP_PORT) || 465

        if (!smtpUser || !smtpPass) {
            throw new Error('SMTP credentials missing. Set SMTP_USER and SMTP_PASS in .env, or use MOCK_MAIL=true for testing.')
        }

        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        })

        await transporter.sendMail({
            from: process.env.SMTP_FROM || `Mazir App <${smtpUser}>`,
            to: email,
            subject: `Mazir App: Растау коды - ${code}`,
            html: `
        <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 40px auto; padding: 40px; border-radius: 24px; background-color: #ffffff; border: 1px solid #eef2f6; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #ff385c 0%, #e31c5f 100%); border-radius: 16px; color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; box-shadow: 0 4px 12px rgba(227, 28, 95, 0.2);">
              Mazir App
            </div>
          </div>
          
          <div style="color: #1a1f36; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            Сәлеметсіз бе, <b>${fullName}</b>!<br>
            Жүйеге кіру үшін төмендегі растау кодын қолданыңыз:
          </div>
          
          <div style="background: #f8fafc; padding: 32px; text-align: center; font-size: 36px; font-weight: 800; letter-spacing: 8px; border-radius: 20px; color: #ff385c; border: 2px dashed #e2e8f0; margin: 24px 0;">
            ${code}
          </div>
          
          <div style="color: #64748b; font-size: 13px; text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #f1f5f9;">
            Бұл код <b>10 минут</b> ішінде жарамды.<br>
            <span style="color: #94a3b8;">Егер сіз бұл сұранысты жасамасаңыз, бұл хатқа мән бермеңіз.</span>
          </div>
          
          <div style="text-align: center; margin-top: 24px;">
            <p style="font-size: 11px; color: #cbd5e1; margin: 0;">&copy; ${new Date().getFullYear()} Mazir App. All rights reserved.</p>
          </div>
        </div>
      `,
        })
    } catch (emailError: any) {
        console.error('Error sending email:', emailError)
        throw new Error(emailError.message || 'Почта жіберу мүмкін болмады. SMTP параметрлерін тексеріңіз.')
    }

    return { success: true }
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
