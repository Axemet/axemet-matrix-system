-- Execute after creating and confirming filipe@axemetsolution.com in the application.
update public.profiles
set role = 'admin', status = 'active'
where email = 'filipe@axemetsolution.com';
