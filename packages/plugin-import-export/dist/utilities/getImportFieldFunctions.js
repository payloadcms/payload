import { traverseFields } from 'payload';
/**
 * Gets custom fromCSV field functions for import.
 * These functions transform field values when unflattening CSV data for import.
 */ export const getImportFieldFunctions = ({ fields })=>{
    const result = {};
    const buildCustomFunctions = ({ field, parentRef, ref })=>{
        // @ts-expect-error ref is untyped
        ref.prefix = parentRef.prefix || '';
        if (field.type === 'group' || field.type === 'tab') {
            // @ts-expect-error ref is untyped
            const parentPrefix = parentRef?.prefix ? `${parentRef.prefix}_` : '';
            // @ts-expect-error ref is untyped
            ref.prefix = `${parentPrefix}${field.name}_`;
        }
        if (typeof field.custom?.['plugin-import-export']?.fromCSV === 'function') {
            // @ts-expect-error ref is untyped
            result[`${ref.prefix}${field.name}`] = field.custom['plugin-import-export']?.fromCSV;
        } else if (field.type === 'relationship' || field.type === 'upload') {
            if (field.hasMany !== true) {
                if (!Array.isArray(field.relationTo)) {
                    // monomorphic single relationship - simple ID to value conversion
                    // @ts-expect-error ref is untyped
                    result[`${ref.prefix}${field.name}`] = ({ value })=>{
                        // If it's already an object (from JSON import), return as-is
                        if (typeof value === 'object' && value !== null) {
                            return value;
                        }
                        // Convert string/number ID to relationship value
                        return value;
                    };
                } else {
                // polymorphic single relationship - needs special handling
                // The CSV has field_id and field_relationTo columns
                // We need to combine them back into { relationTo, value } format
                // This is handled in unflattenObject, so we don't need a fromCSV here
                }
            } else {
                if (!Array.isArray(field.relationTo)) {
                    // @ts-expect-error ref is untyped
                    result[`${ref.prefix}${field.name}`] = ({ value })=>{
                        // If it's already an array (from JSON import), return as-is
                        if (Array.isArray(value)) {
                            return value;
                        }
                        // For CSV, this is handled by array unflattening in unflattenObject
                        return value;
                    };
                } else {
                // polymorphic many relationships
                // Similar to polymorphic single, handled in unflattenObject
                }
            }
        } else if (field.type === 'number') {
            // For hasMany number fields, preserve comma-separated strings for later processing
            if (field.hasMany) {
                // Don't convert - let unflattenObject handle comma-separated values
                // @ts-expect-error ref is untyped
                result[`${ref.prefix}${field.name}`] = ({ value })=>value;
            } else {
                // Ensure single numbers are parsed correctly from CSV strings
                // @ts-expect-error ref is untyped
                result[`${ref.prefix}${field.name}`] = ({ value })=>{
                    if (typeof value === 'number') {
                        return value;
                    }
                    if (typeof value === 'string') {
                        const parsed = parseFloat(value);
                        return isNaN(parsed) ? 0 : parsed;
                    }
                    return value;
                };
            }
        } else if (field.type === 'checkbox') {
            // Convert string boolean values to actual booleans
            // @ts-expect-error ref is untyped
            result[`${ref.prefix}${field.name}`] = ({ value })=>{
                if (typeof value === 'boolean') {
                    return value;
                }
                if (typeof value === 'string') {
                    return value.toLowerCase() === 'true' || value === '1';
                }
                return Boolean(value);
            };
        } else if (field.type === 'date') {
            // Ensure dates are in proper format
            // @ts-expect-error ref is untyped
            result[`${ref.prefix}${field.name}`] = ({ value })=>{
                if (!value) {
                    return value;
                }
                // If it's already a valid date string, return as-is
                if (typeof value === 'string' && !isNaN(Date.parse(value))) {
                    return value;
                }
                // Try to parse and format
                try {
                    const date = new Date(value);
                    return isNaN(date.getTime()) ? value : date.toISOString();
                } catch  {
                    return value;
                }
            };
        } else if (field.type === 'json' || field.type === 'richText') {
            // Parse JSON strings back to objects (both json and richText fields)
            // @ts-expect-error ref is untyped
            result[`${ref.prefix}${field.name}`] = ({ value })=>{
                if (typeof value === 'object') {
                    return value;
                }
                if (typeof value === 'string') {
                    try {
                        return JSON.parse(value);
                    } catch  {
                        return value;
                    }
                }
                return value;
            };
        }
    };
    traverseFields({
        callback: buildCustomFunctions,
        fields
    });
    return result;
};

//# sourceMappingURL=getImportFieldFunctions.js.map