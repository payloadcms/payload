import type { DataFromGlobalSlug, GlobalSlug, PayloadRequest, SanitizedGlobalConfig } from 'payload';
import type { DeepPartial } from 'ts-essentials';
type Resolver<TSlug extends GlobalSlug> = (_: unknown, args: {
    data?: DeepPartial<Omit<DataFromGlobalSlug<TSlug>, 'id'>>;
    draft?: boolean;
    fallbackLocale?: string;
    locale?: string;
}, context: {
    req: PayloadRequest;
}) => Promise<DataFromGlobalSlug<TSlug>>;
export declare function update<TSlug extends GlobalSlug>(globalConfig: SanitizedGlobalConfig): Resolver<TSlug>;
export {};
//# sourceMappingURL=update.d.ts.map