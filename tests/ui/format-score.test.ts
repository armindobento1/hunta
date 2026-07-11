import { formatScore } from "@/lib/ui/format-score";

describe("formatScore", () => {
  it("renders inch scores in hunter notation (whole inches + eighths)", () => {
    expect(formatScore(26.625, "in")).toBe("26 5/8 in");
    expect(formatScore(56.875, "in")).toBe("56 7/8 in");
  });

  it("omits the fraction for whole inches", () => {
    expect(formatScore(30, "in")).toBe("30 in");
  });

  it("rounds legacy decimals to the nearest eighth, rolling over whole inches", () => {
    expect(formatScore(26.99, "in")).toBe("27 in");
  });

  it("leaves non-inch units as plain numbers", () => {
    expect(formatScore(144.5, "cm")).toBe("144.5 cm");
    expect(formatScore(312, undefined)).toBe("312 pts");
  });
});
