import React, { createContext, useEffect, useContext, useState } from 'react';
import RenderCustomComponent from '../../utilities/RenderCustomComponent';
import useIntersect from '../../../hooks/useIntersect';
import { Props, Context } from './types';

const baseClass = 'render-fields';

const intersectionObserverOptions = {
  rootMargin: '1000px',
};

const RenderedFieldContext = createContext({} as Context);

export const useRenderedFields = (): Context => useContext(RenderedFieldContext);

const RenderFields: React.FC<Props> = (props) => {
  const {
    fieldSchema,
    fieldTypes,
    filter,
    permissions,
    readOnly: readOnlyOverride,
    operation: operationFromProps,
    className,
  } = props;

  const [hasRendered, setHasRendered] = useState(false);
  const [intersectionRef, entry] = useIntersect(intersectionObserverOptions);
  const isIntersecting = Boolean(entry?.isIntersecting);
  const isAboveViewport = entry?.boundingClientRect?.top < 0;

  const shouldRender = isIntersecting || isAboveViewport;

  const { operation: operationFromContext } = useRenderedFields();

  const operation = operationFromProps || operationFromContext;

  const [contextValue, setContextValue] = useState({
    operation,
  });

  useEffect(() => {
    setContextValue({
      operation,
    });
  }, [operation]);

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
          <RenderedFieldContext.Provider value={contextValue}>
            {fieldSchema.map((field, i) => {
              if (!field?.hidden && field?.admin?.disabled !== true) {
                if ((filter && typeof filter === 'function' && filter(field)) || !filter) {
                  const FieldComponent = field?.admin?.hidden ? fieldTypes.hidden : fieldTypes[field.type];

                  const fieldPermissions = field?.name ? permissions?.[field.name] : permissions;

                  let { admin: { readOnly } = {} } = field;

                  if (readOnlyOverride) readOnly = true;

                  if (permissions?.[field?.name]?.read?.permission !== false) {
                    if (permissions?.[field?.name]?.[operation]?.permission === false) {
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
                            path: field.path || field.name,
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
            })}
          </RenderedFieldContext.Provider>
        )}
      </div>
    );
  }

  return null;
};

export default RenderFields;
