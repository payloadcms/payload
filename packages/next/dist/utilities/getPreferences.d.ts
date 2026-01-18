import type { DefaultDocumentIDType, Payload } from 'payload';
export declare const getPreferences: <T>(key: string, payload: Payload, userID: DefaultDocumentIDType, userSlug: string) => Promise<{
    id: DefaultDocumentIDType;
    value: T;
}>;
//# sourceMappingURL=getPreferences.d.ts.map