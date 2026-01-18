import type { Config, Field, SanitizedConfig } from 'payload';
import type { MultiTenantPluginConfig } from '../types.js';
type AddFilterOptionsToFieldsArgs<ConfigType = unknown> = {
    blockReferencesWithFilters: string[];
    config: Config | SanitizedConfig;
    fields: Field[];
    tenantEnabledCollectionSlugs: string[];
    tenantEnabledGlobalSlugs: string[];
    tenantFieldName: string;
    tenantsArrayFieldName: string;
    tenantsArrayTenantFieldName: string;
    tenantsCollectionSlug: string;
    userHasAccessToAllTenants: Required<MultiTenantPluginConfig<ConfigType>>['userHasAccessToAllTenants'];
};
export declare function addFilterOptionsToFields<ConfigType = unknown>({ blockReferencesWithFilters, config, fields, tenantEnabledCollectionSlugs, tenantEnabledGlobalSlugs, tenantFieldName, tenantsArrayFieldName, tenantsArrayTenantFieldName, tenantsCollectionSlug, userHasAccessToAllTenants, }: AddFilterOptionsToFieldsArgs<ConfigType>): Field[];
export {};
//# sourceMappingURL=addFilterOptionsToFields.d.ts.map