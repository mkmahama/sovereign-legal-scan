export type ThemeAccentId =
  | "blue"
  | "teal"
  | "mint"
  | "green"
  | "indigo"
  | "purple"
  | "pink"
  | "red"
  | "orange"
  | "yellow"
  | "brown"
  | "gray";

export type ThemeAccent = {
  id: ThemeAccentId;
  name: string;
  color: string;
  hover: string;
  soft: string;
  border: string;
  ring: string;
  contrast: string;
};

export const THEME_STORAGE_KEY = "sovereign-theme-accent";
export const DEFAULT_THEME_ACCENT: ThemeAccentId = "teal";

export const APPLE_THEME_ACCENTS: ThemeAccent[] = [
  { id: "blue", name: "Blue", color: "#007AFF", hover: "#0068D9", soft: "#E5F1FF", border: "#B8DAFF", ring: "rgba(0, 122, 255, 0.18)", contrast: "#FFFFFF" },
  { id: "teal", name: "Teal", color: "#30B0C7", hover: "#178EA4", soft: "#E7F8FA", border: "#AEE6EE", ring: "rgba(48, 176, 199, 0.2)", contrast: "#FFFFFF" },
  { id: "mint", name: "Mint", color: "#00C7BE", hover: "#00A79F", soft: "#E2FAF8", border: "#A4EEE9", ring: "rgba(0, 199, 190, 0.2)", contrast: "#FFFFFF" },
  { id: "green", name: "Green", color: "#34C759", hover: "#28A745", soft: "#E8F8EC", border: "#B8EBC5", ring: "rgba(52, 199, 89, 0.2)", contrast: "#FFFFFF" },
  { id: "indigo", name: "Indigo", color: "#5856D6", hover: "#4643C7", soft: "#ECEBFF", border: "#CBC9FA", ring: "rgba(88, 86, 214, 0.2)", contrast: "#FFFFFF" },
  { id: "purple", name: "Purple", color: "#AF52DE", hover: "#9640C5", soft: "#F6EAFC", border: "#E7C4F6", ring: "rgba(175, 82, 222, 0.2)", contrast: "#FFFFFF" },
  { id: "pink", name: "Pink", color: "#FF2D55", hover: "#DF1D42", soft: "#FFE8EE", border: "#FFC0CF", ring: "rgba(255, 45, 85, 0.2)", contrast: "#FFFFFF" },
  { id: "red", name: "Red", color: "#FF3B30", hover: "#D92D25", soft: "#FFE9E7", border: "#FFC5C0", ring: "rgba(255, 59, 48, 0.2)", contrast: "#FFFFFF" },
  { id: "orange", name: "Orange", color: "#FF9500", hover: "#D97900", soft: "#FFF2DE", border: "#FFD9A3", ring: "rgba(255, 149, 0, 0.22)", contrast: "#1D1D1F" },
  { id: "yellow", name: "Yellow", color: "#FFCC00", hover: "#D6A800", soft: "#FFF8D9", border: "#FFE88A", ring: "rgba(255, 204, 0, 0.24)", contrast: "#1D1D1F" },
  { id: "brown", name: "Brown", color: "#A2845E", hover: "#806747", soft: "#F5EFE7", border: "#DDCCB6", ring: "rgba(162, 132, 94, 0.22)", contrast: "#FFFFFF" },
  { id: "gray", name: "Gray", color: "#8E8E93", hover: "#6E6E73", soft: "#F1F1F3", border: "#D6D6DA", ring: "rgba(142, 142, 147, 0.22)", contrast: "#FFFFFF" },
];

export function findThemeAccent(id: string | null | undefined): ThemeAccent {
  return APPLE_THEME_ACCENTS.find((accent) => accent.id === id) || APPLE_THEME_ACCENTS.find((accent) => accent.id === DEFAULT_THEME_ACCENT)!;
}

export function getInitialThemeAccent(): ThemeAccentId {
  if (typeof window === "undefined") return DEFAULT_THEME_ACCENT;
  return findThemeAccent(window.localStorage?.getItem(THEME_STORAGE_KEY)).id;
}

export function applyThemeAccent(accentId: ThemeAccentId) {
  if (typeof document === "undefined") return;
  const accent = findThemeAccent(accentId);
  const root = document.documentElement;
  root.style.setProperty("--accent-color", accent.color);
  root.style.setProperty("--accent-hover", accent.hover);
  root.style.setProperty("--accent-soft", accent.soft);
  root.style.setProperty("--accent-border", accent.border);
  root.style.setProperty("--accent-ring", accent.ring);
  root.style.setProperty("--accent-contrast", accent.contrast);
  root.dataset.themeAccent = accent.id;
}
