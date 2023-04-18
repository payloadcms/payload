import { Field, FieldAffectingData, FieldPresentationalOnly } from '../fields/config/types';
declare const flattenFields: (fields: Field[], keepPresentationalFields?: boolean) => (FieldAffectingData | FieldPresentationalOnly)[];
export default flattenFields;
