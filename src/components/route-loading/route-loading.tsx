import Image from "next/image";
import styles from "./route-loading.module.css";

export default function RouteLoading() {
  return (
    <span className={styles.loading} role="status" aria-busy="true">
      <Image
        src="/papersmell-logo.svg"
        alt=""
        width={96}
        height={96}
        priority
        aria-hidden="true"
        className={styles.logo}
      />
    </span>
  );
}
