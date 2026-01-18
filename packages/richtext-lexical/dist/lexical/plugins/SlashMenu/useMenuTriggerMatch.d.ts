import type { LexicalEditor } from 'lexical';
export type TriggerFn = ({ editor, query, }: {
    editor: LexicalEditor;
    /** The query string is the POTENTIAL trigger AND the text after the trigger text. */
    query: string;
}) => MenuTextMatch | null;
export type MenuTextMatch = {
    leadOffset: number;
    matchingString: string;
    replaceableString: string;
};
/**
 * Returns a function which checks if the trigger (e.g. '/') is present in the query and, if so, returns the matching string (text after the trigger)
 */
export declare function useMenuTriggerMatch(
/**
 * Text which triggers the menu. Everything after this text will be used as the query.
 */
trigger: string, { maxLength, minLength }: {
    maxLength?: number;
    minLength?: number;
}): TriggerFn;
//# sourceMappingURL=useMenuTriggerMatch.d.ts.map