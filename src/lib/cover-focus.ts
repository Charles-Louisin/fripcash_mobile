import type { ImageContentPosition } from "expo-image";

export type CoverFocus = { x: number; y: number };

export const COVER_CENTER: CoverFocus = { x: 50, y: 50 };

function clamp(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function coverFocusOf(url?: string | null): CoverFocus {
  if (!url) return COVER_CENTER;
  try {
    const parsed = new URL(url);
    const x = Number(parsed.searchParams.get("cx"));
    const y = Number(parsed.searchParams.get("cy"));
    if (!Number.isFinite(x) || !Number.isFinite(y)) return COVER_CENTER;
    return { x: clamp(x), y: clamp(y) };
  } catch {
    return COVER_CENTER;
  }
}

export function withCoverFocus(url: string, focus: CoverFocus) {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("cx", String(clamp(focus.x)));
    parsed.searchParams.set("cy", String(clamp(focus.y)));
    return parsed.toString();
  } catch {
    const join = url.includes("?") ? "&" : "?";
    return `${url}${join}cx=${clamp(focus.x)}&cy=${clamp(focus.y)}`;
  }
}

export function coverContentPosition(url?: string | null): ImageContentPosition {
  const focus = coverFocusOf(url);
  return {
    left: `${focus.x}%` as `${number}%`,
    top: `${focus.y}%` as `${number}%`,
  };
}
