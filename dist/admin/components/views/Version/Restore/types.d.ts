import { SanitizedCollectionConfig } from '../../../../../collections/config/types';
import { SanitizedGlobalConfig } from '../../../../../globals/config/types';
export type Props = {
    collection?: SanitizedCollectionConfig;
    global?: SanitizedGlobalConfig;
    className?: string;
    versionID: string;
    originalDocID: string;
    versionDate: string;
};
