/* eslint-disable */
module.exports = {
  root: true,
  env: { browser: true, es2021: true },
  settings: {
    react: {
      version: "18.3",
    },
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "prettier", // 先添加 prettier 配置
    "plugin:prettier/recommended", // 然后添加 prettier 插件
  ],
  rules: {
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/prefer-ts-expect-error": "off",
    "react/react-in-jsx-scope": "off",
    "@typescript-eslint/ban-ts-comments": "off",
    "no-debugger": "off",
    // 配置prettier规则
    "@typescript-eslint/no-explicit-any": "off",
    // 配置未使用import的规则为warning，不自动删除
    "no-unused-imports": "off",
    "@typescript-eslint/no-unused-imports": "off",
    // 添加no-mixed-spaces-and-tabs规则
    "no-mixed-spaces-and-tabs": ["error", "smart-tabs"],
    "prettier/prettier": [
      "error",
      {
        endOfLine: "auto",
      },
    ],
    // 禁用可能与 Prettier 冲突的规则
    "arrow-body-style": "off",
    "prefer-arrow-callback": "off",
  },
};
