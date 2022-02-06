import { useConfig } from '@payloadcms/config-provider';
import React from 'react';
import ReactDiffViewer from 'react-diff-viewer';
import { useLocale } from '../../../../../utilities/Locale';
import { SanitizedCollectionConfig } from '../../../../../../../collections/config/types';
import { fieldAffectsData, fieldIsPresentationalOnly, RelationshipField } from '../../../../../../../fields/config/types';
import Label from '../../Label';
import { Props } from '../types';

import './index.scss';

const baseClass = 'relationship-diff';

type RelationshipValue = Record<string, any>;

const generateLabelFromValue = (
  collections: SanitizedCollectionConfig[],
  field: RelationshipField,
  locale: string,
  value: RelationshipValue | { relationTo: string, value: RelationshipValue },
): string => {
  let relation: string;
  let relatedDoc: RelationshipValue;
  let valueToReturn = '';

  if (Array.isArray(field.relationTo)) {
    if (typeof value === 'object') {
      relation = value.relationTo;
      relatedDoc = value.value;
    }
  } else {
    relation = field.relationTo;
    relatedDoc = value;
  }

  const relatedCollection = collections.find((c) => c.slug === relation);

  if (relatedCollection) {
    const useAsTitle = relatedCollection?.admin?.useAsTitle;
    const useAsTitleField = relatedCollection.fields.find((f) => (fieldAffectsData(f) && !fieldIsPresentationalOnly(f)) && f.name === useAsTitle);
    let titleFieldIsLocalized = false;

    if (useAsTitleField && fieldAffectsData(useAsTitleField)) titleFieldIsLocalized = useAsTitleField.localized;


    if (typeof relatedDoc?.[useAsTitle] !== 'undefined') {
      valueToReturn = relatedDoc[useAsTitle];
    } else if (typeof relatedDoc?.id !== 'undefined') {
      valueToReturn = relatedDoc.id;
    }

    if (typeof valueToReturn === 'object' && titleFieldIsLocalized) {
      valueToReturn = valueToReturn[locale];
    }
  }

  return valueToReturn;
};

const Relationship: React.FC<Props & { field: RelationshipField}> = ({ field, version, comparison }) => {
  const { collections } = useConfig();
  const locale = useLocale();

  let placeholder = '';

  if (version === comparison) placeholder = '[no value]';

  let versionToRender = version;
  let comparisonToRender = comparison;

  if (field.hasMany) {
    if (Array.isArray(version)) versionToRender = version.map((val) => generateLabelFromValue(collections, field, locale, val)).join(', ');
    if (Array.isArray(comparison)) comparisonToRender = comparison.map((val) => generateLabelFromValue(collections, field, locale, val)).join(', ');
  } else {
    versionToRender = generateLabelFromValue(collections, field, locale, version);
    comparisonToRender = generateLabelFromValue(collections, field, locale, comparison);
  }

  return (
    <div className={baseClass}>
      <Label>
        {locale && (
          <span className={`${baseClass}__locale-label`}>{locale}</span>
        )}
        {field.label}
      </Label>
      <ReactDiffViewer
        oldValue={typeof versionToRender !== 'undefined' ? String(versionToRender) : placeholder}
        newValue={typeof comparisonToRender !== 'undefined' ? String(comparisonToRender) : placeholder}
        splitView
        hideLineNumbers
        showDiffOnly={false}
      />
    </div>
  );

  return null;
};

export default Relationship;
