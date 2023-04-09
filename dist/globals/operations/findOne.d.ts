import { SanitizedGlobalConfig } from '../config/types';
import { PayloadRequest } from '../../express/types';
type Args = {
    globalConfig: SanitizedGlobalConfig;
    locale?: string;
    req: PayloadRequest;
    slug: string;
    depth?: number;
    showHiddenFields?: boolean;
    draft?: boolean;
    overrideAccess?: boolean;
};
declare function findOne<T extends Record<string, unknown>>(args: Args): Promise<T>;
export default findOne;
