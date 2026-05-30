import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Vercel サーバーレス環境で Node.js ランタイムを明示
export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  let body: { companyName?: string; contactName?: string; email?: string; message?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'リクエストの形式が正しくありません' }, { status: 400 })
  }

  const { companyName, contactName, email, message } = body

  // バリデーション
  if (!companyName || !contactName || !email || !message) {
    return NextResponse.json({ error: '全項目を入力してください' }, { status: 400 })
  }

  // Supabase に保存
  const { error: dbError } = await supabase.from('inquiries').insert({
    company_name: companyName,
    contact_name: contactName,
    email,
    message,
  })

  if (dbError) {
    console.error('DB保存エラー:', JSON.stringify(dbError))
    return NextResponse.json(
      { error: `DB保存失敗: ${dbError.message} (code: ${dbError.code})` },
      { status: 500 }
    )
  }

  // メール通知（dynamic import で Vercel 互換）
  try {
    const nodemailer = (await import('nodemailer')).default
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })

    await transporter.sendMail({
      from: `"GenKa お問い合わせ" <${process.env.GMAIL_USER}>`,
      to: process.env.NOTIFICATION_EMAIL,
      subject: `【GenKa】お問い合わせが届きました - ${companyName}`,
      text: [
        '新しいお問い合わせが届きました。',
        '',
        `会社名：${companyName}`,
        `担当者名：${contactName}`,
        `メールアドレス：${email}`,
        '',
        'お問い合わせ内容：',
        message,
      ].join('\n'),
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#1A1D26;padding:24px;border-radius:12px;">
            <h2 style="color:#F5A623;margin:0 0 16px;">GenKa お問い合わせ通知</h2>
            <p style="color:#8B92A9;margin:0 0 24px;">新しいお問い合わせが届きました。</p>
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:10px 0;color:#8B92A9;width:130px;vertical-align:top;">会社名</td>
                <td style="padding:10px 0;color:#F0F2F8;font-weight:bold;">${companyName}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;color:#8B92A9;vertical-align:top;">担当者名</td>
                <td style="padding:10px 0;color:#F0F2F8;">${contactName}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;color:#8B92A9;vertical-align:top;">メールアドレス</td>
                <td style="padding:10px 0;color:#F0F2F8;"><a href="mailto:${email}" style="color:#F5A623;">${email}</a></td>
              </tr>
              <tr>
                <td style="padding:10px 0;color:#8B92A9;vertical-align:top;">内容</td>
                <td style="padding:10px 0;color:#F0F2F8;white-space:pre-wrap;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
              </tr>
            </table>
          </div>
        </div>
      `,
    })
  } catch (mailError) {
    // メール失敗はログのみ（DB保存済みなので成功レスポンスを返す）
    console.error('メール送信エラー:', mailError)
  }

  return NextResponse.json({ success: true })
}
