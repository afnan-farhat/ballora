export default {
  testEnvironment: "jsdom",

  transform: {
    "^.+\\.(ts|tsx|js|jsx)$": "babel-jest"
  },

  moduleNameMapper: {
    "\\.(css|scss|sass)$": "identity-obj-proxy"
  },

  setupFilesAfterEnv: ["<rootDir>/setupTests.js"],
};