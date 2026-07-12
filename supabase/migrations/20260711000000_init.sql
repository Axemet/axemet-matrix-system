-- Migration: Initial Schema for MM Matrizes Budgeting Tool
-- Tables: profiles, clients, budgets, materials, services, machining_types

-- Enable uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES Table (links with Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'viewer',
  status TEXT DEFAULT 'pending',
  organization TEXT DEFAULT 'Axemet Solution LTDA',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ensure the columns exist if the table was pre-existing (Supabase templates workaround)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'viewer';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization TEXT DEFAULT 'Axemet Solution LTDA';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable full access for admins" ON public.profiles;

CREATE POLICY "Enable read access for all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Enable update for users own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Enable full access for admins" ON public.profiles FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin'
  )
);

-- Trigger to automatically create a profile for new auth users (Case-insensitive check)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, status, organization)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    CASE WHEN LOWER(NEW.email) = 'filipesantos.ind85@gmail.com' THEN 'admin' ELSE 'viewer' END,
    CASE WHEN LOWER(NEW.email) = 'filipesantos.ind85@gmail.com' THEN 'active' ELSE 'pending' END,
    'Axemet Solution LTDA'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. CLIENTS Table
CREATE TABLE IF NOT EXISTS public.clients (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  corporate_name TEXT,
  cnpj TEXT,
  state_inscription TEXT,
  phone TEXT,
  email TEXT,
  responsible TEXT,
  cep TEXT,
  address TEXT,
  number TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all clients" ON public.clients FOR SELECT USING (true);
CREATE POLICY "Enable insert for all clients" ON public.clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all clients" ON public.clients FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all clients" ON public.clients FOR DELETE USING (true);

-- 3. MATERIALS Table (Database of Raw Materials)
CREATE TABLE IF NOT EXISTS public.materials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  density NUMERIC NOT NULL,
  price_per_kg NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Materials
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all materials" ON public.materials FOR SELECT USING (true);
CREATE POLICY "Enable write access for all materials" ON public.materials FOR ALL USING (true);

-- 4. SERVICES Table (Database of Service Rates)
CREATE TABLE IF NOT EXISTS public.services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  val_unit NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Enable write access for all services" ON public.services FOR ALL USING (true);

-- 5. MACHINING TYPES Table (Database of Machining Rates)
CREATE TABLE IF NOT EXISTS public.machining_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  hourly_rate NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Machining Types
ALTER TABLE public.machining_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all machining_types" ON public.machining_types FOR SELECT USING (true);
CREATE POLICY "Enable write access for all machining_types" ON public.machining_types FOR ALL USING (true);

-- 6. BUDGETS Table
CREATE TABLE IF NOT EXISTS public.budgets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  reference TEXT,
  client_name TEXT NOT NULL,
  client_id TEXT REFERENCES public.clients(id) ON DELETE SET NULL,
  contact_name TEXT,
  mold_type TEXT,
  molding_material TEXT,
  product_quantity INTEGER DEFAULT 1000,
  delivery_time TEXT,
  observations TEXT,
  status TEXT DEFAULT 'draft',
  mold_description TEXT,
  date DATE DEFAULT CURRENT_DATE,
  mold_width NUMERIC DEFAULT 0,
  mold_length NUMERIC DEFAULT 0,
  discount_percent NUMERIC DEFAULT 0,
  discount_value NUMERIC DEFAULT 0,
  totals JSONB NOT NULL,
  config JSONB NOT NULL,
  materials JSONB NOT NULL DEFAULT '[]'::jsonb,
  third_party_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  internal_services JSONB NOT NULL DEFAULT '[]'::jsonb,
  machining_types JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Budgets
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all budgets" ON public.budgets FOR SELECT USING (true);
CREATE POLICY "Enable insert for all budgets" ON public.budgets FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all budgets" ON public.budgets FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all budgets" ON public.budgets FOR DELETE USING (true);


-- ==========================================
-- SEED DATA (Default configurations)
-- ==========================================

-- Seed Materials (Raw Materials)
INSERT INTO public.materials (id, name, density, price_per_kg) VALUES
  ('mat_1045', 'Aço 1045', 7.85, 11.50),
  ('mat_p20', 'Aço P20', 7.85, 25.00),
  ('mat_cobre', 'Cobre', 2.25, 65.00),
  ('mat_aluminio', 'Alumínio', 2.70, 45.00),
  ('mat_h13', 'Aço H13', 7.85, 55.00)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  density = EXCLUDED.density,
  price_per_kg = EXCLUDED.price_per_kg;

-- Seed Services (Service Rates)
INSERT INTO public.services (id, name, unit, val_unit) VALUES
  ('srv_0', 'Projeto', 'dia', 550.00),
  ('srv_1', 'Usinagem Alumínio', 'h', 100.00),
  ('srv_2', 'Usinagem Aço', 'h', 160.00),
  ('srv_3', 'Usinagem Aço Temperado', 'h', 200.00),
  ('srv_4', 'Erosão', 'h', 75.00),
  ('srv_5', 'Matrizaria', 'dia', 550.00)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  unit = EXCLUDED.unit,
  val_unit = EXCLUDED.val_unit;

-- Seed Machining Types (Machining Rates)
INSERT INTO public.machining_types (id, name, hourly_rate) VALUES
  ('mt_fresa', 'Usinagem Aço', 160.0),
  ('mt_fresa_temp', 'Usinagem Aço Temperado', 200.0),
  ('mt_fresa_alum', 'Usinagem Alumínio', 100.0),
  ('mt_erosao', 'Erosão', 75.0),
  ('mt_retifica', 'Retífica', 120.0)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  hourly_rate = EXCLUDED.hourly_rate;

-- Seed some default clients for immediate utility if none exist
INSERT INTO public.clients (id, name, cnpj, phone, email, city) VALUES
  ('client_1', 'Metalúrgica Aliança S/A', '98.765.432/0001-00', '(47) 3456-7890', 'suprimentos@alianca.com', 'Caxias do Sul - RS'),
  ('client_2', 'Metalúrgica Teste Ltda.', '12.345.678/0001-99', '(11) 98765-4321', 'compras@metaltes.com', 'Joinville - SC'),
  ('client_3', 'Plásticos do Brasil S.A.', '45.678.901/0001-22', '(19) 3211-5544', 'contato@plasticosbr.com', 'Sorocaba - SP')
ON CONFLICT (id) DO NOTHING;
