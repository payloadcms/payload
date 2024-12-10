/*
  This source code has been taken and modified from https://github.com/vercel/next.js/blob/39498d604c3b25d92a483153fe648a7ee456fbda/packages/next/src/lib/resolve-from.ts

  License:

  The MIT License (MIT)

  Copyright (c) 2024 Vercel, Inc.

  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

// source: https://github.com/sindresorhus/resolve-from
import { createRequire } from 'module'
import path from 'path'

import { isError } from './isError.js'
import { realpathSync } from './realPath.js'

export const resolveFrom = (fromDirectory: string, moduleId: string, silent?: boolean) => {
  if (typeof fromDirectory !== 'string') {
    throw new TypeError(
      `Expected \`fromDir\` to be of type \`string\`, got \`${typeof fromDirectory}\``,
    )
  }

  if (typeof moduleId !== 'string') {
    throw new TypeError(
      `Expected \`moduleId\` to be of type \`string\`, got \`${typeof moduleId}\``,
    )
  }

  try {
    fromDirectory = realpathSync(fromDirectory)
  } catch (error: unknown) {
    if (isError(error) && error.code === 'ENOENT') {
      fromDirectory = path.resolve(fromDirectory)
    } else if (silent) {
      return
    } else {
      throw error
    }
  }

  const fromFile = path.join(fromDirectory, 'noop.js')

  const require = createRequire(import.meta.url)

  const Module = require('module')

  const resolveFileName = () => {
    return Module._resolveFilename(moduleId, {
      id: fromFile,
      filename: fromFile,
      paths: Module._nodeModulePaths(fromDirectory),
    })
  }

  if (silent) {
    try {
      return resolveFileName()
    } catch (error) {
      return
    }
  }

  return resolveFileName()
}
