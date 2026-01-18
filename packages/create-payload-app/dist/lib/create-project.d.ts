import type { CliArgs, DbDetails, PackageManager, ProjectExample, ProjectTemplate } from '../types.js';
type TemplateOrExample = {
    example: ProjectExample;
} | {
    template: ProjectTemplate;
};
export declare function createProject(args: {
    cliArgs: CliArgs;
    dbDetails?: DbDetails;
    packageManager: PackageManager;
    projectDir: string;
    projectName: string;
} & TemplateOrExample): Promise<void>;
/**
 * Reads the package.json file into an object and then does the following:
 * - Sets the `name` property to the provided `projectName`.
 * - Bumps the payload packages from workspace:* to the latest version.
 * - Writes the updated object back to the package.json file.
 */
export declare function updatePackageJSON(args: {
    /**
     * The latest version of Payload to use in the package.json.
     */
    latestVersion: string;
    projectDir: string;
    /**
     * The name of the project to set in package.json.
     */
    projectName: string;
}): Promise<void>;
/**
 * Recursively updates a JSON object to replace all instances of `workspace:` with the latest version pinned.
 *
 * Does not return and instead modifies the `packageJson` object in place.
 */
export declare function updatePackageJSONDependencies(args: {
    latestVersion: string;
    packageJson: Record<string, unknown>;
}): void;
export {};
//# sourceMappingURL=create-project.d.ts.map