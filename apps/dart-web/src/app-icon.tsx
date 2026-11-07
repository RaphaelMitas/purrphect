import tokens from "@purrphect/ui/tokens";
import { ImageResponse } from "next/og";
import { Cat } from "@/components/cat";

export function appIcon(size: number, radius = size * 0.22) {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: radius,
        background: `hsl(${tokens.light.background})`,
      }}
    >
      <Cat size={size * 0.7} />
    </div>,
    { width: size, height: size },
  );
}
