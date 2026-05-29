-- ============================================
-- GenKa - Supabase テーブル設定スクリプト
-- SupabaseのSQL Editorで実行してください
-- ============================================

-- 会社テーブル
CREATE TABLE companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 工事テーブル
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  client_name TEXT,
  contract_amount INTEGER NOT NULL DEFAULT 0,  -- 契約金額（円）
  budget_labor INTEGER NOT NULL DEFAULT 0,      -- 予算：労務費
  budget_material INTEGER NOT NULL DEFAULT 0,   -- 予算：材料費
  budget_outsource INTEGER NOT NULL DEFAULT 0,  -- 予算：外注費
  budget_expense INTEGER NOT NULL DEFAULT 0,    -- 予算：経費
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 原価入力テーブル
CREATE TABLE costs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('labor', 'material', 'outsource', 'expense')),
  amount INTEGER NOT NULL,
  description TEXT,
  cost_date DATE DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLSポリシー設定
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "自社データのみアクセス可能" ON companies
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "自社工事のみアクセス可能" ON projects
  FOR ALL USING (
    company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
  );

CREATE POLICY "自社工事の原価のみアクセス可能" ON costs
  FOR ALL USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN companies c ON p.company_id = c.id
      WHERE c.owner_id = auth.uid()
    )
  );

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- テーブル権限付与（authenticated ロールに CRUD 権限を付与）
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.costs TO authenticated;
