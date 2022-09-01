export default {
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  testEnvironment: 'node',
  injectGlobals: true,
  modulePathIgnorePatterns: ['<rootDir>/bin/*'],
}
