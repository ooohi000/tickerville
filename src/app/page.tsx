import { MapScene } from "@/components/scene/MapScene";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <MapScene />
    </main>
  );
}
