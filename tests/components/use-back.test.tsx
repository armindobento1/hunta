import { act, renderHook } from "@testing-library/react";

import { useBack } from "@/lib/hooks/use-back";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mocks.navigate };
});

describe("useBack", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState(null, "", "/");
  });

  it("replaces a fresh deep link with the fallback", () => {
    window.history.replaceState({ idx: 0 }, "");
    const { result } = renderHook(() => useBack("/fallback"));

    act(() => result.current());

    expect(mocks.navigate).toHaveBeenCalledWith("/fallback", { replace: true });
  });

  it("navigates back when app history exists", () => {
    window.history.replaceState({ idx: 2 }, "");
    const { result } = renderHook(() => useBack("/fallback"));

    act(() => result.current());

    expect(mocks.navigate).toHaveBeenCalledWith(-1);
  });
});
