import { execFileSync } from 'child_process'

import { pinnedMajorTagGlob } from './pinnedMajor.js'

/** Lists local git tags on the pinned major, e.g. `v4.*`. */
export const listReleaseTags = (): string[] =>
  execFileSync('git', ['tag', '--list', pinnedMajorTagGlob], { encoding: 'utf8' })
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
