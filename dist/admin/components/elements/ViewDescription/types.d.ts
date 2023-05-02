import React from 'react';
export type DescriptionFunction = () => string;
export type DescriptionComponent = React.ComponentType<any>;
type Description = Record<string, string> | string | DescriptionFunction | DescriptionComponent;
export type Props = {
    description?: Description;
};
export declare function isComponent(description: Description): description is DescriptionComponent;
export {};
