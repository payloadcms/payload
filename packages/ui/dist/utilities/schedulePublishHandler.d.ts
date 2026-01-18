import { type PayloadRequest, type SchedulePublishTaskInput } from 'payload';
export type SchedulePublishHandlerArgs = {
    date?: Date;
    /**
     * The job id to delete to remove a scheduled publish event
     */
    deleteID?: number | string;
    req: PayloadRequest;
    timezone?: string;
} & SchedulePublishTaskInput;
export declare const schedulePublishHandler: ({ type, date, deleteID, doc, global, locale, req, timezone, }: SchedulePublishHandlerArgs) => Promise<{
    error: any;
    message?: undefined;
} | {
    message: string;
    error?: undefined;
}>;
//# sourceMappingURL=schedulePublishHandler.d.ts.map