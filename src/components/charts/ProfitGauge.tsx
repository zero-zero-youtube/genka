'use client'

// 半円形ゲージ（利益率表示）
const ProfitGauge = ({ rate }: { rate: number }) => {
  // ゲージは-180°〜0°の半円（0%〜100%）
  const clampedRate = Math.max(-20, Math.min(100, rate))
  // -20%が0°、100%が180°にマッピング
  const normalizedRate = (clampedRate + 20) / 120
  const angle = normalizedRate * 180 - 90 // -90°〜90°

  const cx = 110
  const cy = 110
  const r = 80

  // ポインターの先端位置を計算
  const rad = ((angle - 90) * Math.PI) / 180
  const px = cx + r * Math.cos(rad)
  const py = cy + r * Math.sin(rad)

  const getColor = () => {
    if (rate < 10) return '#EF4444'
    if (rate < 20) return '#F59E0B'
    return '#10B981'
  }

  return (
    <svg width="220" height="130" viewBox="0 0 220 130">
      {/* 背景トラック（半円） */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke="#222639"
        strokeWidth="16"
        strokeLinecap="round"
      />

      {/* 赤ゾーン（0〜10%） */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${
          cx + r * Math.cos((((-90 + (10 + 20) / 120 * 180) - 90) * Math.PI) / 180)
        } ${cy + r * Math.sin((((-90 + (10 + 20) / 120 * 180) - 90) * Math.PI) / 180)}`}
        fill="none"
        stroke="#EF4444"
        strokeWidth="16"
        strokeLinecap="butt"
        opacity="0.3"
      />

      {/* 黄ゾーン */}
      <path
        d="M 30 110 A 80 80 0 0 1 110 30"
        fill="none"
        stroke="#F59E0B"
        strokeWidth="16"
        strokeLinecap="butt"
        opacity="0.3"
      />

      {/* 緑ゾーン */}
      <path
        d="M 110 30 A 80 80 0 0 1 190 110"
        fill="none"
        stroke="#10B981"
        strokeWidth="16"
        strokeLinecap="butt"
        opacity="0.3"
      />

      {/* ポインター */}
      <line
        x1={cx}
        y1={cy}
        x2={px}
        y2={py}
        stroke={getColor()}
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* 中心円 */}
      <circle cx={cx} cy={cy} r="6" fill={getColor()} />

      {/* ラベル */}
      <text x={cx} y={cy + 20} textAnchor="middle" fill="#8B92A9" fontSize="10">
        0%
      </text>
      <text x="10" y="115" textAnchor="start" fill="#EF4444" fontSize="10">
        -20%
      </text>
      <text x="200" y="115" textAnchor="end" fill="#10B981" fontSize="10">
        40%+
      </text>
    </svg>
  )
}

export default ProfitGauge
