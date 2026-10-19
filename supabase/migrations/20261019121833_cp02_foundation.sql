-- CP-02: local synthetic foundation. Supabase supplies auth.users/auth.uid().
create schema if not exists app_private;
create schema if not exists api;
revoke all on schema app_private from public, anon, authenticated;
revoke all on schema api from public, anon;
grant usage on schema api to authenticated;

create table public.organizations (
 id uuid primary key default gen_random_uuid(), code text not null unique,
 name text not null, active boolean not null default true, created_at timestamptz not null default now()
);
create table public.units (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
 code text not null, name text not null, timezone text not null default 'America/Sao_Paulo',
 active boolean not null default true, unique(organization_id,id), unique(organization_id,code)
);
create table public.user_profiles (
 organization_id uuid not null references public.organizations(id), user_id uuid not null references auth.users(id),
 display_name text not null, active boolean not null default true, suspended_at timestamptz,
 primary key(organization_id,user_id), check (not active or suspended_at is null)
);
create table public.access_grants (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, user_id uuid not null,
 unit_id uuid, role text not null check(role in ('access_admin','reception','professional','finance','management')),
 granted_by uuid references auth.users(id), reason text not null check(length(trim(reason)) > 0),
 created_at timestamptz not null default now(), valid_from timestamptz not null default now(),
 valid_until timestamptz, revoked_at timestamptz, revoked_by uuid references auth.users(id), revocation_reason text,
 foreign key(organization_id,user_id) references public.user_profiles(organization_id,user_id),
 foreign key(organization_id,unit_id) references public.units(organization_id,id),
 check (role <> 'access_admin' or unit_id is null),
 check (valid_until is null or valid_until > valid_from),
 check (revoked_at is null or (revoked_by is not null and length(trim(revocation_reason)) > 0))
);
create unique index access_grants_active_unique on public.access_grants
 (organization_id,user_id,role,coalesce(unit_id,'00000000-0000-0000-0000-000000000000'::uuid))
 where revoked_at is null;
create index access_grants_actor_idx on public.access_grants(user_id,organization_id,role) where revoked_at is null;
create table public.professionals (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
 user_id uuid, display_name text not null, active boolean not null default true, unique(organization_id,id),
 foreign key(organization_id,user_id) references public.user_profiles(organization_id,user_id)
);
create table public.professional_units (
 organization_id uuid not null, professional_id uuid not null, unit_id uuid not null, active boolean not null default true,
 primary key(organization_id,professional_id,unit_id),
 foreign key(organization_id,professional_id) references public.professionals(organization_id,id),
 foreign key(organization_id,unit_id) references public.units(organization_id,id)
);
create table public.patients (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
 display_name text not null, active boolean not null default true, unique(organization_id,id)
);
create table public.patient_units (
 organization_id uuid not null, patient_id uuid not null, unit_id uuid not null, active boolean not null default true,
 primary key(organization_id,patient_id,unit_id),
 foreign key(organization_id,patient_id) references public.patients(organization_id,id),
 foreign key(organization_id,unit_id) references public.units(organization_id,id)
);
create index patient_units_unit_idx on public.patient_units(organization_id,unit_id,patient_id) where active;
create table public.appointments (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, unit_id uuid not null,
 patient_id uuid not null, professional_id uuid not null, starts_at timestamptz not null,
 status text not null check(status in ('scheduled','confirmed','absent','cancelled')),
 version integer not null default 1 check(version > 0), unique(organization_id,id),
 unique(organization_id,id,professional_id),
 foreign key(organization_id,unit_id) references public.units(organization_id,id),
 foreign key(organization_id,patient_id,unit_id) references public.patient_units(organization_id,patient_id,unit_id),
 foreign key(organization_id,professional_id,unit_id) references public.professional_units(organization_id,professional_id,unit_id)
);
create index appointments_unit_idx on public.appointments(organization_id,unit_id,starts_at);
create table public.care_links (
 organization_id uuid not null, appointment_id uuid not null, professional_id uuid not null, active boolean not null default true,
 primary key(organization_id,appointment_id,professional_id),
 foreign key(organization_id,appointment_id,professional_id)
  references public.appointments(organization_id,id,professional_id),
 foreign key(organization_id,professional_id) references public.professionals(organization_id,id)
);
create table public.access_events (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
 actor_id uuid references auth.users(id), subject_id uuid references auth.users(id), grant_id uuid references public.access_grants(id),
 action text not null check(action in ('grant','revoke','suspend','resume')), reason text not null,
 happened_at timestamptz not null default now()
);
create index access_events_org_idx on public.access_events(organization_id,happened_at desc);

-- Narrow SECURITY DEFINER checks avoid recursive RLS. They never accept actor identity as input.
create function app_private.has_grant(p_org uuid,p_unit uuid,p_roles text[])
returns boolean language sql stable security definer set search_path = ''
as $$
 select (select auth.uid()) is not null and exists (
  select 1 from public.user_profiles up
  join public.access_grants g on g.organization_id=up.organization_id and g.user_id=up.user_id
  join public.organizations o on o.id=up.organization_id
  where up.user_id=(select auth.uid()) and up.organization_id=p_org and up.active and up.suspended_at is null and o.active
   and g.revoked_at is null and g.valid_from <= now() and (g.valid_until is null or g.valid_until > now())
   and g.role=any(p_roles)
   and (g.unit_id is null or (g.unit_id=p_unit and exists (
    select 1 from public.units u where u.id=g.unit_id and u.organization_id=p_org and u.active)))
 );
$$;
create function app_private.can_access_patient(p_org uuid,p_patient uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
 select exists (select 1 from public.patient_units pu
  where pu.organization_id=p_org and pu.patient_id=p_patient and pu.active
   and app_private.has_grant(p_org,pu.unit_id,array['reception','professional','finance','management','access_admin']));
$$;
create function app_private.can_access_care(p_org uuid,p_appointment uuid,p_professional uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
 select exists (select 1 from public.care_links cl
  join public.appointments a on a.organization_id=cl.organization_id and a.id=cl.appointment_id
  join public.professionals pp on pp.organization_id=cl.organization_id and pp.id=cl.professional_id
  where cl.organization_id=p_org and cl.appointment_id=p_appointment and cl.professional_id=p_professional
   and cl.active and pp.active and pp.user_id=(select auth.uid())
   and app_private.has_grant(p_org,a.unit_id,array['professional']));
$$;
revoke all on all functions in schema app_private from public, anon;
grant usage on schema app_private to authenticated;
grant execute on function app_private.has_grant(uuid,uuid,text[]),
 app_private.can_access_patient(uuid,uuid),app_private.can_access_care(uuid,uuid,uuid) to authenticated;

revoke all on all tables in schema public from public, anon, authenticated;
grant usage on schema public to authenticated, service_role;
grant select on public.organizations,public.units,public.user_profiles,public.access_grants,
 public.professionals,public.professional_units,public.patients,public.patient_units,
 public.appointments,public.care_links,public.access_events to authenticated;
grant all on public.organizations,public.units,public.user_profiles,public.access_grants,
 public.professionals,public.professional_units,public.patients,public.patient_units,
 public.appointments,public.care_links,public.access_events to service_role;
alter table public.organizations enable row level security;
alter table public.units enable row level security;
alter table public.user_profiles enable row level security;
alter table public.access_grants enable row level security;
alter table public.professionals enable row level security;
alter table public.professional_units enable row level security;
alter table public.patients enable row level security;
alter table public.patient_units enable row level security;
alter table public.appointments enable row level security;
alter table public.care_links enable row level security;
alter table public.access_events enable row level security;
create policy org_read on public.organizations for select to authenticated
 using(app_private.has_grant(id,null,array['access_admin','management']));
create policy unit_read on public.units for select to authenticated
 using(app_private.has_grant(organization_id,id,array['access_admin','reception','professional','finance','management']));
create policy profile_read on public.user_profiles for select to authenticated
 using((user_id=(select auth.uid()) and active and suspended_at is null)
  or app_private.has_grant(organization_id,null,array['access_admin']));
create policy grant_read on public.access_grants for select to authenticated
 using((user_id=(select auth.uid()) and app_private.has_grant(organization_id,unit_id,array[role]))
  or app_private.has_grant(organization_id,null,array['access_admin']));
create policy professional_read on public.professionals for select to authenticated
 using(exists(select 1 from public.professional_units pu where pu.organization_id=professionals.organization_id
  and pu.professional_id=professionals.id and pu.active
  and app_private.has_grant(pu.organization_id,pu.unit_id,array['access_admin','reception','professional','management'])));
create policy professional_unit_read on public.professional_units for select to authenticated
 using(active and app_private.has_grant(organization_id,unit_id,array['access_admin','reception','professional','management']));
create policy patient_read on public.patients for select to authenticated
 using(app_private.can_access_patient(organization_id,id));
create policy patient_unit_read on public.patient_units for select to authenticated
 using(active and app_private.has_grant(organization_id,unit_id,array['access_admin','reception','professional','finance','management']));
create policy appointment_read on public.appointments for select to authenticated
 using(app_private.has_grant(organization_id,unit_id,array['access_admin','reception','finance','management'])
  or app_private.can_access_care(organization_id,id,professional_id));
create policy care_link_read on public.care_links for select to authenticated
 using(app_private.can_access_care(organization_id,appointment_id,professional_id));
create policy access_event_read on public.access_events for select to authenticated
 using(app_private.has_grant(organization_id,null,array['access_admin']));

create function api.grant_access(p_org uuid,p_user uuid,p_role text,p_unit uuid,p_reason text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare v_id uuid;
begin
 if (select auth.uid()) is null or not app_private.has_grant(p_org,null,array['access_admin']) then
  raise exception 'access denied' using errcode='42501';
 end if;
 if p_user=(select auth.uid()) or p_role not in ('reception','professional','finance','management','access_admin')
  or (p_role='access_admin' and p_unit is not null) or p_reason is null or length(trim(p_reason))=0 then
  raise exception 'invalid grant' using errcode='22023';
 end if;
 if not exists(select 1 from public.user_profiles where organization_id=p_org and user_id=p_user and active and suspended_at is null)
  or (p_unit is not null and not exists(select 1 from public.units where organization_id=p_org and id=p_unit and active)) then
  raise exception 'invalid scope' using errcode='22023';
 end if;
 insert into public.access_grants(organization_id,user_id,unit_id,role,granted_by,reason)
  values(p_org,p_user,p_unit,p_role,(select auth.uid()),p_reason) returning id into v_id;
 insert into public.access_events(organization_id,actor_id,subject_id,grant_id,action,reason)
  values(p_org,(select auth.uid()),p_user,v_id,'grant',p_reason);
 return v_id;
end;
$$;
create function api.revoke_access(p_grant uuid,p_reason text)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare v_grant public.access_grants%rowtype;
begin
 select * into v_grant from public.access_grants where id=p_grant for update;
 if not found or (select auth.uid()) is null or not app_private.has_grant(v_grant.organization_id,null,array['access_admin']) then
  raise exception 'access denied' using errcode='42501';
 end if;
 if v_grant.user_id=(select auth.uid()) or p_reason is null or length(trim(p_reason))=0 then
  raise exception 'invalid revocation' using errcode='22023';
 end if;
 if v_grant.revoked_at is not null then return false; end if;
 update public.access_grants set revoked_at=now(),revoked_by=(select auth.uid()),revocation_reason=p_reason where id=p_grant;
 insert into public.access_events(organization_id,actor_id,subject_id,grant_id,action,reason)
  values(v_grant.organization_id,(select auth.uid()),v_grant.user_id,p_grant,'revoke',p_reason);
 return true;
end;
$$;
create function api.set_user_suspension(p_org uuid,p_user uuid,p_suspended boolean,p_reason text)
returns boolean language plpgsql security definer set search_path = ''
as $$
begin
 if (select auth.uid()) is null or not app_private.has_grant(p_org,null,array['access_admin']) then
  raise exception 'access denied' using errcode='42501';
 end if;
 if p_user=(select auth.uid()) or p_reason is null or length(trim(p_reason))=0 then
  raise exception 'invalid suspension' using errcode='22023';
 end if;
 update public.user_profiles set active=not p_suspended,
  suspended_at=case when p_suspended then now() else null end
  where organization_id=p_org and user_id=p_user and active is distinct from not p_suspended;
 if not found then return false; end if;
 insert into public.access_events(organization_id,actor_id,subject_id,action,reason)
  values(p_org,(select auth.uid()),p_user,case when p_suspended then 'suspend' else 'resume' end,p_reason);
 return true;
end;
$$;
revoke all on all functions in schema api from public, anon;
grant execute on function api.grant_access(uuid,uuid,text,uuid,text),
 api.revoke_access(uuid,text),api.set_user_suspension(uuid,uuid,boolean,text) to authenticated;
