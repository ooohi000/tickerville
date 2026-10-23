"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { setEra, useEra } from "@/components/era/useEra";
import { ERA_IDS, ERAS, formatGreeting } from "@/lib/era/eras";
import { createStoredValue } from "./storedValue";
import styles from "./WelcomeCard.module.css";

/** 첫 방문 안내를 본 적 있는가 (이 브라우저에만) */
const welcomedStore = createStoredValue<boolean>("tickerville.welcomed", {
  // 서버 렌더에선 "봤다"로 두고, 브라우저에서 기록이 없을 때만 띄운다 (깜빡임·hydration 어긋남 방지)
  fallback: true,
  parse: (raw) => raw === "yes",
  serialize: (v) => (v ? "yes" : "no"),
});

/** 지도 사용법 세 줄 (spec.md "첫 방문 안내") */
const HOW_TO = [
  { icon: "🏢", text: "건물 높이 = 최근 4분기 매출. 크레인은 매출이 빠르게 느는 기업" },
  { icon: "👆", text: "건물이나 지역 이름표를 누르면 재무 보고서가 열려요" },
  { icon: "🌤️", text: "하늘 = 시장 날씨 (금융 스트레스 지수). 불안하면 먹구름" },
] as const;

/**
 * 첫 방문 안내 카드: 서비스 소개 + 사용법 + "누구의 자리에서 볼까요?" 시대 고르기.
 * 한 번 닫으면 다시 안 뜬다. 시대는 왼쪽 위 버튼으로 언제든 바꿀 수 있다.
 */
export function WelcomeCard({ companyCount }: { companyCount: number }) {
  const welcomed = welcomedStore.use();
  const era = useEra();
  const startRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (welcomed) return;
    // 휴대폰에서 카드가 아래로 밀려 제목이 잘리지 않게
    startRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && welcomedStore.set(true);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [welcomed]);

  if (welcomed) return null;

  return (
    <div className={styles.backdrop}>
      <section className={styles.card} role="dialog" aria-modal="true" aria-labelledby="welcome-title">
        <header className={styles.header}>
          <p className={styles.eyebrow}>TICKERVILLE</p>
          <h1 id="welcome-title" className={styles.title}>
            {formatGreeting(era)}
          </h1>
          <p className={styles.lead}>
            미국 기업 {companyCount}곳의 공시를 지도 위에 펼쳐 놨습니다. 건물은 실제 본사 자리, 숫자는 모두 SEC 공시 원본이에요.
          </p>
        </header>

        <ul className={styles.howTo}>
          {HOW_TO.map((h) => (
            <li key={h.text}>
              <span aria-hidden="true">{h.icon}</span>
              {h.text}
            </li>
          ))}
        </ul>

        <fieldset className={styles.eras}>
          <legend className={styles.legend}>누구의 자리에서 기업을 볼까요?</legend>
          <p className={styles.hint}>대통령을 고르면 그 시대 참모가 보고하고 조언해요. 나중에 왼쪽 위에서 바꿀 수 있어요.</p>
          <div className={styles.eraGrid} role="radiogroup" aria-label="시대 고르기">
            {ERA_IDS.map((id) => {
              const e = ERAS[id];
              const active = id === era.id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={`${styles.eraOption} ${active ? styles.active : ""}`}
                  onClick={() => setEra(id)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- 작은 고정 이미지 */}
                  <img src={`/personas/${e.image}.webp`} alt="" width={120} height={120} className={styles.figure} />
                  <b>{e.year}</b>
                  <span>{e.leader.ko}</span>
                  <small>{e.periodKo}</small>
                </button>
              );
            })}
          </div>
        </fieldset>

        <footer className={styles.footer}>
          <p className={styles.notice}>
            주가·시가총액은 보여주지 않아요 · 투자 권유가 아니에요 ·{" "}
            <Link href="/about" onClick={() => welcomedStore.set(true)}>
              소개·데이터 출처
            </Link>
          </p>
          <button ref={startRef} type="button" className={styles.start} onClick={() => welcomedStore.set(true)}>
            {era.year}년 {era.leader.ko}{era.id === "2026" ? "로" : " 자리에서"} 시작하기
          </button>
        </footer>
      </section>
    </div>
  );
}
