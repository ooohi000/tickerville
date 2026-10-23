import Link from "next/link";
import styles from "./AboutLink.module.css";

/** 지도 왼쪽 아래 작은 링크: 출처 표기(SEC·FRED 약관) + 소개 페이지 */
export function AboutLink() {
  return (
    <Link href="/about" className={styles.link}>
      데이터 SEC · FRED · 소개 ⓘ
    </Link>
  );
}
