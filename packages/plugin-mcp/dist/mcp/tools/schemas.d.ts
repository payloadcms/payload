import { z } from 'zod';
export declare const toolSchemas: {
    findGlobal: {
        description: string;
        parameters: z.ZodObject<{
            depth: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
            fallbackLocale: z.ZodOptional<z.ZodString>;
            locale: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            depth: number;
            locale?: string | undefined;
            fallbackLocale?: string | undefined;
        }, {
            depth?: number | undefined;
            locale?: string | undefined;
            fallbackLocale?: string | undefined;
        }>;
    };
    findResources: {
        description: string;
        parameters: z.ZodObject<{
            id: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
            depth: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
            draft: z.ZodOptional<z.ZodBoolean>;
            fallbackLocale: z.ZodOptional<z.ZodString>;
            limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
            locale: z.ZodOptional<z.ZodString>;
            page: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
            sort: z.ZodOptional<z.ZodString>;
            where: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            depth: number;
            limit: number;
            page: number;
            locale?: string | undefined;
            sort?: string | undefined;
            draft?: boolean | undefined;
            where?: string | undefined;
            id?: string | number | undefined;
            fallbackLocale?: string | undefined;
        }, {
            depth?: number | undefined;
            locale?: string | undefined;
            sort?: string | undefined;
            draft?: boolean | undefined;
            where?: string | undefined;
            id?: string | number | undefined;
            fallbackLocale?: string | undefined;
            limit?: number | undefined;
            page?: number | undefined;
        }>;
    };
    createResource: {
        description: string;
        parameters: z.ZodObject<{
            data: z.ZodString;
            depth: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
            draft: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            fallbackLocale: z.ZodOptional<z.ZodString>;
            locale: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            depth: number;
            draft: boolean;
            data: string;
            locale?: string | undefined;
            fallbackLocale?: string | undefined;
        }, {
            data: string;
            depth?: number | undefined;
            locale?: string | undefined;
            draft?: boolean | undefined;
            fallbackLocale?: string | undefined;
        }>;
    };
    updateResource: {
        description: string;
        parameters: z.ZodObject<{
            id: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
            data: z.ZodString;
            depth: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
            draft: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            fallbackLocale: z.ZodOptional<z.ZodString>;
            filePath: z.ZodOptional<z.ZodString>;
            locale: z.ZodOptional<z.ZodString>;
            overrideLock: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            overwriteExistingFiles: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            where: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            depth: number;
            draft: boolean;
            data: string;
            overrideLock: boolean;
            overwriteExistingFiles: boolean;
            locale?: string | undefined;
            where?: string | undefined;
            id?: string | number | undefined;
            fallbackLocale?: string | undefined;
            filePath?: string | undefined;
        }, {
            data: string;
            depth?: number | undefined;
            locale?: string | undefined;
            draft?: boolean | undefined;
            where?: string | undefined;
            id?: string | number | undefined;
            fallbackLocale?: string | undefined;
            filePath?: string | undefined;
            overrideLock?: boolean | undefined;
            overwriteExistingFiles?: boolean | undefined;
        }>;
    };
    deleteResource: {
        description: string;
        parameters: z.ZodObject<{
            id: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
            depth: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
            fallbackLocale: z.ZodOptional<z.ZodString>;
            locale: z.ZodOptional<z.ZodString>;
            where: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            depth: number;
            locale?: string | undefined;
            where?: string | undefined;
            id?: string | number | undefined;
            fallbackLocale?: string | undefined;
        }, {
            depth?: number | undefined;
            locale?: string | undefined;
            where?: string | undefined;
            id?: string | number | undefined;
            fallbackLocale?: string | undefined;
        }>;
    };
    updateGlobal: {
        description: string;
        parameters: z.ZodObject<{
            data: z.ZodString;
            depth: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
            draft: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            fallbackLocale: z.ZodOptional<z.ZodString>;
            locale: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            depth: number;
            draft: boolean;
            data: string;
            locale?: string | undefined;
            fallbackLocale?: string | undefined;
        }, {
            data: string;
            depth?: number | undefined;
            locale?: string | undefined;
            draft?: boolean | undefined;
            fallbackLocale?: string | undefined;
        }>;
    };
    createCollection: {
        description: string;
        parameters: z.ZodObject<{
            collectionDescription: z.ZodOptional<z.ZodString>;
            collectionName: z.ZodString;
            fields: z.ZodArray<z.ZodAny, "many">;
            hasUpload: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            fields: any[];
            collectionName: string;
            collectionDescription?: string | undefined;
            hasUpload?: boolean | undefined;
        }, {
            fields: any[];
            collectionName: string;
            collectionDescription?: string | undefined;
            hasUpload?: boolean | undefined;
        }>;
    };
    findCollections: {
        description: string;
        parameters: z.ZodObject<{
            collectionName: z.ZodOptional<z.ZodString>;
            includeContent: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            includeCount: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            includeContent: boolean;
            includeCount: boolean;
            collectionName?: string | undefined;
        }, {
            collectionName?: string | undefined;
            includeContent?: boolean | undefined;
            includeCount?: boolean | undefined;
        }>;
    };
    updateCollection: {
        description: string;
        parameters: z.ZodObject<{
            collectionName: z.ZodString;
            configUpdates: z.ZodOptional<z.ZodAny>;
            fieldModifications: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
            fieldNamesToRemove: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            newContent: z.ZodOptional<z.ZodString>;
            newFields: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
            updateType: z.ZodEnum<["add_field", "remove_field", "modify_field", "update_config", "replace_content"]>;
        }, "strip", z.ZodTypeAny, {
            collectionName: string;
            updateType: "add_field" | "remove_field" | "modify_field" | "update_config" | "replace_content";
            configUpdates?: any;
            fieldModifications?: any[] | undefined;
            fieldNamesToRemove?: string[] | undefined;
            newContent?: string | undefined;
            newFields?: any[] | undefined;
        }, {
            collectionName: string;
            updateType: "add_field" | "remove_field" | "modify_field" | "update_config" | "replace_content";
            configUpdates?: any;
            fieldModifications?: any[] | undefined;
            fieldNamesToRemove?: string[] | undefined;
            newContent?: string | undefined;
            newFields?: any[] | undefined;
        }>;
    };
    deleteCollection: {
        description: string;
        parameters: z.ZodObject<{
            collectionName: z.ZodString;
            confirmDeletion: z.ZodBoolean;
            updateConfig: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            confirmDeletion: boolean;
            collectionName: string;
            updateConfig: boolean;
        }, {
            confirmDeletion: boolean;
            collectionName: string;
            updateConfig?: boolean | undefined;
        }>;
    };
    findConfig: {
        description: string;
        parameters: z.ZodObject<{
            includeMetadata: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            includeMetadata: boolean;
        }, {
            includeMetadata?: boolean | undefined;
        }>;
    };
    updateConfig: {
        description: string;
        parameters: z.ZodObject<{
            adminConfig: z.ZodOptional<z.ZodAny>;
            collectionName: z.ZodOptional<z.ZodString>;
            databaseConfig: z.ZodOptional<z.ZodAny>;
            generalConfig: z.ZodOptional<z.ZodAny>;
            newContent: z.ZodOptional<z.ZodString>;
            pluginUpdates: z.ZodOptional<z.ZodAny>;
            updateType: z.ZodEnum<["add_collection", "remove_collection", "update_admin", "update_database", "update_plugins", "replace_content"]>;
        }, "strip", z.ZodTypeAny, {
            updateType: "replace_content" | "add_collection" | "remove_collection" | "update_admin" | "update_database" | "update_plugins";
            collectionName?: string | undefined;
            newContent?: string | undefined;
            adminConfig?: any;
            databaseConfig?: any;
            generalConfig?: any;
            pluginUpdates?: any;
        }, {
            updateType: "replace_content" | "add_collection" | "remove_collection" | "update_admin" | "update_database" | "update_plugins";
            collectionName?: string | undefined;
            newContent?: string | undefined;
            adminConfig?: any;
            databaseConfig?: any;
            generalConfig?: any;
            pluginUpdates?: any;
        }>;
    };
    auth: {
        description: string;
        parameters: z.ZodObject<{
            headers: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            headers?: string | undefined;
        }, {
            headers?: string | undefined;
        }>;
    };
    login: {
        description: string;
        parameters: z.ZodObject<{
            collection: z.ZodString;
            depth: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
            email: z.ZodString;
            overrideAccess: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            password: z.ZodString;
            showHiddenFields: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            collection: string;
            depth: number;
            email: string;
            password: string;
            overrideAccess: boolean;
            showHiddenFields: boolean;
        }, {
            collection: string;
            email: string;
            password: string;
            depth?: number | undefined;
            overrideAccess?: boolean | undefined;
            showHiddenFields?: boolean | undefined;
        }>;
    };
    verify: {
        description: string;
        parameters: z.ZodObject<{
            collection: z.ZodString;
            token: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            collection: string;
            token: string;
        }, {
            collection: string;
            token: string;
        }>;
    };
    resetPassword: {
        description: string;
        parameters: z.ZodObject<{
            collection: z.ZodString;
            password: z.ZodString;
            token: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            collection: string;
            password: string;
            token: string;
        }, {
            collection: string;
            password: string;
            token: string;
        }>;
    };
    forgotPassword: {
        description: string;
        parameters: z.ZodObject<{
            collection: z.ZodString;
            disableEmail: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            email: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            collection: string;
            email: string;
            disableEmail: boolean;
        }, {
            collection: string;
            email: string;
            disableEmail?: boolean | undefined;
        }>;
    };
    unlock: {
        description: string;
        parameters: z.ZodObject<{
            collection: z.ZodString;
            email: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            collection: string;
            email: string;
        }, {
            collection: string;
            email: string;
        }>;
    };
    createJob: {
        description: string;
        parameters: z.ZodObject<{
            description: z.ZodString;
            inputSchema: z.ZodDefault<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
            jobData: z.ZodDefault<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
            jobName: z.ZodString;
            jobSlug: z.ZodString;
            jobType: z.ZodEnum<["task", "workflow"]>;
            outputSchema: z.ZodDefault<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
        }, "strip", z.ZodTypeAny, {
            description: string;
            inputSchema: Record<string, any>;
            jobData: Record<string, any>;
            jobName: string;
            jobSlug: string;
            jobType: "task" | "workflow";
            outputSchema: Record<string, any>;
        }, {
            description: string;
            jobName: string;
            jobSlug: string;
            jobType: "task" | "workflow";
            inputSchema?: Record<string, any> | undefined;
            jobData?: Record<string, any> | undefined;
            outputSchema?: Record<string, any> | undefined;
        }>;
    };
    updateJob: {
        description: string;
        parameters: z.ZodObject<{
            configUpdate: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            handlerCode: z.ZodOptional<z.ZodString>;
            inputSchema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            jobSlug: z.ZodString;
            outputSchema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            taskSequence: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
            updateType: z.ZodEnum<["modify_schema", "update_tasks", "change_config", "replace_handler"]>;
        }, "strip", z.ZodTypeAny, {
            updateType: "modify_schema" | "update_tasks" | "change_config" | "replace_handler";
            jobSlug: string;
            inputSchema?: Record<string, any> | undefined;
            outputSchema?: Record<string, any> | undefined;
            configUpdate?: Record<string, any> | undefined;
            handlerCode?: string | undefined;
            taskSequence?: any[] | undefined;
        }, {
            updateType: "modify_schema" | "update_tasks" | "change_config" | "replace_handler";
            jobSlug: string;
            inputSchema?: Record<string, any> | undefined;
            outputSchema?: Record<string, any> | undefined;
            configUpdate?: Record<string, any> | undefined;
            handlerCode?: string | undefined;
            taskSequence?: any[] | undefined;
        }>;
    };
    runJob: {
        description: string;
        parameters: z.ZodObject<{
            delay: z.ZodOptional<z.ZodNumber>;
            input: z.ZodRecord<z.ZodString, z.ZodAny>;
            jobSlug: z.ZodString;
            priority: z.ZodOptional<z.ZodNumber>;
            queue: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            jobSlug: string;
            input: Record<string, any>;
            delay?: number | undefined;
            priority?: number | undefined;
            queue?: string | undefined;
        }, {
            jobSlug: string;
            input: Record<string, any>;
            delay?: number | undefined;
            priority?: number | undefined;
            queue?: string | undefined;
        }>;
    };
};
//# sourceMappingURL=schemas.d.ts.map