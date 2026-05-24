import jsxA11y from "eslint-plugin-jsx-a11y";
import tsParser from "@typescript-eslint/parser";

const recommended = jsxA11y.flatConfigs.recommended;

export default [
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "src/generated/**",
      ".accessibility-reports/**",
      "test-results/**",
      "playwright-report/**"
    ]
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true }
      }
    },
    plugins: recommended.plugins,
    rules: recommended.rules
  }
];
