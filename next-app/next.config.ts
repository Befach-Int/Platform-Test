import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  // Transpile BlockSuite packages to fix ESM compatibility
  transpilePackages: [
    "@blocksuite/presets",
    "@blocksuite/store",
    "@blocksuite/blocks",
    "@blocksuite/affine-model",
    "@blocksuite/affine-block-surface",
    "@blocksuite/affine-components",
    "@blocksuite/data-view",
    "@blocksuite/icons",
    "@blocksuite/inline",
    "@blocksuite/block-std",
    "@blocksuite/global",
  ],

  // Empty turbopack config to silence warning when using webpack
  turbopack: {},

  // Webpack configuration to fix BlockSuite icon typo issue
  webpack: (config) => {
    // Fix for BlockSuite icon typo: CheckBoxCkeckSolidIcon -> CheckBoxCheckSolidIcon
    config.resolve.alias = {
      ...config.resolve.alias,
    };

    // Ignore the typo'd exports in BlockSuite
    config.module.rules.push({
      test: /\.m?js$/,
      include: /node_modules\/@blocksuite/,
      resolve: {
        fullySpecified: false,
      },
    });

    return config;
  },
};

export default nextConfig;
