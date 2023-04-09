import { CollectionModel } from '../collections/config/types';
declare const docWithFilenameExists: (Model: CollectionModel, path: string, filename: string) => Promise<boolean>;
export default docWithFilenameExists;
