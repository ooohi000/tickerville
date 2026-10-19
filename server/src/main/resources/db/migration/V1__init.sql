-- 스키마 v1. 계약: ../../../../docs/api.md, 데이터 결정: docs/data-sources.md
-- 금액은 달러 정수(bigint). SEC 원본 값은 소수가 있을 수 있어 numeric.

-- 기업 기본 정보 (SEC submissions + 직접 관리하는 값)
create table company (
    id               bigint generated always as identity primary key,
    ticker           varchar(10)  not null unique,
    cik              varchar(10)  unique check (cik ~ '^[0-9]{10}$'),  -- SEC 기업번호(앞 0 채움). 목데이터는 null 가능
    name             varchar(200) not null,
    name_ko          varchar(100),
    sector           varchar(20)  not null
        check (sector in ('tech','communication','consumer','finance','healthcare','industrial','energy','other')),
    hq_city          varchar(100) not null,
    hq_state         varchar(2)   not null check (hq_state ~ '^[A-Z]{2}$'),
    hq_lat           double precision not null check (hq_lat between -90 and 90),
    hq_lng           double precision not null check (hq_lng between -180 and 180),
    exchange         varchar(20),
    sic_code         varchar(4),
    sic_description  varchar(200),
    fiscal_year_end  varchar(4) check (fiscal_year_end ~ '^[0-9]{4}$'),  -- MMDD
    description_ko   text,                               -- 직접 쓴 한 줄 소개
    memo             text,
    created_at       timestamptz  not null default now(),
    updated_at       timestamptz  not null default now()
);

-- 지도용 최신 지표 (기업당 한 줄). 수집기가 계산해서 덮어쓴다
create table company_snapshot (
    company_id              bigint primary key references company (id) on delete cascade,
    revenue_ttm_usd         bigint,
    net_income_ttm_usd      bigint,
    total_assets_usd        bigint,
    operating_margin_ttm    double precision,           -- 0.32 = 32%
    revenue_growth_yoy      double precision,           -- 0.25 = +25%
    public_float_usd        bigint,
    public_float_as_of      date,
    filings_material_30d    integer not null default 0 check (filings_material_30d >= 0),
    filings_insider_30d     integer not null default 0 check (filings_insider_30d >= 0),
    data_as_of              date,                       -- 이 기업 재무 데이터의 마지막 기간 마감일
    updated_at              timestamptz not null default now()
);

-- SEC companyfacts 원본 값 (필요한 개념만). 정규화를 다시 돌릴 수 있게 원본을 남긴다
create table financial_fact (
    id            bigint generated always as identity primary key,
    company_id    bigint       not null references company (id) on delete cascade,
    taxonomy      varchar(20)  not null,                -- us-gaap, dei
    concept       varchar(200) not null,
    unit          varchar(20)  not null,                -- USD, shares, USD/shares
    period_start  date,                                 -- 시점 값(총자산 등)은 null
    period_end    date         not null,
    value         numeric(28, 6) not null,
    accession     varchar(25)  not null,                -- 공시 번호
    form          varchar(10)  not null,
    filed         date         not null,
    fy            integer,                              -- 참고용. 기간 판정에 쓰지 않는다
    fp            varchar(4),
    unique (company_id, taxonomy, concept, unit, period_start, period_end, accession)
);
create index financial_fact_lookup on financial_fact (company_id, concept, period_end);

-- 정규화된 재무제표 (분기 Q / 연간 FY). 계약의 FinancialStatement
create table financial_period (
    id                    bigint generated always as identity primary key,
    company_id            bigint  not null references company (id) on delete cascade,
    period_type           varchar(2) not null check (period_type in ('Q', 'FY')),
    fiscal_year           integer not null,
    fiscal_period         varchar(2) not null check (fiscal_period in ('Q1','Q2','Q3','Q4','FY')),
    period_start          date    not null,
    period_end            date    not null,
    filed_at              date,
    revenue               bigint,
    gross_profit          bigint,
    operating_income      bigint,
    net_income            bigint,
    eps_diluted           numeric(12, 4),
    total_assets          bigint,
    total_liabilities     bigint,
    total_equity          bigint,
    operating_cash_flow   bigint,
    capital_expenditure   bigint,
    free_cash_flow        bigint,
    unique (company_id, period_type, period_end)
);
create index financial_period_recent on financial_period (company_id, period_type, period_end desc);

-- 공시 목록 (SEC submissions). 땅 열기 집계와 "최근 소식"
create table filing (
    id          bigint generated always as identity primary key,
    company_id  bigint      not null references company (id) on delete cascade,
    accession   varchar(25) not null unique,
    form        varchar(20) not null,
    filed_at    date        not null,
    url         varchar(500) not null
);
create index filing_recent on filing (company_id, filed_at desc);

-- 시장 날씨 지수 (주간). 계산 원본(STLFSI)도 같이 남긴다
create table market_weather (
    id            bigint generated always as identity primary key,
    as_of         date not null unique,
    stress_index  double precision not null,            -- FRED STLFSI4
    value         double precision not null check (value between 0 and 100),
    created_at    timestamptz not null default now()
);
