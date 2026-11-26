import type { ImageLoaderProps } from "next/image";

export const SCREENSHOT_WIDTHS = [480, 960, 1600];

export default function screenshotLoader({ src, width }: ImageLoaderProps) {
  return `${src.replace(/\.png$/, "")}-${width}.webp`;
}
