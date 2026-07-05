import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AccountSearch } from "@/components/social/account-search";
import { SocialFeed } from "@/components/social/social-feed";
import { buildPublicHunt } from "@/lib/domain/public-social";
import { makeKill } from "@/tests/helpers/kill";
import { renderWithRouter } from "@/tests/helpers/render-router";

const profile = { id: "other", displayName: "Other Hunter", avatarUrl: null, bio: "Public hunts", searchName: "other hunter", createdAt: "2025-01-01T00:00:00.000Z", updatedAt: "2025-01-01T00:00:00.000Z" };

describe("social discovery", () => {
  it("searches public accounts and follows a result", async () => {
    const user = userEvent.setup();
    const search = vi.fn().mockResolvedValue([profile]);
    const toggleFollow = vi.fn();
    renderWithRouter(<AccountSearch currentUserId="owner" followingIds={[]} search={search} onToggleFollow={toggleFollow} />);
    await user.type(screen.getByRole("searchbox", { name: /search hunters/i }), "ot");
    expect(await screen.findByText("Other Hunter")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /follow other hunter/i }));
    expect(toggleFollow).toHaveBeenCalledWith("other", false);
  });

  it("filters the following feed without hiding discover hunts", async () => {
    const user = userEvent.setup();
    const hunt = buildPublicHunt(makeKill({ ownerId: "other" }), { ...profile, id: "other" });
    renderWithRouter(<SocialFeed hunts={[hunt]} currentUserId="owner" followingIds={[]} />);
    expect(screen.getByText("Greater Kudu")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Following" }));
    await waitFor(() => expect(screen.queryByText("Greater Kudu")).toBeNull());
  });
});
