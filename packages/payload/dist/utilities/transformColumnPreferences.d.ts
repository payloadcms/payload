import type { Column } from '../admin/types.js';
import type { ColumnPreference } from '../preferences/types.js';
export type ColumnsFromURL = string[];
/**
 * Transforms various forms of columns into `ColumnPreference[]` which is what is stored in the user's preferences table
 * In React state, for example, columns are stored in in their entirety, including React components: `[{ accessor: 'title', active: true, Label: React.ReactNode, ... }]`
 * In the URL, they are stored as an array of strings: `['title', '-slug']`, where the `-` prefix is used to indicate that the column is inactive
 * However in the database, columns must be in this exact shape: `[{ accessor: 'title', active: true }, { accessor: 'slug', active: false }]`
 * This means that when handling columns, they need to be consistently transformed back and forth
 */
export declare const transformColumnsToPreferences: (columns: Column[] | ColumnPreference[] | ColumnsFromURL | string | undefined) => ColumnPreference[] | undefined;
/**
 * Does the opposite of `transformColumnsToPreferences`, where `ColumnPreference[]` and `Column[]` are transformed into `ColumnsFromURL`
 * This is useful for storing the columns in the URL, where it appears as a simple comma delimited array of strings
 * The `-` prefix is used to indicate that the column is inactive
 */
export declare const transformColumnsToSearchParams: (columns: Column[] | ColumnPreference[]) => ColumnsFromURL;
//# sourceMappingURL=transformColumnPreferences.d.ts.map