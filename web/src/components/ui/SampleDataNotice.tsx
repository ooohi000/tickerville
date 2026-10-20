import styles from "./SampleDataNotice.module.css";

/** 서버에 연결되지 않아 번들 샘플을 보여줄 때 알려주는 작은 표시 */
export function SampleDataNotice() {
  return (
    <div className={styles.notice} role="status">
      샘플 데이터 · 서버 연결 전
    </div>
  );
}
