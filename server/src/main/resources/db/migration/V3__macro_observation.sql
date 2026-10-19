-- 스키마 v3: 거시 지표 원본(FRED 등) 쌓기 + 시장 날씨 계산 버전

-- 주간·일간 시리즈 원본. 시장 날씨(STLFSI4)·매크로 전광판(금리·유가…)이 같이 쓴다
create table macro_observation (
    series_id   varchar(30)    not null,                 -- FRED 시리즈 ID (STLFSI4, DGS10 ...)
    obs_date    date           not null,
    value       numeric(20, 6) not null,
    source      varchar(10)    not null default 'FRED',
    fetched_at  timestamptz    not null default now(),
    primary key (series_id, obs_date)
);

alter table market_weather
    add column calc_version integer not null default 1,
    add column updated_at   timestamptz not null default now();
