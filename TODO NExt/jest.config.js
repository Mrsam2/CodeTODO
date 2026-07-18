/** Unit tests for the pure logic in lib/ — no React Native imports needed. */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/lib"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
          types: ["jest", "node"],
          paths: { "@/*": ["./*"] },
        },
      },
    ],
  },
};
