import type { Metadata } from "next";
import Link from "next/link";
import { ERA_IDS, ERAS, TAGLINE_KO } from "@/lib/era/eras";
import styles from "./about.module.css";

export const metadata: Metadata = {
  title: "티커빌 소개 · 데이터 출처",
  description:
    "미국 기업 본사를 실제 미국 지도 위 3D 건물로 보여주는 티커빌. SEC 공시와 연준 공개 지표만 쓰고, 주가·시가총액은 보여주지 않아요.",
};

/** 지도에서 읽는 법 — spec.md "화면 요소"와 같은 내용을 짧게 */
const READING = [
  { term: "건물 높이", desc: "최근 4분기 매출 합계 (왼쪽 위에서 순이익·총자산·공시상 시총으로 바꿀 수 있어요)" },
  { term: "크레인", desc: "매출이 1년 전보다 25% 이상 늘어난 고성장 기업" },
  { term: "땅 색 원판", desc: "최근 30일 공시가 많을수록 진하고 커요 (중요 사건 8-K + 내부자 거래 Form 4)" },
  { term: "하늘", desc: "시장 날씨 — 연준 금융스트레스 지수(STLFSI4)의 최근 10년 백분위. 불안할수록 먹구름·비·번개" },
  { term: "지역 이름표", desc: "실리콘밸리·뉴욕처럼 기업이 몰린 곳. 누르면 그 지역 기업 목록" },
  { term: "상세 패널", desc: "실적 발표 D-day, 최근 분기 실적, 이익률, 재무 안정성, 8분기 추이, 최근 공시" },
] as const;

/** 데이터 출처 (docs/data-sources.md) */
const SOURCES = [
  {
    name: "미국 증권거래위원회 SEC EDGAR",
    what: "재무제표(companyfacts), 기업 정보·공시 목록(submissions)",
    note: "공개 정보로 재배포가 허용돼요. 요청 속도 제한을 지켜 매일 받아요.",
    href: "https://www.sec.gov/search-filings/edgar-application-programming-interfaces",
  },
  {
    name: "세인트루이스 연준 FRED",
    what: "금융스트레스 지수 STLFSI4 (시장 날씨)",
    note: "This product uses the FRED® API but is not endorsed or certified by the Federal Reserve Bank of St. Louis.",
    href: "https://fred.stlouisfed.org/docs/api/terms_of_use.html",
  },
  {
    name: "미국 인구조사국 지오코더",
    what: "본사 주소 → 위도·경도 (안 되면 우편번호 중심)",
    note: "미국 정부 공공 데이터",
    href: "https://geocoding.geo.census.gov/",
  },
  {
    name: "us-atlas (인구조사국 경계 지도)",
    what: "미국 50개 주 경계",
    note: "ISC 라이선스",
    href: "https://github.com/topojson/us-atlas",
  },
] as const;

export default function AboutPage() {
  return (
    <main className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.back}>
          ← 지도로 돌아가기
        </Link>
      </nav>

      <header className={styles.hero}>
        <p className={styles.eyebrow}>TICKERVILLE · 티커빌</p>
        <h1 className={styles.title}>{TAGLINE_KO}</h1>
        <p className={styles.lead}>
          티커빌은 미국 상장 기업이 실제로 어디에 있는지 지도 위에서 보고, 건물을 누르면 그 회사의 실적과 재무 상태를 한국어로
          읽을 수 있는 서비스예요. 숫자는 모두 기업이 미국 증권거래위원회에 낸 공시에서 가져와요.
        </p>
      </header>

      <section className={styles.section} aria-labelledby="reading">
        <h2 id="reading">지도 읽는 법</h2>
        <dl className={styles.reading}>
          {READING.map((r) => (
            <div key={r.term}>
              <dt>{r.term}</dt>
              <dd>{r.desc}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={styles.section} aria-labelledby="eras">
        <h2 id="eras">시대 테마</h2>
        <p>
          왼쪽 위에서 대통령을 고르면 내가 그 시대 대통령이 되어 참모의 보고를 받아요. 패널과 하늘 색이 그 시대
          모습으로 바뀌고, 그 해에 아직 없던 기업은 흐리게 보여요. 재무 숫자는 언제나 지금 데이터예요.
        </p>
        <ul className={styles.eras}>
          {ERA_IDS.map((id) => {
            const e = ERAS[id];
            return (
              <li key={id}>
                {/* eslint-disable-next-line @next/next/no-img-element -- 작은 고정 이미지 */}
                <img src={`/personas/${e.image}-face.webp`} alt="" width={48} height={48} />
                <span>
                  <b>
                    {e.year} · {e.leader.ko}
                  </b>
                  <small>{e.periodKo}</small>
                </span>
              </li>
            );
          })}
        </ul>
        <p className={styles.small}>
          패널 아래 조언 버튼은 그 시대 참모·투자 대가가 <b>실제로 남긴 글</b>만 보여줘요. 책·연설·공문서 원문과
          맞춰 본 문장에 출처를 붙였고, 출처를 찾지 못한 유명 문장(예: &ldquo;아낀 1페니는 번 1페니&rdquo;)은 넣지
          않았어요. 한국어 번역과 풀이는 티커빌이 새로 썼어요. 캐릭터는 실존 인물을 바탕으로 AI로 그린 창작
          이미지예요.
        </p>
      </section>

      <section className={styles.section} aria-labelledby="sources">
        <h2 id="sources">데이터 출처</h2>
        <ul className={styles.sources}>
          {SOURCES.map((s) => (
            <li key={s.name}>
              <a href={s.href} target="_blank" rel="noopener noreferrer">
                {s.name} ↗
              </a>
              <span>{s.what}</span>
              <small>{s.note}</small>
            </li>
          ))}
        </ul>
        <p className={styles.small}>
          데이터는 하루 한 번 새로 받아요. 공시가 늦거나 회사마다 항목 이름이 달라 일부 숫자가 비거나 늦을 수 있어요.
        </p>
      </section>

      <section className={styles.section} aria-labelledby="not">
        <h2 id="not">보여주지 않는 것</h2>
        <ul className={styles.list}>
          <li>
            <b>주가·시가총액·거래량</b> — 공개 사이트에 보여주려면 유료 라이선스가 필요해서 쓰지 않아요. 대신
            공시에 적힌 &ldquo;공시상 시총&rdquo;(10-K 표지의 유동 시가총액, 연 1회)을 기준일과 함께 보여줘요.
          </li>
          <li>
            <b>매수·매도 추천</b> — 티커빌은 투자 권유를 하지 않아요. 모든 투자 판단과 책임은 본인에게 있어요.
          </li>
        </ul>
      </section>

      <footer className={styles.footer}>
        <p>
          개발 과정은{" "}
          <a href="https://velog.io/@ooohi00011" target="_blank" rel="noopener noreferrer">
            velog
          </a>
          에 연재 중
        </p>
        <p className={styles.small}>글꼴: Black Han Sans · 나눔명조 · Old Standard TT (SIL Open Font License)</p>
      </footer>
    </main>
  );
}
