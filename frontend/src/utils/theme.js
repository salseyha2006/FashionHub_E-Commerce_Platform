// src/utils/theme.js — Phase 10: Theme & Branding Engine
//
// index.css defines --color-primary-50..900 etc. inside an @theme block.
// In Tailwind v4 those are *real* CSS custom properties, so every utility
// class (bg-primary-500, border-primary-500, text-primary-500, …) resolves
// through var(--color-primary-500) at paint time. That means we don't need
// to touch a single className anywhere in the app — we only need to
// override the custom properties on :root at runtime, and the whole app
// re-skins itself.
//
// No color-math dependency: everything below is plain HSL math so this
// stays dependency-free.

function hexToHsl(hex) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((ch) => ch + ch).join('');
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

// Lightness targets tuned to roughly match the shipped pink scale's "feel"
// (500 = the admin's chosen color; 50 barely-there tint; 900 near-ink).
const SHADE_LIGHTNESS = {
  50: 96, 100: 92, 200: 84, 300: 72, 400: 60,
  500: null, // the admin's color itself
  600: null, 700: null, 800: null, 900: null,
};

/**
 * Given one hex color (what the admin picks), generate the full 50-900
 * scale the rest of the app already expects.
 */
export function generateColorScale(hex) {
  if (!hex || !/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) return null;
  const { h, s, l: baseL } = hexToHsl(hex);

  const scale = {};
  for (const shade of [50, 100, 200, 300, 400]) {
    scale[shade] = hslToHex(h, Math.max(s * 0.9, 25), SHADE_LIGHTNESS[shade]);
  }
  scale[500] = hex;
  // Darker shades: keep hue/sat, step lightness down from the base color.
  scale[600] = hslToHex(h, Math.min(s * 1.05, 100), Math.max(baseL - 10, 8));
  scale[700] = hslToHex(h, Math.min(s * 1.1, 100), Math.max(baseL - 20, 6));
  scale[800] = hslToHex(h, Math.min(s * 1.1, 100), Math.max(baseL - 28, 5));
  scale[900] = hslToHex(h, Math.min(s * 1.15, 100), Math.max(baseL - 35, 4));
  return scale;
}

const RADIUS_PRESETS = {
  rounded: { sm: '6px', md: '10px', lg: '16px', xl: '20px' },
  sharp:   { sm: '2px', md: '4px',  lg: '6px',  xl: '8px' },
  pill:    { sm: '10px', md: '16px', lg: '24px', xl: '9999px' },
};

const FONT_STACKS = {
  inter: '"Inter", "Kantumruy Pro", ui-sans-serif, system-ui, sans-serif',
  kantumruy: '"Kantumruy Pro", "Inter", ui-sans-serif, system-ui, sans-serif',
  system: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
};

/**
 * Applies theme settings (color / radius / font) as CSS custom properties
 * on the document root. Safe to call repeatedly (e.g. after Admin saves).
 */
export function applyTheme(settings) {
  if (!settings || typeof document === 'undefined') return;
  const root = document.documentElement;

  if (settings.themePrimaryColor) {
    const scale = generateColorScale(settings.themePrimaryColor);
    if (scale) {
      for (const [shade, value] of Object.entries(scale)) {
        root.style.setProperty(`--color-primary-${shade}`, value);
      }
      root.style.setProperty(
        '--gradient-primary',
        `linear-gradient(135deg, ${scale[400]} 0%, ${scale[600]} 100%)`
      );
      root.style.setProperty('--gradient-mesh-1', `radial-gradient(at top left, ${scale[100]} 0%, transparent 50%)`);
      root.style.setProperty('--gradient-mesh-2', `radial-gradient(at bottom right, ${scale[50]} 0%, transparent 50%)`);
    }
  }

  const radii = RADIUS_PRESETS[settings.themeRadiusStyle] || RADIUS_PRESETS.rounded;
  root.style.setProperty('--radius-sm', radii.sm);
  root.style.setProperty('--radius-md', radii.md);
  root.style.setProperty('--radius-lg', radii.lg);
  root.style.setProperty('--radius-xl', radii.xl);

  const font = FONT_STACKS[settings.themeFont] || FONT_STACKS.inter;
  root.style.setProperty('--font-sans', font);
  root.style.setProperty('--font-display', font);

  if (settings.faviconUrl) {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = settings.faviconUrl;
  }

  // Cache so the next page load can paint the right theme instantly,
  // before the /settings network request even resolves (avoids a
  // flash of the default pink theme).
  try {
    sessionStorage.setItem('fh_theme_cache', JSON.stringify({
      themePrimaryColor: settings.themePrimaryColor,
      themeRadiusStyle: settings.themeRadiusStyle,
      themeFont: settings.themeFont,
      faviconUrl: settings.faviconUrl,
    }));
  } catch { /* storage unavailable — non-fatal, theme just won't be cached */ }
}

/** Reads the last-applied theme from sessionStorage, if any. */
export function getCachedTheme() {
  try {
    const raw = sessionStorage.getItem('fh_theme_cache');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
