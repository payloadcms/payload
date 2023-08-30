import React from 'react';
import { useTranslation } from 'react-i18next';

import type { FieldWithSubFields } from '../../../../../../../fields/config/types.js';
import type { Props } from '../types.js';

import { getTranslation } from '../../../../../../../utilities/getTranslation.js';
import Label from '../../Label/index.js';
import RenderFieldsToDiff from '../../index.js';
import './index.scss';

const baseClass = 'nested-diff';

const Nested: React.FC<Props & { field: FieldWithSubFields}> = ({
  comparison,
  disableGutter = false,
  field,
  fieldComponents,
  locale,
  locales,
  permissions,
  version,
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
          comparison={comparison}
          fieldComponents={fieldComponents}
          fieldPermissions={permissions}
          fields={field.fields}
          locales={locales}
          version={version}
        />
      </div>
    </div>
  );
};

export default Nested;
