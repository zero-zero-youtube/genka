// アプリ全体で使用する型定義

export type ProjectStatus = 'active' | 'completed' | 'invoiced' | 'paid'
export type CostCategory = 'labor' | 'material' | 'outsource' | 'expense'

export interface Company {
  id: string
  name: string
  owner_id: string
  created_at: string
}

export interface Project {
  id: string
  company_id: string
  name: string
  client_name: string | null
  contract_amount: number
  budget_labor: number
  budget_material: number
  budget_outsource: number
  budget_expense: number
  start_date: string | null
  end_date: string | null
  status: ProjectStatus
  created_at: string
  updated_at: string
}

export interface Cost {
  id: string
  project_id: string
  category: CostCategory
  amount: number
  description: string | null
  cost_date: string
  created_by: string | null
  created_at: string
}

export type EstimateStatus = 'draft' | 'sent' | 'ordered' | 'rejected'

export interface Estimate {
  id: string
  company_id: string
  name: string
  client_name: string | null
  contract_amount: number
  cost_labor: number
  cost_material: number
  cost_outsource: number
  cost_expense: number
  note: string | null
  status: EstimateStatus
  converted_project_id: string | null
  created_at: string
  updated_at: string
}

export type MemberRole = 'owner' | 'member'

export interface CompanyMember {
  id: string
  company_id: string
  user_id: string
  role: MemberRole
  joined_at: string
  // joinして取得するユーザー情報
  email?: string
}

export interface Invitation {
  id: string
  company_id: string
  email: string | null
  role: MemberRole
  invited_by: string
  expires_at: string
  accepted_at: string | null
  created_at: string
}

// 計算済みプロジェクトサマリー
export interface ProjectSummary extends Project {
  total_actual_cost: number
  estimated_profit: number
  estimated_profit_rate: number
  progress_rate: number
  cost_by_category: {
    labor: number
    material: number
    outsource: number
    expense: number
  }
}
