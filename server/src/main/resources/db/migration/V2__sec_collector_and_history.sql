-- 스키마 v2: SEC 수집기 + 데이터 쌓기 (docs/data-sources.md "데이터 쌓기 원칙")

-- 기업: SEC 본사 주소 원본(좌표 변환 전)과 마지막 수집 시각
alter table company
    add column sec_street       varchar(200),
    add column sec_city         varchar(100),
    add column sec_state        varchar(10),
    add column sec_zip          varchar(20),
    add column sec_synced_at    timestamptz;

-- 지도 지표: 어떤 정리 규칙 버전으로 계산했는지
alter table company_snapshot
    add column calc_version integer;

-- 시점 값(start 가 null)도 중복 방지되게 (PostgreSQL 15+)
-- V1 의 자동 생성 이름은 63자에서 잘려서 이름을 찾아 지운다
do $$
declare c text;
begin
    select conname into c from pg_constraint where conrelid = 'financial_fact'::regclass and contype = 'u';
    execute format('alter table financial_fact drop constraint %I', c);
end $$;
alter table financial_fact
    add constraint financial_fact_unique unique nulls not distinct
        (company_id, taxonomy, concept, unit, period_start, period_end, accession);

-- 공시: 8-K 항목(2.02 = 실적 발표), 접수 시각(장전·장후 판정), 보고 기준일
alter table filing
    add column items        varchar(100),
    add column accepted_at  timestamptz,
    add column report_date  date;
create index filing_form_recent on filing (company_id, form, filed_at desc);

-- 매일 지도 지표 기록 (기업·날짜당 한 줄). company_snapshot 은 최신값, 이건 쌓이는 기록
create table company_metric_daily (
    company_id              bigint  not null references company (id) on delete cascade,
    as_of                   date    not null,                -- 수집한 날 (미국 동부)
    calc_version            integer not null,
    revenue_ttm_usd         bigint,
    net_income_ttm_usd      bigint,
    total_assets_usd        bigint,
    operating_margin_ttm    double precision,
    revenue_growth_yoy      double precision,
    public_float_usd        bigint,
    public_float_as_of      date,
    filings_material_30d    integer not null,
    filings_insider_30d     integer not null,
    data_as_of              date,
    created_at              timestamptz not null default now(),
    primary key (company_id, as_of)
);

-- 실적 발표 이벤트: 예상(추정·직접 입력) → 확정 → 실제 발표(8-K 2.02)
create table earnings_event (
    id            bigint generated always as identity primary key,
    company_id    bigint      not null references company (id) on delete cascade,
    status        varchar(10) not null check (status in ('EXPECTED', 'CONFIRMED', 'REPORTED')),
    event_date    date        not null,                      -- 미국 동부 날짜
    timing        varchar(6)  check (timing in ('BMO', 'DURING', 'AMC')),  -- 장전·장중·장후
    source        varchar(10) not null check (source in ('SEC_8K', 'ESTIMATE', 'MANUAL')),
    accession     varchar(25) unique,                        -- 실제 발표 공시 (REPORTED 만)
    recorded_at   timestamptz not null default now(),        -- 이 상태를 처음 기록한 시각 (확정 시점 분석용)
    note          text
);
create index earnings_event_company on earnings_event (company_id, event_date desc);

-- 데이터 품질 이상 신호 (수집할 때마다 기업 단위로 다시 계산)
create table data_quality_issue (
    id            bigint generated always as identity primary key,
    company_id    bigint       not null references company (id) on delete cascade,
    code          varchar(40)  not null,
    detail        varchar(500) not null,
    calc_version  integer      not null,
    detected_at   timestamptz  not null default now(),
    unique (company_id, code)
);
