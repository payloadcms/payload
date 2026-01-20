/**
 * Config interface
 */
export interface Config {
    auth: {
        users: Users;
    };
    blocks: {};
    collections: {
        posts: Posts;
        media: Media;
        "payload-kv": PayloadKv;
        users: Users;
        "payload-locked-documents": PayloadLockedDocuments;
        "payload-preferences": PayloadPreferences;
        "payload-migrations": PayloadMigrations;
    };
    collectionsJoins: {};
    collectionsSelect: {
        posts: PostsSelect;
        media: MediaSelect;
        "payload-kv": PayloadKvSelect;
        users: UsersSelect;
        "payload-locked-documents": PayloadLockedDocumentsSelect;
        "payload-preferences": PayloadPreferencesSelect;
        "payload-migrations": PayloadMigrationsSelect;
    };
    db: {
        defaultIDType: string;
    };
    fallbackLocale: null;
    globals: {
        menu: Menu;
    };
    globalsSelect: {
        menu: MenuSelect;
    };
    locale: null;
    user: (Users & {
        collection: string;
    });
    jobs: {
        tasks: unknown;
        workflows: unknown;
    };
}
/**
 * Supported timezones in IANA format.
 */
export interface SupportedTimezones {
    [key: string]: unknown;
}
/**
 * menu interface
 */
export interface Menu {
    id: string;
    globalText?: string | null;
    updatedAt?: string | null;
    createdAt?: string | null;
}
/**
 * menu_select interface
 */
export interface MenuSelect {
    globalText?: boolean;
    updatedAt?: boolean;
    createdAt?: boolean;
    globalType?: boolean;
}
/**
 * posts interface
 */
export interface Posts {
    id: string;
    title?: string | null;
    content?: {
        root: {
            type: string;
            children: {
                type: string;
                version: number;
                [key: string]: unknown;
            }[];
            direction: ("ltr" | "rtl") | null;
            format: string;
            indent: number;
            version: number;
        };
        [key: string]: unknown;
    } | null;
    updatedAt: string;
    createdAt: string;
}
/**
 * posts_select interface
 */
export interface PostsSelect {
    title?: boolean;
    content?: boolean;
    updatedAt?: boolean;
    createdAt?: boolean;
}
/**
 * media interface
 */
export interface Media {
    id: string;
    updatedAt: string;
    createdAt: string;
    url?: string | null;
    thumbnailURL?: string | null;
    filename?: string | null;
    mimeType?: string | null;
    filesize?: number | null;
    width?: number | null;
    height?: number | null;
    focalX?: number | null;
    focalY?: number | null;
    sizes?: {
        thumbnail?: {
            url?: string | null;
            width?: number | null;
            height?: number | null;
            mimeType?: string | null;
            filesize?: number | null;
            filename?: string | null;
        };
        medium?: {
            url?: string | null;
            width?: number | null;
            height?: number | null;
            mimeType?: string | null;
            filesize?: number | null;
            filename?: string | null;
        };
        large?: {
            url?: string | null;
            width?: number | null;
            height?: number | null;
            mimeType?: string | null;
            filesize?: number | null;
            filename?: string | null;
        };
    };
}
/**
 * media_select interface
 */
export interface MediaSelect {
    updatedAt?: boolean;
    createdAt?: boolean;
    url?: boolean;
    thumbnailURL?: boolean;
    filename?: boolean;
    mimeType?: boolean;
    filesize?: boolean;
    width?: boolean;
    height?: boolean;
    focalX?: boolean;
    focalY?: boolean;
    sizes?: boolean | {
        thumbnail?: boolean | {
            url?: boolean;
            width?: boolean;
            height?: boolean;
            mimeType?: boolean;
            filesize?: boolean;
            filename?: boolean;
        };
        medium?: boolean | {
            url?: boolean;
            width?: boolean;
            height?: boolean;
            mimeType?: boolean;
            filesize?: boolean;
            filename?: boolean;
        };
        large?: boolean | {
            url?: boolean;
            width?: boolean;
            height?: boolean;
            mimeType?: boolean;
            filesize?: boolean;
            filename?: boolean;
        };
    };
}
/**
 * payload-kv interface
 */
export interface PayloadKv {
    id: string;
    key: string;
    data: {
        [key: string]: unknown;
    } | unknown[] | string | number | boolean | null;
}
/**
 * payload-kv_select interface
 */
export interface PayloadKvSelect {
    key?: boolean;
    data?: boolean;
}
/**
 * users interface
 */
export interface Users {
    id: string;
    updatedAt: string;
    createdAt: string;
    email: string;
    resetPasswordToken?: string | null;
    resetPasswordExpiration?: string | null;
    salt?: string | null;
    hash?: string | null;
    loginAttempts?: number | null;
    lockUntil?: string | null;
    sessions?: {
        id: string;
        createdAt?: string | null;
        expiresAt: string;
    }[] | null;
    password?: string | null;
}
/**
 * users_select interface
 */
export interface UsersSelect {
    updatedAt?: boolean;
    createdAt?: boolean;
    email?: boolean;
    resetPasswordToken?: boolean;
    resetPasswordExpiration?: boolean;
    salt?: boolean;
    hash?: boolean;
    loginAttempts?: boolean;
    lockUntil?: boolean;
    sessions?: boolean | {
        id?: boolean;
        createdAt?: boolean;
        expiresAt?: boolean;
    };
}
/**
 * payload-locked-documents interface
 */
export interface PayloadLockedDocuments {
    id: string;
    document?: ({
        relationTo: "posts";
        value: string | Posts;
    } | null) | ({
        relationTo: "media";
        value: string | Media;
    } | null) | ({
        relationTo: "users";
        value: string | Users;
    } | null);
    globalSlug?: string | null;
    user: {
        relationTo: "users";
        value: string | Users;
    };
    updatedAt: string;
    createdAt: string;
}
/**
 * payload-locked-documents_select interface
 */
export interface PayloadLockedDocumentsSelect {
    document?: boolean;
    globalSlug?: boolean;
    user?: boolean;
    updatedAt?: boolean;
    createdAt?: boolean;
}
/**
 * payload-preferences interface
 */
export interface PayloadPreferences {
    id: string;
    user: {
        relationTo: "users";
        value: string | Users;
    };
    key?: string | null;
    value?: {
        [key: string]: unknown;
    } | unknown[] | string | number | boolean | null;
    updatedAt: string;
    createdAt: string;
}
/**
 * payload-preferences_select interface
 */
export interface PayloadPreferencesSelect {
    user?: boolean;
    key?: boolean;
    value?: boolean;
    updatedAt?: boolean;
    createdAt?: boolean;
}
/**
 * payload-migrations interface
 */
export interface PayloadMigrations {
    id: string;
    name?: string | null;
    batch?: number | null;
    updatedAt: string;
    createdAt: string;
}
/**
 * payload-migrations_select interface
 */
export interface PayloadMigrationsSelect {
    name?: boolean;
    batch?: boolean;
    updatedAt?: boolean;
    createdAt?: boolean;
}
/**
 * auth interface
 */
export interface Auth {
    [key: string]: unknown;
}

declare module 'payload' {
  // @ts-ignore 
  export interface GeneratedTypes extends Config {}
}