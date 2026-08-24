import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Vinext supports ordinary same-origin anchors and performs full document
      // navigation for authentication-sensitive routes.
      "@next/next/no-html-link-for-pages": "off",
      "@next/next/no-location-assign-relative-destination": "off",
      // The shared brand assets are static, local files and intentionally avoid
      // framework image wrappers in the terminal chrome.
      "@next/next/no-img-element": "off",
      // These screens initialize and reset request state from effects; this is
      // intentional synchronization with URL, timer, and network state.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
