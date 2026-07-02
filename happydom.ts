import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();

// Radix UI (Popover/Popper) reads ResizeObserver during layout, which happy-dom doesn't implement.
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
