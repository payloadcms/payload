import { Response } from 'express';
import { PayloadRequest } from '../express/types';
declare const graphQLHandler: (req: PayloadRequest, res: Response) => import("express").Handler;
export default graphQLHandler;
