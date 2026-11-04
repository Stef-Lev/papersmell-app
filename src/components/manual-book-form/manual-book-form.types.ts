import type { BookInput } from "@/lib/book-input";

export type ManualBookFormProps = {
  submitLabel: string;
  disabled?: boolean;
  /** Resolves true when the book was saved, which clears the form. */
  onSubmit: (book: BookInput) => Promise<boolean>;
};
