import type { FormState, UploadEdits } from 'payload';
import type { InitialForms } from './index.js';
export type State = {
    activeIndex: number;
    forms: {
        errorCount: number;
        formID: string;
        formState: FormState;
        uploadEdits?: UploadEdits;
    }[];
    totalErrorCount: number;
};
type Action = {
    count: number;
    index: number;
    type: 'UPDATE_ERROR_COUNT';
} | {
    errorCount: number;
    formState: FormState;
    index: number;
    type: 'UPDATE_FORM';
    updatedFields?: Record<string, unknown>;
    uploadEdits?: UploadEdits;
} | {
    forms: InitialForms;
    type: 'ADD_FORMS';
} | {
    index: number;
    type: 'REMOVE_FORM';
} | {
    index: number;
    type: 'SET_ACTIVE_INDEX';
} | {
    state: Partial<State>;
    type: 'REPLACE';
};
export declare function formsManagementReducer(state: State, action: Action): State;
export {};
//# sourceMappingURL=reducer.d.ts.map