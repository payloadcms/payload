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

const RenderFields = (props) => {
  const {
    fieldSchema,
    customComponentsPath: customComponentsPathFromProps,
    fieldTypes,
    filter,
    permissions,
    readOnly: readOnlyOverride,
    operation: operationFromProps,
    className,
  } = props;

  const [hasIntersected, setHasIntersected] = useState(false);
  const [intersectionRef, entry] = useIntersect(intersectionObserverOptions);
  const isIntersecting = Boolean(entry?.isIntersecting);

  const { customComponentsPath: customComponentsPathFromContext, operation: operationFromContext } = useRenderedFields();

  const operation = operationFromProps || operationFromContext;
  const customComponentsPath = customComponentsPathFromProps || customComponentsPathFromContext;

  const [contextValue, setContextValue] = useState({
    operation,
    customComponentsPath,
  });

  useEffect(() => {
    setContextValue({
      operation,
      customComponentsPath,
    });
  }, [operation, customComponentsPath]);

  useEffect(() => {
    if (isIntersecting && !hasIntersected) {
      setHasIntersected(true);
    }
  }, [isIntersecting, hasIntersected]);

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
        {hasIntersected && (
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

                    const customComponentPath = `${customComponentsPath}${field.name ? `${field.name}` : ''}`;

                    if (FieldComponent) {
                      return (
                        <RenderCustomComponent
                          key={i}
                          path={`${customComponentPath}.field`}
                          DefaultComponent={FieldComponent}
                          componentProps={{
                            customComponentPath,
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
  customComponentsPath: '',
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
  customComponentsPath: PropTypes.string,
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
