import { describe, expect, it } from "vitest";
import { describeUserAgent } from "./describe-user-agent";

describe("describeUserAgent", () => {
  it("reconnaît navigateur et système", () => {
    expect(
      describeUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
      ),
    ).toBe("Chrome sur Windows");
  });

  it("ne confond pas Edge avec Chrome", () => {
    expect(
      describeUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/130.0 Safari/537.36 Edg/130.0",
      ),
    ).toBe("Edge sur macOS");
  });

  it("gère l'absence d'information", () => {
    expect(describeUserAgent(null)).toBe("Appareil inconnu");
    expect(describeUserAgent("curl/8.0")).toBe("Appareil inconnu");
  });
});
