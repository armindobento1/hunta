import { screen } from "@testing-library/react";

import { HomePage } from "@/src/pages/home-page";
import { renderWithRouter } from "@/tests/helpers/render-router";

vi.mock("@/lib/hooks/use-auth", () => ({
  useAuth: () => ({ user: null, loading: false, error: null }),
}));

describe("HomePage", () => {
  it("introduces the private hunting portfolio", () => {
    renderWithRouter(<HomePage />);

    expect(screen.getByLabelText("Hunta")).toHaveTextContent("H");
    expect(screen.queryByText("F")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /your hunts, remembered/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /get started/i })).toHaveAttribute(
      "href",
      "/auth",
    );
  });
});
