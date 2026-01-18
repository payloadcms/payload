import type { PackageManager } from '../types.js';
export declare const welcomeMessage: string;
export declare function helpMessage(): void;
export declare function successMessage(projectDir: string, packageManager: PackageManager): string;
export declare function successfulNextInit(): string;
export declare function moveMessage(args: {
    nextAppDir: string;
    projectDir: string;
}): string;
export declare function feedbackOutro(): string;
//# sourceMappingURL=messages.d.ts.map