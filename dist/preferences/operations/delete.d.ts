import { Document } from '../../types';
import { PreferenceRequest } from '../types';
declare function deleteOperation(args: PreferenceRequest): Promise<Document>;
export default deleteOperation;
