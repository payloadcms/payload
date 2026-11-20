import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { packagePublishList } from '../../../../tools/releaser/src/lib/publishList.js'
import { payloadPackageNames } from '../payload-package-names.js'

describe('bundled core package list', () => {
  it('should match the release list', () => {
    const publishedNames = packagePublishList.map((directory) => {
      const packageJson = JSON.parse(
        readFileSync(new URL(`../../../${directory}/package.json`, import.meta.url), 'utf8'),
      ) as { name: string }

      return packageJson.name
    })

    expect([...payloadPackageNames].sort()).toEqual(publishedNames.sort())
  })
})
