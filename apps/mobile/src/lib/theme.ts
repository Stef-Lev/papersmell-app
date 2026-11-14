export type ThemeColors = {
  background: string;
  surface: string;
  text: string;
  muted: string;
  primary: string;
  primarySoft: string;
  border: string;
  coral: string;
  coralSoft: string;
  danger: string;
  dangerSoft: string;
  white: string;
};

export const lightColors: ThemeColors = {
  background: "#eff7f6",
  surface: "#ffffff",
  text: "#0d2224",
  muted: "#285b5e",
  primary: "#377d80",
  primarySoft: "#dceceb",
  border: "#bad8d7",
  coral: "#ff9182",
  coralSoft: "#fff5f3",
  danger: "#b91c1c",
  dangerSoft: "#fef2f2",
  white: "#ffffff",
};

export const darkColors: ThemeColors = {
  background: "#111c1d",
  surface: "#1b2b2c",
  text: "#f0f7f6",
  muted: "#b6cdcd",
  primary: "#75b6b4",
  primarySoft: "#294344",
  border: "#3d5a5b",
  coral: "#ff9d8f",
  coralSoft: "#392b2a",
  danger: "#ff9b9b",
  dangerSoft: "#3b2528",
  white: "#ffffff",
};

export const colors = lightColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 20,
  pill: 999,
};
