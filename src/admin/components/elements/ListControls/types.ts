import { SanitizedCollectionConfig } from '../../../../collections/config/types';

export type Props = {
  enableColumns?: boolean,
  enableSort?: boolean,
  setSort: (sort: string) => void,
  collection: SanitizedCollectionConfig,
  handleChange: (newState) => void,
}

export type ListControls = {
  where?: unknown
  columns?: string[]
}
