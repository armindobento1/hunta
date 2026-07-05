import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { HuntDetail } from "@/components/kills/hunt-detail";
import { TrashView } from "@/components/kills/trash-view";
import { makeKill } from "@/tests/helpers/kill";
import { renderWithRouter } from "@/tests/helpers/render-router";

describe("HuntDetail", () => {
  it("renders the authoritative facts and route metrics", () => {
    renderWithRouter(
      <HuntDetail
        kill={makeKill()}
        mapSlot={<div>Satellite route map</div>}
        onTrash={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "Greater Kudu" })).toBeInTheDocument();
    expect(screen.getByText(".300 Win Mag")).toBeInTheDocument();
    expect(screen.getByText(/180 grain/i)).toBeInTheDocument();
    expect(screen.getByText("06:42")).toBeInTheDocument();
    expect(screen.getByText("8.4 km")).toBeInTheDocument();
    expect(screen.getByText(/2h 18m/i)).toBeInTheDocument();
    expect(screen.getByText("Satellite route map")).toBeInTheDocument();
  });

  it("requires explicit confirmation before moving a record to trash", async () => {
    const user = userEvent.setup();
    const onTrash = vi.fn().mockResolvedValue(undefined);
    renderWithRouter(
      <HuntDetail kill={makeKill()} mapSlot={<div />} onTrash={onTrash} />,
    );

    await user.click(screen.getByRole("button", { name: /move to trash/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(onTrash).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /confirm move to trash/i }));
    expect(onTrash).toHaveBeenCalledOnce();
  });
});

describe("TrashView", () => {
  it("restores a selected record without discarding its attachments", async () => {
    const user = userEvent.setup();
    const onRestore = vi.fn().mockResolvedValue(undefined);
    const trashed = makeKill({
      status: "trashed",
      trashedAt: "2025-06-13T00:00:00.000Z",
    });

    renderWithRouter(<TrashView kills={[trashed]} onRestore={onRestore} />);
    await user.click(screen.getByRole("button", { name: /restore greater kudu/i }));

    expect(onRestore).toHaveBeenCalledWith("kill-1");
  });
});
