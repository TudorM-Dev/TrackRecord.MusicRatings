import { useEffect, useState } from "react";

export const BRAND_TINT = "#e8a33d";

const cache = new Map<string, string>();
const pending = new Map<string, Promise<string>>();

function toHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [(h / 6) * 360, s, l];
}

function toHex(h: number, s: number, l: number): string {
  const hue = h / 360;
  const channel = (p: number, q: number, t: number) => {
    let v = t;
    if (v < 0) v += 1;
    if (v > 1) v -= 1;
    if (v < 1 / 6) return p + (q - p) * 6 * v;
    if (v < 1 / 2) return q;
    if (v < 2 / 3) return p + (q - p) * (2 / 3 - v) * 6;
    return p;
  };

  let r: number;
  let g: number;
  let b: number;

  if (s === 0) {
    r = l;
    g = l;
    b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = channel(p, q, hue + 1 / 3);
    g = channel(p, q, hue);
    b = channel(p, q, hue - 1 / 3);
  }

  const part = (v: number) =>
    Math.round(v * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${part(r)}${part(g)}${part(b)}`;
}

const SIZE = 28;
const HUE_BUCKET = 12;

function dominant(image: HTMLImageElement): string {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return BRAND_TINT;

  context.drawImage(image, 0, 0, SIZE, SIZE);
  const { data } = context.getImageData(0, 0, SIZE, SIZE);

  const bins = new Map<
    number,
    { weight: number; h: number; s: number; l: number }
  >();

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3] ?? 255;
    if (alpha < 200) continue;

    const [h, s, l] = toHsl(data[i] ?? 0, data[i + 1] ?? 0, data[i + 2] ?? 0);
    if (l < 0.12 || l > 0.94 || s < 0.18) continue;

    const key = Math.round(h / HUE_BUCKET);
    const weight = s * (1 - Math.abs(l - 0.5));
    const bin = bins.get(key) ?? { weight: 0, h: 0, s: 0, l: 0 };
    bin.weight += weight;
    bin.h += h * weight;
    bin.s += s * weight;
    bin.l += l * weight;
    bins.set(key, bin);
  }

  let best: { weight: number; h: number; s: number; l: number } | null = null;
  for (const bin of bins.values()) {
    if (!best || bin.weight > best.weight) best = bin;
  }

  if (!best || best.weight === 0) return "#c9c2b6";

  const h = best.h / best.weight;
  const s = Math.min(0.92, Math.max(0.45, best.s / best.weight));
  const l = Math.min(0.68, Math.max(0.52, best.l / best.weight));

  return toHex(h, s, l);
}

export function tintOf(coverUrl: string): string | undefined {
  return coverUrl ? cache.get(coverUrl) : undefined;
}

export function extractTint(coverUrl: string): Promise<string> {
  if (!coverUrl) return Promise.resolve(BRAND_TINT);

  const hit = cache.get(coverUrl);
  if (hit) return Promise.resolve(hit);

  const inFlight = pending.get(coverUrl);
  if (inFlight) return inFlight;

  const job = new Promise<string>((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";

    const done = (value: string) => {
      cache.set(coverUrl, value);
      pending.delete(coverUrl);
      resolve(value);
    };

    image.onload = () => {
      try {
        done(dominant(image));
      } catch {
        done(BRAND_TINT);
      }
    };
    image.onerror = () => done(BRAND_TINT);
    image.src = coverUrl;
  });

  pending.set(coverUrl, job);
  return job;
}

export function useDocumentTint(tint: string | undefined) {
  useEffect(() => {
    if (!tint) return;
    const root = document.documentElement;
    root.style.setProperty("--tint", tint);
    return () => {
      root.style.removeProperty("--tint");
    };
  }, [tint]);
}

export function useTint(coverUrl: string | undefined): string {
  const [tint, setTint] = useState(
    () => (coverUrl && cache.get(coverUrl)) || BRAND_TINT,
  );

  useEffect(() => {
    if (!coverUrl) {
      setTint(BRAND_TINT);
      return;
    }

    const hit = cache.get(coverUrl);
    if (hit) {
      setTint(hit);
      return;
    }

    let live = true;
    void extractTint(coverUrl).then((value) => {
      if (live) setTint(value);
    });

    return () => {
      live = false;
    };
  }, [coverUrl]);

  return tint;
}
