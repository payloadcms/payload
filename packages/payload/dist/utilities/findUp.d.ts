/**
 * Synchronously walks up parent directories until a condition is met and/or one of the file names within the fileNames array is found.
 */
export declare function findUpSync({ condition, dir, fileNames, }: {
    condition?: (dir: string) => boolean | Promise<boolean | string> | string;
    dir: string;
    fileNames?: string[];
}): null | string;
/**
 * Asynchronously walks up parent directories until a condition is met and/or one of the file names within the fileNames array is found.
 */
export declare function findUp({ condition, dir, fileNames, }: {
    condition?: (dir: string) => boolean | Promise<boolean | string> | string;
    dir: string;
    fileNames?: string[];
}): Promise<null | string>;
export declare function pathExistsAndIsAccessibleSync(path: string): boolean;
export declare function pathExistsAndIsAccessible(path: string): Promise<boolean>;
//# sourceMappingURL=findUp.d.ts.map