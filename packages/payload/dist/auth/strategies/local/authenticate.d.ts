import type { TypeWithID } from '../../../collections/config/types.js';
type Doc = Record<string, unknown> & TypeWithID;
type Args = {
    doc: Doc;
    password: string;
};
export declare const authenticateLocalStrategy: ({ doc, password }: Args) => Promise<Doc | null>;
export {};
//# sourceMappingURL=authenticate.d.ts.map