import React from 'react';
import RenderFieldsToDiff from '../..';
import { Props } from '../types';
import Label from '../../Label';
import { FieldWithSubFields } from '../../../../../../../fields/config/types';

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
}) => (
  <div className={baseClass}>
    {field.label && (
      <Label>
        {locale && (
        <span className={`${baseClass}__locale-label`}>{locale}</span>
        )}
        {field.label}
      </Label>
    )}
    <div className={[
      `${baseClass}__wrap`,
      !disableGutter && `${baseClass}__wrap--gutter`,
    ].filter(Boolean).join(' ')}
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

export default Nested;
