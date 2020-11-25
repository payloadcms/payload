import { Collection } from '../../../../collections/config/types';

export type Props = {
  collection: Collection,
  id: string,
  filename: string,
  mimeType: string,
  sizes?: unknown,
  onClick?: () => void,
}
