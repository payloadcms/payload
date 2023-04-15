import { SanitizedCollectionConfig } from '../collections/config/types';
import { SanitizedGlobalConfig } from '../globals/config/types';
import { PaginatedDocs } from '../mongoose/types';
type ShouldIncrementVersionCount = (args: {
    entity: SanitizedGlobalConfig | SanitizedCollectionConfig;
    versions: PaginatedDocs<{
        version?: {
            _status: string;
        };
    }>;
    docStatus: string;
}) => boolean;
export declare const shouldIncrementVersionCount: ShouldIncrementVersionCount;
export {};
