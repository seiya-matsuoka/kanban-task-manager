import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import nextPlugin from "@next/eslint-plugin-next";

export default [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "dist/**",
      "coverage/**",
      "components.json",
    ],
  },

  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.browser,
      parser: tseslint.parser,
      parserOptions: { project: false },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      "@next/next": nextPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "no-undef": "off",
    },
    settings: {
      next: { rootDir: ["./"] },
    },
  },

  {
    files: [
      "tailwind.config.{js,ts}",
      "postcss.config.{js,ts}",
      "next.config.{js,ts,mjs}",
      "eslint.config.mjs",
    ],
    languageOptions: { sourceType: "module", globals: globals.node },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];
