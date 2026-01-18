import type { TypeWithID } from 'payload';
import type { Documents } from './index.js';
type RequestDocuments = {
    docs: {
        relationTo: string;
        value: number | string;
    }[];
    type: 'REQUEST';
};
type AddLoadedDocuments = {
    docs: TypeWithID[];
    idsToLoad: (number | string)[];
    relationTo: string;
    type: 'ADD_LOADED';
};
type Action = AddLoadedDocuments | RequestDocuments;
export declare function reducer(state: Documents, action: Action): Documents;
export {};
//# sourceMappingURL=reducer.d.ts.map