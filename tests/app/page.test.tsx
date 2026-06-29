import { render, screen } from "@testing-library/react";

import HomePage from "@/app/page";

describe("HomePage", () => {
  it("introduces the private hunting portfolio", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: /your hunts, remembered/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /get started/i })).toHaveAttribute(
      "href",
      "/auth",
    );
  });
});
