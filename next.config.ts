import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Server Actions cap request bodies at 1 MB by default, which rejects even a
      // single phone photo. This must stay >= MAX_PHOTOS * MAX_BYTES from
      // src/lib/photos.ts (currently 8 x 12 MB), plus room for the form fields.
      // It cannot import that module: next.config.ts is transpiled and loaded
      // outside the app's module graph, so the path does not resolve.
      bodySizeLimit: "100mb",
    },
  },
};

export default nextConfig;
