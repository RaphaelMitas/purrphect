import { describe, expect, it } from "vitest";
import { localeTag, resolveLanguage } from "./language";

describe("resolveLanguage", () => {
  it("follows the first device language the app speaks", () => {
    expect(resolveLanguage("system", [{ languageCode: "es" }, { languageCode: "fr" }])).toBe("fr");
  });

  it("falls back to English when the device speaks none of them", () => {
    expect(resolveLanguage("system", [{ languageCode: "es" }, { languageCode: null }])).toBe("en");
  });

  it("lets a chosen language win over the device", () => {
    expect(resolveLanguage("de", [{ languageCode: "fr" }])).toBe("de");
  });
});

describe("localeTag", () => {
  it("keeps the device region when the device speaks the chosen language", () => {
    const device = [
      { languageCode: "fr", languageTag: "fr-CA" },
      { languageCode: "en", languageTag: "en-GB" },
    ];
    expect(localeTag("en", device)).toBe("en-GB");
    expect(localeTag("de", device)).toBe("de");
  });
});
