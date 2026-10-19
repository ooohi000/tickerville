"use client";

import { KOREA_TIME_ZONE, MARKET_TIME_ZONE } from "@/lib/market/marketCalendar";
import { getMarketSession } from "@/lib/market/marketClock";
import { formatNextChange, formatWallClock, PHASE_SPECS } from "@/lib/market/format";
import styles from "./MarketClockBadge.module.css";
import { useNow } from "./useNow";

/** 뉴욕·서울 시각 + 장 상태 + 다음 변화까지 남은 시간 (왼쪽 위) */
export function MarketClockBadge() {
  const now = useNow();
  if (now === null) return null;

  const at = new Date(now);
  const session = getMarketSession(at);
  const spec = PHASE_SPECS[session.phase];
  const note = session.closedReason ?? session.earlyCloseReason;

  return (
    <div className={styles.badge}>
      <div className={styles.status}>
        <span className={styles.dot} style={{ background: spec.color }} aria-hidden />
        <strong>{spec.label}</strong>
        {note && (
          <span className={styles.note}>
            {session.closedReason ? `휴장 · ${note}` : `${note} · 오후 1시 조기 마감`}
          </span>
        )}
        <span className={styles.next}>
          {formatNextChange(session.next.phase, session.next.at.getTime() - now)}
        </span>
      </div>
      <div className={styles.clocks}>
        <span>
          <span className={styles.city}>뉴욕</span> {formatWallClock(at, MARKET_TIME_ZONE)}
        </span>
        <span>
          <span className={styles.city}>서울</span> {formatWallClock(at, KOREA_TIME_ZONE)}
        </span>
      </div>
    </div>
  );
}
