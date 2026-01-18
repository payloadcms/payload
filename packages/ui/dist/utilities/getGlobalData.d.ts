import type { ClientUser, PayloadRequest } from 'payload';
export declare function getGlobalData(req: PayloadRequest): Promise<{
    data: {
        _isLocked: boolean;
        _lastEditedAt: string;
        _userEditing: ClientUser | number | string;
    };
    lockDuration?: number;
    slug: string;
}[]>;
//# sourceMappingURL=getGlobalData.d.ts.map