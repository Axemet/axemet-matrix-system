# Axemet System

Plataforma de gestão para indústrias de moldes e matrizes. O fluxo principal parte do orçamento comercial aprovado, cria uma ordem de fabricação rastreável e acompanha engenharia, PCP, compras, fabricação, try-out, qualidade, entrega e garantia.

## Módulos

- Comercial: clientes, orçamento técnico, CRM e aprovação.
- Projetos: criação automática de OS, estágios e histórico de movimentações.
- RH e estrutura: colaboradores, funções com CBO, setores, máquinas, SST e atribuições.
- Suprimentos: fornecedores homologados e dados para compras.
- Dashboard: carteira, prazos críticos, disponibilidade de máquinas e pessoas usando dados cadastrados.

## Segurança e acesso

Autenticação é feita exclusivamente pelo Supabase Auth. Não há usuário, senha ou recuperação simulados no navegador. O banco usa RLS por organização, status de conta e módulo. Administradores e gestores concedem permissões de visualização e edição para cada área.

## Configuração do Supabase

1. Defina `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no provedor de deploy.
2. Execute os arquivos de `supabase/migrations` no SQL Editor, em ordem cronológica.
3. Execute `supabase/activate-filipe-admin.sql` apenas para ativar o administrador inicial.
4. Cadastros novos entram como `pending`; aprove-os em Gestão de Acessos e atribua permissões.

As migrations são parte obrigatória do sistema. Não use scripts antigos de demonstração.

## Desenvolvimento e validação

```bash
npm install
npm run build
```

`npm run build` deve ser executado fora do ambiente sandbox do Codex, pois o Vite/esbuild pode não conseguir resolver diretórios ancestrais restritos neste ambiente. A validação de tipos pode ser executada com:

```bash
node_modules/.bin/tsc --noEmit
```
