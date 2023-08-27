import React from 'react';
import { useTranslation } from 'react-i18next';
import RenderFieldsToDiff from '../...js';
import { Props } from '../types.js';
import Label from '../../Label.js';
import { FieldWithSubFields } from '../../../../../../../fields/config/types.js';
import { getTranslation } from '../../../../../../../utilities/getTranslation.js';

import './index.scss';

const baseClass = 'nested-diff';

const Nested: React.FC<Props & { field: FieldWithSubFields}> = ({
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
