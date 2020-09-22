module.exports = {
  collectCoverage: true,
  collectCoverageFrom: [
    '!**/types/**',
    '!tsconfig.json',
    '!**/coverage/**',
    '!**/dist/**',
    '!**/node_modules/**',
    '!scripts/**',
    '!package.json',
    '!package-lock.json',
  ],
};
