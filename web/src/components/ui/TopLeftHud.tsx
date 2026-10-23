"use client";

import { useState, type ReactNode } from "react";
import styles from "./TopLeftHud.module.css";

export interface TopLeftHudProps {
  /** 항상 보이는 맨 윗줄 (시대 고르기) */
  lead?: ReactNode;
  /** 작은 화면에서 접혔을 때 보이는 한 줄 요약 (장 상태 · 날씨). 누르면 children 이 펼쳐진다 */
  summary?: ReactNode;
  /** 어느 화면에서든 항상 보이는 안내 (샘플 데이터 등) */
  notice?: ReactNode;
  /** 작은 화면에서 통째로 숨김 (아래 상세 시트가 열렸을 때 지도 틈을 넓게) */
  hiddenOnSmall?: boolean;
  children: ReactNode;
}

/**
 * 왼쪽 위 2D 표시들을 위에서부터 차례로 쌓는다. 각 표시는 위치(fixed·top)를 갖지 않는다.
 * 넓은 화면: 전부 펼침 / 작은 화면(720px 미만): lead + 요약 한 줄, 누르면 펼침
 */
export function TopLeftHud({ lead, summary, notice, hiddenOnSmall = false, children }: TopLeftHudProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`${styles.hud} ${hiddenOnSmall ? styles.hiddenOnSmall : ""}`} data-hud-top="">
      {(lead || summary) && (
        <div className={styles.row}>
          {lead}
          {summary && (
            <button
              type="button"
              className={styles.summary}
              aria-expanded={open}
              aria-label={open ? "시장 정보 접기" : "시장 정보 펼치기"}
              onClick={() => setOpen((v) => !v)}
            >
              {summary}
              <span aria-hidden="true">{open ? "▴" : "▾"}</span>
            </button>
          )}
        </div>
      )}
      {notice}
      <div className={`${styles.details} ${open ? styles.open : ""}`}>{children}</div>
    </div>
  );
}
