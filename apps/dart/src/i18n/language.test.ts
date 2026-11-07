import { describe, expect, it } from "vitest";
import { resolveLanguage } from "./language";

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
