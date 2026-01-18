import type { DescriptionFunction, StaticDescription, ViewDescriptionClientProps } from 'payload';
import React from 'react';
export type ViewDescriptionComponent = React.ComponentType<any>;
type Description = DescriptionFunction | StaticDescription | string | ViewDescriptionComponent;
export declare function isComponent(description: Description): description is ViewDescriptionComponent;
export declare function ViewDescription(props: ViewDescriptionClientProps): React.JSX.Element;
export {};
//# sourceMappingURL=index.d.ts.map