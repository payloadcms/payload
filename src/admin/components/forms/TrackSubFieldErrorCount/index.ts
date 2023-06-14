import React from 'react';
import { Field, TabAsField, fieldAffectsData, fieldHasSubFields, tabHasName } from '../../../../fields/config/types';
import { useAllFormFields, useFormFields, useFormSubmitted } from '../Form/context';

const recursivelyBuildFieldPaths = (path: string, subFields?: Field[]): { branches: string[], tips: string[] } => {
  if (!subFields) {
    // arrays, blocks
    // -> could have any number of subFields: path[index].fieldName
    return {
      branches: [path],
      tips: [],
    };
  }

  const pathNames = subFields.reduce((acc, subField) => {
    if (fieldHasSubFields(subField) && fieldAffectsData(subField)) {
      // groups, named-tab
      const branchName = path ? `${path}.${subField.name}.` : `${subField.name}.`;
      acc.branches.push(branchName);
    } else if (fieldHasSubFields(subField)) {
      // rows, collapsibles, unnamed-tab
      const { branches, tips } = recursivelyBuildFieldPaths(path, subField.fields);
      acc.branches.push(...branches);
      acc.tips.push(...tips);
    } else if (subField.type === 'tabs') {
      // tabs
      subField.tabs.forEach((tab: TabAsField) => {
        let tabPath = path;
        if (tabHasName(tab)) {
          tabPath = path ? `${path}.${tab.name}` : tab.name;
        }
        const { branches, tips } = recursivelyBuildFieldPaths(tabPath, tab.fields);
        acc.branches.push(...branches);
        acc.tips.push(...tips);
      });
    } else if (fieldAffectsData(subField)) {
      // text, number, date, etc.
      const tipName = path ? `${path}.${subField.name}` : subField.name;
      acc.tips.push(tipName);
    }

    return acc;
  }, {
    branches: [],
    tips: [],
  });

  return pathNames;
};

export const TrackSubFieldErrorCount: React.FC<{ subFields?: Field[], path: string, setErrorCount: (count: number) => void }> = ({ path, subFields, setErrorCount }) => {
  const [fields] = useAllFormFields();
  const hasSubmitted = useFormSubmitted();

  const { branches, tips } = recursivelyBuildFieldPaths(path, subFields);

  const relatedChildrenKeys = Object.entries(fields).reduce((acc, [key]) => {
    const keyMatchesPathSegment = branches.some((fieldPathSegment) => key.startsWith(fieldPathSegment));
    const keyEqualsPath = !keyMatchesPathSegment && tips.some((fieldPath) => key === fieldPath);

    if (keyMatchesPathSegment || keyEqualsPath) acc.push(key);
    return acc;
  }, []);

  const childErrorCount = useFormFields(([fieldState]) => relatedChildrenKeys.reduce((acc, key) => {
    if ('valid' in fieldState[key] && !fieldState[key].valid) {
      return acc + 1;
    }
    return acc;
  }, 0));

  React.useEffect(() => {
    if (hasSubmitted) {
      setErrorCount(childErrorCount);
    }
  }, [childErrorCount, setErrorCount, hasSubmitted]);

  return null;
};
