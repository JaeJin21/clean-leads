-- ============================================================
--  leads 테이블 생성 스크립트
--  Supabase SQL Editor에 붙여넣고 실행하세요.
-- ============================================================

create table if not exists public.leads (
  id           uuid primary key default gen_random_uuid(),
  name         text        not null,
  phone        text        not null,
  address      text        not null,
  service_type text        not null,   -- 입주청소 | 거주청소 | 사무실청소
  size         integer     not null,   -- 평수
  date         date        not null,   -- 희망 날짜
  status       text        not null default 'pending',  -- pending | matched | completed | cancelled
  created_at   timestamptz not null default now()
);

-- ── 인덱스 ────────────────────────────────────────────────
create index if not exists leads_status_idx      on public.leads (status);
create index if not exists leads_created_at_idx  on public.leads (created_at desc);

-- ── RLS(Row Level Security) ───────────────────────────────
-- 클라이언트(anon key)는 INSERT만 허용, 조회는 서비스 롤만 허용
alter table public.leads enable row level security;

-- anon 사용자: INSERT 전용
create policy "anon can insert leads"
  on public.leads
  for insert
  to anon
  with check (true);

-- service_role: 전체 권한 (관리자 대시보드 용)
create policy "service role full access"
  on public.leads
  for all
  to service_role
  using (true)
  with check (true);

-- ── 컬럼 주석 ─────────────────────────────────────────────
comment on table  public.leads               is '청소 업체 매칭 리드';
comment on column public.leads.service_type  is '청소 종류: 입주청소 | 거주청소 | 사무실청소';
comment on column public.leads.size          is '평수 (정수)';
comment on column public.leads.status        is '리드 상태: pending | matched | completed | cancelled';

-- ============================================================
--  Migration: ref_channel 컬럼 추가
--  기존 테이블에 적용할 경우 아래 ALTER TABLE을 실행하세요.
-- ============================================================

alter table public.leads
  add column if not exists ref_channel text;   -- 유입 채널: blog | threads | daangn | direct | x | null

comment on column public.leads.ref_channel is '유입 채널: blog | threads | daangn | direct | x';
