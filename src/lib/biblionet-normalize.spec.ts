import { describe, expect, it } from "vitest";
import {
  biblionetPersonName,
  extractBiblionetTitle,
  normalizeBiblionetTitle,
} from "./biblionet-normalize";

const raw = {
  TitlesID: "72584",
  CoverImage: "/assets/images/books/book_72584/72584.jpg",
  Title: " Θεραπείας συνέχεια ",
  Subtitle: "",
  ISBN: "978-960-211-652-4",
  Publisher: "Νεφέλη",
  WriterName: "Νίκη Λοϊζίδη",
  FirstPublishDate: "2002-01-01",
  CurrentPublishDate: "0000-00-00",
  PageNo: "119",
  Category: "Ελληνική λογοτεχνία",
};

describe("normalizeBiblionetTitle", () => {
  it("should normalize a Biblionet title", () => {
    expect(normalizeBiblionetTitle(raw)).toEqual({
      source: "biblionet",
      externalId: "72584",
      isbn: "9789602116524",
      title: "Θεραπείας συνέχεια",
      subtitle: undefined,
      authors: ["Νίκη Λοϊζίδη"],
      publisher: "Νεφέλη",
      description: undefined,
      pageCount: 119,
      publishedDate: "2002-01-01",
      categories: ["Ελληνική λογοτεχνία"],
      coverUrl: "https://biblionet.gr/assets/images/books/book_72584/72584.jpg",
    });
  });

  it("should return null without an id or title", () => {
    expect(normalizeBiblionetTitle({ TitlesID: "1", Title: "" })).toBeNull();
  });
});

describe("biblionetPersonName", () => {
  it("should join the name parts of a person", () => {
    expect(
      biblionetPersonName({ Name: "Amir", MiddleName: "", Surname: "Levine" }),
    ).toBe("Amir Levine");
  });

  it("should use a pen name stored only in the surname", () => {
    expect(
      biblionetPersonName({ Name: "", Surname: "Φυστίκι ΠουΚυλάει" }),
    ).toBe("Φυστίκι ΠουΚυλάει");
  });

  it("should return undefined without a person or name", () => {
    expect(biblionetPersonName(null)).toBeUndefined();
    expect(biblionetPersonName({ Name: " ", Surname: "" })).toBeUndefined();
  });
});

describe("extractBiblionetTitle", () => {
  it("should unwrap nested arrays and plain objects", () => {
    expect(extractBiblionetTitle([[raw]])).toBe(raw);
    expect(extractBiblionetTitle(raw)).toBe(raw);
    expect(extractBiblionetTitle({ error: { error: "x" } })).toBeNull();
  });
});
