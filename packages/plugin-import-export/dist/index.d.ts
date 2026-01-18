import type { Config } from 'payload';
import type { FromCSVFunction, ImportExportPluginConfig, ToCSVFunction } from './types.js';
export declare const importExportPlugin: (pluginConfig: ImportExportPluginConfig) => (config: Config) => Promise<Config>;
declare module 'payload' {
    interface FieldCustom {
        'plugin-import-export'?: {
            /**
             * When `true` the field is **completely excluded** from the import-export plugin:
             * - It will not appear in the "Fields to export" selector.
             * - It is hidden from the preview list when no specific fields are chosen.
             * - Its data is omitted from the final CSV / JSON export.
             * @default false
             */
            disabled?: boolean;
            fromCSV?: FromCSVFunction;
            /**
             * Custom function used to modify the outgoing csv data by manipulating the data, siblingData or by returning the desired value
             */
            toCSV?: ToCSVFunction;
        };
    }
    interface CollectionAdminCustom {
        'plugin-import-export'?: {
            /**
             * Array of field paths that are disabled for import/export.
             * These paths are collected from fields marked with `custom['plugin-import-export'].disabled = true`.
             */
            disabledFields?: string[];
        };
    }
}
//# sourceMappingURL=index.d.ts.map