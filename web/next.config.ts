import type { NextConfig } from "next";
import { API_PREFIX, rewriteDestination } from "./src/lib/api/config";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // 브라우저는 같은 주소 /api/v1/* 로 부르고, Next 가 Spring 서버(TICKERVILLE_API_URL)로 넘긴다 → CORS 불필요
  async rewrites() {
    return [{ source: `${API_PREFIX}/:path*`, destination: rewriteDestination(process.env) }];
  },
};

export default nextConfig;
