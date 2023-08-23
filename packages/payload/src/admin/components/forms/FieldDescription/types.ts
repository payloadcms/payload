import React from 'react';

export type DescriptionFunction = (value?: unknown) => string

export type DescriptionComponent = React.ComponentType<{ value: unknown }>

export type Description = Record<string, string> | string | DescriptionFunction | DescriptionComponent

export type Props = {
  description?: Description
  value?: unknown;
  className?: string
}

export function isComponent(description: Description): description is DescriptionComponent {
  return React.isValidElement(description);
}
