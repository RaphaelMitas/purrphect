import type { NextConfig } from "next";

const config: NextConfig = {
  output: "export",
  transpilePackages: ["@purrphect/ui", "@purrphect/store-assets"],
  images: { unoptimized: true },
};

export default config;
