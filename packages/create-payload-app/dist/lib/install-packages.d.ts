import type { PackageManager } from '../types.js';
export declare function installPackages(args: {
    packageManager: PackageManager;
    packagesToInstall: string[];
    projectDir: string;
}): Promise<{
    success: boolean;
}>;
//# sourceMappingURL=install-packages.d.ts.map