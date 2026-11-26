import type { NextConfig } from "next";
import { SCREENSHOT_WIDTHS } from "./src/screenshot-loader";

const config: NextConfig = {
  output: "export",
  transpilePackages: ["@purrphect/ui", "@purrphect/store-assets"],
  images: {
    loader: "custom",
    loaderFile: "./src/screenshot-loader.ts",
    deviceSizes: SCREENSHOT_WIDTHS,
    imageSizes: [],
  },
};

export default config;
