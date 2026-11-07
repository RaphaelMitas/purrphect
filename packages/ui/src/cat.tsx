import { memo, useMemo } from "react";
import { SvgXml } from "react-native-svg";
import { CAT_ASPECT, catSvg } from "./cat-svg";
import { usePalette } from "./lib/theme";

export const Cat = memo(function Cat({
  size = 32,
  color,
  blush = true,
}: {
  size?: number;
  color?: string;
  blush?: boolean;
}) {
  const palette = usePalette();
  const fill = color ?? palette.pink;
  const xml = useMemo(() => catSvg(fill, { blush }), [fill, blush]);
  return <SvgXml xml={xml} width={size} height={size * CAT_ASPECT} />;
});
