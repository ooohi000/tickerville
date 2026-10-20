import { MapScene } from "@/components/scene/MapScene";
import { isUsingSample } from "@/lib/api/mapData";
import { getMapData } from "./_data/getMapData";
import styles from "./page.module.css";

export default async function Home() {
  const data = await getMapData();
  return (
    <main className={styles.main}>
      <MapScene
        companies={data.dataset.companies}
        regions={data.regions}
        marketWeather={data.marketWeather}
        usingSample={isUsingSample(data)}
      />
    </main>
  );
}
