export type ThemeColors = {
  background: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  primary: string;
  primaryContrast: string;
  primarySoft: string;
  secondary: string;
  secondaryContrast: string;
  secondarySoft: string;
  accent: string;
  focus: string;
  danger: string;
  dangerSoft: string;
  success: string;
};

export const lightColors: ThemeColors = {
  background: "#eff7f6",
  surface: "#ffffff",
  text: "#0d2224",
  muted: "#285b5e",
  border: "#bad8d7",
  primary: "#377d80",
  primaryContrast: "#ffffff",
  primarySoft: "#dceceb",
  secondary: "#ff9182",
  secondaryContrast: "#0d2224",
  secondarySoft: "#fff5f3",
  accent: "#ff9182",
  focus: "#377d80",
  danger: "#dc2626",
  dangerSoft: "#fef2f2",
  success: "#306e71",
};

export const darkColors: ThemeColors = {
  background: "#0d2224",
  surface: "#183638",
  text: "#eff7f6",
  muted: "#bad8d7",
  border: "#21494c",
  primary: "#8dbdbc",
  primaryContrast: "#0d2224",
  primarySoft: "#21494c",
  secondary: "#ff9182",
  secondaryContrast: "#0d2224",
  secondarySoft: "#421f20",
  accent: "#ffb1a5",
  focus: "#8dbdbc",
  danger: "#f87171",
  dangerSoft: "#450a0a",
  success: "#8dbdbc",
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
  xs: 2,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  xxl: 16,
  xxxl: 24,
  pill: 9999,
};
