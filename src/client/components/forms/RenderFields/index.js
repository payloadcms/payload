import React, { createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import RenderCustomComponent from '../../utilities/RenderCustomComponent';

import './index.scss';

const RenderedFieldContext = createContext({});

export const useRenderedFields = () => useContext(RenderedFieldContext);

const RenderFields = ({
  fieldSchema, initialData, customComponentsPath: customComponentsPathFromProps, fieldTypes, filter,
}) => {
  const { customComponentsPath: customComponentsPathFromContext } = useRenderedFields();

  const customComponentsPath = customComponentsPathFromProps || customComponentsPathFromContext;

  if (fieldSchema) {
    return (
      <RenderedFieldContext.Provider value={{ customComponentsPath }}>
        {fieldSchema.map((field, i) => {
          if (field?.hidden !== 'api' && field?.hidden !== true) {
            if ((filter && typeof filter === 'function' && filter(field)) || !filter) {
              const FieldComponent = field?.hidden === 'admin' ? fieldTypes.hidden : fieldTypes[field.type];

              let initialFieldData;

              if (!field.name) {
                initialFieldData = initialData;
              } else if (initialData?.[field.name] !== undefined) {
                initialFieldData = initialData[field.name];
              }

              if (FieldComponent) {
                return (
                  <RenderCustomComponent
                    key={field.name || `field-${i}`}
                    path={`${customComponentsPath}${field.name ? `${field.name}.field` : ''}`}
                    DefaultComponent={FieldComponent}
                    componentProps={{
                      ...field,
                      path: field.path || field.name,
                      fieldTypes,
                      initialData: initialFieldData,
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

            return null;
          }

          return null;
        })}
      </RenderedFieldContext.Provider>
    );
  }

  return null;
};

RenderFields.defaultProps = {
  initialData: {},
  customComponentsPath: '',
  filter: null,
};

RenderFields.propTypes = {
  fieldSchema: PropTypes.arrayOf(
    PropTypes.shape({}),
  ).isRequired,
  initialData: PropTypes.shape({}),
  customComponentsPath: PropTypes.string,
  fieldTypes: PropTypes.shape({
    hidden: PropTypes.function,
  }).isRequired,
  filter: PropTypes.func,
};

export default RenderFields;
