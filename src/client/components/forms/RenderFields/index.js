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

  // console.log(customComponentsPath);

  if (fieldSchema) {
    return (
      <RenderedFieldContext.Provider value={{ customComponentsPath }}>
        {fieldSchema.map((field, i) => {
          if (field?.hidden !== 'api' && field?.hidden !== true) {
            if ((filter && typeof filter === 'function' && filter(field)) || !filter) {
              const FieldComponent = field?.hidden === 'admin' ? fieldTypes.hidden : fieldTypes[field.type];

              let { defaultValue } = field;

              if (!field.name) {
                defaultValue = initialData;
              } else if (initialData[field.name]) {
                defaultValue = initialData[field.name];
              }

              if (FieldComponent) {
                return (
                  <RenderCustomComponent
                    key={field.name || `field-${i}`}
                    path={`${customComponentsPath}${field.name ? `${field.name.split('.').pop()}.field` : ''}`}
                    DefaultComponent={FieldComponent}
                    componentProps={{
                      ...field,
                      fieldTypes,
                      defaultValue,
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
    hidden: PropTypes.func,
  }).isRequired,
  filter: PropTypes.func,
};

export default RenderFields;
