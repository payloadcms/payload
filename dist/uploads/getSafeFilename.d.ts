import { CollectionModel } from '../collections/config/types';
declare function getSafeFileName(Model: CollectionModel, staticPath: string, desiredFilename: string): Promise<string>;
export default getSafeFileName;
