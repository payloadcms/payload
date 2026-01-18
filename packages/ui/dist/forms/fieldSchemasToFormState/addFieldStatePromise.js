import ObjectIdImport from 'bson-objectid';
import { getBlockSelect, stripUnselectedFields, validateBlocksFilterOptions } from 'payload';
import { deepCopyObjectSimple, fieldAffectsData, fieldHasSubFields, fieldIsHiddenOrDisabled, fieldIsID, fieldIsLocalized, tabHasName } from 'payload/shared';
import { resolveFilterOptions } from '../../utilities/resolveFilterOptions.js';
import { isRowCollapsed } from './isRowCollapsed.js';
import { iterateFields } from './iterateFields.js';
const ObjectId = 'default' in ObjectIdImport ? ObjectIdImport.default : ObjectIdImport;
/**
 * Flattens the fields schema and fields data.
 * The output is the field path (e.g. array.0.name) mapped to a FormField object.
 */
export const addFieldStatePromise = async args => {
  const {
    id,
    addErrorPathToParent: addErrorPathToParentArg,
    anyParentLocalized = false,
    blockData,
    clientFieldSchemaMap,
    collectionSlug,
    data,
    field,
    fieldSchemaMap,
    filter,
    forceFullValue = false,
    fullData,
    includeSchema = false,
    indexPath,
    mockRSCs,
    omitParents = false,
    operation,
    parentPath,
    parentPermissions,
    parentSchemaPath,
    passesCondition,
    path,
    preferences,
    previousFormState,
    readOnly,
    renderAllFields,
    renderFieldFn,
    req,
    schemaPath,
    select,
    selectMode,
    skipConditionChecks = false,
    skipValidation = false,
    state
  } = args;
  if (!args.clientFieldSchemaMap && args.renderFieldFn) {
    // eslint-disable-next-line no-console
    console.warn('clientFieldSchemaMap is not passed to addFieldStatePromise - this will reduce performance');
  }
  let fieldPermissions = true;
  const fieldState = {};
  const lastRenderedPath = previousFormState?.[path]?.lastRenderedPath;
  // Append only if true to avoid sending '$undefined' through the network
  if (lastRenderedPath) {
    fieldState.lastRenderedPath = lastRenderedPath;
  }
  // If we're rendering all fields, no need to flag this as added by server
  const addedByServer = !renderAllFields && !previousFormState?.[path];
  // Append only if true to avoid sending '$undefined' through the network
  if (addedByServer) {
    fieldState.addedByServer = true;
  }
  // Append only if true to avoid sending '$undefined' through the network
  if (passesCondition === false) {
    fieldState.passesCondition = false;
  }
  // Append only if true to avoid sending '$undefined' through the network
  if (includeSchema) {
    fieldState.fieldSchema = field;
  }
  if (fieldAffectsData(field) && !fieldIsHiddenOrDisabled(field) && field.type !== 'tab') {
    fieldPermissions = parentPermissions === true ? parentPermissions : deepCopyObjectSimple(parentPermissions?.[field.name]);
    let hasPermission = fieldPermissions === true || deepCopyObjectSimple(fieldPermissions?.read);
    if (typeof field?.access?.read === 'function') {
      hasPermission = await field.access.read({
        id,
        blockData,
        data: fullData,
        req,
        siblingData: data
      });
    } else {
      hasPermission = true;
    }
    if (!hasPermission) {
      return;
    }
    const validate = 'validate' in field ? field.validate : undefined;
    let validationResult = true;
    if (typeof validate === 'function' && !skipValidation && passesCondition) {
      let jsonError;
      if (field.type === 'json' && typeof data[field.name] === 'string') {
        try {
          JSON.parse(data[field.name]);
        } catch (e) {
          jsonError = e;
        }
      }
      try {
        validationResult = await validate(data?.[field.name], {
          ...field,
          id,
          blockData,
          collectionSlug,
          data: fullData,
          event: 'onChange',
          // @AlessioGr added `jsonError` in https://github.com/payloadcms/payload/commit/c7ea62a39473408c3ea912c4fbf73e11be4b538d
          // @ts-expect-error-next-line
          jsonError,
          operation,
          preferences,
          previousValue: previousFormState?.[path]?.initialValue,
          req,
          siblingData: data
        });
      } catch (err) {
        validationResult = `Error validating field at path: ${path}`;
        req.payload.logger.error({
          err,
          msg: validationResult
        });
      }
    }
    /**
    * This function adds the error **path** to the current field and all its parents. If a field is invalid, all its parents are also invalid.
    * It does not add the error **message** to the current field, as that shouldn't apply to all parents.
    * This is done separately below.
    */
    const addErrorPathToParent = errorPath => {
      if (typeof addErrorPathToParentArg === 'function') {
        addErrorPathToParentArg(errorPath);
      }
      if (!fieldState.errorPaths) {
        fieldState.errorPaths = [];
      }
      if (!fieldState.errorPaths.includes(errorPath)) {
        fieldState.errorPaths.push(errorPath);
        fieldState.valid = false;
      }
    };
    if (typeof validationResult === 'string') {
      fieldState.errorMessage = validationResult;
      fieldState.valid = false;
      addErrorPathToParent(path);
    }
    switch (field.type) {
      case 'array':
        {
          const arrayValue = Array.isArray(data[field.name]) ? data[field.name] : [];
          const arraySelect = select?.[field.name];
          const {
            promises,
            rows
          } = arrayValue.reduce((acc, row, rowIndex) => {
            const rowPath = path + '.' + rowIndex;
            row.id = row?.id || new ObjectId().toHexString();
            if (!omitParents && (!filter || filter(args))) {
              const idKey = rowPath + '.id';
              state[idKey] = {
                initialValue: row.id,
                value: row.id
              };
              if (includeSchema) {
                state[idKey].fieldSchema = field.fields.find(field => fieldIsID(field));
              }
            }
            acc.promises.push(iterateFields({
              id,
              addErrorPathToParent,
              anyParentLocalized: field.localized || anyParentLocalized,
              blockData,
              clientFieldSchemaMap,
              collectionSlug,
              data: row,
              fields: field.fields,
              fieldSchemaMap,
              filter,
              forceFullValue,
              fullData,
              includeSchema,
              mockRSCs,
              omitParents,
              operation,
              parentIndexPath: '',
              parentPassesCondition: passesCondition,
              parentPath: rowPath,
              parentSchemaPath: schemaPath,
              permissions: fieldPermissions === true ? fieldPermissions : fieldPermissions?.fields || {},
              preferences,
              previousFormState,
              readOnly,
              renderAllFields,
              renderFieldFn,
              req,
              select: typeof arraySelect === 'object' ? arraySelect : undefined,
              selectMode,
              skipConditionChecks,
              skipValidation,
              state
            }));
            if (!acc.rows) {
              acc.rows = [];
            }
            // First, check if `previousFormState` has a matching row
            const previousRow = (previousFormState?.[path]?.rows || []).find(prevRow => prevRow.id === row.id);
            const newRow = {
              id: row.id,
              isLoading: false
            };
            if (previousRow?.lastRenderedPath) {
              newRow.lastRenderedPath = previousRow.lastRenderedPath;
            }
            // add addedByServer flag
            if (!previousRow) {
              newRow.addedByServer = true;
            }
            const isCollapsed = isRowCollapsed({
              collapsedPrefs: preferences?.fields?.[path]?.collapsed,
              field,
              previousRow,
              row
            });
            if (isCollapsed) {
              newRow.collapsed = true;
            }
            acc.rows.push(newRow);
            return acc;
          }, {
            promises: [],
            rows: []
          });
          // Wait for all promises and update fields with the results
          await Promise.all(promises);
          if (rows) {
            fieldState.rows = rows;
          }
          // Add values to field state
          if (data[field.name] !== null) {
            fieldState.value = forceFullValue ? arrayValue : arrayValue.length;
            fieldState.initialValue = forceFullValue ? arrayValue : arrayValue.length;
            if (arrayValue.length > 0) {
              fieldState.disableFormData = true;
            }
          }
          // Add field to state
          if (!omitParents && (!filter || filter(args))) {
            state[path] = fieldState;
          }
          break;
        }
      case 'blocks':
        {
          const blocksValue = Array.isArray(data[field.name]) ? data[field.name] : [];
          // Handle blocks filterOptions
          let filterOptionsValidationResult = null;
          if (field.filterOptions) {
            filterOptionsValidationResult = await validateBlocksFilterOptions({
              id,
              data: fullData,
              filterOptions: field.filterOptions,
              req,
              siblingData: data,
              value: data[field.name]
            });
            fieldState.blocksFilterOptions = filterOptionsValidationResult.allowedBlockSlugs;
          }
          const {
            promises,
            rowMetadata
          } = blocksValue.reduce((acc, row, i) => {
            const blockTypeToMatch = row.blockType;
            const block = req.payload.blocks[blockTypeToMatch] ?? (field.blockReferences ?? field.blocks).find(blockType => typeof blockType !== 'string' && blockType.slug === blockTypeToMatch);
            if (!block) {
              throw new Error(`Block with type "${row.blockType}" was found in block data, but no block with that type is defined in the config for field with schema path ${schemaPath}.`);
            }
            const {
              blockSelect,
              blockSelectMode
            } = getBlockSelect({
              block,
              select: select?.[field.name],
              selectMode
            });
            const rowPath = path + '.' + i;
            if (block) {
              row.id = row?.id || new ObjectId().toHexString();
              if (!omitParents && (!filter || filter(args))) {
                // Handle block `id` field
                const idKey = rowPath + '.id';
                state[idKey] = {
                  initialValue: row.id,
                  value: row.id
                };
                // If the blocks field fails filterOptions validation, add error paths to the individual blocks that are no longer allowed
                if (filterOptionsValidationResult?.invalidBlockSlugs?.length && filterOptionsValidationResult.invalidBlockSlugs.includes(row.blockType)) {
                  state[idKey].errorMessage = req.t('validation:invalidBlock', {
                    block: row.blockType
                  });
                  state[idKey].valid = false;
                  addErrorPathToParent(idKey);
                  // If the error is due to block filterOptions, we want the blocks field (fieldState) to include all the filterOptions-related
                  // error paths for each sub-block, not for the validation result of the block itself. Otherwise, say there are 2 invalid blocks,
                  // the blocks field will have 3 instead of 2 error paths - one for itself, and one for each invalid block.
                  // Instead, we want only the 2 error paths for the individual, invalid blocks.
                  fieldState.errorPaths = fieldState.errorPaths.filter(errorPath => errorPath !== path);
                }
                if (includeSchema) {
                  state[idKey].fieldSchema = includeSchema ? block.fields.find(blockField => fieldIsID(blockField)) : undefined;
                }
                // Handle `blockType` field
                const fieldKey = rowPath + '.blockType';
                state[fieldKey] = {
                  initialValue: row.blockType,
                  value: row.blockType
                };
                if (addedByServer) {
                  state[fieldKey].addedByServer = addedByServer;
                }
                if (includeSchema) {
                  state[fieldKey].fieldSchema = block.fields.find(blockField => 'name' in blockField && blockField.name === 'blockType');
                }
                // Handle `blockName` field
                const blockNameKey = rowPath + '.blockName';
                state[blockNameKey] = {};
                if (row.blockName) {
                  state[blockNameKey].initialValue = row.blockName;
                  state[blockNameKey].value = row.blockName;
                }
                if (includeSchema) {
                  state[blockNameKey].fieldSchema = block.fields.find(blockField => 'name' in blockField && blockField.name === 'blockName');
                }
              }
              acc.promises.push(iterateFields({
                id,
                addErrorPathToParent,
                anyParentLocalized: field.localized || anyParentLocalized,
                blockData: row,
                clientFieldSchemaMap,
                collectionSlug,
                data: row,
                fields: block.fields,
                fieldSchemaMap,
                filter,
                forceFullValue,
                fullData,
                includeSchema,
                mockRSCs,
                omitParents,
                operation,
                parentIndexPath: '',
                parentPassesCondition: passesCondition,
                parentPath: rowPath,
                parentSchemaPath: schemaPath + '.' + block.slug,
                permissions: fieldPermissions === true ? fieldPermissions : parentPermissions?.[field.name]?.blocks?.[block.slug] === true ? true : parentPermissions?.[field.name]?.blocks?.[block.slug]?.fields || {},
                preferences,
                previousFormState,
                readOnly,
                renderAllFields,
                renderFieldFn,
                req,
                select: typeof blockSelect === 'object' ? blockSelect : undefined,
                selectMode: blockSelectMode,
                skipConditionChecks,
                skipValidation,
                state
              }));
              // First, check if `previousFormState` has a matching row
              const previousRow = (previousFormState?.[path]?.rows || []).find(prevRow => prevRow.id === row.id);
              const newRow = {
                id: row.id,
                blockType: row.blockType,
                isLoading: false
              };
              if (previousRow?.lastRenderedPath) {
                newRow.lastRenderedPath = previousRow.lastRenderedPath;
              }
              acc.rowMetadata.push(newRow);
              const isCollapsed = isRowCollapsed({
                collapsedPrefs: preferences?.fields?.[path]?.collapsed,
                field,
                previousRow,
                row
              });
              if (isCollapsed) {
                acc.rowMetadata[acc.rowMetadata.length - 1].collapsed = true;
              }
            }
            return acc;
          }, {
            promises: [],
            rowMetadata: []
          });
          await Promise.all(promises);
          // Add values to field state
          if (data[field.name] === null) {
            fieldState.value = null;
            fieldState.initialValue = null;
          } else {
            fieldState.value = forceFullValue ? blocksValue : blocksValue.length;
            fieldState.initialValue = forceFullValue ? blocksValue : blocksValue.length;
            if (blocksValue.length > 0) {
              fieldState.disableFormData = true;
            }
          }
          fieldState.rows = rowMetadata;
          // Add field to state
          if (!omitParents && (!filter || filter(args))) {
            state[path] = fieldState;
          }
          break;
        }
      case 'group':
        {
          if (!filter || filter(args)) {
            fieldState.disableFormData = true;
            state[path] = fieldState;
          }
          const groupSelect = select?.[field.name];
          await iterateFields({
            id,
            addErrorPathToParent,
            anyParentLocalized: field.localized || anyParentLocalized,
            blockData,
            clientFieldSchemaMap,
            collectionSlug,
            data: data?.[field.name] || {},
            fields: field.fields,
            fieldSchemaMap,
            filter,
            forceFullValue,
            fullData,
            includeSchema,
            mockRSCs,
            omitParents,
            operation,
            parentIndexPath: '',
            parentPassesCondition: passesCondition,
            parentPath: path,
            parentSchemaPath: schemaPath,
            permissions: typeof fieldPermissions === 'boolean' ? fieldPermissions : fieldPermissions?.fields,
            preferences,
            previousFormState,
            readOnly,
            renderAllFields,
            renderFieldFn,
            req,
            select: typeof groupSelect === 'object' ? groupSelect : undefined,
            selectMode,
            skipConditionChecks,
            skipValidation,
            state
          });
          break;
        }
      case 'relationship':
      case 'upload':
        {
          if (field.filterOptions) {
            if (typeof field.filterOptions === 'object') {
              if (typeof field.relationTo === 'string') {
                fieldState.filterOptions = {
                  [field.relationTo]: field.filterOptions
                };
              } else {
                fieldState.filterOptions = field.relationTo.reduce((acc, relation) => {
                  acc[relation] = field.filterOptions;
                  return acc;
                }, {});
              }
            }
            if (typeof field.filterOptions === 'function') {
              const query = await resolveFilterOptions(field.filterOptions, {
                id,
                blockData,
                data: fullData,
                relationTo: field.relationTo,
                req,
                siblingData: data,
                user: req.user
              });
              fieldState.filterOptions = query;
            }
          }
          if (field.hasMany) {
            const relationshipValue = Array.isArray(data[field.name]) ? data[field.name].map(relationship => {
              if (Array.isArray(field.relationTo)) {
                return {
                  relationTo: relationship.relationTo,
                  value: relationship.value && typeof relationship.value === 'object' ? relationship.value?.id : relationship.value
                };
              }
              if (typeof relationship === 'object' && relationship !== null) {
                return relationship.id;
              }
              return relationship;
            }) : undefined;
            fieldState.value = relationshipValue;
            fieldState.initialValue = relationshipValue;
          } else if (Array.isArray(field.relationTo)) {
            if (data[field.name] && typeof data[field.name] === 'object' && 'relationTo' in data[field.name] && 'value' in data[field.name]) {
              const value = typeof data[field.name]?.value === 'object' && data[field.name]?.value && 'id' in data[field.name].value ? data[field.name].value.id : data[field.name].value;
              const relationshipValue = {
                relationTo: data[field.name]?.relationTo,
                value
              };
              fieldState.value = relationshipValue;
              fieldState.initialValue = relationshipValue;
            }
          } else {
            const relationshipValue = data[field.name] && typeof data[field.name] === 'object' && 'id' in data[field.name] ? data[field.name].id : data[field.name];
            fieldState.value = relationshipValue;
            fieldState.initialValue = relationshipValue;
          }
          if (!filter || filter(args)) {
            state[path] = fieldState;
          }
          break;
        }
      case 'select':
        {
          if (typeof field.filterOptions === 'function') {
            fieldState.selectFilterOptions = field.filterOptions({
              data: fullData,
              options: field.options,
              req,
              siblingData: data
            });
          }
          if (data[field.name] !== undefined) {
            fieldState.value = data[field.name];
            fieldState.initialValue = data[field.name];
          }
          if (!filter || filter(args)) {
            state[path] = fieldState;
          }
          break;
        }
      default:
        {
          if (data[field.name] !== undefined) {
            fieldState.value = data[field.name];
            fieldState.initialValue = data[field.name];
          }
          // Add field to state
          if (!filter || filter(args)) {
            state[path] = fieldState;
          }
          break;
        }
    }
  } else if (fieldHasSubFields(field) && !fieldAffectsData(field)) {
    // Handle field types that do not use names (row, collapsible, unnamed group etc)
    if (!filter || filter(args)) {
      state[path] = {
        disableFormData: true
      };
      if (passesCondition === false) {
        state[path].passesCondition = false;
      }
    }
    await iterateFields({
      id,
      mockRSCs,
      select,
      selectMode,
      // passthrough parent functionality
      addErrorPathToParent: addErrorPathToParentArg,
      anyParentLocalized: fieldIsLocalized(field) || anyParentLocalized,
      blockData,
      clientFieldSchemaMap,
      collectionSlug,
      data,
      fields: field.fields,
      fieldSchemaMap,
      filter,
      forceFullValue,
      fullData,
      includeSchema,
      omitParents,
      operation,
      parentIndexPath: indexPath,
      parentPassesCondition: passesCondition,
      parentPath: path,
      parentSchemaPath: schemaPath,
      permissions: parentPermissions,
      preferences,
      previousFormState,
      readOnly,
      renderAllFields,
      renderFieldFn,
      req,
      skipConditionChecks,
      skipValidation,
      state
    });
  } else if (field.type === 'tab') {
    const isNamedTab = tabHasName(field);
    let tabSelect;
    const tabField = {
      ...field,
      type: 'tab'
    };
    let childPermissions = undefined;
    if (isNamedTab) {
      const shouldContinue = stripUnselectedFields({
        field: tabField,
        select,
        selectMode,
        siblingDoc: data?.[field.name] || {}
      });
      if (!shouldContinue) {
        return;
      }
      if (parentPermissions === true) {
        childPermissions = true;
      } else {
        const tabPermissions = parentPermissions?.[field.name];
        if (tabPermissions === true) {
          childPermissions = true;
        } else {
          childPermissions = tabPermissions?.fields;
        }
      }
      if (typeof select?.[field.name] === 'object') {
        tabSelect = select?.[field.name];
      }
    } else {
      childPermissions = parentPermissions;
      tabSelect = select;
    }
    const pathSegments = path ? path.split('.') : [];
    // If passesCondition is false then this should always result to false
    // If the tab has no admin.condition provided then fallback to passesCondition and let that decide the result
    let tabPassesCondition = passesCondition;
    if (passesCondition && typeof field.admin?.condition === 'function') {
      tabPassesCondition = field.admin.condition(fullData, data, {
        blockData,
        operation,
        path: pathSegments,
        user: req.user
      });
    }
    if (field?.id) {
      state[field.id] = {
        passesCondition: tabPassesCondition
      };
    }
    return iterateFields({
      id,
      addErrorPathToParent: addErrorPathToParentArg,
      anyParentLocalized: field.localized || anyParentLocalized,
      blockData,
      clientFieldSchemaMap,
      collectionSlug,
      data: isNamedTab ? data?.[field.name] || {} : data,
      fields: field.fields,
      fieldSchemaMap,
      filter,
      forceFullValue,
      fullData,
      includeSchema,
      mockRSCs,
      omitParents,
      operation,
      parentIndexPath: indexPath,
      parentPassesCondition: tabPassesCondition,
      parentPath: path,
      parentSchemaPath: schemaPath,
      permissions: childPermissions,
      preferences,
      previousFormState,
      readOnly,
      renderAllFields,
      renderFieldFn,
      req,
      select: tabSelect,
      selectMode,
      skipConditionChecks,
      skipValidation,
      state
    });
  } else if (field.type === 'tabs') {
    return iterateFields({
      id,
      addErrorPathToParent: addErrorPathToParentArg,
      anyParentLocalized: fieldIsLocalized(field) || anyParentLocalized,
      blockData,
      clientFieldSchemaMap,
      collectionSlug,
      data,
      fields: field.tabs.map(tab => ({
        ...tab,
        type: 'tab'
      })),
      fieldSchemaMap,
      filter,
      forceFullValue,
      fullData,
      includeSchema,
      omitParents,
      operation,
      parentIndexPath: indexPath,
      parentPassesCondition: passesCondition,
      parentPath: path,
      parentSchemaPath: schemaPath,
      permissions: parentPermissions,
      preferences,
      previousFormState,
      renderAllFields,
      renderFieldFn,
      req,
      select,
      selectMode,
      skipConditionChecks,
      skipValidation,
      state
    });
  } else if (field.type === 'ui') {
    if (!filter || filter(args)) {
      state[path] = fieldState;
      state[path].disableFormData = true;
    }
  }
  if (renderFieldFn && !fieldIsHiddenOrDisabled(field)) {
    const fieldConfig = fieldSchemaMap.get(schemaPath);
    if (!fieldConfig && !mockRSCs) {
      if (schemaPath.endsWith('.blockType')) {
        return;
      } else {
        throw new Error(`Field config not found for ${schemaPath}`);
      }
    }
    if (!state[path]) {
      // Some fields (ie `Tab`) do not live in form state
      // therefore we cannot attach customComponents to them
      return;
    }
    if (addedByServer) {
      state[path].addedByServer = addedByServer;
    }
    renderFieldFn({
      id,
      clientFieldSchemaMap,
      collectionSlug,
      data: fullData,
      fieldConfig: fieldConfig,
      fieldSchemaMap,
      fieldState: state[path],
      formState: state,
      indexPath,
      lastRenderedPath,
      mockRSCs,
      operation,
      parentPath,
      parentSchemaPath,
      path,
      permissions: fieldPermissions,
      preferences,
      previousFieldState: previousFormState?.[path],
      readOnly,
      renderAllFields,
      req,
      schemaPath,
      siblingData: data
    });
  }
};
//# sourceMappingURL=addFieldStatePromise.js.map