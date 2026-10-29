// @ts-check
// Flat ESLint config. The build scripts run in Node; the three.js scenes run in headless Chromium,
// where `three` and `gsap` resolve through the import map in scenes/*.html.
import js from "@eslint/js"
import globals from "globals"

export default [
  { ignores: ["node_modules/", "scenes/node_modules/", "dist/", "assets/", ".cache/"] },
  js.configs.recommended,
  {
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: { ecmaVersion: 2024, sourceType: "module" },
    rules: {
      eqeqeq: ["error", "always"],
      "no-var": "error",
      "prefer-const": "error"
    }
  },
  {
    files: ["scripts/**/*.mjs", "scenes/render.mjs", "eslint.config.mjs"],
    languageOptions: { globals: globals.node }
  },
  {
    files: ["scenes/*.js", "scenes/lib/**/*.js"],
    languageOptions: { globals: globals.browser }
  }
]
