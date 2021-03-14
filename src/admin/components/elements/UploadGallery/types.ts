import { CollectionConfig } from '../../../../collections/config/types';

export type Props = {
    docs?: Record<string, unknown>[],
    collection: CollectionConfig,
    onCardClick: (doc) => void,
}
