import React from 'react';
import RenderFields from '../../RenderFields';
import withCondition from '../../withCondition';
import FieldDescription from '../../FieldDescription';
import FieldTypeGutter from '../../FieldTypeGutter';
import { NegativeFieldGutterProvider } from '../../FieldTypeGutter/context';
import { Props } from './types';

import './index.scss';

const baseClass = 'group';

const Group: React.FC<Props> = (props) => {
  const {
    label,
    fields,
    name,
    path: pathFromProps,
    fieldTypes,
    admin: {
      readOnly,
      style,
      width,
      hideGutter,
      description,
    },
    permissions,
  } = props;

  const path = pathFromProps || name;

  return (
    <div
      className={[
        'field-type',
        baseClass,
        !label && `${baseClass}--no-label`,
      ].filter(Boolean).join(' ')}
      style={{
        ...style,
        width,
      }}
    >
      { !hideGutter && (<FieldTypeGutter />) }

      <div className={`${baseClass}__content-wrapper`}>
        {(label || description) && (
          <header className={`${baseClass}__header`}>
            {label && (
              <h3 className={`${baseClass}__title`}>{label}</h3>
            )}
            <FieldDescription
              value={null}
              description={description}
            />
          </header>
        )}
        <div className={`${baseClass}__fields-wrapper`}>
          <NegativeFieldGutterProvider allow={false}>
            <RenderFields
              permissions={permissions?.fields}
              readOnly={readOnly}
              fieldTypes={fieldTypes}
              fieldSchema={fields.map((subField) => ({
                ...subField,
                path: `${path}${subField.name ? `.${subField.name}` : ''}`,
              }))}
            />
          </NegativeFieldGutterProvider>
        </div>
      </div>
    </div>
  );
};

export default withCondition(Group);
