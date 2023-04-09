import { Request } from 'express';
export default function parseCookies(req: Request): {
    [key: string]: string;
};
