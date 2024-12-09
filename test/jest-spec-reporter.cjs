// From https://github.com/robertbradleyux/jest-ci-spec-reporter/blob/main/src/jest-ci-spec-reporter.ts
/*
MIT License

Copyright (c) 2023 Robert Bradley

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
class JestCiSpecReporter {
  onRunStart({ numTotalTestSuites }) {
    console.log()
    console.log(`Found ${numTotalTestSuites} test suites.`)
    console.log()
  }
  onRunComplete(_, results) {
    const {
      numFailedTests,
      numPassedTests,
      numPendingTests,
      testResults,
      numTotalTests,
      startTime,
    } = results
    testResults.forEach(({ failureMessage }) => {
      if (failureMessage) {
        console.log(failureMessage)
      }
    })
    const testResultText = numFailedTests === 0 ? 'SUCCESS' : 'FAILED'
    const numNotSkippedTests = numPassedTests + numFailedTests
    const runDuration = this._getRunDuration(startTime)
    console.log()
    console.log(
      `Executed ${numNotSkippedTests} of ${numTotalTests} (skipped ${numPendingTests}) ${testResultText} (${runDuration})`,
    )
    console.log(`TOTAL: ${numFailedTests || numNotSkippedTests} ${testResultText}`)
  }
  onTestResult(test, { testResults }) {
    // Log pretty ALL RESULTS message
    console.log('\n\n\x1b[1m\x1b[30mALL RESULTS\x1b[0m')
    testResults.forEach((result) => {
      var _a, _b
      const { title, duration, status, ancestorTitles } = result
      const { name } =
        (_b = (_a = test.context.config) === null || _a === void 0 ? void 0 : _a.displayName) !==
          null && _b !== void 0
          ? _b
          : {}
      if (name) {
        ancestorTitles.unshift(name)
      }
      const breadcrumbs = `${ancestorTitles.join(' > ')} >`

      console.log(
        `    ${this._getTestStatus(status)} ${breadcrumbs} ${title} ${this._getTestDuration(duration)}`,
      )
    })
  }

  onTestCaseResult(test, result) {
    var _a, _b
    const { title, duration, status, ancestorTitles } = result
    const { name } =
      (_b = (_a = test.context.config) === null || _a === void 0 ? void 0 : _a.displayName) !==
        null && _b !== void 0
        ? _b
        : {}
    if (name) {
      ancestorTitles.unshift(name)
    }
    const breadcrumbs = `${ancestorTitles.join(' > ')} >`

    console.log(
      `    ${this._getTestStatus(status)} ${breadcrumbs} ${title} ${this._getTestDuration(duration)}`,
    )
  }

  getLastError() {
    return undefined
  }
  _getRunDuration(startTime) {
    const deltaInMillis = new Date().getTime() - new Date(startTime).getTime()
    const seconds = ((deltaInMillis % 60000) / 1000).toFixed(3)
    return `${seconds} secs`
  }
  _getTestDuration(duration) {
    return `\x1b[1m\x1b[30m(${duration !== null && duration !== void 0 ? duration : 0}ms)\x1b[0m`
  }
  _getTestStatus(status) {
    switch (status) {
      case 'passed':
        return '\x1b[1m\x1b[32m[PASS]\x1b[0m'
      case 'pending':
        return '\x1b[1m\x1b[33m[SKIP]\x1b[0m'
      case 'todo':
        return '\x1b[1m\x1b[34m[TODO]\x1b[0m'
      case 'failed':
      default:
        return '\x1b[1m\x1b[31m[FAIL]\x1b[0m'
    }
  }
}
exports.default = JestCiSpecReporter
