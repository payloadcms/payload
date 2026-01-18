import type { CollectionSlug } from 'payload';
type LoginWithEmail = {
    collection: CollectionSlug;
    config: any;
    email: string;
    password: string;
    username?: never;
};
type LoginWithUsername = {
    collection: CollectionSlug;
    config: any;
    email?: never;
    password: string;
    username: string;
};
type LoginArgs = LoginWithEmail | LoginWithUsername;
export declare function login({ collection, config, email, password, username }: LoginArgs): Promise<{
    token?: string;
    user: any;
}>;
export {};
//# sourceMappingURL=login.d.ts.map