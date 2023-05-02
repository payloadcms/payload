import DataLoader from 'dataloader';
import { PayloadRequest } from '../express/types';
import { TypeWithID } from './config/types';
export declare const getDataLoader: (req: PayloadRequest) => DataLoader<string, TypeWithID, string>;
