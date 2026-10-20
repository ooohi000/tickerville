"use client";

import { useState } from "react";
import { SidePanel } from "@/components/ui/SidePanel";
import { useNow } from "@/components/ui/useNow";
import { displayName } from "@/lib/company/format";
import { SECTOR_LABEL_KO } from "@/lib/company/sector";
import { describeLastEarnings, describeNextEarnings, formatKoreanDate } from "@/lib/detail/earningsLabel";
import { describeFiscalYearEnd } from "@/lib/detail/fiscalYear";
import { EMPTY, formatPerShare, formatRatio, formatUsdKo } from "@/lib/detail/money";
import { buildQuarterPoints } from "@/lib/detail/quarterChart";
import { getStatementRatios, isNegativeEquity } from "@/lib/detail/ratios";
import type { CompanyDetail, FinancialStatement } from "@/types";
import styles from "./CompanyDetailPanel.module.css";
import { QuarterBars } from "./QuarterBars";
import { useCompanyDetail } from "./useCompanyDetail";

/** 막대 색 (어두운 패널 위). 매출 = 파랑, 순이익 = 초록, 적자 = 빨강 + "적자" 글자 */
const REVENUE_COLOR = "#5b9cf5";
const PROFIT_COLOR = "#46c26b";
const LOSS_COLOR = "#e5484d";
/** 처음 보여줄 공시 수. 나머지는 "더보기" */
const FILINGS_PREVIEW = 5;

export interface CompanyDetailPanelProps {
  ticker: string;
  onClose: () => void;
  /** 지역 목록에서 들어왔으면 "← 목록" */
  onBack?: () => void;
  backLabel?: string;
}

/** 기업 상세: 소개 · 실적 발표 · 최근 분기 · 재무 안정성 · 분기 차트 · 최근 공시 */
export function CompanyDetailPanel({ ticker, onClose, onBack, backLabel }: CompanyDetailPanelProps) {
  const state = useCompanyDetail(ticker);
  const title =
    state.status === "ready" ? (
      <>
        {displayName(state.detail.company)} <span>{ticker}</span>
      </>
    ) : (
      ticker
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
      </p>
      {profile?.descriptionKo && <p className={styles.description}>{profile.descriptionKo}</p>}
      {fiscal && <p className={styles.note}>{fiscal} — 분기 이름이 달력과 다를 수 있어요</p>}

      {(next || last) && (
        <section>
          <h3 className={styles.sectionTitle}>실적 발표</h3>
          <dl className={styles.rows}>
            {next && (
              <>
                <dt>다음</dt>
                <dd>
                  {next.date}
                  {next.dday && <b className={styles.dday}>{next.dday}</b>}
                  <span className={next.status === "확정" ? styles.confirmed : styles.expected}>{next.status}</span>
                </dd>
              </>
            )}
            {last && (
              <>
                <dt>지난</dt>
                <dd>
                  {last.text}
                  {last.koreaHint && <span className={styles.muted}> ({last.koreaHint})</span>}
                </dd>
              </>
            )}
          </dl>
        </section>
      )}

      {q && <StatementSection title="최근 분기" statement={q} nowDate={nowDate} />}
      {a && <BalanceSection statement={a} />}

      <QuarterBars title="분기 매출" points={points} field="revenue" color={REVENUE_COLOR} />
      <QuarterBars
        title="분기 순이익"
        points={points}
        field="netIncome"
        color={PROFIT_COLOR}
        negativeColor={LOSS_COLOR}
      />

      <Filings filings={detail.recentFilings} nowDate={nowDate} />
      <p className={styles.source}>출처: SEC EDGAR 공시 · 투자 권유가 아니에요</p>
    </div>
  );
}

function periodName(s: FinancialStatement): string {
  return s.fiscalPeriod === "FY" ? `FY${s.fiscalYear}` : `FY${String(s.fiscalYear).slice(-2)} ${s.fiscalPeriod}`;
}

/** 손익: 매출·영업이익·순이익·EPS + 이익률 */
function StatementSection({
  title,
  statement: s,
  nowDate,
}: {
  title: string;
  statement: FinancialStatement;
  nowDate: Date | null;
}) {
  const r = getStatementRatios(s);
  return (
    <section>
      <h3 className={styles.sectionTitle}>
        {title}{" "}
        <span className={styles.muted}>
          {periodName(s)}
          {nowDate && ` · ${formatKoreanDate(s.periodEnd, nowDate)} 마감`}
        </span>
      </h3>
      <dl className={styles.rows}>
        <dt>매출</dt>
        <dd>{formatUsdKo(s.revenue)}</dd>
        <dt>영업이익</dt>
        <dd>
          {formatUsdKo(s.operatingIncome)}
          {r.operatingMargin !== null && <span className={styles.muted}> ({formatRatio(r.operatingMargin)})</span>}
        </dd>
        <dt>순이익</dt>
        <dd>
          {formatUsdKo(s.netIncome)}
          {r.netMargin !== null && <span className={styles.muted}> ({formatRatio(r.netMargin)})</span>}
        </dd>
        <dt>주당순이익</dt>
        <dd>{formatPerShare(s.epsDiluted)}</dd>
      </dl>
    </section>
  );
}

/** 재무 안정성 (최근 연간): 자산·부채비율·자기자본비율·잉여현금흐름 */
function BalanceSection({ statement: s }: { statement: FinancialStatement }) {
  const r = getStatementRatios(s);
  return (
    <section>
      <h3 className={styles.sectionTitle}>
        재무 안정성 <span className={styles.muted}>{periodName(s)}</span>
      </h3>
      <dl className={styles.rows}>
        <dt>총자산</dt>
        <dd>{formatUsdKo(s.totalAssets)}</dd>
        <dt>부채비율</dt>
        <dd>{isNegativeEquity(s) ? <span className={styles.loss}>자본잠식</span> : formatRatio(r.debtToEquity, 0)}</dd>
        <dt>자기자본비율</dt>
        <dd>{formatRatio(r.equityRatio)}</dd>
        <dt>잉여현금흐름</dt>
        <dd>
          {formatUsdKo(s.freeCashFlow)}
          {r.fcfMargin !== null && <span className={styles.muted}> (매출의 {formatRatio(r.fcfMargin)})</span>}
        </dd>
      </dl>
    </section>
  );
}

function Filings({ filings, nowDate }: { filings: CompanyDetail["recentFilings"]; nowDate: Date | null }) {
  const [expanded, setExpanded] = useState(false);
  if (filings.length === 0) return null;
  const shown = expanded ? filings : filings.slice(0, FILINGS_PREVIEW);
  return (
    <section>
      <h3 className={styles.sectionTitle}>최근 공시</h3>
      <ul className={styles.filings}>
        {shown.map((f) => (
          <li key={`${f.url}`}>
            <a href={f.url} target="_blank" rel="noopener noreferrer">
              <span>{f.labelKo}</span>
              <span className={styles.muted}>{nowDate ? formatKoreanDate(f.filedAt, nowDate) : f.filedAt || EMPTY}</span>
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
