import React from 'react';
/**
 * All fields are wrapped in a `FieldPathContext` provider by default.
 * The `useFieldPath` hook will return this value if it exists, not the path the field was explicitly given.
 * This means if you render a field directly, you will need to wrap it with a new `FieldPathContext` provider.
 * Otherwise, it will return the parent's path, not the path it was explicitly given.
 * @example
 * ```tsx
 * 'use client'
 * import React from 'react'
 * import { TextField, FieldPathContext } from '@payloadcms/ui'
 * import type { TextFieldClientComponent } from 'payload'
 *
 * export const MyCustomField: TextFieldClientComponent = (props) => {
 *   return (
 *     <FieldPathContext value="path.to.some.other.field">
 *       <TextField {...props} />
 *     </FieldPathContext>
 *   )
 * }
 * ```
 *
 * @experimental This is an experimental API and may change at any time. Use at your own risk.
 */
export const FieldPathContext = React.createContext(undefined);
/**
 * Gets the current field path from the nearest `FieldPathContext` provider.
 * All fields are wrapped in this context by default.
 *
 * @experimental This is an experimental API and may change at any time. Use at your own risk.
 */
export const useFieldPath = () => {
  const context = React.useContext(FieldPathContext);
  if (!context) {
    return;
  }
  return context;
};
//# sourceMappingURL=context.js.map