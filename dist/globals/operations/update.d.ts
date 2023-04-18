import { Config as GeneratedTypes } from 'payload/generated-types';
import { DeepPartial } from 'ts-essentials';
import { SanitizedGlobalConfig } from '../config/types';
import { PayloadRequest } from '../../express/types';
type Args<T extends {
    [field: string | number | symbol]: unknown;
}> = {
    globalConfig: SanitizedGlobalConfig;
    slug: string | number | symbol;
    req: PayloadRequest;
    depth?: number;
    overrideAccess?: boolean;
    showHiddenFields?: boolean;
    draft?: boolean;
    autosave?: boolean;
    data: DeepPartial<Omit<T, 'id'>>;
};
declare function update<TSlug extends keyof GeneratedTypes['globals']>(args: Args<GeneratedTypes['globals'][TSlug]>): Promise<GeneratedTypes['globals'][TSlug]>;
export default update;
