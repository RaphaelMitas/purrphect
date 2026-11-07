import type { NextConfig } from "next";

const config: NextConfig = {
  output: "export",
  transpilePackages: ["@purrphect/ui"],
  images: { unoptimized: true },
};

export default config;
