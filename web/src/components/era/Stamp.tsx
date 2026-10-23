"use client";

import type { EraStamp } from "@/lib/era/eras";
import styles from "./Stamp.module.css";

export interface StampProps {
  stamp: EraStamp;
  /** 도장 아래 작은 글씨 (연도 · 승진 직급 등) */
  sub?: string;
  /** 위에 덮어 쓸 글자 (예: PROMOTED) */
  label?: string;
  /** 놓일 자리: 패널 머리 오른쪽 / 조언 카드 안 */
  placement?: "panel" | "inline";
}

/** 보고서 도장. 처음 나타날 때 '쾅' 찍힌다 (움직임 줄이기 설정이면 그냥 나타남) */
export function Stamp({ stamp, sub, label, placement = "panel" }: StampProps) {
  return (
    <span
      aria-hidden="true"
      className={`${styles.stamp} ${styles[stamp.shape]} ${styles[placement]}`}
      style={{ color: stamp.color, borderColor: stamp.color }}
    >
      <b>{label ?? stamp.label}</b>
      {sub && <small>{sub}</small>}
    </span>
  );
}
