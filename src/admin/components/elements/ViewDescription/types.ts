import React from 'react';

export type DescriptionFunction = () => string

export type DescriptionComponent = React.ComponentType

type Description = string | DescriptionFunction | DescriptionComponent

export type Props = {
  description?: Description
}

export function isComponent(description: Description): description is DescriptionComponent {
  return React.isValidElement(description);
}
