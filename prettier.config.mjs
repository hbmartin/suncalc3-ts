const config = {
  printWidth: 120,
  trailingComma: "es5",
  overrides: [
    {
      files: ["eslint.config.mjs", "prettier.config.mjs", "*.json", "*.md"],
      options: {
        printWidth: 80,
      },
    },
    {
      files: ["tsconfig.json", "tsconfig.build.json"],
      options: {
        trailingComma: "none",
      },
    },
  ],
};

export default config;
