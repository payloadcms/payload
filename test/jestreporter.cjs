class CustomReporter {
  constructor(globalConfig, reporterOptions, reporterContext) {
    this._globalConfig = globalConfig
    this._options = reporterOptions
    this._context = reporterContext
  }

  onTestCaseResult(test, testCaseResult) {
    if (testCaseResult.status === 'passed') {
      return
    }
    console.log('Test case result:', testCaseResult)
  }
}

module.exports = CustomReporter
