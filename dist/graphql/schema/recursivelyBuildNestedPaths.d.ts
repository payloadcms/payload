import { FieldAffectingData, FieldWithSubFields } from '../../fields/config/types';
declare const recursivelyBuildNestedPaths: (parentName: string, field: FieldWithSubFields & FieldAffectingData) => any[];
export default recursivelyBuildNestedPaths;
