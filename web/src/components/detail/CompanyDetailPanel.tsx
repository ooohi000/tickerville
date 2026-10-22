"use client";

import { useState } from "react";
import { SidePanel } from "@/components/ui/SidePanel";
import { useNow } from "@/components/ui/useNow";
import { displayName } from "@/lib/company/format";
import { formatGrowth } from "@/lib/company/growth";
import { SECTOR_LABEL_KO } from "@/lib/company/sector";
import { describeLastEarnings, describeNextEarnings, formatKoreanDate } from "@/lib/detail/earningsLabel";
import { describeFiscalYearEnd } from "@/lib/detail/fiscalYear";
import { formatPerShare, formatRatio, formatUsdKo } from "@/lib/detail/money";
import { buildQuarterPoints } from "@/lib/detail/quarterChart";
import { getStatementRatios, isNegativeEquity } from "@/lib/detail/ratios";
import { getYoyChanges } from "@/lib/detail/yoy";
import type { CompanyDetail, FinancialStatement } from "@/types";
import styles from "./CompanyDetailPanel.module.css";
import { QuarterBars } from "./QuarterBars";
import { RingGauge } from "./RingGauge";
import { useCompanyDetail } from "./useCompanyDetail";

/** 처음 보여줄 공시 수. 나머지는 "더보기" */
const FILINGS_PREVIEW = 4;

export interface CompanyDetailPanelProps {
  ticker: string;
  onClose: () => void;
  /** 지역 목록에서 들어왔으면 "← 목록" */
  onBack?: () => void;
  backLabel?: string;
}

/**
 * 기업 상세 HUD 패널 (시안: "tickerville 상세 패널 HUD 시안").
 * 머리(티커·이름) · 소개 · 실적 발표 D-day · 최근 분기 4칸(전년 대비) · 링 게이지 3개 · 재무 안정성 ·
 * 최근 8분기 막대 · 공시 로그 · 크게 보기(준비 중)
 */
export function CompanyDetailPanel({ ticker, onClose, onBack, backLabel }: CompanyDetailPanelProps) {
  const state = useCompanyDetail(ticker);
  const name = state.status === "ready" ? displayName(state.detail.company) : null;
  const title = (
    <span className={styles.head}>
      <span className={styles.eyebrow}>TARGET LOCKED</span>
      <span className={styles.headRow}>
        <span className={styles.ticker}>{ticker}</span>
        {name && <span className={styles.name}>{name}</span>}
      </span>
    </span>
  );

  return (
    <SidePanel
      ariaLabel={`${ticker} 상세 정보`}
      title={title}
      onClose={onClose}
      onBack={onBack}
      backLabel={backLabel}
    >
      {state.status === "loading" && <p className={styles.muted}>불러오는 중…</p>}
      {state.status === "error" && <p className={styles.muted}>{state.message}</p>}
      {state.status === "ready" && <DetailBody detail={state.detail} quarters={state.quarters} />}
    </SidePanel>
  );
}

function DetailBody({ detail, quarters }: { detail: CompanyDetail; quarters: FinancialStatement[] }) {
  const now = useNow();
  const nowDate = now === null ? null : new Date(now);
  const { company, profile, latestQuarter: q, latestAnnual: a, earnings } = detail;
  const fiscal = describeFiscalYearEnd(profile?.fiscalYearEnd ?? null);
  const next = nowDate && describeNextEarnings(earnings.next, nowDate);
  const last = nowDate && describeLastEarnings(earnings.lastReported, nowDate);
  const points = buildQuarterPoints(quarters, 8);

  return (
    <div className={styles.body}>
      <p className={styles.meta}>
        {SECTOR_LABEL_KO[company.sector]} · {company.hq.city}, {company.hq.state}
        {profile?.exchange && ` · ${profile.exchange}`}
        {fiscal && ` · ${fiscal}`}
      </p>
      {profile?.descriptionKo && <p className={styles.description}>{profile.descriptionKo}</p>}

      {(next || last) && (
        <div className={styles.countdown}>
          {next?.dday && <span className={styles.dday}>{next.dday}</span>}
          <div className={styles.countdownText}>
            {next ? (
              <b>
                다음 실적 발표 · {next.date}
                <span className={next.status === "확정" ? styles.confirmed : styles.expected}>{next.status}</span>
              </b>
            ) : (
              <b>다음 실적 발표 · 미정</b>
            )}
            {last && (
              <span className={styles.label}>
                지난 발표 {last.text}
                {last.koreaHint && ` (${last.koreaHint})`}
              </span>
            )}
          </div>
        </div>
      )}

      {q && <QuarterTiles statement={q} quarters={quarters} nowDate={nowDate} />}

      {q && (
        <div className={styles.gauges}>
          <RingGauge label="영업이익률" ratio={getStatementRatios(q).operatingMargin} />
          <RingGauge label="순이익률" ratio={getStatementRatios(q).netMargin} />
          <RingGauge label="자기자본비율" ratio={a ? getStatementRatios(a).equityRatio : null} />
        </div>
      )}

      {a && <Balance statement={a} />}

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <span>최근 {points.length}분기</span>
          <span className={styles.legend}>
            <i className={styles.legendRevenue} />
            매출
            <i className={styles.legendProfit} />
            순이익
          </span>
        </h3>
        <QuarterBars points={points} />
      </section>

      <Filings filings={detail.recentFilings} nowDate={nowDate} />

      <button type="button" className={styles.expand} disabled title="크게 보기 화면은 준비 중이에요">
        크게 보기 · 준비 중
      </button>
      <p className={styles.source}>SRC SEC EDGAR · 투자 권유 아님</p>
    </div>
  );
}

function periodName(s: FinancialStatement): string {
  return s.fiscalPeriod === "FY" ? `FY${s.fiscalYear}` : `FY${String(s.fiscalYear).slice(-2)} ${s.fiscalPeriod}`;
}

/** 최근 분기 4칸: 큰 숫자 + 전년 대비 */
function QuarterTiles({
  statement: s,
  quarters,
  nowDate,
}: {
  statement: FinancialStatement;
  quarters: FinancialStatement[];
  nowDate: Date | null;
}) {
  const yoy = getYoyChanges(s, quarters);
  const tiles = [
    { label: "매출", value: formatUsdKo(s.revenue), change: yoy.revenue, loss: false },
    { label: "영업이익", value: formatUsdKo(s.operatingIncome), change: yoy.operatingIncome, loss: (s.operatingIncome ?? 0) < 0 },
    { label: "순이익", value: formatUsdKo(s.netIncome), change: yoy.netIncome, loss: (s.netIncome ?? 0) < 0 },
    { label: "주당순이익", value: formatPerShare(s.epsDiluted), change: yoy.epsDiluted, loss: (s.epsDiluted ?? 0) < 0 },
  ];
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>
        <span>최근 분기 · {periodName(s)}</span>
        {nowDate && <span className={styles.faint}>{formatKoreanDate(s.periodEnd, nowDate)} 마감</span>}
      </h3>
      <div className={styles.tiles}>
        {tiles.map((t) => (
          <div key={t.label} className={styles.tile}>
            <span className={styles.label}>{t.label}</span>
            <span className={t.loss ? `${styles.tileValue} ${styles.down}` : styles.tileValue}>{t.value}</span>
            <Change value={t.change} />
          </div>
        ))}
      </div>
    </section>
  );
}

function Change({ value }: { value: number | null }) {
  if (value === null) return <span className={styles.faint}>전년 대비 —</span>;
  const up = value >= 0;
  return (
    <span className={up ? styles.up : styles.down}>
      {up ? "▲" : "▼"} {formatGrowth(Math.abs(value)).replace("+", "")} 전년 대비
    </span>
  );
}

/** 재무 안정성 한 줄 (최근 연간) */
function Balance({ statement: s }: { statement: FinancialStatement }) {
  const r = getStatementRatios(s);
  return (
    <dl className={styles.balance}>
      <div>
        <dt>총자산</dt>
        <dd>{formatUsdKo(s.totalAssets)}</dd>
      </div>
      <div>
        <dt>부채비율</dt>
        <dd className={isNegativeEquity(s) ? styles.down : undefined}>
          {isNegativeEquity(s) ? "자본잠식" : formatRatio(r.debtToEquity, 0)}
        </dd>
      </div>
      <div>
        <dt>잉여현금흐름</dt>
        <dd className={(s.freeCashFlow ?? 0) < 0 ? styles.down : undefined}>{formatUsdKo(s.freeCashFlow)}</dd>
      </div>
      <p className={styles.faint}>최근 연간 {periodName(s)}</p>
    </dl>
  );
}

function Filings({ filings, nowDate }: { filings: CompanyDetail["recentFilings"]; nowDate: Date | null }) {
  const [expanded, setExpanded] = useState(false);
  if (filings.length === 0) return null;
  const shown = expanded ? filings : filings.slice(0, FILINGS_PREVIEW);
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>
        <span>최근 공시</span>
      </h3>
      <ul className={styles.filings}>
        {shown.map((f, i) => (
          // 같은 날 같은 링크가 있을 수 있어 순번까지 키로
          <li key={`${f.url}#${i}`}>
            <a href={f.url} target="_blank" rel="noopener noreferrer">
              <span className={styles.filingDate}>
                {nowDate ? formatKoreanDate(f.filedAt, nowDate).replace(/(\d+)월 (\d+)일/, (_, m, d) => `${m.padStart(2, "0")}.${d.padStart(2, "0")}`) : f.filedAt}
              </span>
              <span>{f.labelKo}</span>
            </a>
          </li>
        ))}
      </ul>
      {!expanded && filings.length > FILINGS_PREVIEW && (
        <button type="button" className={styles.more} onClick={() => setExpanded(true)}>
          더보기 {filings.length - FILINGS_PREVIEW}개
        </button>
      )}
    </section>
  );
}
