import { Documents } from './index';
import { TypeWithID } from '../../../../../../collections/config/types';
type RequestDocuments = {
    type: 'REQUEST';
    docs: {
        relationTo: string;
        value: number | string;
    }[];
};
type AddLoadedDocuments = {
    type: 'ADD_LOADED';
    relationTo: string;
    docs: TypeWithID[];
    idsToLoad: (string | number)[];
};
type Action = RequestDocuments | AddLoadedDocuments;
export declare function reducer(state: Documents, action: Action): Documents;
export {};
