import { TabAsField, fieldAffectsData, fieldHasSubFields, tabHasName } from '../../../../../fields/config/types';
import { useAllFormFields, useFormFields } from '../../Form/context';

const recursivelyBuildFieldPaths = (path: string, fields): { branches: string[], tips: string[] } => {
  const pathNames = fields.reduce((acc, field) => {
    if (fieldHasSubFields(field) && fieldAffectsData(field)) {
      // arrays, groups, named-tab
      const branchName = path ? `${path}.${field.name}.` : `${field.name}.`;
      acc.branches.push(branchName);
    } else if (fieldHasSubFields(field)) {
      // rows, collapsibles, unnamed-tab
      const { branches, tips } = recursivelyBuildFieldPaths(path, field.fields);
      acc.branches.push(...branches);
      acc.tips.push(...tips);
    } else if (field.type === 'tabs') {
      // tabs
      field.tabs.forEach((tab: TabAsField) => {
        let tabPath = path;
        if (tabHasName(tab)) {
          tabPath = path ? `${path}.${tab.name}` : tab.name;
        }
        const { branches, tips } = recursivelyBuildFieldPaths(tabPath, tab.fields);
        acc.branches.push(...branches);
        acc.tips.push(...tips);
      });
    } else if (fieldAffectsData(field)) {
      // text, number, date, etc.
      const tipName = path ? `${path}.${field.name}` : field.name;
      acc.tips.push(tipName);
    }

    return acc;
  }, {
    branches: [],
    tips: [],
  });

  return pathNames;
};

export const useWatchChildrenFields = ({ path, childrenFields }: { path?: string, childrenFields: any[] }) => {
  const [fields] = useAllFormFields();

  const { branches, tips } = recursivelyBuildFieldPaths(path, childrenFields);

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

  return childErrorCount;
};
