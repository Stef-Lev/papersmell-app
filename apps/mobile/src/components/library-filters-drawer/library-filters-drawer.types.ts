import type { MobileMessageKey } from "../../lib/translation";
import type {
  LibraryFilterOption,
  LibraryFilterSectionKey,
  LibraryFilterValues,
} from "../../lib/library-filters";

export type LibraryFiltersDrawerProps = {
  visible: boolean;
  activeSection: LibraryFilterSectionKey;
  sections: {
    key: LibraryFilterSectionKey;
    labelKey: MobileMessageKey;
  }[];
  optionsBySection: Record<LibraryFilterSectionKey, LibraryFilterOption[]>;
  draftFilters: LibraryFilterValues;
  resultCount: number;
  onClose: () => void;
  onSectionChange: (section: LibraryFilterSectionKey) => void;
  onToggleOption: (section: LibraryFilterSectionKey, value: string) => void;
  onClear: () => void;
  onApply: () => void;
};
