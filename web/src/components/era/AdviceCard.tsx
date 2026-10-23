"use client";

import { useState } from "react";
import { formatAdviceSource, loadAdviceBook, type Advice, type AdviceBook, type Advisor } from "@/lib/era/advice";
import { createDeck, draw, type Deck } from "@/lib/era/deck";
import { ERAS, type EraSpec } from "@/lib/era/eras";
import { AFFINITIES, affinityFor, applyRead, readByAdvisor, untilNext, withJosa, type Affinity, type Rank } from "@/lib/era/progress";
import styles from "./AdviceCard.module.css";
import { Stamp } from "./Stamp";
import { setReadingLog, useReadingLog } from "./useEra";

/** 받은 묶음은 시대별로 한 번만 (패널을 닫았다 열어도 다시 받지 않는다) */
const books = new Map<string, Promise<AdviceBook>>();
function getBook(era: EraSpec) {
  let p = books.get(era.id);
  if (!p) {
    p = loadAdviceBook(era.id);
    books.set(era.id, p);
  }
  return p;
}

interface Shown {
  advice: Advice;
  advisor: Advisor;
  /** 이번에 읽어서 오른 것 (없으면 null) */
  promoted: Rank | null;
  closer: Affinity | null;
}

/**
 * 상세 패널 아래 "참모의 조언": 누를 때마다 그 시대 참모·멘토의 실제 글 하나.
 * 한 바퀴 돌기 전엔 같은 조언이 다시 나오지 않는다 (lib/era/deck).
 */
export function AdviceCard({ era }: { era: EraSpec }) {
  const [shown, setShown] = useState<Shown | null>(null);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [failed, setFailed] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const log = useReadingLog();

  const next = async () => {
    try {
      const book = await getBook(era);
      const current = deck ?? createDeck(book.quotes.length);
      const r = draw(current);
      const advice = book.quotes[r.index];
      const advisor = book.advisors.find((a) => a.id === advice.advisor);
      if (!advisor) throw new Error(advice.advisor);
      const outcome = applyRead(log, advice.id, advisor.id);
      if (outcome.log !== log) setReadingLog(outcome.log);
      setDeck(r.deck);
      setShown({ advice, advisor, promoted: outcome.promoted, closer: outcome.closer });
      setShowOriginal(false);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  };

  return (
    <section className={styles.card} aria-live="polite">
      <button type="button" className={styles.button} onClick={next}>
        {shown ? `다른 ${era.adviceLabelKo}` : era.adviceButtonKo}
      </button>
      {failed && <p className={styles.muted}>조언을 불러오지 못했어요. 다시 눌러 주세요.</p>}
      {shown && (
        <figure className={styles.figure}>
          <figcaption className={styles.who}>
            <b>{shown.advisor.name.ko}</b>
            <span>{shown.advisor.role.ko}</span>
            <AffinityLine count={readByAdvisor(log, shown.advisor.id)} />
          </figcaption>
          {shown.closer && (
            <p className={styles.closer}>
              {withJosa(shown.advisor.name.ko, "과", "와")} 더 가까워졌어요 — <b>{shown.closer.ko}</b>
            </p>
          )}
          {shown.promoted && era.id === "2026" && (
            <div className={styles.promoted}>
              <Stamp stamp={ERAS["2026"].stamp} label="PROMOTED" sub={`${shown.promoted.en} ANALYST`} placement="inline" />
              <p>
                승진했어요! 이제 <b>{shown.promoted.ko} 애널리스트</b>예요.
              </p>
            </div>
          )}
          <blockquote className={styles.quote}>“{shown.advice.text.ko}”</blockquote>
          {showOriginal && (
            <blockquote className={styles.original} lang="en">
              “{shown.advice.text.en}”
            </blockquote>
          )}
          <p className={styles.plain}>{shown.advice.plain.ko}</p>
          <p className={styles.source}>
            — {shown.advisor.name.en},{" "}
            {shown.advice.source.url ? (
              <a href={shown.advice.source.url} target="_blank" rel="noopener noreferrer">
                {formatAdviceSource(shown.advice.source)}
              </a>
            ) : (
              formatAdviceSource(shown.advice.source)
            )}
            {shown.advice.confidence === "secondary" && <span className={styles.tag}>2차 자료로 확인</span>}
          </p>
          <button type="button" className={styles.link} onClick={() => setShowOriginal((v) => !v)}>
            {showOriginal ? "원문 접기" : "원문 보기"}
          </button>
        </figure>
      )}
    </section>
  );
}

/** 친밀도: ♥ 3칸 + 단계 이름 + 다음 단계까지 */
function AffinityLine({ count }: { count: number }) {
  const a = affinityFor(count);
  const left = untilNext(AFFINITIES, count);
  return (
    <span className={styles.affinity} aria-label={`친밀도 ${a.ko}, 이 참모의 조언 ${count}개 읽음`}>
      <i aria-hidden="true">{"♥".repeat(a.hearts)}{"♡".repeat(3 - a.hearts)}</i> {a.ko} · 조언 {count}개 읽음
      {left !== null && ` · ${left}개 더 읽으면 다음 단계`}
    </span>
  );
}
