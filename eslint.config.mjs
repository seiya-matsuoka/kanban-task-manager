import js from "@eslint/js";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import nextPlugin from "@next/eslint-plugin-next";

export default [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "dist/**",
      "coverage/**",
      "components.json",
      "**/generated/**",
      "prisma/dev.db",
    ],
  },

  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      globals: globals.browser,
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      "react-hooks": reactHooks,
      "@next/next": nextPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "no-undef": "off",

      "no-unused-vars": "off",
      // 未使用変数: 変数・引数ともに _ 始まりは許容
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      // React Hooks
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
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
