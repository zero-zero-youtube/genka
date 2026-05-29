'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts'
import { CATEGORY_LABELS, CATEGORY_COLORS, formatCurrency } from '@/lib/utils'
import { ProjectSummary } from '@/types'

interface Props {
  project: ProjectSummary
}

interface TooltipPayload {
  name: string
  value: number
}

interface TooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}

// カスタムツールチップ
const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1A1D26] border border-[#2E3347] rounded-lg p-3 shadow-xl text-sm">
      <p className="text-[#F0F2F8] font-bold mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex justify-between gap-6">
          <span className="text-[#8B92A9]">{entry.name}</span>
          <span className="font-mono text-[#F0F2F8]">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

// 予算vs実績の棒グラフ
const BudgetVsActualChart = ({ project }: Props) => {
  const categories: Array<keyof typeof CATEGORY_LABELS> = [
    'labor',
    'material',
    'outsource',
    'expense',
  ]

  const data = categories.map((cat) => ({
    name: CATEGORY_LABELS[cat],
    予算:
      cat === 'labor'
        ? project.budget_labor
        : cat === 'material'
        ? project.budget_material
        : cat === 'outsource'
        ? project.budget_outsource
        : project.budget_expense,
    実績: project.cost_by_category[cat as keyof typeof project.cost_by_category],
    color: CATEGORY_COLORS[cat],
  }))

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} barGap={4} barCategoryGap="30%">
        <XAxis
          dataKey="name"
          tick={{ fill: '#8B92A9', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => `¥${(v / 10000).toFixed(0)}万`}
          tick={{ fill: '#8B92A9', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => (
            <span style={{ color: '#8B92A9', fontSize: 12 }}>{value}</span>
          )}
        />
        <Bar dataKey="予算" fill="#2E3347" radius={[4, 4, 0, 0]} />
        <Bar dataKey="実績" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export default BudgetVsActualChart
