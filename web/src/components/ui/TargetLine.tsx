"use client";

import { type RefObject, useEffect, useRef } from "react";
import type { TargetSink } from "@/components/scene/TargetTracker";
import { computeTargetLine } from "@/lib/camera/targetLine";
import styles from "./TargetLine.module.css";

/** 선이 닿을 패널 (SidePanel 이 data-target-panel 을 단다) */
const PANEL_SELECTOR = "[data-target-panel]";

/**
 * 조준선 HUD: 고른 건물의 조준 표시(동그라미 두 겹) + 상세 패널까지 이어지는 선 + 티커·좌표.
 * 위치는 TargetTracker 가 매 프레임 넘기고, 여기서 SVG 속성을 직접 고친다 (React 다시 그리기 없음).
 * 티커가 바뀌면 key 로 새로 붙어서 선이 건물에서 패널로 다시 그어진다.
 */
export function TargetLine({ label, sinkRef }: { label: string; sinkRef: RefObject<TargetSink | null> }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const lineRef = useRef<SVGLineElement>(null);
  const ringRef = useRef<SVGGElement>(null);
  const textRef = useRef<SVGTextElement>(null);

  useEffect(() => {
    const update: TargetSink = (point) => {
      const svg = svgRef.current;
      const lineEl = lineRef.current;
      const ring = ringRef.current;
      const text = textRef.current;
      if (!svg || !lineEl || !ring || !text) return;
      const panel = document.querySelector(PANEL_SELECTOR)?.getBoundingClientRect() ?? null;
      const line = computeTargetLine(point, { width: window.innerWidth, height: window.innerHeight }, panel);
      if (!line) {
        svg.style.visibility = "hidden";
        return;
      }
      svg.style.visibility = "visible";
      lineEl.setAttribute("x1", String(line.x1));
      lineEl.setAttribute("y1", String(line.y1));
      lineEl.setAttribute("x2", String(line.x2));
      lineEl.setAttribute("y2", String(line.y2));
      ring.setAttribute("transform", `translate(${line.x1} ${line.y1})`);
      text.setAttribute("x", String(line.labelX));
      text.setAttribute("y", String(line.labelY));
    };
    sinkRef.current = update;
    return () => {
      sinkRef.current = null;
    };
  }, [sinkRef]);

  return (
    <svg ref={svgRef} className={styles.overlay} aria-hidden="true" style={{ visibility: "hidden" }}>
      <line ref={lineRef} className={styles.line} pathLength={1} />
      <g ref={ringRef}>
        <circle r={22} className={styles.outer} />
        <circle r={12} className={styles.inner} />
        <circle r={3} className={styles.dot} />
      </g>
      <text ref={textRef} className={styles.label}>
        {label}
      </text>
    </svg>
  );
}
