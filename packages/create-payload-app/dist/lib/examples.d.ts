import type { ProjectExample } from '../types.js';
export declare function getExamples({ branch }: {
    branch: string;
}): Promise<ProjectExample[]>;
export declare function parseExample({ name, branch, }: {
    branch: string;
    name: string;
}): Promise<false | ProjectExample>;
//# sourceMappingURL=examples.d.ts.map