import React from 'react';

export type DescriptionFunction = (value?: unknown) => string

export type DescriptionComponent = React.ComponentType<{ value: unknown }>

export type Description = DescriptionComponent | DescriptionFunction | Record<string, string> | string

export type Props = {
  className?: string
  description?: Description
  value?: unknown;
}

export function isComponent(description: Description): description is DescriptionComponent {
  return React.isValidElement(description);
}
