import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

// Claude APIを使ったAI分析エンドポイント（ストリーミング対応）
export async function POST(req: NextRequest) {
  const { prompt } = await req.json()

  const apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY
  if (!apiKey || apiKey === 'your_anthropic_api_key') {
    // APIキー未設定時はダミーレスポンス
    const dummy = `【所見】
・本工事の利益率は適正な水準にあります。予算管理が概ね順調に行われています。
・材料費については予算内に収まっており、調達計画が適切だったと判断されます。
・労務費は計画通りで、工程管理が効果的でした。

【改善提案】
次回工事では外注費の早期確定を心がけることで、原価変動リスクをさらに低減できます。協力業者との長期契約や複数社見積の習慣化により、5〜10%のコスト削減が期待できます。`

    return new Response(dummy, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  try {
    const client = new Anthropic({ apiKey })

    const stream = await client.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    // ストリーミングレスポンスを返す
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(new TextEncoder().encode(chunk.delta.text))
          }
        }
        controller.close()
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (err) {
    console.error('Claude APIエラー:', err)
    return new Response('AI分析の生成に失敗しました', { status: 500 })
  }
}
