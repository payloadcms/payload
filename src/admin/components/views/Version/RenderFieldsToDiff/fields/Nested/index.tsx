import React from 'react';
import { useTranslation } from 'react-i18next';
import { RenderFieldsToDiff } from '../..';
import { Props } from '../types';
import Label from '../../Label';
import { FieldWithSubFields } from '../../../../../../../fields/config/types';
import { getTranslation } from '../../../../../../../utilities/getTranslation';

import './index.scss';

const baseClass = 'nested-diff';

export const Nested: React.FC<Props & { field: FieldWithSubFields }> = ({
  version,
  comparison,
  permissions,
  field,
  locale,
  locales,
  fieldComponents,
  disableGutter = false,
}) => {
  const { i18n } = useTranslation();

  return (
    <div className={baseClass}>
      {field.label && (
        <Label>
          {locale && (
            <span className={`${baseClass}__locale-label`}>{locale}</span>
          )}
          {getTranslation(field.label, i18n)}
        </Label>
      )}
      <div className={[
        `${baseClass}__wrap`,
        !disableGutter && `${baseClass}__wrap--gutter`,
      ].filter(Boolean)
        .join(' ')}
      >
        <RenderFieldsToDiff
          locales={locales}
          version={version}
          comparison={comparison}
          fieldPermissions={permissions}
          fields={field.fields}
          fieldComponents={fieldComponents}
        />
      </div>
    </div>
  );
};

export default Nested;
