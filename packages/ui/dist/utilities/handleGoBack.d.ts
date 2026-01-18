import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime.js';
type GoBackProps = {
    adminRoute: string;
    collectionSlug: string;
    router: AppRouterInstance;
    serverURL?: string;
};
export declare const handleGoBack: ({ adminRoute, collectionSlug, router, serverURL }: GoBackProps) => void;
export {};
//# sourceMappingURL=handleGoBack.d.ts.map