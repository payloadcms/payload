export type CustomVersionParser = (version: string) => {
    parts: number[];
    preReleases: string[];
};
export type DependencyCheckerArgs = {
    /**
     * Define dependency groups to ensure that all dependencies within that group are on the same version, and that no dependencies in that group with different versions are found
     */
    dependencyGroups?: {
        dependencies: string[];
        /**
         * Name of the dependency group to be displayed in the error message
         */
        name: string;
        targetVersion?: string;
        targetVersionDependency?: string;
    }[];
    /**
     * Dependency package names keyed to their required versions. Supports >= (greater or equal than version) as a prefix, or no prefix for the exact version
     */
    dependencyVersions?: {
        [dependency: string]: {
            customVersionParser?: CustomVersionParser;
            required?: boolean;
            version?: string;
        };
    };
};
export declare function checkDependencies({ dependencyGroups, dependencyVersions, }: DependencyCheckerArgs): Promise<void>;
//# sourceMappingURL=dependencyChecker.d.ts.map