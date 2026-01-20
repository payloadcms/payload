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
        collection: "users";
    });
    jobs: {
        tasks: unknown;
        workflows: unknown;
    };
}
/**
 * Supported timezones in IANA format.
 */
/**
 * This type was referenced by `Config`'s JSON-Schema
 * via the `definition` "supportedTimezones"
 */
export type SupportedTimezones = "Pacific/Midway" | "Pacific/Niue" | "Pacific/Honolulu" | "Pacific/Rarotonga" | "America/Anchorage" | "Pacific/Gambier" | "America/Los_Angeles" | "America/Tijuana" | "America/Denver" | "America/Phoenix" | "America/Chicago" | "America/Guatemala" | "America/New_York" | "America/Bogota" | "America/Caracas" | "America/Santiago" | "America/Buenos_Aires" | "America/Sao_Paulo" | "Atlantic/South_Georgia" | "Atlantic/Azores" | "Atlantic/Cape_Verde" | "Europe/London" | "Europe/Berlin" | "Africa/Lagos" | "Europe/Athens" | "Africa/Cairo" | "Europe/Moscow" | "Asia/Riyadh" | "Asia/Dubai" | "Asia/Baku" | "Asia/Karachi" | "Asia/Tashkent" | "Asia/Calcutta" | "Asia/Dhaka" | "Asia/Almaty" | "Asia/Jakarta" | "Asia/Bangkok" | "Asia/Shanghai" | "Asia/Singapore" | "Asia/Tokyo" | "Asia/Seoul" | "Australia/Brisbane" | "Australia/Sydney" | "Pacific/Guam" | "Pacific/Noumea" | "Pacific/Auckland" | "Pacific/Fiji";
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "menu"
 */
export interface Menu {
    id: string;
    globalText?: string | null;
    updatedAt?: string | null;
    createdAt?: string | null;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "menu_select"
 */
export interface MenuSelect<T extends boolean = true> {
    globalText?: T;
    updatedAt?: T;
    createdAt?: T;
    globalType?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "posts"
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
            format: "left" | "start" | "center" | "right" | "end" | "justify" | "";
            indent: number;
            version: number;
        };
        [key: string]: unknown;
    } | null;
    updatedAt: string;
    createdAt: string;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "posts_select"
 */
export interface PostsSelect<T extends boolean = true> {
    title?: T;
    content?: T;
    updatedAt?: T;
    createdAt?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "media"
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
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "media_select"
 */
export interface MediaSelect<T extends boolean = true> {
    updatedAt?: T;
    createdAt?: T;
    url?: T;
    thumbnailURL?: T;
    filename?: T;
    mimeType?: T;
    filesize?: T;
    width?: T;
    height?: T;
    focalX?: T;
    focalY?: T;
    sizes?: T | {
        thumbnail?: T | {
            url?: T;
            width?: T;
            height?: T;
            mimeType?: T;
            filesize?: T;
            filename?: T;
        };
        medium?: T | {
            url?: T;
            width?: T;
            height?: T;
            mimeType?: T;
            filesize?: T;
            filename?: T;
        };
        large?: T | {
            url?: T;
            width?: T;
            height?: T;
            mimeType?: T;
            filesize?: T;
            filename?: T;
        };
    };
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "payload-kv"
 */
export interface PayloadKv {
    id: string;
    key: string;
    data: {
        [key: string]: unknown;
    } | unknown[] | string | number | boolean | null;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "payload-kv_select"
 */
export interface PayloadKvSelect<T extends boolean = true> {
    key?: T;
    data?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "users"
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
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "users_select"
 */
export interface UsersSelect<T extends boolean = true> {
    updatedAt?: T;
    createdAt?: T;
    email?: T;
    resetPasswordToken?: T;
    resetPasswordExpiration?: T;
    salt?: T;
    hash?: T;
    loginAttempts?: T;
    lockUntil?: T;
    sessions?: T | {
        id?: T;
        createdAt?: T;
        expiresAt?: T;
    };
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "payload-locked-documents"
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
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "payload-locked-documents_select"
 */
export interface PayloadLockedDocumentsSelect<T extends boolean = true> {
    document?: T;
    globalSlug?: T;
    user?: T;
    updatedAt?: T;
    createdAt?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "payload-preferences"
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
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "payload-preferences_select"
 */
export interface PayloadPreferencesSelect<T extends boolean = true> {
    user?: T;
    key?: T;
    value?: T;
    updatedAt?: T;
    createdAt?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "payload-migrations"
 */
export interface PayloadMigrations {
    id: string;
    name?: string | null;
    batch?: number | null;
    updatedAt: string;
    createdAt: string;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "payload-migrations_select"
 */
export interface PayloadMigrationsSelect<T extends boolean = true> {
    name?: T;
    batch?: T;
    updatedAt?: T;
    createdAt?: T;
}
/**
 * This type was referenced by `Config`'s JSON-Schema
 * via the `definition` "auth"
 */
export type Auth = unknown;

declare module 'payload' {
  // @ts-ignore 
  export interface GeneratedTypes extends Config {}
}