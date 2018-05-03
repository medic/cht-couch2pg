module.exports = {
  displayName: 'lint:eslint',
  runner: 'jest-runner-eslint',
  testMatch: [
    '<rootDir>/spec/**/*.js',
    '<rootDir>/replicate/**/*.js'
  ],
  testPathIgnorePatterns: [
  ]
}
