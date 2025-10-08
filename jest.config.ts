// import type { Config } from "jest";

// const config: Config = {
//   clearMocks: true,

//   collectCoverage: true,

//   coverageDirectory: "coverage",
// };

// export default config;

/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { useESM: true }],
  },
  extensionsToTreatAsEsm: [".ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  testMatch: ["**/__tests__/**/*.test.(ts|js)", "**/tests/**/*.test.(ts|js)"],
};
