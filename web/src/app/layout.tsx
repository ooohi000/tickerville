import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./era-fonts.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // 링크 미리보기 이미지 주소를 절대 주소로 (배포 주소는 TICKERVILLE_SITE_URL)
  metadataBase: new URL(process.env.TICKERVILLE_SITE_URL ?? "http://localhost:3000"),
  title: "티커빌 — 미국 기업 3D 지도",
  description: "미국 상장 기업을 실제 지도 위 3D 건물로. 대통령이 되어 기업 보고를 받아보세요 — SEC 공시로 보는 실적과 재무",
  openGraph: { siteName: "티커빌", locale: "ko_KR", type: "website" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
