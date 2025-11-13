// Build testPathIgnorePatterns array conditionally
const testPathIgnorePatterns = [
  '/node_modules/',
  '/tests/integration/',
  '/tests/e2e/'
];

// Skip load tests by default (unless explicitly enabled)
if (process.env.SKIP_LOAD_TESTS !== 'false') {
  testPathIgnorePatterns.push('/tests/load/');
}

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  testPathIgnorePatterns,
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        moduleResolution: 'node',
        esModuleInterop: true,
      }
    }],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    // Exclude UI-heavy files from global coverage (require manual/E2E testing)
    '!src/app.ts',
    '!src/delete.ts',
    '!src/ui/**', // UI modules require E2E testing
    '!src/features/**', // Feature modules require E2E testing
    // Include core modules (validators and models) now that we have tests
    // Exclude crypto module (covered in PR #1, has separate tests)
    '!src/core/crypto/**',
    '!src/core/models/**', // Type-only module, no runtime code to test
    '!src/infrastructure/**',
    '!src/application/**',
    '!src/presentation/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 65,
      lines: 50,
      statements: 50
    },
    // Critical security files require high coverage
    // Starting at 70% during refactoring, will increase to 90+ by end of PR series
    // TODO: Increase to 75% in PR #3, 80% in PR #5, 90%+ by PR #13
    './src/security.ts': {
      branches: 70,
      functions: 70,
      lines: 75,
      statements: 75
    },
    // Core modules require high coverage (PR #2)
    // Starting at 75% during refactoring, will increase to 90+ by end of PR series
    './src/core/validators/index.ts': {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
};