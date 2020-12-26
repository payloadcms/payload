import { CollectionConfig } from '../../../../collections/config/types';

export type Props = {
    docs?: unknown[],
    collection: CollectionConfig,
    onCardClick: (doc) => void,
}
