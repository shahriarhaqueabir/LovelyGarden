
/**
 * Simple hex color manipulation utilities for theming.
 */

export const hexToRgb = (hex: string): { r: number, g: number, b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

// Mix color with white (tint) or black (shade)
// weight: 0 to 1. 0 = original, 1 = target (white/black)
const mix = (c1: { r: number, g: number, b: number }, c2: { r: number, g: number, b: number }, weight: number) => {
  return {
    r: Math.round(c1.r + (c2.r - c1.r) * weight),
    g: Math.round(c1.g + (c2.g - c1.g) * weight),
    b: Math.round(c1.b + (c2.b - c1.b) * weight)
  };
};

const rgbToHex = (c: { r: number, g: number, b: number }) => {
  return "#" + ((1 << 24) + (c.r << 16) + (c.g << 8) + c.b).toString(16).slice(1);
};

export const generatePalette = (baseHex: string) => {
  const base = hexToRgb(baseHex);
  if (!base) return null;

  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 0, g: 0, b: 0 };
  // 950 is 90% black.
  // 50 is 90% white.
  // 950 is 90% black.

  return {
    50: rgbToHex(mix(base, white, 0.95)),
    100: rgbToHex(mix(base, white, 0.9)),
    200: rgbToHex(mix(base, white, 0.75)),
    300: rgbToHex(mix(base, white, 0.6)),
    400: rgbToHex(mix(base, white, 0.3)),
    500: baseHex,
    600: rgbToHex(mix(base, black, 0.1)),
    700: rgbToHex(mix(base, black, 0.3)),
    800: rgbToHex(mix(base, black, 0.5)),
    900: rgbToHex(mix(base, black, 0.7)),
    950: rgbToHex(mix(base, black, 0.85)),
  };
};

export const applyTheme = (baseHex: string) => {
  const palette = generatePalette(baseHex);
  if (!palette) return;

  const root = document.documentElement;
  Object.entries(palette).forEach(([key, value]) => {
    root.style.setProperty(`--color-garden-${key}`, value);
  });
};
