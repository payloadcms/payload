import { getBlockSelect, getDefaultValue, stripUnselectedFields } from 'payload';
import { fieldAffectsData, tabHasName } from 'payload/shared';
import { iterateFields } from './iterateFields.js';
// TODO: Make this works for rich text subfields
export const defaultValuePromise = async ({
  id,
  data,
  field,
  locale,
  req,
  select,
  selectMode,
  siblingData,
  user
}) => {
  const shouldContinue = stripUnselectedFields({
    field,
    select,
    selectMode,
    siblingDoc: siblingData
  });
  if (!shouldContinue) {
    return;
  }
  if (fieldAffectsData(field)) {
    if (typeof siblingData[field.name] === 'undefined' && typeof field.defaultValue !== 'undefined') {
      try {
        siblingData[field.name] = await getDefaultValue({
          defaultValue: field.defaultValue,
          locale,
          req,
          user,
          value: siblingData[field.name]
        });
      } catch (err) {
        req.payload.logger.error({
          err,
          msg: `Error calculating default value for field: ${field.name}`
        });
      }
    }
  }
  // Traverse subfields
  switch (field.type) {
    case 'array':
      {
        const rows = siblingData[field.name];
        if (Array.isArray(rows)) {
          const promises = [];
          const arraySelect = select?.[field.name];
          rows.forEach(row => {
            promises.push(iterateFields({
              id,
              data,
              fields: field.fields,
              locale,
              req,
              select: typeof arraySelect === 'object' ? arraySelect : undefined,
              selectMode,
              siblingData: row,
              user
            }));
          });
          await Promise.all(promises);
        }
        break;
      }
    case 'blocks':
      {
        const rows = siblingData[field.name];
        if (Array.isArray(rows)) {
          const promises = [];
          rows.forEach(row => {
            const blockTypeToMatch = row.blockType;
            const block = req.payload.blocks[blockTypeToMatch] ?? (field.blockReferences ?? field.blocks).find(blockType => typeof blockType !== 'string' && blockType.slug === blockTypeToMatch);
            const {
              blockSelect,
              blockSelectMode
            } = getBlockSelect({
              block,
              select: select?.[field.name],
              selectMode
            });
            if (block) {
              row.blockType = blockTypeToMatch;
              promises.push(iterateFields({
                id,
                data,
                fields: block.fields,
                locale,
                req,
                select: typeof blockSelect === 'object' ? blockSelect : undefined,
                selectMode: blockSelectMode,
                siblingData: row,
                user
              }));
            }
          });
          await Promise.all(promises);
        }
        break;
      }
    case 'collapsible':
    case 'row':
      {
        await iterateFields({
          id,
          data,
          fields: field.fields,
          locale,
          req,
          select,
          selectMode,
          siblingData,
          user
        });
        break;
      }
    case 'group':
      {
        if (fieldAffectsData(field)) {
          if (typeof siblingData[field.name] !== 'object') {
            siblingData[field.name] = {};
          }
          const groupData = siblingData[field.name];
          const groupSelect = select?.[field.name];
          await iterateFields({
            id,
            data,
            fields: field.fields,
            locale,
            req,
            select: typeof groupSelect === 'object' ? groupSelect : undefined,
            selectMode,
            siblingData: groupData,
            user
          });
        } else {
          await iterateFields({
            id,
            data,
            fields: field.fields,
            locale,
            req,
            select,
            selectMode,
            siblingData,
            user
          });
        }
        break;
      }
    case 'tab':
      {
        let tabSiblingData;
        const isNamedTab = tabHasName(field);
        let tabSelect;
        if (isNamedTab) {
          if (typeof siblingData[field.name] !== 'object') {
            siblingData[field.name] = {};
          }
          tabSiblingData = siblingData[field.name];
          if (typeof select?.[field.name] === 'object') {
            tabSelect = select?.[field.name];
          }
        } else {
          tabSiblingData = siblingData;
          tabSelect = select;
        }
        await iterateFields({
          id,
          data,
          fields: field.fields,
          locale,
          req,
          select: tabSelect,
          selectMode,
          siblingData: tabSiblingData,
          user
        });
        break;
      }
    case 'tabs':
      {
        await iterateFields({
          id,
          data,
          fields: field.tabs.map(tab => ({
            ...tab,
            type: 'tab'
          })),
          locale,
          req,
          select,
          selectMode,
          siblingData,
          user
        });
        break;
      }
    default:
      {
        break;
      }
  }
};
//# sourceMappingURL=promise.js.map