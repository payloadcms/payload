import type { I18nClient } from '@payloadcms/translations';
import type { ClientField } from 'payload';
/**
 * Returns the appropriate display value for a field.
 * - For select and radio fields:
 *   - Returns JSX elements as-is.
 *   - Translates localized label objects based on the current language.
 *   - Returns string labels directly.
 *   - Falls back to the option value if no valid label is found.
 * - For all other field types, returns `cellData` unchanged.
 */
export declare const getDisplayedFieldValue: (cellData: any, field: ClientField, i18n: I18nClient) => any;
//# sourceMappingURL=getDisplayedFieldValue.d.ts.map