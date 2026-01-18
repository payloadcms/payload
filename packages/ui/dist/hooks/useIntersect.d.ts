import type React from 'react';
type Intersect = [
    setNode: React.Dispatch<HTMLElement>,
    entry: IntersectionObserverEntry,
    node: HTMLElement
];
export declare const useIntersect: ({ root, rootMargin, threshold }?: {
    root?: any;
    rootMargin?: string;
    threshold?: number;
}, disable?: boolean) => Intersect;
export {};
//# sourceMappingURL=useIntersect.d.ts.map