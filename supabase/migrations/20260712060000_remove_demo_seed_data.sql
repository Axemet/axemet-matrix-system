-- Remove only the explicit IDs created by the legacy bootstrap seed. Real records are never targeted.
delete from public.clients where id in ('client_1','client_2','client_3');
delete from public.materials where id in ('mat_1045','mat_p20','mat_cobre','mat_aluminio','mat_h13');
delete from public.services where id in ('srv_0','srv_1','srv_2','srv_3','srv_4','srv_5');
delete from public.machining_types where id in ('mt_fresa','mt_fresa_temp','mt_fresa_alum','mt_erosao','mt_retifica');
