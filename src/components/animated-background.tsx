import type { CSSProperties } from "react";
import styles from "./animated-background.module.css";

// Posiciones fijas (no aleatorias) para que el render del servidor y del
// cliente coincidan y no haya errores de hidratación.
const COINS = [
  { x: "8%",  size: 18, dur: 22, delay: 0,  sway: "24px" },
  { x: "22%", size: 12, dur: 28, delay: 6,  sway: "-18px" },
  { x: "37%", size: 22, dur: 25, delay: 12, sway: "30px" },
  { x: "51%", size: 14, dur: 30, delay: 3,  sway: "-26px" },
  { x: "66%", size: 20, dur: 24, delay: 15, sway: "20px" },
  { x: "79%", size: 11, dur: 27, delay: 9,  sway: "-14px" },
  { x: "91%", size: 16, dur: 23, delay: 18, sway: "22px" },
];

export function AnimatedBackground() {
  return (
    <div className={styles.root} aria-hidden="true">
      <div className={`${styles.blob} ${styles.blobA}`} />
      <div className={`${styles.blob} ${styles.blobB}`} />
      <div className={`${styles.blob} ${styles.blobC}`} />
      <div className={styles.grid} />
      {COINS.map((c, i) => (
        <span
          key={i}
          className={styles.coin}
          style={
            {
              "--x": c.x,
              "--size": `${c.size}px`,
              "--dur": `${c.dur}s`,
              "--delay": `-${c.delay}s`,
              "--sway": c.sway,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
