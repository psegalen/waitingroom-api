import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

const config = [
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/explicit-function-return-type": ["error", { allowExpressions: true }],
      "no-nested-ternary": "off",
      "no-shadow": "off",
      "@typescript-eslint/no-shadow": ["error"],
      "@typescript-eslint/no-unused-vars": "warn",
      "import/extensions": "off",
    },
  },
  {
    ignores: ["build/*", "dist/*"],
  },
];

export default config;
