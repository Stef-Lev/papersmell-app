import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { mobileApi } from "../lib/api";
import type { BookCollection, BookEntry } from "../lib/types";
import { getErrorMessage } from "../lib/translation";
import { usePreferences } from "../providers/preferences-provider";

export function useLibrary() {
  const { locale } = usePreferences();
  const [entries, setEntries] = useState<BookEntry[]>([]);
  const [collections, setCollections] = useState<BookCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setIsLoading(true);
    setError("");
    try {
      const response = await mobileApi.getLibrary();
      if (currentRequest !== requestId.current) return;
      setEntries(response.entries);
      setCollections(response.collections);
    } catch (cause) {
      if (currentRequest === requestId.current) {
        setError(getErrorMessage(cause, locale, "mobile.errors.loadLibrary"));
      }
    } finally {
      if (currentRequest === requestId.current) setIsLoading(false);
    }
  }, [locale]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      return () => {
        requestId.current += 1;
      };
    }, [refresh]),
  );

  return { entries, collections, isLoading, error, refresh };
}
