import { CAT_ASPECT, catDataUri } from "@purrphect/ui/cat-svg";
import tokens from "@purrphect/ui/tokens";

const SRC = catDataUri(`hsl(${tokens.light.pink})`);

export function Cat({ size, className }: { size: number; className?: string }) {
  // biome-ignore lint/performance/noImgElement: an inline data-URI SVG gains nothing from next/image
  return <img src={SRC} width={size} height={Math.round(size * CAT_ASPECT)} className={className} alt="" />;
}
