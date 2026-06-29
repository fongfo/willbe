/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['dotenv/config'],
  // Route/integration suites share one real Postgres database, so they must run
  // serially — parallel workers race each other's deleteMany() cleanup. The
  // readiness suite is uniquely sensitive because its score reads all tables.
  maxWorkers: 1,
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/index.ts',
    '!src/generated/**',
    '!src/db/client.ts',
    '!src/cache/redisClient.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
