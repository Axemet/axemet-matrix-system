import React from 'react';
import { BadgeCheck, BriefcaseBusiness, Building2, CalendarDays, CheckCircle2, ClipboardList, Factory, GraduationCap, Pencil, Plus, ShieldCheck, Trash2, Users, Wrench, X } from 'lucide-react';
type Sector = {
    id: string;
    name: string;
    code: string;
    leader: string;
    shift: string;
    active: boolean;
};
type Role = {
    id: string;
    title: string;
    cbo: string;
    sectorId: string;
    skills: string;
    active: boolean;
};
type Employee = {
    id: string;
    name: string;
    roleId: string;
    sectorId: string;
    shift: string;
    status: 'Ativo' | 'Férias' | 'Afastado' | 'Inativo';
    skills: string;
    nr12Expiry: string;
    asoExpiry: string;
};
type Machine = {
    id: string;
    code: string;
    name: string;
    sectorId: string;
    type: string;
    status: 'Disponível' | 'Em operação' | 'Manutenção' | 'Bloqueada';
    authorizedEmployeeIds: string[];
    maintenanceDue: string;
};
type Operation = {
    projectId: string;
    project: string;
    operationId: string;
    operation: string;
    workCenter: string;
    operator?: string;
    status: string;
};
type Editor = {
    kind: 'employee' | 'role' | 'sector' | 'machine' | 'assignment';
    id?: string;
} | null;
const uid = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
const load = <T,>(key: string, fallback: T): T => { try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
}
catch {
    return fallback;
} };
const seedSectors: Sector[] = [
    { id: 'sec_eng', name: 'Engenharia', code: 'ENG', leader: 'Roberto Lima', shift: 'Administrativo', active: true },
    { id: 'sec_cnc', name: 'Usinagem CNC', code: 'CNC', leader: 'Marcos Souza', shift: '1º turno', active: true },
    { id: 'sec_aj', name: 'Ajustagem e Montagem', code: 'AJU', leader: 'Henrique Costa', shift: '1º turno', active: true },
    { id: 'sec_qual', name: 'Qualidade', code: 'QLD', leader: 'Ana Martins', shift: 'Administrativo', active: true },
];
const seedRoles: Role[] = [
    { id: 'role_cnc', title: 'Operador de CNC', cbo: '7214-05', sectorId: 'sec_cnc', skills: 'Programação CNC, leitura de desenho, metrologia', active: true },
    { id: 'role_eng', title: 'Projetista de Moldes', cbo: '3186-10', sectorId: 'sec_eng', skills: 'CAD 3D, BOM, revisão técnica', active: true },
    { id: 'role_aj', title: 'Ajustador de Moldes', cbo: '7250-20', sectorId: 'sec_aj', skills: 'Montagem, tryout, polimento', active: true },
];
const seedEmployees: Employee[] = [
    { id: 'emp_marcos', name: 'Marcos de Souza', roleId: 'role_cnc', sectorId: 'sec_cnc', shift: '1º turno', status: 'Ativo', skills: 'CNC 3 e 5 eixos, CAM', nr12Expiry: '2027-04-30', asoExpiry: '2026-12-20' },
    { id: 'emp_roberto', name: 'Roberto Lima', roleId: 'role_eng', sectorId: 'sec_eng', shift: 'Administrativo', status: 'Ativo', skills: 'SolidWorks, projetos de injeção', nr12Expiry: '', asoExpiry: '2026-10-12' },
    { id: 'emp_henrique', name: 'Henrique Costa', roleId: 'role_aj', sectorId: 'sec_aj', shift: '1º turno', status: 'Ativo', skills: 'Ajustagem, montagem, tryout', nr12Expiry: '2026-08-14', asoExpiry: '2026-09-30' },
];
const seedMachines: Machine[] = [
    { id: 'mac_romi', code: 'CNC-01', name: 'CNC ROMI D800', sectorId: 'sec_cnc', type: 'Centro de usinagem', status: 'Em operação', authorizedEmployeeIds: ['emp_marcos'], maintenanceDue: '2026-08-05' },
    { id: 'mac_ret', code: 'RET-01', name: 'Retífica Plana', sectorId: 'sec_cnc', type: 'Retífica', status: 'Disponível', authorizedEmployeeIds: ['emp_marcos'], maintenanceDue: '2026-09-15' },
];
export default function ModuloRH({ canManage, operations, onAssignOperation, showToast }: {
    canManage: boolean;
    operations: Operation[];
    onAssignOperation: (projectId: string, operationId: string, employeeName: string, machineName: string) => void;
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}) {
    const [tab, setTab] = React.useState<'people' | 'roles' | 'sectors' | 'machines' | 'assignments' | 'compliance'>('people');
    const [sectors, setSectors] = React.useState<Sector[]>(() => load('rh_sectors', seedSectors));
    const [roles, setRoles] = React.useState<Role[]>(() => load('rh_roles', seedRoles));
    const [employees, setEmployees] = React.useState<Employee[]>(() => load('rh_employees', seedEmployees));
    const [machines, setMachines] = React.useState<Machine[]>(() => load('rh_machines', seedMachines));
    const [editor, setEditor] = React.useState<Editor>(null);
    const [form, setForm] = React.useState<Record<string, string>>({});
    React.useEffect(() => localStorage.setItem('rh_sectors', JSON.stringify(sectors)), [sectors]);
    React.useEffect(() => localStorage.setItem('rh_roles', JSON.stringify(roles)), [roles]);
    React.useEffect(() => localStorage.setItem('rh_employees', JSON.stringify(employees)), [employees]);
    React.useEffect(() => localStorage.setItem('rh_machines', JSON.stringify(machines)), [machines]);
    const sectorName = (id: string) => sectors.find(s => s.id === id)?.name || 'Não definido';
    const roleName = (id: string) => roles.find(r => r.id === id)?.title || 'Sem função';
    const begin = (kind: NonNullable<Editor>['kind'], item?: any) => { if (!canManage)
        return; setEditor({ kind, id: item?.id }); setForm(item ? { ...item, authorizedEmployeeIds: (item.authorizedEmployeeIds || []).join(',') } : { status: kind === 'employee' ? 'Ativo' : kind === 'machine' ? 'Disponível' : '', active: 'true', sectorId: sectors[0]?.id || '', roleId: roles[0]?.id || '', shift: '1º turno' }); };
    const set = (key: string, value: string) => setForm(current => ({ ...current, [key]: value }));
    const close = () => { setEditor(null); setForm({}); };
    const save = () => {
        if (!editor)
            return;
        if (editor.kind === 'employee') {
            if (!form.name?.trim())
                return showToast('Informe o nome do colaborador.', 'error');
            const entry: Employee = { id: editor.id || uid('emp'), name: form.name.trim(), roleId: form.roleId, sectorId: form.sectorId, shift: form.shift || '1º turno', status: (form.status || 'Ativo') as Employee['status'], skills: form.skills || '', nr12Expiry: form.nr12Expiry || '', asoExpiry: form.asoExpiry || '' };
            setEmployees(list => editor.id ? list.map(x => x.id === editor.id ? entry : x) : [entry, ...list]);
        }
        if (editor.kind === 'role') {
            if (!form.title?.trim())
                return showToast('Informe o nome da função.', 'error');
            const entry: Role = { id: editor.id || uid('role'), title: form.title.trim(), cbo: form.cbo || '', sectorId: form.sectorId, skills: form.skills || '', active: form.active !== 'false' };
            setRoles(list => editor.id ? list.map(x => x.id === editor.id ? entry : x) : [entry, ...list]);
        }
        if (editor.kind === 'sector') {
            if (!form.name?.trim() || !form.code?.trim())
                return showToast('Informe nome e código do setor.', 'error');
            const entry: Sector = { id: editor.id || uid('sec'), name: form.name.trim(), code: form.code.trim().toUpperCase(), leader: form.leader || '', shift: form.shift || 'Administrativo', active: form.active !== 'false' };
            setSectors(list => editor.id ? list.map(x => x.id === editor.id ? entry : x) : [entry, ...list]);
        }
        if (editor.kind === 'machine') {
            if (!form.name?.trim() || !form.code?.trim())
                return showToast('Informe nome e código da máquina.', 'error');
            const entry: Machine = { id: editor.id || uid('mac'), code: form.code.trim().toUpperCase(), name: form.name.trim(), sectorId: form.sectorId, type: form.type || 'Máquina', status: (form.status || 'Disponível') as Machine['status'], authorizedEmployeeIds: (form.authorizedEmployeeIds || '').split(',').map(x => x.trim()).filter(Boolean), maintenanceDue: form.maintenanceDue || '' };
            setMachines(list => editor.id ? list.map(x => x.id === editor.id ? entry : x) : [entry, ...list]);
        }
        if (editor.kind === 'assignment') {
            const operation = operations.find(x => `${x.projectId}:${x.operationId}` === form.operation);
            const employee = employees.find(x => x.id === form.employeeId);
            const machine = machines.find(x => x.id === form.machineId);
            if (!operation || !employee)
                return showToast('Selecione a operação e o colaborador.', 'error');
            onAssignOperation(operation.projectId, operation.operationId, employee.name, machine?.name || operation.workCenter);
        }
        close();
        showToast('Registro salvo e integrado ao fluxo operacional.', 'success');
    };
    const remove = (kind: string, id: string) => { if (!canManage || !confirm('Excluir este registro?'))
        return; if (kind === 'employee')
        setEmployees(x => x.filter(i => i.id !== id)); if (kind === 'role')
        setRoles(x => x.filter(i => i.id !== id)); if (kind === 'sector')
        setSectors(x => x.filter(i => i.id !== id)); if (kind === 'machine')
        setMachines(x => x.filter(i => i.id !== id)); showToast('Registro removido.', 'info'); };
    const expiring = employees.filter(e => [e.nr12Expiry, e.asoExpiry].some(d => d && new Date(d).getTime() < Date.now() + 60 * 86400000));
    const tabs = [{ id: 'people', label: 'Colaboradores', icon: Users }, { id: 'roles', label: 'Funções', icon: BriefcaseBusiness }, { id: 'sectors', label: 'Setores', icon: Building2 }, { id: 'machines', label: 'Máquinas', icon: Factory }, { id: 'assignments', label: 'Atribuições', icon: ClipboardList }, { id: 'compliance', label: 'SST & Capacitações', icon: ShieldCheck }] as const;
    const managerNotice = !canManage && <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">Você tem acesso de consulta. Gestores e administradores podem cadastrar, editar e remover registros.</div>;
    return <div className="space-y-6 animate-fadeIn">
    <section className="rh-hero rounded-2xl p-6 text-white relative overflow-hidden"><div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-amber-200"><Users className="h-4 w-4"/> Pessoas & Operação</div><h2 className="mt-2 font-display text-2xl font-black">Gestão de RH integrada à fábrica</h2><p className="mt-2 max-w-2xl text-xs leading-relaxed text-slate-300">Estruture pessoas, funções, setores, capacitações e máquinas; depois atribua cada colaborador autorizado às operações reais dos projetos.</p></div>{canManage && <button onClick={() => begin('employee')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d5ad4a] px-4 py-2.5 text-xs font-extrabold text-[#09213a] shadow-lg transition hover:bg-[#ecc971]"><Plus className="h-4 w-4"/>Novo colaborador</button>}</div><div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4"><Kpi label="Colaboradores ativos" value={String(employees.filter(e => e.status === 'Ativo').length)}/><Kpi label="Máquinas disponíveis" value={String(machines.filter(m => m.status === 'Disponível' || m.status === 'Em operação').length)}/><Kpi label="Setores ativos" value={String(sectors.filter(s => s.active).length)}/><Kpi label="Alertas SST" value={String(expiring.length)} alert={expiring.length > 0}/></div></section>
    <div className="rh-tabs flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">{tabs.map(t => { const Icon = t.icon; return <button key={t.id} onClick={() => setTab(t.id)} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition ${tab === t.id ? 'bg-[#102e4b] text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}><Icon className="h-4 w-4"/>{t.label}</button>; })}</div>
    {managerNotice}
    {tab === 'people' && <Panel title="Colaboradores" action={canManage ? <button onClick={() => begin('employee')} className="rh-primary"><Plus className="h-4 w-4"/>Cadastrar colaborador</button> : undefined}><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-400"><th className="p-3">Colaborador</th><th>Função / Setor</th><th>Turno</th><th>Capacitações</th><th>Status</th><th /></tr></thead><tbody>{employees.map(e => <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50/70"><td className="p-3"><b className="text-slate-800">{e.name}</b><span className="mt-1 block text-[10px] text-slate-400">{e.skills || 'Sem competências cadastradas'}</span></td><td><b className="text-slate-700">{roleName(e.roleId)}</b><span className="mt-1 block text-[10px] text-slate-400">{sectorName(e.sectorId)}</span></td><td>{e.shift}</td><td><Cert value={e.nr12Expiry} label="NR-12"/><Cert value={e.asoExpiry} label="ASO"/></td><td><Status value={e.status}/></td><td className="pr-3"><Actions edit={() => begin('employee', e)} del={() => remove('employee', e.id)} show={canManage}/></td></tr>)}</tbody></table></div></Panel>}
    {tab === 'roles' && <Panel title="Funções e competências" action={canManage ? <button onClick={() => begin('role')} className="rh-primary"><Plus className="h-4 w-4"/>Nova função</button> : undefined}><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{roles.map(r => <article key={r.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4"><div className="flex justify-between gap-3"><div><h3 className="font-bold text-slate-800">{r.title}</h3><p className="mt-1 font-mono text-[10px] text-slate-500">CBO: {r.cbo || 'não informado'}</p></div><Actions edit={() => begin('role', r)} del={() => remove('role', r.id)} show={canManage}/></div><p className="mt-4 text-xs text-slate-600"><b>Setor:</b> {sectorName(r.sectorId)}</p><p className="mt-2 text-xs leading-relaxed text-slate-500">{r.skills || 'Competências ainda não informadas.'}</p></article>)}</div></Panel>}
    {tab === 'sectors' && <Panel title="Setores de trabalho" action={canManage ? <button onClick={() => begin('sector')} className="rh-primary"><Plus className="h-4 w-4"/>Novo setor</button> : undefined}><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{sectors.map(s => <article key={s.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between"><div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 font-mono text-xs font-bold text-blue-700">{s.code}</div><Actions edit={() => begin('sector', s)} del={() => remove('sector', s.id)} show={canManage}/></div><h3 className="mt-4 font-bold text-slate-800">{s.name}</h3><p className="mt-1 text-xs text-slate-500">Líder: {s.leader || 'Não atribuído'}</p><div className="mt-4 flex justify-between text-[10px] font-semibold"><span className="text-slate-400">{s.shift}</span><span className={s.active ? 'text-emerald-600' : 'text-slate-400'}>{s.active ? 'ATIVO' : 'INATIVO'}</span></div></article>)}</div></Panel>}
    {tab === 'machines' && <Panel title="Máquinas e centros de trabalho" action={canManage ? <button onClick={() => begin('machine')} className="rh-primary"><Plus className="h-4 w-4"/>Nova máquina</button> : undefined}><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{machines.map(m => <article key={m.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex justify-between"><div><p className="font-mono text-[10px] font-bold text-[#2d6db2]">{m.code}</p><h3 className="mt-1 font-bold text-slate-800">{m.name}</h3></div><Actions edit={() => begin('machine', m)} del={() => remove('machine', m.id)} show={canManage}/></div><p className="mt-3 text-xs text-slate-500">{m.type} · {sectorName(m.sectorId)}</p><div className="mt-4 rounded-xl bg-slate-50 p-3 text-[10px] text-slate-500"><p>Operadores autorizados: <b className="text-slate-700">{m.authorizedEmployeeIds.map(id => employees.find(e => e.id === id)?.name).filter(Boolean).join(', ') || 'Nenhum'}</b></p><p className="mt-1">Próx. manutenção: <b className="text-slate-700">{m.maintenanceDue || 'Não definida'}</b></p></div><div className="mt-3"><Status value={m.status}/></div></article>)}</div></Panel>}
    {tab === 'assignments' && <Panel title="Atribuições ao fluxo de trabalho" action={canManage ? <button onClick={() => begin('assignment')} className="rh-primary"><Plus className="h-4 w-4"/>Atribuir colaborador</button> : undefined}><p className="mb-4 text-xs text-slate-500">Atribua pessoas e máquinas às operações do PCP. A atualização é refletida no projeto e no chão de fábrica.</p><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-400"><th className="p-3">Projeto</th><th>Operação</th><th>Centro de trabalho</th><th>Responsável</th><th>Status</th><th /></tr></thead><tbody>{operations.map(o => <tr key={o.operationId} className="border-b border-slate-100"><td className="p-3 font-semibold text-slate-700">{o.project}</td><td>{o.operation}</td><td>{o.workCenter}</td><td>{o.operator || <span className="text-amber-600">Não atribuído</span>}</td><td><Status value={o.status}/></td><td className="pr-3">{canManage && <button onClick={() => begin('assignment', { operation: `${o.projectId}:${o.operationId}` })} className="rounded-lg p-2 text-[#2d6db2] hover:bg-blue-50" title="Atribuir"><Pencil className="h-4 w-4"/></button>}</td></tr>)}</tbody></table></div></Panel>}
    {tab === 'compliance' && <Panel title="Capacitações, SST e documentos funcionais"><div className="grid gap-4 md:grid-cols-2"><div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5"><GraduationCap className="h-6 w-6 text-emerald-600"/><h3 className="mt-3 font-bold text-slate-800">Capacitações e NR-12</h3><p className="mt-2 text-xs leading-relaxed text-slate-600">Registre certificados, validade e autorização para operar cada máquina. O sistema alerta documentos próximos do vencimento.</p><p className="mt-4 text-xs font-semibold text-emerald-700">{employees.filter(e => e.nr12Expiry).length} colaboradores com NR-12 registrada</p></div><div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5"><BadgeCheck className="h-6 w-6 text-blue-600"/><h3 className="mt-3 font-bold text-slate-800">ASO e saúde ocupacional</h3><p className="mt-2 text-xs leading-relaxed text-slate-600">Mantenha somente status, validade e aptidão operacional neste painel. Documentos médicos detalhados exigem controle restrito por LGPD.</p><p className="mt-4 text-xs font-semibold text-blue-700">{employees.filter(e => e.asoExpiry).length} ASOs com validade registrada</p></div></div>{expiring.length > 0 && <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900"><b>Revisão necessária:</b> {expiring.map(e => e.name).join(', ')} possuem ASO ou NR-12 vencendo nos próximos 60 dias.</div>}</Panel>}
    {editor && <EditorModal editor={editor} form={form} set={set} save={save} close={close} sectors={sectors} roles={roles} employees={employees} machines={machines} operations={operations}/>} 
  </div>;
}
function Kpi({ label, value, alert }: {
    label: string;
    value: string;
    alert?: boolean;
}) { return <div className="rounded-xl border border-white/10 bg-white/8 p-3"><p className="text-[9px] font-bold uppercase tracking-wider text-slate-300">{label}</p><p className={`mt-1 text-xl font-black ${alert ? 'text-amber-300' : 'text-white'}`}>{value}</p></div>; }
function Panel({ title, action, children }: {
    title: string;
    action?: React.ReactNode;
    children: React.ReactNode;
}) { return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-5 flex items-center justify-between gap-3"><h2 className="font-display text-base font-black text-slate-800">{title}</h2>{action}</div>{children}</section>; }
function Status({ value }: {
    value: string;
}) { const c = value === 'Ativo' || value === 'Disponível' || value === 'Em operação' || value === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : value === 'Férias' || value === 'Manutenção' || value === 'in_progress' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'; return <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-bold ${c}`}>{value}</span>; }
function Cert({ value, label }: {
    value: string;
    label: string;
}) { if (!value)
    return <span className="mr-1 text-[10px] text-slate-400">{label}: —</span>; const late = new Date(value).getTime() < Date.now() + 60 * 86400000; return <span className={`mr-1 inline-flex rounded px-1.5 py-0.5 text-[9px] font-bold ${late ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{label} {new Date(value + 'T12:00:00').toLocaleDateString('pt-BR')}</span>; }
function Actions({ edit, del, show }: {
    edit: () => void;
    del: () => void;
    show: boolean;
}) { return show ? <div className="flex justify-end"><button onClick={edit} className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600"><Pencil className="h-4 w-4"/></button><button onClick={del} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4"/></button></div> : null; }
function Field({ label, children }: {
    label: string;
    children: React.ReactNode;
}) { return <label className="grid gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-500"><span>{label}</span>{children}</label>; }
function EditorModal({ editor, form, set, save, close, sectors, roles, employees, machines, operations }: any) { const formRef = React.useRef(form);
    const setRef = React.useRef(set);
    formRef.current = form;
    setRef.current = set;
    const I = React.useCallback(({ k, type = 'text', placeholder }: {
        k: string;
        type?: string;
        placeholder?: string;
    }) => <input type={type} value={formRef.current[k] || ''} placeholder={placeholder} onChange={e => setRef.current(k, e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-blue-500"/>, []); const Select = ({ k, children }: {
    k: string;
    children: React.ReactNode;
}) => <select value={form[k] || ''} onChange={e => set(k, e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-800 outline-none">{children}</select>; const title = { employee: 'Colaborador', role: 'Função', sector: 'Setor', machine: 'Máquina', assignment: 'Atribuição operacional' }[editor.kind]; return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"><div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-widest text-[#2d6db2]">RH & Operação</p><h2 className="mt-1 font-display text-xl font-black text-slate-800">{editor.id ? 'Editar' : 'Novo'} {title}</h2></div><button onClick={close} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5"/></button></div><div className="grid gap-4 sm:grid-cols-2">{editor.kind === 'employee' && <><Field label="Nome completo"><I k="name"/></Field><Field label="Função"><Select k="roleId">{roles.map((r: any) => <option key={r.id} value={r.id}>{r.title}</option>)}</Select></Field><Field label="Setor"><Select k="sectorId">{sectors.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field><Field label="Turno"><I k="shift"/></Field><Field label="Status"><Select k="status"><option>Ativo</option><option>Férias</option><option>Afastado</option><option>Inativo</option></Select></Field><Field label="NR-12 válida até"><I k="nr12Expiry" type="date"/></Field><Field label="ASO válido até"><I k="asoExpiry" type="date"/></Field><Field label="Competências"><I k="skills" placeholder="Ex.: CNC, CAM, metrologia"/></Field></>}{editor.kind === 'role' && <><Field label="Nome da função"><I k="title"/></Field><Field label="Código CBO"><I k="cbo" placeholder="Ex.: 7214-05"/></Field><Field label="Setor padrão"><Select k="sectorId">{sectors.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field><Field label="Competências exigidas"><I k="skills"/></Field></>}{editor.kind === 'sector' && <><Field label="Nome"><I k="name"/></Field><Field label="Código"><I k="code" placeholder="Ex.: CNC"/></Field><Field label="Líder"><I k="leader"/></Field><Field label="Turno padrão"><I k="shift"/></Field></>}{editor.kind === 'machine' && <><Field label="Nome"><I k="name"/></Field><Field label="Código"><I k="code"/></Field><Field label="Tipo"><I k="type"/></Field><Field label="Setor"><Select k="sectorId">{sectors.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field><Field label="Status"><Select k="status"><option>Disponível</option><option>Em operação</option><option>Manutenção</option><option>Bloqueada</option></Select></Field><Field label="Manutenção prevista"><I k="maintenanceDue" type="date"/></Field><Field label="IDs dos autorizados"><I k="authorizedEmployeeIds" placeholder="emp_..., emp_..."/></Field></>}{editor.kind === 'assignment' && <><Field label="Operação"><Select k="operation"><option value="">Selecione</option>{operations.map((o: any) => <option key={o.operationId} value={`${o.projectId}:${o.operationId}`}>{o.project} · {o.operation}</option>)}</Select></Field><Field label="Colaborador"><Select k="employeeId"><option value="">Selecione</option>{employees.filter((e: any) => e.status === 'Ativo').map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}</Select></Field><Field label="Máquina / centro"><Select k="machineId"><option value="">Manter centro da operação</option>{machines.filter((m: any) => m.status !== 'Bloqueada').map((m: any) => <option key={m.id} value={m.id}>{m.code} · {m.name}</option>)}</Select></Field></>}</div><div className="mt-6 flex justify-end gap-2"><button onClick={close} className="rounded-xl px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100">Cancelar</button><button onClick={save} className="rh-primary"><CheckCircle2 className="h-4 w-4"/>Salvar</button></div></div></div>; }
