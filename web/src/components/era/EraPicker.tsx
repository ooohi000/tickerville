"use client";

import { useEffect, useRef, useState } from "react";
import { ADVICE_TOTAL, DEFAULT_ERA, ERA_IDS, ERAS } from "@/lib/era/eras";
import { RANKS, rankFor, totalRead, untilNext } from "@/lib/era/progress";
import styles from "./EraPicker.module.css";
import { AnalystNameField } from "./AnalystNameField";
import { setEra, setEraFade, useAnalystName, useEra, useEraFade, useReadingLog } from "./useEra";

/** 왼쪽 위 "시대 고르기". 누르면 대통령 4명 + 현재 애널리스트 목록이 펼쳐진다 */
export function EraPicker() {
  const era = useEra();
  const fade = useEraFade();
  const analystName = useAnalystName();
  const read = totalRead(useReadingLog());
  const rank = rankFor(read);
  const left = untilNext(RANKS, read);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  return (
    <div className={styles.root} ref={rootRef}>
      <button type="button" className={styles.current} aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((v) => !v)}>
        {/* eslint-disable-next-line @next/next/no-img-element -- 작은 고정 이미지라 next/image 최적화가 필요 없다 */}
        <img src={`/personas/${era.image}-face.webp`} alt="" width={28} height={28} className={styles.face} />
        <span className={styles.year}>{era.year}</span>
        <span className={styles.who}>{era.id === DEFAULT_ERA && analystName ? analystName : era.leader.ko}</span>
        <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className={styles.menu} role="radiogroup" aria-label="시대 고르기">
          <p className={styles.hint}>누구의 자리에서 기업을 볼까요?</p>
          {ERA_IDS.map((id) => {
            const e = ERAS[id];
            const active = id === era.id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={active}
                className={`${styles.option} ${active ? styles.active : ""}`}
                onClick={() => {
                  setEra(id);
                  setOpen(false);
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- 위와 같음 */}
                <img src={`/personas/${e.image}-face.webp`} alt="" width={40} height={40} className={styles.face} />
                <span className={styles.optionText}>
                  <b>
                    {e.year} · {e.leader.ko}
                  </b>
                  <span>
                    {e.roleKo} · {e.periodKo}
                  </span>
                </span>
              </button>
            );
          })}
          <div className={styles.analyst}>
            <AnalystNameField />
            <p>
              {rank.ko} 애널리스트 · 읽은 조언 {read}/{ADVICE_TOTAL}
              {left !== null && ` · ${left}개 더 읽으면 승진`}
            </p>
          </div>
          <label className={styles.fade}>
            <input type="checkbox" checked={fade} onChange={(e) => setEraFade(e.target.checked)} />
            그 해에 없던 기업은 흐리게 (눌러서 볼 수는 있어요)
          </label>
        </div>
      )}
    </div>
  );
}
