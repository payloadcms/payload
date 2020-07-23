import React, { createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import { DynamicSizeList as List } from 'react-window';
import RenderCustomComponent from '../../utilities/RenderCustomComponent';

import './index.scss';

const RenderedFieldContext = createContext({});

export const useRenderedFields = () => useContext(RenderedFieldContext);

const RenderFields = (props) => {
  const {
    fieldSchema,
    initialData,
    customComponentsPath: customComponentsPathFromProps,
    fieldTypes,
    filter,
    permissions,
    readOnly: readOnlyOverride,
    operation: operationFromProps,
  } = props;

  const { customComponentsPath: customComponentsPathFromContext, operation: operationFromContext } = useRenderedFields();

  const customComponentsPath = customComponentsPathFromProps || customComponentsPathFromContext;
  const operation = operationFromProps || operationFromContext;

  const renderRow = ({ index, style }) => {
    const field = fieldSchema[index];

    if (!field?.hidden && field?.admin?.disabled !== true) {
      if ((filter && typeof filter === 'function' && filter(field)) || !filter) {
        const FieldComponent = field?.admin?.hidden ? fieldTypes.hidden : fieldTypes[field.type];

        let initialFieldData;
        let fieldPermissions = permissions[field.name];

        if (!field.name) {
          initialFieldData = initialData;
          fieldPermissions = permissions;
        } else if (initialData?.[field.name] !== undefined) {
          initialFieldData = initialData[field.name];
        }

        let { admin: { readOnly } = {} } = field;

        if (readOnlyOverride) readOnly = true;

        if (permissions?.[field?.name]?.read?.permission !== false) {
          if (permissions?.[field?.name]?.[operation]?.permission === false) {
            readOnly = true;
          }

          if (FieldComponent) {
            return (
              <div style={{ ...style, top: 200 * index }}>
                <RenderCustomComponent
                  key={field.name || `field-${index}`}
                  path={`${customComponentsPath}${field.name ? `${field.name}.field` : ''}`}
                  DefaultComponent={FieldComponent}
                  componentProps={{
                    ...field,
                    path: field.path || field.name,
                    fieldTypes,
                    initialData: initialFieldData,
                    admin: {
                      ...(field.admin || {}),
                      readOnly,
                    },
                    permissions: fieldPermissions,
                  }}
                />
              </div>
            );
          }

          return (
            <div
              style={style}
              className="missing-field"
              key={index}
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
  };

  if (fieldSchema) {
    return (
      <RenderedFieldContext.Provider value={{ customComponentsPath, operation }}>
        <List
          data={fieldSchema}
          itemCount={fieldSchema.length}
          height={600}
          width={750}
        >
          {renderRow}
        </List>
      </RenderedFieldContext.Provider>
    );
  }

  return null;
};

RenderFields.defaultProps = {
  initialData: {},
  customComponentsPath: '',
  filter: null,
  readOnly: false,
  permissions: {},
  operation: undefined,
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
  permissions: PropTypes.shape({}),
  readOnly: PropTypes.bool,
  operation: PropTypes.string,
};

export default RenderFields;
