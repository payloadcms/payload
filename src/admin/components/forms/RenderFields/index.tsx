import React, { useEffect, useState } from 'react';
import RenderCustomComponent from '../../utilities/RenderCustomComponent';
import useIntersect from '../../../hooks/useIntersect';
import { Props } from './types';
import { fieldAffectsData, fieldIsPresentationalOnly } from '../../../../fields/config/types';
import { useOperation } from '../../utilities/OperationProvider';

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
  } = props;

  const [hasRendered, setHasRendered] = useState(false);
  const [intersectionRef, entry] = useIntersect(intersectionObserverOptions);
  const operation = useOperation();

  const isIntersecting = Boolean(entry?.isIntersecting);
  const isAboveViewport = entry?.boundingClientRect?.top < 0;
  const shouldRender = isIntersecting || isAboveViewport;


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
          fieldSchema.map((field, i) => {
            const fieldIsPresentational = fieldIsPresentationalOnly(field);
            let FieldComponent = fieldTypes[field.type];

            if (fieldIsPresentational || (!field?.hidden && field?.admin?.disabled !== true)) {
              if ((filter && typeof filter === 'function' && filter(field)) || !filter) {
                if (fieldIsPresentational) {
                  return (
                    <FieldComponent
                      {...field}
                      key={i}
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
                        key={i}
                        CustomComponent={field?.admin?.components?.Field}
                        DefaultComponent={FieldComponent}
                        componentProps={{
                          ...field,
                          path: field.path || (isFieldAffectingData ? field.name : undefined),
                          fieldTypes,
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
                      key={i}
                    >
                      No matched field found for
                      {' '}
                      &quot;
                      {field.label}
                      &quot;
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
