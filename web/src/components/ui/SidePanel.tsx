import type { ReactNode } from "react";
import styles from "./SidePanel.module.css";

export interface SidePanelProps {
  /** 제목 줄 (h2 안에 들어간다) */
  title: ReactNode;
  ariaLabel: string;
  onClose: () => void;
  /** 있으면 왼쪽에 "← {backLabel}" 버튼 */
  onBack?: () => void;
  backLabel?: string;
  /** 조준선이 닿는 패널이면 true (TargetLine 이 data-target-panel 로 찾는다) */
  targetAnchor?: boolean;
  /** 내용이 다 들어와 패널 크기가 정해졌는가 (카메라가 이 크기를 보고 건물 자리를 정한다) */
  targetReady?: boolean;
  children: ReactNode;
}

/** 목록·상세 패널 공통 HUD 틀: 모바일은 아래 시트, 넓은 화면은 오른쪽 위. 모서리 꺾쇠 + 제목 + 뒤로 + 닫기 */
export function SidePanel({
  title,
  ariaLabel,
  onClose,
  onBack,
  backLabel = "뒤로",
  targetAnchor = false,
  targetReady = false,
  children,
}: SidePanelProps) {
  return (
    <aside className={styles.panel} aria-label={ariaLabel} data-target-panel={targetAnchor ? "" : undefined}
      data-target-ready={targetAnchor && targetReady ? "" : undefined}
    >
      <span aria-hidden="true" className={`${styles.corner} ${styles.tl}`} />
      <span aria-hidden="true" className={`${styles.corner} ${styles.tr}`} />
      <span aria-hidden="true" className={`${styles.corner} ${styles.bl}`} />
      <span aria-hidden="true" className={`${styles.corner} ${styles.br}`} />
      {onBack && (
        <button type="button" className={`${styles.iconButton} ${styles.back}`} onClick={onBack}>
          ← {backLabel}
        </button>
      )}
      <header className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <button type="button" className={styles.iconButton} onClick={onClose} aria-label="닫기">
          ×
        </button>
      </header>
      {children}
    </aside>
  );
}
