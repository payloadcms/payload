import { WhereField, Where } from '../types';
declare const flattenWhereConstraints: (query: Where) => WhereField[];
export default flattenWhereConstraints;
