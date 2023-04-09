import { SanitizedCollectionConfig } from '../../../../collections/config/types';
export type Props = {
    collection: SanitizedCollectionConfig;
    sort?: string;
    handleChange?: (sort: string) => void;
    modifySearchQuery?: boolean;
};
