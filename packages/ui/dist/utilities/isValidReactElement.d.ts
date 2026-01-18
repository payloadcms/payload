import { type ReactElement } from 'react';
/**
 * Since Next.js 15.4, `React.isValidElement()` returns `false` for components that cross the server-client boundary.
 * This utility expands on that check so that it returns true for valid React elements.
 */
export declare function isValidReactElement<P>(object: {} | null | undefined): object is ReactElement<P>;
//# sourceMappingURL=isValidReactElement.d.ts.map