import type { ClientField } from 'payload';
import type React from 'react';
type TrackSubSchemaErrorCountProps = {
    fields?: ClientField[];
    /**
     * This path should only include path segments that affect data
     * i.e. it should not include _index-0 type segments
     *
     * For collapsibles and tabs you can simply pass their parent path
     */
    path: (number | string)[];
    setErrorCount: (count: number) => void;
};
export declare const WatchChildErrors: React.FC<TrackSubSchemaErrorCountProps>;
export {};
//# sourceMappingURL=index.d.ts.map