module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.js'],
  setupFiles: ['./test/loadTestEnv.js'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['api/**/*.js'],
};
