import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import RenderCustomComponent from '../../utilities/RenderCustomComponent';
import useIntersect from '../../../hooks/useIntersect';
import { Props } from './types';
import { fieldAffectsData, fieldIsPresentationalOnly } from '../../../../fields/config/types';
import { useOperation } from '../../utilities/OperationProvider';
import { getTranslation } from '../../../../utilities/getTranslation';

const baseClass = 'render-fields';

const intersectionObserverOptions = {
  rootMargin: '1000px',
};

const RenderFields: React.FC<Props> = (props) => {
  const {
    fieldSchema,
    fieldTypes,
    filter,
    permissions,
    readOnly: readOnlyOverride,
    className,
    forceRender,
    indexPath: incomingIndexPath,
  } = props;

  const { t, i18n } = useTranslation('general');
  const [hasRendered, setHasRendered] = useState(Boolean(forceRender));
  const [intersectionRef, entry] = useIntersect(intersectionObserverOptions);
  const operation = useOperation();

  const isIntersecting = Boolean(entry?.isIntersecting);
  const isAboveViewport = entry?.boundingClientRect?.top < 0;
  const shouldRender = forceRender || isIntersecting || isAboveViewport;

  useEffect(() => {
    if (shouldRender && !hasRendered) {
      setHasRendered(true);
    }
  }, [shouldRender, hasRendered]);

  const classes = [
    baseClass,
    className,
  ].filter(Boolean).join(' ');

  if (fieldSchema) {
    return (
      <div
        ref={intersectionRef}
        className={classes}
      >
        {hasRendered && (
          fieldSchema.map((field, fieldIndex) => {
            const fieldIsPresentational = fieldIsPresentationalOnly(field);
            let FieldComponent = fieldTypes[field.type];

            if (fieldIsPresentational || (!field?.hidden && field?.admin?.disabled !== true)) {
              if ((filter && typeof filter === 'function' && filter(field)) || !filter) {
                if (fieldIsPresentational) {
                  return (
                    <FieldComponent
                      {...field}
                      key={fieldIndex}
                    />
                  );
                }

                if (field?.admin?.hidden) {
                  FieldComponent = fieldTypes.hidden;
                }

                const isFieldAffectingData = fieldAffectsData(field);

                const fieldPermissions = isFieldAffectingData ? permissions?.[field.name] : permissions;

                let { admin: { readOnly } = {} } = field;

                if (readOnlyOverride && readOnly !== false) readOnly = true;

                if ((isFieldAffectingData && permissions?.[field?.name]?.read?.permission !== false) || !isFieldAffectingData) {
                  if (isFieldAffectingData && permissions?.[field?.name]?.[operation]?.permission === false) {
                    readOnly = true;
                  }

                  if (FieldComponent) {
                    return (
                      <RenderCustomComponent
                        key={fieldIndex}
                        CustomComponent={field?.admin?.components?.Field}
                        DefaultComponent={FieldComponent}
                        componentProps={{
                          ...field,
                          path: field.path || (isFieldAffectingData ? field.name : ''),
                          fieldTypes,
                          indexPath: incomingIndexPath ? `${incomingIndexPath}.${fieldIndex}` : `${fieldIndex}`,
                          admin: {
                            ...(field.admin || {}),
                            readOnly,
                          },
                          permissions: fieldPermissions,
                        }}
                      />
                    );
                  }

                  return (
                    <div
                      className="missing-field"
                      key={fieldIndex}
                    >
                      {t('error:noMatchedField', { label: fieldAffectsData(field) ? getTranslation(field.label || field.name, i18n) : field.path })}
                    </div>
                  );
                }
              }

              return null;
            }

            return null;
          })
        )}
      </div>
    );
  }

  return null;
};

export default RenderFields;
