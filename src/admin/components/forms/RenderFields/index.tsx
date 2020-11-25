import React, { createContext, useEffect, useContext, useState } from 'react';
import PropTypes from 'prop-types';
import RenderCustomComponent from '../../utilities/RenderCustomComponent';
import useIntersect from '../../../hooks/useIntersect';

const baseClass = 'render-fields';

const intersectionObserverOptions = {
  rootMargin: '1000px',
};

const RenderedFieldContext = createContext({});

export const useRenderedFields = () => useContext(RenderedFieldContext);

const RenderFields: React.FC = (props) => {
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

                  let fieldPermissions = permissions[field.name];

                  if (!field.name) {
                    fieldPermissions = permissions;
                  }

                  let { admin: { readOnly } = {} } = field;

                  if (readOnlyOverride) readOnly = true;

                  if (operation === 'create') readOnly = false;

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

RenderFields.defaultProps = {
  filter: null,
  readOnly: false,
  permissions: {},
  operation: undefined,
  className: undefined,
};

RenderFields.propTypes = {
  fieldSchema: PropTypes.arrayOf(
    PropTypes.shape({}),
  ).isRequired,
  fieldTypes: PropTypes.shape({
    hidden: PropTypes.function,
  }).isRequired,
  filter: PropTypes.func,
  permissions: PropTypes.shape({}),
  readOnly: PropTypes.bool,
  operation: PropTypes.string,
  className: PropTypes.string,
};

export default RenderFields;
