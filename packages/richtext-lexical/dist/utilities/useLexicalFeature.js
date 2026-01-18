'use client';

import { useAddClientFunction } from '@payloadcms/ui';
import { useEditorConfigContext } from '../lexical/config/client/EditorConfigProvider.js';
export const useLexicalFeature = (featureKey, feature) => {
  const {
    fieldProps: t0
  } = useEditorConfigContext();
  const {
    schemaPath: schemaPathFromFieldProps
  } = t0;
  const tableCell = {
    cellProps: {
      schemaPath: []
    }
  };
  const schemaPathFromCellProps = tableCell?.cellProps?.schemaPath ? tableCell?.cellProps?.schemaPath.join(".") : null;
  const schemaPath = schemaPathFromCellProps || schemaPathFromFieldProps;
  useAddClientFunction(`lexicalFeature.${schemaPath}.${featureKey}`, feature);
};
//# sourceMappingURL=useLexicalFeature.js.map