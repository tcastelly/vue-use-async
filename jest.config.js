module.exports = {
  collectCoverage: true,
  collectCoverageFrom: [
    '!**/coverage/**',
    '!**/dist/**',
    '!**/node_modules/**',
    '!scripts/**',
    '!package.json',
    '!package-lock.json',
  ],
};
