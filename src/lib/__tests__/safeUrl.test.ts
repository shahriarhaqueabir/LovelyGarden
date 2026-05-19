import { describe, expect, it } from "vitest";
import { getSafeExternalUrl } from "../safeUrl";

describe("getSafeExternalUrl", () => {
  it("allows http and https URLs", () => {
    expect(getSafeExternalUrl("https://example.com/path")).toBe(
      "https://example.com/path",
    );
    expect(getSafeExternalUrl("http://example.com/path")).toBe(
      "http://example.com/path",
    );
  });

  it("blocks non-web protocols and malformed URLs", () => {
    expect(getSafeExternalUrl("javascript:alert(1)")).toBeUndefined();
    expect(getSafeExternalUrl("data:text/html,hi")).toBeUndefined();
    expect(getSafeExternalUrl("/relative/path")).toBeUndefined();
    expect(getSafeExternalUrl("not a url")).toBeUndefined();
  });
});
