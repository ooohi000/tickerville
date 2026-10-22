import type { ReactNode } from "react";
import styles from "./TopLeftHud.module.css";

/** 왼쪽 위 2D 표시들을 위에서부터 차례로 쌓는다. 각 표시는 위치(fixed·top)를 갖지 않는다 */
export function TopLeftHud({ children }: { children: ReactNode }) {
  return (
    <div className={styles.hud} data-hud-top="">
      {children}
    </div>
  );
}
