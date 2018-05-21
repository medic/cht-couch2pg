module.exports = {
  displayName: 'jest:test',
  'testEnvironment': 'node',
  'testPathIgnorePatterns': [
    'bootstrap', 'mocks', 'docs', 'utils'
  ],
  'testMatch': ['<rootDir>/tests/**/*.js'],
  'collectCoverageFrom': ['<rootDir>/replicate/**/*.{js}'],
  'coverageThreshold': {
    'global': {
      'branches': 100,
      'functions': 100,
      'lines': 100,
      'statements': 100
    }
  }
}
