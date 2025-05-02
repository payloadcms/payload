// @ts-strict-ignore
/**
 * Taken from https://github.com/sindresorhus/env-paths/blob/main/index.js
 *
 * MIT License
 *
 * Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import os from 'node:os'
import path from 'node:path'
import process from 'node:process'

const homedir = os.homedir()
const tmpdir = os.tmpdir()
const { env } = process

const macos = (name) => {
  const library = path.join(homedir, 'Library')

  return {
    cache: path.join(library, 'Caches', name),
    config: path.join(library, 'Preferences', name),
    data: path.join(library, 'Application Support', name),
    log: path.join(library, 'Logs', name),
    temp: path.join(tmpdir, name),
  }
}

const windows = (name) => {
  const appData = env.APPDATA || path.join(homedir, 'AppData', 'Roaming')
  const localAppData = env.LOCALAPPDATA || path.join(homedir, 'AppData', 'Local')

  return {
    // Data/config/cache/log are invented by me as Windows isn't opinionated about this
    cache: path.join(localAppData, name, 'Cache'),
    config: path.join(appData, name, 'Config'),
    data: path.join(localAppData, name, 'Data'),
    log: path.join(localAppData, name, 'Log'),
    temp: path.join(tmpdir, name),
  }
}

// https://specifications.freedesktop.org/basedir-spec/basedir-spec-latest.html
const linux = (name) => {
  const username = path.basename(homedir)

  return {
    cache: path.join(env.XDG_CACHE_HOME || path.join(homedir, '.cache'), name),
    config: path.join(env.XDG_CONFIG_HOME || path.join(homedir, '.config'), name),
    data: path.join(env.XDG_DATA_HOME || path.join(homedir, '.local', 'share'), name),
    // https://wiki.debian.org/XDGBaseDirectorySpecification#state
    log: path.join(env.XDG_STATE_HOME || path.join(homedir, '.local', 'state'), name),
    temp: path.join(tmpdir, username, name),
  }
}

export function envPaths(name, { suffix = 'nodejs' } = {}) {
  if (typeof name !== 'string') {
    throw new TypeError(`Expected a string, got ${typeof name}`)
  }

  if (suffix) {
    // Add suffix to prevent possible conflict with native apps
    name += `-${suffix}`
  }

  if (process.platform === 'darwin') {
    return macos(name)
  }

  if (process.platform === 'win32') {
    return windows(name)
  }

  return linux(name)
}
