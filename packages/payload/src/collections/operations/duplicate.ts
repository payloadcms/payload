import type { DeepPartial } from 'ts-essentials'

import type { CollectionSlug } from '../../index.js'
import type { TransformCollectionWithSelect } from '../../types/index.js'
import type { RequiredDataFromCollectionSlug, SelectFromCollectionSlug } from '../config/types.js'

import { type Arguments as CreateArguments, createOperation } from './create.js'

export type Arguments<TSlug extends CollectionSlug> = {
  data?: DeepPartial<RequiredDataFromCollectionSlug<TSlug>>
  id: number | string
} & Omit<CreateArguments<TSlug>, 'data' | 'duplicateFromID'>

export const duplicateOperation = async <
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  incomingArgs: Arguments<TSlug>,
): Promise<TransformCollectionWithSelect<TSlug, TSelect>> => {
  const { id, ...args } = incomingArgs
  return createOperation({
    ...args,
    data: incomingArgs?.data || {},
    duplicateFromID: id,
  })
}
