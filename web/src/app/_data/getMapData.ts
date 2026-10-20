import { cacheLife } from "next/cache";
import { loadMapData, type MapData } from "@/lib/api/mapData";

/**
 * 첫 화면 데이터. 서버(Next)에서 Spring API 를 부르고 몇 분 캐시한다.
 * 서버 데이터는 하루 한 번(장 마감 후) 바뀌므로 minutes 로 충분하다 (stale 5분 / revalidate 1분 / expire 1시간).
 * API 가 꺼져 있으면 샘플로 채워진 결과도 같은 시간만 캐시되고, 서버가 켜지면 다음 갱신 때 실제 데이터로 바뀐다.
 */
export async function getMapData(): Promise<MapData> {
  "use cache";
  cacheLife("minutes");
  return loadMapData({ isServer: true, env: process.env });
}
