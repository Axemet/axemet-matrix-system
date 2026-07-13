-- Commercial document identity: public website belongs to the organization;
-- the phone belongs to the logged-in collaborator who sends the proposal.
alter table public.organizations add column if not exists website text;
alter table public.profiles add column if not exists phone text;
