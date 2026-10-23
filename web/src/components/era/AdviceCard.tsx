"use client";

import { useState } from "react";
import { formatAdviceSource, loadAdviceBook, type Advice, type AdviceBook, type Advisor } from "@/lib/era/advice";
import { createDeck, draw, type Deck } from "@/lib/era/deck";
import type { EraSpec } from "@/lib/era/eras";
import styles from "./AdviceCard.module.css";

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

  const next = async () => {
    try {
      const book = await getBook(era);
      const current = deck ?? createDeck(book.quotes.length);
      const r = draw(current);
      const advice = book.quotes[r.index];
      const advisor = book.advisors.find((a) => a.id === advice.advisor);
      if (!advisor) throw new Error(advice.advisor);
      setDeck(r.deck);
      setShown({ advice, advisor });
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
          </figcaption>
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
