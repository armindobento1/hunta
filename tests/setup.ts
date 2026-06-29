import "@testing-library/jest-dom/vitest";

class ResizeObserverMock {
  disconnect() {}
  observe() {}
  unobserve() {}
}

global.ResizeObserver = ResizeObserverMock;
