/*
  This source code has been taken and modified from https://github.com/vercel/next.js/blob/41a80533f900467e1b788bd2673abe2dca20be6a/packages/next/src/lib/has-necessary-dependencies.ts

  License:

  The MIT License (MIT)

  Copyright (c) 2024 Vercel, Inc.

  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { findUp } from '../findUp.js'
import { resolveFrom } from './resolveFrom.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const payloadPkgDirname = path.resolve(dirname, '../../../') // pkg dir (outside src)
// if node_modules is in payloadPkgDirname, go to parent dir which contains node_modules
if (payloadPkgDirname.includes('node_modules')) {
  payloadPkgDirname.split('node_modules').slice(0, -1)
}
const resolvedCwd = path.resolve(process.cwd())

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
        const pkgDir = path.dirname(pkgPath)

        let packageJsonFilePath = null

        const foundPackageJsonDir = await findUp({
          dir: pkgDir,
          fileNames: ['package.json'],
        })

        if (foundPackageJsonDir) {
          const resolvedFoundPath = path.resolve(foundPackageJsonDir)

          if (
            resolvedFoundPath.startsWith(resolvedCwd) ||
            resolvedFoundPath.startsWith(payloadPkgDirname)
          ) {
            // We don't want to match node modules outside the user's project. Checking for both process.cwd and dirname is a reliable way to do this.
            packageJsonFilePath = resolvedFoundPath
          }
        }

        // No need to check if packageJsonFilePath exists - findUp checks that for us
        if (packageJsonFilePath) {
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
