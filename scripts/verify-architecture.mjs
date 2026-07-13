import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const fail = (message) => { console.error(`FAIL: ${message}`); process.exitCode = 1; };
const assert = (condition, message) => { if (!condition) fail(message); };
const root = process.cwd();
const text = (path) => readFileSync(join(root, path), 'utf8');
const migrations = join(root, 'supabase', 'migrations');
const migrationFiles = readdirSync(migrations).filter(name => name.endsWith('.sql')).sort();

assert(migrationFiles.length >= 5, 'As migrations de segurança, RH, indústria, permissões e organização devem existir.');
for (const migration of ['20260712000000_production_security.sql', '20260712010000_rh_operations.sql', '20260712020000_industrial_core.sql', '20260712030000_module_permissions.sql', '20260712040000_organization_profile.sql']) assert(existsSync(join(migrations, migration)), `Migration ausente: ${migration}`);

const login = text('src/components/LoginScreen.tsx');
assert(!login.includes('mm_saved_password'), 'Senhas não podem ser persistidas no navegador.');
assert(!login.includes('Simulação offline'), 'Login não pode manter fluxo de simulação offline.');
assert(login.includes('signInUser'), 'Login deve autenticar pelo Supabase.');

const industrial = text('src/lib/industrial.ts');
assert(industrial.includes('approveBudgetToProject'), 'Fluxo orçamento → projeto deve usar RPC corporativa.');
assert(industrial.includes('listPurchaseRequests'), 'Compras deve carregar solicitações persistentes.');
const hr = text('src/components/ModuloRH.tsx');
assert(!hr.includes('localStorage'), 'RH não pode usar localStorage como fonte de dados.');
assert(hr.includes('loadHrData'), 'RH deve carregar dados do Supabase.');
const dashboard = text('src/components/Modulo11BI.tsx');
assert(!dashboard.includes('Simular Apontamento'), 'Dashboard não pode expor apontamentos simulados.');
assert(dashboard.includes('listManufacturingProjects'), 'Dashboard deve consultar projetos persistentes.');
console.log(`OK: arquitetura validada com ${migrationFiles.length} migrations versionadas.`);
