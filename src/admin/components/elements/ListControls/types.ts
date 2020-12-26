import { CollectionConfig } from '../../../../collections/config/types';

export type Props = {
  enableColumns?: boolean,
  enableSort?: boolean,
  setSort: (sort: string) => void,
  collection: CollectionConfig,
  handleChange: (newState) => void,
}
