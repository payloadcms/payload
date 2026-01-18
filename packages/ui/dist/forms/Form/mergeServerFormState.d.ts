import type { FormState } from 'payload';
/**
 * If true, will accept all values from the server, overriding any current values in local state.
 * Can also provide an options object for more granular control.
 */
export type AcceptValues = {
    /**
     * When `false`, will accept the values from the server _UNLESS_ the value has been modified locally since the request was made.
     * This is useful for autosave, for example, where hooks may have modified the field's value on the server while you were still making changes.
     * @default undefined
     */
    overrideLocalChanges?: boolean;
} | boolean;
type Args = {
    acceptValues?: AcceptValues;
    currentState?: FormState;
    incomingState: FormState;
};
/**
 * This function receives form state from the server and intelligently merges it into the client state.
 * The server contains extra properties that the client may not have, e.g. custom components and error states.
 * We typically do not want to merge properties that rely on user input, however, such as values, unless explicitly requested.
 * Doing this would cause the client to lose any local changes to those fields.
 *
 * Note: Local state is the source of truth, not the new server state that is getting merged in. This is critical for array row
 * manipulation specifically, where the user may have added, removed, or reordered rows while a request was pending and is now stale.
 *
 * This function applies some defaults, as well as cleans up the server response in preparation for the client.
 * e.g. it will set `valid` and `passesCondition` to true if undefined, and remove `addedByServer` from the response.
 */
export declare const mergeServerFormState: ({ acceptValues, currentState, incomingState, }: Args) => FormState;
export {};
//# sourceMappingURL=mergeServerFormState.d.ts.map