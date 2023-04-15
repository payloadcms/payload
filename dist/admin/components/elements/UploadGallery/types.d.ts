import { SanitizedCollectionConfig } from '../../../../collections/config/types';
export type Props = {
    docs?: Record<string, unknown>[];
    collection: SanitizedCollectionConfig;
    onCardClick: (doc: any) => void;
};
