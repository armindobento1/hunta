import { authErrorMessage } from "@/lib/firebase/auth";

describe("authErrorMessage", () => {
  it("maps known Firebase codes to actionable copy", () => {
    expect(authErrorMessage({ code: "auth/invalid-credential" })).toMatch(
      /email and password/i,
    );
    expect(authErrorMessage({ code: "auth/email-already-in-use" })).toMatch(
      /already exists/i,
    );
  });

  it("does not expose unknown provider errors", () => {
    expect(authErrorMessage(new Error("secret provider detail"))).toBe(
      "Something went wrong. Please try again.",
    );
  });
});
