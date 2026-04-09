import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: Request) {
  console.log('API: /api/auth/send-otp called')
  try {
    const { email, lang } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Generate 6-digit code specifically for the user
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // 1. Check for Mock Mode
    if (process.env.MOCK_MAIL === 'true') {
      console.log('--- MAIL MOCK MODE ---')
      console.log(`Target Email: ${email}`)
      console.log(`OTP Code: ${otp}`)
      console.log('----------------------')
      return NextResponse.json({ success: true, otp, mock: true })
    }

    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
    const smtpPort = Number(process.env.SMTP_PORT) || 465

    if (!smtpUser || !smtpPass) {
      console.error('SMTP credentials missing')
      return NextResponse.json({ 
        error: 'Mail server configuration missing',
        details: 'Please set SMTP_USER and SMTP_PASS in .env, or use MOCK_MAIL=true for testing.' 
      }, { status: 500 })
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      connectionTimeout: 10000, // 10s
    })

    const subject = lang === 'kk' ? 'Растау коды - Mazir App' : 'Код подтверждения - Mazir App'

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #ff385c; text-align: center;">Mazir App</h2>
        <p style="font-size: 16px; color: #475569; text-align: center;">
          ${lang === 'kk' ? 'Тіркелуді аяқтау үшін төмендегі кодты енгізіңіз:' : 'Для завершения регистрации введите код ниже:'}
        </p>
        <div style="background: #f8fafc; padding: 20px; text-align: center; border-radius: 12px; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #ff385c;">${otp}</span>
        </div>
        <p style="font-size: 14px; color: #94a3b8; text-align: center;">
          ${lang === 'kk' ? 'Егер сіз бұл хатты қателесіп алсаңыз, оған жауап бермесеңіз де болады.' : 'Если вы получили это письмо по ошибке, просто проигнорируйте его.'}
        </p>
      </div>
    `

    await transporter.sendMail({
      from: `Mazir App <${smtpUser}>`,
      to: email,
      subject,
      html,
    })

    return NextResponse.json({ success: true, otp })
  } catch (error: any) {
    console.error('SMTP Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
