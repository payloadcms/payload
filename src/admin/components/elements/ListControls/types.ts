import { Collection } from '../../../../collections/config/types';

export type Props = {
  enableColumns?: boolean,
  enableSort?: boolean,
  setSort: () => void,
  collection: Collection,
  handleChange: (newState) => void,
}
