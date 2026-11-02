import type { CatalogBook } from "@/lib/open-library";

export type BiblionetPreview = {
  book: CatalogBook;
  alreadyStored: boolean;
};
