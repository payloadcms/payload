import React from 'react';

export type DescriptionFunction = (args: { value: unknown, language: string }) => string

export type DescriptionComponent = React.ComponentType<{ value: unknown, language: string }>

export type Description = Record<string, string> | string | DescriptionFunction | DescriptionComponent

export type Props = {
  description?: Description
  value?: unknown;
  className?: string;
  formatOptions?: Intl.NumberFormatOptions
}

export function isComponent(description: Description): description is DescriptionComponent {
  return React.isValidElement(description);
}
