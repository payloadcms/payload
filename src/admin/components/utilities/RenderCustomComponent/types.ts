import React from 'react';

export type Props = {
  CustomComponent: React.ComponentType
  DefaultComponent: React.ComponentType
  componentProps?: Record<string, unknown>
}
