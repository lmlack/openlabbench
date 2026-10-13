import type { NextConfig } from "next";
import { BASE_PATH } from "./lib/base-path";

const nextConfig: NextConfig = {
  // Fully static: the whole site is prerendered to HTML/SVG at build time.
  output: "export",
  // Served from the root of openlabbench.gwark.dev, so BASE_PATH is empty.
  // Kept as a setting: moving under a path again is a one-line change.
  basePath: BASE_PATH,
  // Emit every page as <route>/index.html. Without this the export writes
  // <route>.html but links to <route>, which only resolves on hosts that
  // rewrite clean URLs; plain static hosting 404s on every internal page.
  trailingSlash: true,
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
