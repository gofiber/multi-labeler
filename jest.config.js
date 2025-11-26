module.exports = {
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { useESM: true, tsconfig: { allowJs: true } }],
  },
  moduleNameMapper: {
    '^@probot/octokit-plugin-config(/dist-src/index\\.js)?$': '<rootDir>/jest/mocks/probot-octokit-plugin-config.ts',
  },
  extensionsToTreatAsEsm: ['.ts'],
  verbose: true,
};
