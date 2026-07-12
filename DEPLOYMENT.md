# Publicação do MATRIX SYSTEM

1. Crie um projeto no Supabase e configure o provedor de e-mail em Authentication.
2. Execute, nesta ordem, as migrations da pasta `supabase/migrations` no SQL Editor.
3. Crie a primeira conta no sistema e aprove-a manualmente uma única vez:

```sql
update public.profiles
set role = 'admin', status = 'active'
where email = 'SEU_EMAIL_CORPORATIVO';
```

4. Na Vercel, importe este diretório e informe as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
5. Faça o deploy. Nunca cadastre a chave `service_role` no frontend.

O ambiente de produção exige conta Supabase configurada; logins locais e credenciais padrão foram desabilitados.
