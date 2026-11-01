import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/lib/fetch-json";

type BarcodeDetectorInstance = {
  detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]>;
};
type BarcodeDetectorConstructor = new (options: {
  formats: string[];
}) => BarcodeDetectorInstance;

export function useBarcodeScanner(onDetected: (isbn: string) => Promise<void>) {
  const t = useTranslations("libraryWorkspace");
  const [scanRunning, setScanRunning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanCancelled = useRef(false);

  const stopScanner = useCallback(() => {
    scanCancelled.current = true;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setScanRunning(false);
  }, []);

  useEffect(() => stopScanner, [stopScanner]);

  async function startScanner() {
    const detectorClass = (
      window as Window & { BarcodeDetector?: BarcodeDetectorConstructor }
    ).BarcodeDetector;
    if (!detectorClass || !navigator.mediaDevices?.getUserMedia) {
      toast.error(t("scannerUnsupported"));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
      streamRef.current = stream;
      scanCancelled.current = false;
      setScanRunning(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const detector = new detectorClass({
        formats: ["ean_13", "ean_8", "upc_a", "upc_e"],
      });
      while (!scanCancelled.current && videoRef.current) {
        const detected = await detector.detect(videoRef.current);
        const isbn = detected[0]?.rawValue;
        if (isbn) {
          stopScanner();
          await onDetected(isbn);
          return;
        }
        await new Promise((resolve) => window.setTimeout(resolve, 250));
      }
    } catch (reason) {
      stopScanner();
      toast.error(
        getErrorMessage(
          reason instanceof Error ? reason : new Error(t("scannerError")),
          t("genericError"),
        ),
      );
    }
  }

  return { videoRef, scanRunning, startScanner, stopScanner };
}
