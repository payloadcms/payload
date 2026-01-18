export class TaskError extends Error {
    args;
    constructor(args){
        super(args.message);
        this.args = args;
    }
}
export class WorkflowError extends Error {
    args;
    constructor(args){
        super(args.message);
        this.args = args;
    }
}
/**
 * Throw this error from within a task or workflow handler to cancel the job.
 * Unlike failing a job (e.g. by throwing any other error), a cancelled job will not be retried.
 */ export class JobCancelledError extends Error {
    constructor(message){
        super(message);
    }
}

//# sourceMappingURL=index.js.map