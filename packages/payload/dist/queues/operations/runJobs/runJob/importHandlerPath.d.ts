import type { TaskConfig, TaskHandler } from '../../../config/types/taskTypes.js';
/**
 * Imports a handler function from a given path.
 */
export declare function importHandlerPath<T>(path: string): Promise<T>;
/**
 * The `handler` property of a task config can either be a function or a path to a module that exports a function.
 * This function resolves the handler to a function, either by importing it from the path or returning the function directly
 * if it is already a function.
 */
export declare function getTaskHandlerFromConfig(taskConfig?: TaskConfig): Promise<TaskHandler<string, string>>;
//# sourceMappingURL=importHandlerPath.d.ts.map