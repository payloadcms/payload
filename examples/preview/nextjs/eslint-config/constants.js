const TEST_FILE_PATTERNS = [
  '**/**.it-test.ts',
  '**/**.test.ts',
  '**/**.spec.ts',
  '**/__mocks__/**.ts',
  '**/test/**.ts',
]

const CODE_FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.scss', '.json']

module.exports = {
  TEST_FILE_PATTERNS,
  CODE_FILE_EXTENSIONS,
}
