/** Unit tests for the pure logic in src/lib — no React Native imports needed. */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src/lib"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
          types: ["jest", "node"],
          paths: { "@/*": ["./src/*"] },
        },
      },
    ],
  },
};
