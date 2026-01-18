import type { CollectionAfterChangeHook } from '../../index.js';
/**
 * If a parent is moved into a child folder, we need to re-parent the child
 *
 * @example
 *
 * ```ts
    → F1
      → F2
        → F2A
      → F3

  Moving F1 → F2A becomes:

    → F2A
      → F1
        → F2
        → F3
  ```
 */
export declare const reparentChildFolder: ({ folderFieldName, }: {
    folderFieldName: string;
}) => CollectionAfterChangeHook;
//# sourceMappingURL=reparentChildFolder.d.ts.map