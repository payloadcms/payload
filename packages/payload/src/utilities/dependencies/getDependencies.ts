/*
  This source code has been taken and modified from https://github.com/vercel/next.js/blob/41a80533f900467e1b788bd2673abe2dca20be6a/packages/next/src/lib/has-necessary-dependencies.ts

  License:

  The MIT License (MIT)

  Copyright (c) 2024 Vercel, Inc.

  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import { findUp } from 'find-up'
import { existsSync, promises as fs } from 'fs'
import { dirname } from 'path'

import { resolveFrom } from './resolveFrom.js'

export type NecessaryDependencies = {
  missing: string[]
  resolved: Map<
    string,
    {
      path: string
      version: string
    }
  >
}

export async function getDependencies(
  baseDir: string,
  requiredPackages: string[],
): Promise<NecessaryDependencies> {
  const resolutions = new Map<
    string,
    {
      path: string
      version: string
    }
  >()
  const missingPackages: string[] = []

  await Promise.all(
    requiredPackages.map(async (pkg) => {
      try {
        const pkgPath = await fs.realpath(resolveFrom(baseDir, pkg))

        const pkgDir = dirname(pkgPath)

        let packageJsonFilePath = null

        await findUp('package.json', { type: 'file', cwd: pkgDir }).then((path) => {
          packageJsonFilePath = path
        })

        if (packageJsonFilePath && existsSync(packageJsonFilePath)) {
          // parse version
          const packageJson = JSON.parse(await fs.readFile(packageJsonFilePath, 'utf8'))
          const version = packageJson.version

          resolutions.set(pkg, {
            path: packageJsonFilePath,
            version,
          })
        } else {
          return missingPackages.push(pkg)
        }
      } catch (_) {
        return missingPackages.push(pkg)
      }
    }),
  )

  return {
    missing: missingPackages,
    resolved: resolutions,
  }
}
