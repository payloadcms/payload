export type NecessaryDependencies = {
    missing: string[];
    resolved: Map<string, {
        path: string;
        version: string;
    }>;
};
export declare function getDependencies(baseDir: string, requiredPackages: string[]): Promise<NecessaryDependencies>;
//# sourceMappingURL=getDependencies.d.ts.map