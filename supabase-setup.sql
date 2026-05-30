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
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'invoiced', 'paid')),
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

-- 見積もりテーブル
CREATE TABLE estimates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  client_name TEXT,
  contract_amount INTEGER NOT NULL DEFAULT 0,
  cost_labor INTEGER NOT NULL DEFAULT 0,
  cost_material INTEGER NOT NULL DEFAULT 0,
  cost_outsource INTEGER NOT NULL DEFAULT 0,
  cost_expense INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'ordered', 'rejected')),
  converted_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- メンバーテーブル
CREATE TABLE company_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);

-- 招待テーブル（id自体を招待トークンとして使用）
CREATE TABLE invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  invited_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLSポリシー設定
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "自社見積もりのみアクセス可能" ON estimates
  FOR ALL USING (company_id = get_my_company_id());

CREATE TRIGGER update_estimates_updated_at
  BEFORE UPDATE ON estimates
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.estimates TO authenticated;

ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- ヘルパー関数：ユーザーが所属する会社IDを返す
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM company_members WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- companies: メンバーは自社を参照可能、オーナーのみ更新可能
CREATE POLICY "メンバーは自社を参照可能" ON companies
  FOR SELECT USING (id = get_my_company_id());

CREATE POLICY "オーナーのみ更新可能" ON companies
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "認証ユーザーは会社を作成可能" ON companies
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- projects: 同じ会社のメンバーはアクセス可能
CREATE POLICY "自社工事のみアクセス可能" ON projects
  FOR ALL USING (company_id = get_my_company_id());

-- costs: 自社工事の原価にアクセス可能
CREATE POLICY "自社工事の原価のみアクセス可能" ON costs
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE company_id = get_my_company_id()
    )
  );

-- company_members: 同じ会社のメンバーは一覧参照可能、オーナーのみ追加・削除可能
CREATE POLICY "同社メンバーは一覧参照可能" ON company_members
  FOR SELECT USING (company_id = get_my_company_id());

CREATE POLICY "メンバー追加は本人または招待経由" ON company_members
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "オーナーのみメンバー削除可能" ON company_members
  FOR DELETE USING (
    company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
  );

-- invitations: オーナーは作成・参照可能、誰でもトークン参照可能（招待受け取り）
CREATE POLICY "invitations参照" ON invitations
  FOR SELECT USING (
    company_id = get_my_company_id() OR auth.uid() IS NOT NULL
  );

CREATE POLICY "オーナーのみ招待作成可能" ON invitations
  FOR INSERT WITH CHECK (
    company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
  );

CREATE POLICY "招待の承認更新" ON invitations
  FOR UPDATE USING (auth.uid() IS NOT NULL);

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

-- テーブル権限付与
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.costs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_members TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.invitations TO authenticated;
GRANT EXECUTE ON FUNCTION get_my_company_id() TO authenticated;
