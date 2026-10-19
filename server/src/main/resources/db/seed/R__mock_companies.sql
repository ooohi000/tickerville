-- 로컬 개발용 목데이터 (web/src/data/companies.json 과 같은 10개 기업, 값은 대략적인 샘플)
-- application-local.yml 에서만 이 폴더를 Flyway 위치에 넣는다. 운영 DB에는 들어가지 않는다.
-- Repeatable(R__) 이라 이 파일이 바뀌면 다시 실행된다 → 전부 upsert 로 작성.
-- 실제 SEC 수집기가 생기면 cik 를 채우고 값은 수집기가 덮어쓴다.

insert into company (ticker, name, name_ko, sector, hq_city, hq_state, hq_lat, hq_lng)
values
    ('AAPL', 'Apple', '애플', 'tech', 'Cupertino', 'CA', 37.3349, -122.009),
    ('NVDA', 'NVIDIA', '엔비디아', 'tech', 'Santa Clara', 'CA', 37.3707, -121.9638),
    ('GOOGL', 'Alphabet', '알파벳', 'communication', 'Mountain View', 'CA', 37.422, -122.0841),
    ('META', 'Meta Platforms', '메타', 'communication', 'Menlo Park', 'CA', 37.4848, -122.1484),
    ('MSFT', 'Microsoft', '마이크로소프트', 'tech', 'Redmond', 'WA', 47.6396, -122.1283),
    ('AMZN', 'Amazon', '아마존', 'consumer', 'Seattle', 'WA', 47.6223, -122.3365),
    ('TSLA', 'Tesla', '테슬라', 'consumer', 'Austin', 'TX', 30.2219, -97.6185),
    ('JPM', 'JPMorgan Chase', 'JP모건', 'finance', 'New York', 'NY', 40.7559, -73.9754),
    ('KO', 'Coca-Cola', '코카콜라', 'consumer', 'Atlanta', 'GA', 33.7712, -84.3963),
    ('PLTR', 'Palantir', '팔란티어', 'tech', 'Aventura', 'FL', 25.9565, -80.1392)
on conflict (ticker) do update set
    name = excluded.name, name_ko = excluded.name_ko, sector = excluded.sector,
    hq_city = excluded.hq_city, hq_state = excluded.hq_state,
    hq_lat = excluded.hq_lat, hq_lng = excluded.hq_lng, updated_at = now();

-- 샘플 값이라 data_as_of, public_float_as_of 는 null (API 에서는 "SAMPLE" 로 표시하지 않고 null)
insert into company_snapshot (company_id, revenue_ttm_usd, net_income_ttm_usd, total_assets_usd,
                              operating_margin_ttm, revenue_growth_yoy, public_float_usd,
                              filings_material_30d, filings_insider_30d)
select c.id, s.revenue, s.net_income, s.total_assets, s.op_margin, s.growth, s.public_float, s.material, s.insider
from (values
    ('AAPL', 410000000000, 100000000000, 360000000000, 0.31, 0.05, 3000000000000, 2, 6),
    ('NVDA', 200000000000, 105000000000, 140000000000, 0.62, 0.55, 3000000000000, 3, 14),
    ('GOOGL', 380000000000, 110000000000, 450000000000, 0.32, 0.13, 1900000000000, 2, 9),
    ('META', 180000000000, 65000000000, 280000000000, 0.42, 0.2, 1400000000000, 1, 11),
    ('MSFT', 290000000000, 100000000000, 560000000000, 0.45, 0.15, 3100000000000, 2, 5),
    ('AMZN', 680000000000, 65000000000, 650000000000, 0.11, 0.11, 1800000000000, 2, 8),
    ('TSLA', 95000000000, 6000000000, 125000000000, 0.06, -0.03, 800000000000, 4, 3),
    ('JPM', 270000000000, 58000000000, 4000000000000, null, 0.06, 650000000000, 6, 10),
    ('KO', 47000000000, 11000000000, 100000000000, 0.29, 0.03, 270000000000, 1, 2),
    ('PLTR', 3500000000, 1000000000, 7000000000, 0.2, 0.4, 250000000000, 3, 25)
) as s (ticker, revenue, net_income, total_assets, op_margin, growth, public_float, material, insider)
join company c on c.ticker = s.ticker
on conflict (company_id) do update set
    revenue_ttm_usd = excluded.revenue_ttm_usd, net_income_ttm_usd = excluded.net_income_ttm_usd,
    total_assets_usd = excluded.total_assets_usd, operating_margin_ttm = excluded.operating_margin_ttm,
    revenue_growth_yoy = excluded.revenue_growth_yoy, public_float_usd = excluded.public_float_usd,
    filings_material_30d = excluded.filings_material_30d, filings_insider_30d = excluded.filings_insider_30d,
    updated_at = now();

-- 시장 날씨 샘플: value = clamp(50 - STLFSI × 20, 0, 100) → STLFSI -0.6 이면 62 (구름 조금)
insert into market_weather (as_of, stress_index, value)
values (date '2026-10-16', -0.6, 62)
on conflict (as_of) do update set stress_index = excluded.stress_index, value = excluded.value;
