import "@testing-library/jest-dom/vitest";

const localStorageValues = new Map<string, string>();

Object.defineProperty(window, "localStorage", {
  configurable: true,
  value: {
    get length() {
      return localStorageValues.size;
    },
    clear: () => localStorageValues.clear(),
    getItem: (key: string) => localStorageValues.get(key) ?? null,
    key: (index: number) => [...localStorageValues.keys()][index] ?? null,
    removeItem: (key: string) => localStorageValues.delete(key),
    setItem: (key: string, value: string) => localStorageValues.set(key, String(value)),
  },
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }),
});
