-- Migration: ERP Operational Tables
-- Moves Modules 2-11 data from localStorage into Supabase with proper RLS.
-- All tables use organization_id for multi-tenant isolation and follow the
-- same security pattern established in 20260712000000_production_security.sql

-- ============================================================
-- 1. ERP PROJECTS (MatrixProject) — Módulos 2, 3, 5, 7, 10, 11
-- ============================================================
-- BOM, subprojects, revisions, documents and costs are stored as JSONB to
-- mirror the existing TypeScript types without introducing 6+ extra tables now.
-- They can be normalised into dedicated tables in a future migration if needed.
CREATE TABLE IF NOT EXISTS public.erp_projects (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) DEFAULT public.organization_for_write(),
  reference     TEXT NOT NULL,
  client_name   TEXT NOT NULL,
  mold_description TEXT NOT NULL DEFAULT '',
  mold_type     TEXT NOT NULL DEFAULT '',
  molding_material TEXT NOT NULL DEFAULT '',
  product_quantity INTEGER NOT NULL DEFAULT 1000,
  delivery_time TEXT NOT NULL DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'planning'
                CHECK (status IN ('planning','production','tryout','delivered','warranty','completed')),
  mold_width    NUMERIC(12,2) NOT NULL DEFAULT 0,
  mold_length   NUMERIC(12,2) NOT NULL DEFAULT 0,
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  subprojects   JSONB NOT NULL DEFAULT '[]'::jsonb,
  bom           JSONB NOT NULL DEFAULT '[]'::jsonb,
  revisions     JSONB NOT NULL DEFAULT '[]'::jsonb,
  costs         JSONB NOT NULL DEFAULT '{}'::jsonb,
  documents     JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.erp_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "erp_projects_read_org"   ON public.erp_projects
  FOR SELECT USING (public.is_active_member() AND organization_id = public.current_organization_id());
CREATE POLICY "erp_projects_manage_org" ON public.erp_projects
  FOR ALL USING (public.is_active_member() AND organization_id = public.current_organization_id())
  WITH CHECK (public.is_active_member() AND organization_id = public.current_organization_id());

-- ============================================================
-- 2. RAW MATERIAL STOCK (RawMaterialStock) — Módulo 4
-- ============================================================
CREATE TABLE IF NOT EXISTS public.erp_raw_material_stock (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) DEFAULT public.organization_for_write(),
  type            TEXT NOT NULL,  -- e.g. P20, H13, 1045
  dimensions      TEXT NOT NULL DEFAULT '',
  weight          NUMERIC(12,3) NOT NULL DEFAULT 0,
  batch           TEXT NOT NULL DEFAULT '',
  certificate_url TEXT,
  status          TEXT NOT NULL DEFAULT 'available'
                  CHECK (status IN ('available','reserved','consumed')),
  reserved_for_proj_id TEXT REFERENCES public.erp_projects(id) ON DELETE SET NULL,
  quality_dureza  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.erp_raw_material_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "erp_raw_stock_read_org"   ON public.erp_raw_material_stock
  FOR SELECT USING (public.is_active_member() AND organization_id = public.current_organization_id());
CREATE POLICY "erp_raw_stock_manage_org" ON public.erp_raw_material_stock
  FOR ALL USING (public.is_active_member() AND organization_id = public.current_organization_id())
  WITH CHECK (public.is_active_member() AND organization_id = public.current_organization_id());

-- ============================================================
-- 3. QUALITY INSPECTIONS (QualityInspection) — Módulo 6
-- ============================================================
CREATE TABLE IF NOT EXISTS public.erp_quality_inspections (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id   UUID NOT NULL REFERENCES public.organizations(id) DEFAULT public.organization_for_write(),
  project_id        TEXT REFERENCES public.erp_projects(id) ON DELETE SET NULL,
  project_name      TEXT NOT NULL DEFAULT '',
  bom_item_id       TEXT NOT NULL DEFAULT '',
  bom_item_name     TEXT NOT NULL DEFAULT '',
  operator_name     TEXT NOT NULL DEFAULT '',
  date              DATE NOT NULL DEFAULT CURRENT_DATE,
  dimensions_measured JSONB NOT NULL DEFAULT '[]'::jsonb,
  overall_status    TEXT NOT NULL DEFAULT 'approved'
                    CHECK (overall_status IN ('approved','rejected','rework')),
  cmm_report_url    TEXT,
  non_conformance_id TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.erp_quality_inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "erp_inspections_read_org"   ON public.erp_quality_inspections
  FOR SELECT USING (public.is_active_member() AND organization_id = public.current_organization_id());
CREATE POLICY "erp_inspections_manage_org" ON public.erp_quality_inspections
  FOR ALL USING (public.is_active_member() AND organization_id = public.current_organization_id())
  WITH CHECK (public.is_active_member() AND organization_id = public.current_organization_id());

-- ============================================================
-- 4. NON-CONFORMANCES (NonConformance) — Módulo 6
-- ============================================================
CREATE TABLE IF NOT EXISTS public.erp_non_conformances (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) DEFAULT public.organization_for_write(),
  project_id      TEXT REFERENCES public.erp_projects(id) ON DELETE SET NULL,
  project_name    TEXT NOT NULL DEFAULT '',
  bom_item_id     TEXT NOT NULL DEFAULT '',
  bom_item_name   TEXT NOT NULL DEFAULT '',
  classification  TEXT NOT NULL DEFAULT 'retrabalho'
                  CHECK (classification IN ('refugo','retrabalho','desvio_aceito')),
  root_cause_5whys JSONB NOT NULL DEFAULT '[]'::jsonb,
  ishikawa        JSONB NOT NULL DEFAULT '{}'::jsonb,
  action_plan     TEXT NOT NULL DEFAULT '',
  responsible     TEXT NOT NULL DEFAULT '',
  deadline        DATE,
  cost            NUMERIC(14,2) NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open','closed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.erp_non_conformances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "erp_rncs_read_org"   ON public.erp_non_conformances
  FOR SELECT USING (public.is_active_member() AND organization_id = public.current_organization_id());
CREATE POLICY "erp_rncs_manage_org" ON public.erp_non_conformances
  FOR ALL USING (public.is_active_member() AND organization_id = public.current_organization_id())
  WITH CHECK (public.is_active_member() AND organization_id = public.current_organization_id());

-- ============================================================
-- 5. BILLING MILESTONES (BillingMilestone) — Módulo 8
-- ============================================================
CREATE TABLE IF NOT EXISTS public.erp_billing_milestones (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) DEFAULT public.organization_for_write(),
  project_id      TEXT REFERENCES public.erp_projects(id) ON DELETE CASCADE,
  project_name    TEXT NOT NULL DEFAULT '',
  description     TEXT NOT NULL DEFAULT '',
  percent         NUMERIC(6,2) NOT NULL DEFAULT 0,
  value           NUMERIC(14,2) NOT NULL DEFAULT 0,
  due_date        DATE,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','billed','paid')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.erp_billing_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "erp_milestones_read_org"   ON public.erp_billing_milestones
  FOR SELECT USING (public.is_active_member() AND organization_id = public.current_organization_id());
CREATE POLICY "erp_milestones_manage_org" ON public.erp_billing_milestones
  FOR ALL USING (public.is_active_member() AND organization_id = public.current_organization_id())
  WITH CHECK (public.is_active_member() AND organization_id = public.current_organization_id());

-- ============================================================
-- 6. CASH TRANSACTIONS (CashTransaction) — Módulo 8
-- ============================================================
CREATE TABLE IF NOT EXISTS public.erp_cash_transactions (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) DEFAULT public.organization_for_write(),
  project_id      TEXT REFERENCES public.erp_projects(id) ON DELETE SET NULL,
  project_name    TEXT NOT NULL DEFAULT '',
  type            TEXT NOT NULL CHECK (type IN ('receita','despesa')),
  category        TEXT NOT NULL DEFAULT 'outros',
  description     TEXT NOT NULL DEFAULT '',
  value           NUMERIC(14,2) NOT NULL DEFAULT 0,
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('paid','pending')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.erp_cash_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "erp_transactions_read_org"   ON public.erp_cash_transactions
  FOR SELECT USING (public.is_active_member() AND organization_id = public.current_organization_id());
CREATE POLICY "erp_transactions_manage_org" ON public.erp_cash_transactions
  FOR ALL USING (public.is_active_member() AND organization_id = public.current_organization_id())
  WITH CHECK (public.is_active_member() AND organization_id = public.current_organization_id());

-- ============================================================
-- 7. MAINTENANCE LOGS (MaintenanceLog) — Módulo 10
-- ============================================================
CREATE TABLE IF NOT EXISTS public.erp_maintenance_logs (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) DEFAULT public.organization_for_write(),
  project_id      TEXT REFERENCES public.erp_projects(id) ON DELETE SET NULL,
  project_name    TEXT NOT NULL DEFAULT '',
  cycles          INTEGER NOT NULL DEFAULT 0,
  type            TEXT NOT NULL DEFAULT 'preventative'
                  CHECK (type IN ('preventative','corrective')),
  description     TEXT NOT NULL DEFAULT '',
  parts_replaced  JSONB NOT NULL DEFAULT '[]'::jsonb,
  cost            NUMERIC(14,2) NOT NULL DEFAULT 0,
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  responsible     TEXT NOT NULL DEFAULT '',
  is_warranty     BOOLEAN NOT NULL DEFAULT false,
  status          TEXT NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open','completed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.erp_maintenance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "erp_maint_read_org"   ON public.erp_maintenance_logs
  FOR SELECT USING (public.is_active_member() AND organization_id = public.current_organization_id());
CREATE POLICY "erp_maint_manage_org" ON public.erp_maintenance_logs
  FOR ALL USING (public.is_active_member() AND organization_id = public.current_organization_id())
  WITH CHECK (public.is_active_member() AND organization_id = public.current_organization_id());

-- ============================================================
-- HELPER: auto-update updated_at on all new ERP tables
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'erp_projects','erp_raw_material_stock','erp_quality_inspections',
    'erp_non_conformances','erp_billing_milestones','erp_cash_transactions',
    'erp_maintenance_logs'
  ]) LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_set_updated_at ON public.%I;
       CREATE TRIGGER trg_set_updated_at
         BEFORE UPDATE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();',
      tbl, tbl
    );
  END LOOP;
END;
$$;
