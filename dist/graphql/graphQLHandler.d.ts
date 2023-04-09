/// <reference types="node" />
import { Response } from 'express';
import { PayloadRequest } from '../express/types';
declare const graphQLHandler: (req: PayloadRequest, res: Response) => (request: import("http").IncomingMessage & {
    url: string;
}, response: import("http").ServerResponse<import("http").IncomingMessage> & {
    json?: (data: unknown) => void;
}) => Promise<void>;
export default graphQLHandler;
