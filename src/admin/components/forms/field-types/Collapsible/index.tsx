import React, { useCallback, useState } from 'react';
import RenderFields from '../../RenderFields';
import withCondition from '../../withCondition';
import { Props } from './types';
import { fieldAffectsData } from '../../../../../fields/config/types';
import { Collapsible } from '../../../elements/Collapsible';
import toKebabCase from '../../../../../utilities/toKebabCase';
import { usePreferences } from '../../../utilities/Preferences';
import { DocumentPreferences } from '../../../../../preferences/types';
import { useDocumentInfo } from '../../../utilities/DocumentInfo';

import './index.scss';

const baseClass = 'collapsible-field';

const CollapsibleField: React.FC<Props> = (props) => {
  const {
    label,
    fields,
    fieldTypes,
    path,
    permissions,
    admin: {
      readOnly,
      className,
    },
  } = props;

  const { getPreference, setPreference } = usePreferences();
  const { preferencesKey, preferences } = useDocumentInfo();
  const [fieldPreferencesKey] = useState(() => `collapsible-${toKebabCase(label)}`);

  const onToggle = useCallback(async (newCollapsedState: boolean) => {
    const existingPreferences: DocumentPreferences = await getPreference(preferencesKey);

    setPreference(preferencesKey, {
      ...existingPreferences,
      fields: {
        ...existingPreferences?.fields || {},
        [fieldPreferencesKey]: {
          ...existingPreferences?.fields?.[fieldPreferencesKey],
          collapsed: newCollapsedState,
        },
      },
    });
  }, [preferencesKey, fieldPreferencesKey, getPreference, setPreference]);

  // Do not render until preferences are retrieved
  // So we can properly render the field as open or closed by default
  if (!preferences) return null;

  return (
    <Collapsible
      initCollapsed={Boolean(preferences.fields[fieldPreferencesKey]?.collapsed)}
      className={[
        'field-type',
        baseClass,
        className,
      ].filter(Boolean).join(' ')}
      header={<div className={`${baseClass}__label`}>{label}</div>}
      onToggle={onToggle}
    >
      <RenderFields
        forceRender
        readOnly={readOnly}
        permissions={permissions?.fields}
        fieldTypes={fieldTypes}
        fieldSchema={fields.map((field) => ({
          ...field,
          path: `${path ? `${path}.` : ''}${fieldAffectsData(field) ? field.name : ''}`,
        }))}
      />
    </Collapsible>
  );
};

export default withCondition(CollapsibleField);
