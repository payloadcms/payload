import type { SanitizedCollectionConfig } from '../collections/config/types'

import { DuplicateCollection } from '../errors'

const getDuplicates = (arr: string[]) => arr.filter((item, index) => arr.indexOf(item) !== index)

const checkDuplicateCollections = (collections: SanitizedCollectionConfig[]): void => {
  const duplicateSlugs = getDuplicates(collections.map((c) => c.slug))
  if (duplicateSlugs.length > 0) {
    throw new DuplicateCollection('slug', duplicateSlugs)
  }
}

export default checkDuplicateCollections
