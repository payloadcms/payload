import type { TypedUser } from 'payload';
type Args = {
    config: any;
    route: string;
    searchParams: {
        [key: string]: string | string[];
    };
    user?: TypedUser;
};
export declare const handleAuthRedirect: ({ config, route, searchParams, user }: Args) => string;
export {};
//# sourceMappingURL=handleAuthRedirect.d.ts.map