import { fieldAffectsData } from '../fields/config/types.js';
import { APIError } from './APIError.js';
export class MissingEditorProp extends APIError {
    constructor(field){
        super(`RichText field${fieldAffectsData(field) ? ` "${field.name}"` : ''} is missing the editor prop. For sub-richText fields, the editor props is required, as it would otherwise create infinite recursion.`);
    }
}

//# sourceMappingURL=MissingEditorProp.js.map