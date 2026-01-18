type CreateUploadTimer = (timeout?: number, callback?: () => void) => {
    clear: () => void;
    set: () => boolean;
};
export declare const createUploadTimer: CreateUploadTimer;
export {};
//# sourceMappingURL=uploadTimer.d.ts.map