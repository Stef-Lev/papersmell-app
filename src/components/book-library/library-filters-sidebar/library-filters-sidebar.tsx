"use client";

import { ChevronDown, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import FilterOptions from "@/components/book-library/filter-options/filter-options";
import { filterValuesEqual } from "@/components/book-library/filter-utils";
import type { LibraryFiltersSidebarProps } from "./library-filters-sidebar.types";
import styles from "./library-filters-sidebar.module.css";

export default function LibraryFiltersSidebar({
  values,
  defaults,
  sections,
  onChange,
  onClear,
}: LibraryFiltersSidebarProps) {
  const t = useTranslations("libraryWorkspace");

  const hasChanges = sections.some((section) => {
    const val = values[section.key];
    const def = defaults[section.key];
    return !filterValuesEqual(val, def);
  });

  return (
    <aside className={styles.sidebar} aria-labelledby="library-filters-heading">
      <div className={styles.header}>
        <h3 className={styles.title} id="library-filters-heading">
          <SlidersHorizontal aria-hidden="true" />
          {t("filter")}
        </h3>
        {hasChanges && (
          <button type="button" className={styles.clear} onClick={onClear}>
            <RotateCcw aria-hidden="true" />
            {t("reset")}
          </button>
        )}
      </div>
      {sections.map((section) => {
        const selected = section.options.find(
          (option) => String(option.value) === values[section.key],
        );
        const isActive = !filterValuesEqual(
          values[section.key],
          defaults[section.key],
        );
        return (
          <details
            key={section.key}
            className={styles.section}
            open={section.key === "sortBy" || section.key === "shelf"}
          >
            <summary className={styles.summary}>
              <span className={styles.summaryText}>
                <span className={styles.sectionLabel}>{section.label}</span>
                {isActive && selected && (
                  <span className={styles.selected}>{selected.label}</span>
                )}
              </span>
              <ChevronDown className={styles.chevron} aria-hidden="true" />
            </summary>
            <div className={styles.options}>
              <FilterOptions
                section={section}
                value={values[section.key]}
                onValueChange={(value) => onChange(section.key, value)}
                hideLabel
              />
            </div>
          </details>
        );
      })}
    </aside>
  );
}
