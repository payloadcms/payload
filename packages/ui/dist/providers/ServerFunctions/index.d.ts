import type { AdminViewServerPropsOnly, BuildFormStateArgs, BuildTableStateArgs, Data, DocumentPreferences, DocumentSlots, FormState, GetFolderResultsComponentAndDataArgs, Locale, Params, RenderDocumentVersionsProperties, ServerFunction, ServerFunctionClient, SlugifyServerFunctionArgs } from 'payload';
import type { Slugify } from 'payload/shared';
import React from 'react';
import type { RenderFieldServerFnArgs, RenderFieldServerFnReturnType } from '../../forms/fieldSchemasToFormState/serverFunctions/renderFieldServerFn.js';
import type { buildFormStateHandler } from '../../utilities/buildFormState.js';
import type { buildTableStateHandler } from '../../utilities/buildTableState.js';
import type { CopyDataFromLocaleArgs } from '../../utilities/copyDataFromLocale.js';
import type { getFolderResultsComponentAndDataHandler } from '../../utilities/getFolderResultsComponentAndData.js';
import type { schedulePublishHandler, SchedulePublishHandlerArgs } from '../../utilities/schedulePublishHandler.js';
type GetFormStateClient = (args: {
    signal?: AbortSignal;
} & Omit<BuildFormStateArgs, 'clientConfig' | 'req'>) => ReturnType<typeof buildFormStateHandler>;
type SchedulePublishClient = (args: {
    signal?: AbortSignal;
} & Omit<SchedulePublishHandlerArgs, 'clientConfig' | 'req'>) => ReturnType<typeof schedulePublishHandler>;
type GetTableStateClient = (args: {
    signal?: AbortSignal;
} & Omit<BuildTableStateArgs, 'clientConfig' | 'req'>) => ReturnType<typeof buildTableStateHandler>;
type SlugifyClient = (args: {
    signal?: AbortSignal;
} & Omit<SlugifyServerFunctionArgs, 'clientConfig' | 'req'>) => ReturnType<Slugify>;
export type RenderDocumentResult = {
    data: any;
    Document: React.ReactNode;
    preferences: DocumentPreferences;
};
type RenderDocumentBaseArgs = {
    collectionSlug: string;
    disableActions?: boolean;
    docID: number | string;
    drawerSlug?: string;
    initialData?: Data;
    initialState?: FormState;
    locale?: Locale;
    overrideEntityVisibility?: boolean;
    paramsOverride?: AdminViewServerPropsOnly['params'];
    redirectAfterCreate?: boolean;
    redirectAfterDelete: boolean;
    redirectAfterDuplicate: boolean;
    redirectAfterRestore?: boolean;
    searchParams?: Params;
    /**
     * Properties specific to the versions view
     */
    versions?: RenderDocumentVersionsProperties;
};
export type RenderDocumentServerFunction = ServerFunction<RenderDocumentBaseArgs, Promise<RenderDocumentResult>>;
type RenderDocumentServerFunctionHookFn = (args: {
    signal?: AbortSignal;
} & RenderDocumentBaseArgs) => Promise<RenderDocumentResult>;
type CopyDataFromLocaleClient = (args: {
    signal?: AbortSignal;
} & Omit<CopyDataFromLocaleArgs, 'req'>) => Promise<{
    data: Data;
}>;
type GetDocumentSlots = (args: {
    collectionSlug: string;
    id?: number | string;
    signal?: AbortSignal;
}) => Promise<DocumentSlots>;
type GetFolderResultsComponentAndDataClient = (args: {
    signal?: AbortSignal;
} & Omit<GetFolderResultsComponentAndDataArgs, 'req'>) => ReturnType<typeof getFolderResultsComponentAndDataHandler>;
type RenderFieldClient = (args: RenderFieldServerFnArgs) => Promise<RenderFieldServerFnReturnType>;
export type ServerFunctionsContextType = {
    _internal_renderField: RenderFieldClient;
    copyDataFromLocale: CopyDataFromLocaleClient;
    getDocumentSlots: GetDocumentSlots;
    getFolderResultsComponentAndData: GetFolderResultsComponentAndDataClient;
    getFormState: GetFormStateClient;
    getTableState: GetTableStateClient;
    renderDocument: RenderDocumentServerFunctionHookFn;
    schedulePublish: SchedulePublishClient;
    serverFunction: ServerFunctionClient;
    slugify: SlugifyClient;
};
export declare const ServerFunctionsContext: React.Context<ServerFunctionsContextType>;
export declare const useServerFunctions: () => ServerFunctionsContextType;
export declare const ServerFunctionsProvider: React.FC<{
    children: React.ReactNode;
    serverFunction: ServerFunctionClient;
}>;
export {};
//# sourceMappingURL=index.d.ts.map