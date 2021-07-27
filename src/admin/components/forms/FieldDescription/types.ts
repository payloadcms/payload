import React from 'react';

export type DescriptionFunction = (value: unknown) => string

export type DescriptionComponent = React.ComponentType<{value: unknown}>

type Description = string | DescriptionFunction | DescriptionComponent

export type Props = {
  description?: Description
  value: unknown;
}

export function isComponent(description: Description): description is DescriptionComponent {
  return React.isValidElement(description);
}
