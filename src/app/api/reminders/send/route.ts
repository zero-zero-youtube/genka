import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function sendLineNotify(token: string, message: string) {
  const res = await fetch('https://notify-api.line.me/api/notify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Bearer ${token}`,
    },
    body: new URLSearchParams({ message }),
  })
  return res.ok
}

async function sendEmail(to: string, subject: string, html: string) {
  const nodemailer = (await import('nodemailer')).default
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })
  await transporter.sendMail({
    from: `"GenKa" <${process.env.GMAIL_FROM}>`,
    to,
    subject,
    html,
  })
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: settings } = await supabase
      .from('reminder_settings')
      .select('*')
      .eq('enabled', true)

    if (!settings || settings.length === 0) {
      return NextResponse.json({ message: 'No active reminders' })
    }

    let notificationCount = 0

    for (const setting of settings) {
      const intervalDays = setting.interval_days || 3
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - intervalDays)

      // X日以上原価入力がない進行中の工事を取得
      const { data: activeProjects } = await supabase
        .from('projects')
        .select('id, name')
        .eq('company_id', setting.company_id)
        .eq('status', 'active')

      if (!activeProjects || activeProjects.length === 0) continue

      // 各工事の最新原価入力日を確認
      const stalledProjects: { id: string; name: string }[] = []
      for (const project of activeProjects) {
        const { data: latestCost } = await supabase
          .from('costs')
          .select('created_at')
          .eq('project_id', project.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        const lastInputDate = latestCost?.created_at
          ? new Date(latestCost.created_at)
          : null

        // 原価入力なし or cutoff日より古い
        if (!lastInputDate || lastInputDate < cutoffDate) {
          stalledProjects.push(project)
        }
      }

      if (stalledProjects.length === 0) continue

      const projectList = stalledProjects.map(p => `・${p.name}`).join('\n')
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://genka-steel.vercel.app'
      const lineMessage = `\n【GenKa リマインダー】\n以下の工事で${intervalDays}日間、原価入力がありません。\n\n${projectList}\n\n確認はこちら：${appUrl}/dashboard`

      // LINE通知
      if (setting.line_notify_token) {
        const ok = await sendLineNotify(setting.line_notify_token, lineMessage)
        if (ok) notificationCount++
      }

      // メール通知（対象メンバー）
      if (setting.notify_members && setting.notify_members.length > 0) {
        const { data: members } = await supabase
          .from('company_members')
          .select('user_id')
          .eq('company_id', setting.company_id)
          .in('user_id', setting.notify_members)

        if (members) {
          for (const member of members) {
            const { data: userData } = await supabase.auth.admin.getUserById(member.user_id)
            const email = userData?.user?.email
            if (!email) continue

            const html = `
              <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
                <div style="background:#F59E0B;padding:16px;border-radius:8px 8px 0 0;">
                  <h2 style="color:#1a1a1a;margin:0;">GenKa リマインダー</h2>
                </div>
                <div style="background:#1e293b;padding:24px;border-radius:0 0 8px 8px;color:#fff;">
                  <p>以下の工事で<strong>${intervalDays}日間</strong>、原価入力がありません。</p>
                  <ul style="background:#0f172a;padding:16px;border-radius:8px;">
                    ${stalledProjects.map(p => `<li style="color:#F59E0B;margin:4px 0;">${p.name}</li>`).join('')}
                  </ul>
                  <a href="${appUrl}/dashboard"
                     style="display:inline-block;background:#F59E0B;color:#1a1a1a;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">
                    ダッシュボードを確認する →
                  </a>
                </div>
              </div>
            `
            await sendEmail(
              email,
              `【GenKa】${stalledProjects.length}件の工事で原価入力がありません`,
              html
            )
            notificationCount++
          }
        }
      }
    }

    return NextResponse.json({ message: `Sent ${notificationCount} notifications` })
  } catch (error) {
    console.error('Reminder error:', error)
    return NextResponse.json({ error: 'Failed to send reminders' }, { status: 500 })
  }
}
