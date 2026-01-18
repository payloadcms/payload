type QueuedFunction = () => Promise<void>;
type QueuedTaskOptions = {
    /**
     * A function that is called after the queue has processed a function
     * Used to perform side effects after processing the queue
     * @returns {void}
     */
    afterProcess?: () => void;
    /**
     * A function that can be used to prevent the queue from processing under certain conditions
     * Can also be used to perform side effects before processing the queue
     * @returns {boolean} If `false`, the queue will not process
     */
    beforeProcess?: () => boolean | void;
};
type QueueTask = (fn: QueuedFunction, options?: QueuedTaskOptions) => void;
/**
 * A React hook that allows you to queue up functions to be executed in order.
 * This is useful when you need to ensure long running networks requests are processed sequentially.
 * Builds up a "queue" of functions to be executed in order, only ever processing the last function in the queue.
 * This ensures that a long queue of tasks doesn't cause a backlog of tasks to be processed.
 * E.g. if you queue a task and it begins running, then you queue 9 more tasks:
 *   1. The currently task will finish
 *   2. The next task in the queue will run
 *   3. All remaining tasks will be discarded
 * @returns {queueTask} A function used to queue a function.
 * @example
 * const { queueTask } = useQueue()
 * queueTask(async () => {
 *   await fetch('https://api.example.com')
 * })
 */
export declare function useQueue(): {
    queueTask: QueueTask;
};
export {};
//# sourceMappingURL=useQueue.d.ts.map