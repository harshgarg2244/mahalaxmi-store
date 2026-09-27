create or replace function public.claim_owner()
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return false; end if;
  if exists (select 1 from public.user_roles where user_id = auth.uid()) then return true; end if;
  if exists (select 1 from public.user_roles) then return false; end if;
  insert into public.user_roles(user_id, role) values (auth.uid(), 'admin');
  return true;
end $$;
revoke all on function public.claim_owner() from public, anon;
grant execute on function public.claim_owner() to authenticated;