import type { I18nClient } from '@payloadcms/translations';
import type { Block, ClientBlock, ClientField, Field, FieldBase } from '../../fields/config/types.js';
import type { Payload } from '../../types/index.js';
import { type ImportMap } from '../../index.js';
export { ClientField };
export type ServerOnlyFieldProperties = 'dbName' | 'editor' | 'enumName' | 'filterOptions' | 'graphQL' | 'label' | 'typescriptSchema' | 'validate' | keyof Pick<FieldBase, 'access' | 'custom' | 'defaultValue' | 'hooks'>;
export type ServerOnlyFieldAdminProperties = keyof Pick<FieldBase['admin'], 'components' | 'condition'>;
export declare const createClientBlocks: ({ blocks, defaultIDType, i18n, importMap, }: {
    blocks: (Block | string)[];
    defaultIDType: Payload["config"]["db"]["defaultIDType"];
    i18n: I18nClient;
    importMap: ImportMap;
}) => (ClientBlock | string)[] | ClientBlock[];
export declare const createClientField: ({ defaultIDType, field: incomingField, i18n, importMap, }: {
    defaultIDType: Payload["config"]["db"]["defaultIDType"];
    field: Field;
    i18n: I18nClient;
    importMap: ImportMap;
}) => ClientField;
export declare const createClientFields: ({ defaultIDType, disableAddingID, fields, i18n, importMap, }: {
    defaultIDType: Payload["config"]["db"]["defaultIDType"];
    disableAddingID?: boolean;
    fields: Field[];
    i18n: I18nClient;
    importMap: ImportMap;
}) => ClientField[];
//# sourceMappingURL=client.d.ts.map