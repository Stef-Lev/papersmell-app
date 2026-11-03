import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/lib/fetch-json";
import { toIsbn13 } from "@/lib/isbn";

type BarcodeDetectorInstance = {
  detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]>;
};
type BarcodeDetectorConstructor = new (options: {
  formats: string[];
}) => BarcodeDetectorInstance;

/** Reads barcodes with ZXing for browsers without BarcodeDetector (e.g. Safari). */
async function createZxingDetector(): Promise<BarcodeDetectorInstance> {
  const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] =
    await Promise.all([import("@zxing/browser"), import("@zxing/library")]);
  const hints = new Map([
    [
      DecodeHintType.POSSIBLE_FORMATS,
      [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A],
    ],
  ]);
  const reader = new BrowserMultiFormatReader(hints);
  const canvas = document.createElement("canvas");
  return {
    async detect(video) {
      if (!video.videoWidth) return [];
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")?.drawImage(video, 0, 0);
      try {
        return [{ rawValue: reader.decodeFromCanvas(canvas).getText() }];
      } catch {
        return []; // no barcode in this frame
      }
    },
  };
}

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
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error(t("scannerUnsupported"));
      return;
    }
    const detectorClass = (
      window as Window & { BarcodeDetector?: BarcodeDetectorConstructor }
    ).BarcodeDetector;

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
      const detector = detectorClass
        ? new detectorClass({ formats: ["ean_13", "ean_8", "upc_a", "upc_e"] })
        : await createZxingDetector();
      while (!scanCancelled.current && videoRef.current) {
        const detected = await detector.detect(videoRef.current);
        // Skip price tags and other non-book codes instead of stopping on them.
        const isbn = detected
          .map(({ rawValue }) => toIsbn13(rawValue))
          .find((value) => value && /^97[89]/.test(value));
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
