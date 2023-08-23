import React from 'react';
import { Field, TabAsField, fieldAffectsData, fieldHasSubFields, tabHasName } from '../../../../fields/config/types';
import { useAllFormFields, useFormSubmitted } from '../Form/context';
import useThrottledEffect from '../../../hooks/useThrottledEffect';

const buildPathSegments = (parentPath: string, fieldSchema: Field[]): string[] => {
  const pathNames = fieldSchema.reduce((acc, subField) => {
    if (fieldHasSubFields(subField) && fieldAffectsData(subField)) {
      // group, block, array
      acc.push(parentPath ? `${parentPath}.${subField.name}.` : `${subField.name}.`);
    } else if (fieldHasSubFields(subField)) {
      // rows, collapsibles, unnamed-tab
      acc.push(...buildPathSegments(parentPath, subField.fields));
    } else if (subField.type === 'tabs') {
      // tabs
      subField.tabs.forEach((tab: TabAsField) => {
        let tabPath = parentPath;
        if (tabHasName(tab)) {
          tabPath = parentPath ? `${parentPath}.${tab.name}` : tab.name;
        }
        acc.push(...buildPathSegments(tabPath, tab.fields));
      });
    } else if (fieldAffectsData(subField)) {
      // text, number, date, etc.
      acc.push(parentPath ? `${parentPath}.${subField.name}` : subField.name);
    }

    return acc;
  }, []);

  return pathNames;
};

type TrackSubSchemaErrorCountProps = {
  /**
   * Only for collapsibles, and unnamed-tabs
   */
  fieldSchema?: Field[];
  path: string;
  setErrorCount: (count: number) => void;
}
export const WatchChildErrors: React.FC<TrackSubSchemaErrorCountProps> = ({ path, fieldSchema, setErrorCount }) => {
  const [fields] = useAllFormFields();
  const hasSubmitted = useFormSubmitted();
  const [pathSegments] = React.useState(() => {
    if (fieldSchema) {
      return buildPathSegments(path, fieldSchema);
    }

    return [`${path}.`];
  });

  useThrottledEffect(() => {
    let errorCount = 0;
    if (hasSubmitted) {
      Object.entries(fields).forEach(([key]) => {
        const matchingSegment = pathSegments.some((segment) => {
          if (segment.endsWith('.')) {
            return key.startsWith(segment);
          }
          return key === segment;
        });

        if (matchingSegment) {
          if ('valid' in fields[key] && !fields[key].valid) {
            errorCount += 1;
          }
        }
      });
    }

    setErrorCount(errorCount);
  }, 250, [fields, hasSubmitted, pathSegments]);

  return null;
};
