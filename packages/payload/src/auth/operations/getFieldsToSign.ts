/* eslint-disable no-param-reassign */
import { User } from '..';
import { CollectionConfig } from '../../collections/config/types';
import { Field, fieldAffectsData, TabAsField, tabHasName } from '../../fields/config/types';

type TraverseFieldsArgs = {
  fields: (Field | TabAsField)[]
  data: Record<string, unknown>
  result: Record<string, unknown>
}
const traverseFields = ({
  // parent,
  fields,
  data,
  result,
}: TraverseFieldsArgs) => {
  fields.forEach((field) => {
    switch (field.type) {
      case 'row':
      case 'collapsible': {
        traverseFields({
          fields: field.fields,
          data,
          result,
        });
        break;
      }
      case 'group': {
        let targetResult;
        if (typeof field.saveToJWT === 'string') {
          targetResult = field.saveToJWT;
          result[field.saveToJWT] = data[field.name];
        } else if (field.saveToJWT) {
          targetResult = field.name;
          result[field.name] = data[field.name];
        }
        const groupData: Record<string, unknown> = data[field.name] as Record<string, unknown>;
        const groupResult = (targetResult ? result[targetResult] : result) as Record<string, unknown>;
        traverseFields({
          fields: field.fields,
          data: groupData,
          result: groupResult,
        });
        break;
      }
      case 'tabs': {
        traverseFields({
          fields: field.tabs.map((tab) => ({ ...tab, type: 'tab' })),
          data,
          result,
        });
        break;
      }
      case 'tab': {
        if (tabHasName(field)) {
          let targetResult;
          if (typeof field.saveToJWT === 'string') {
            targetResult = field.saveToJWT;
            result[field.saveToJWT] = data[field.name];
          } else if (field.saveToJWT) {
            targetResult = field.name;
            result[field.name] = data[field.name];
          }
          const tabData: Record<string, unknown> = data[field.name] as Record<string, unknown>;
          const tabResult = (targetResult ? result[targetResult] : result) as Record<string, unknown>;
          traverseFields({
            fields: field.fields,
            data: tabData,
            result: tabResult,
          });
        } else {
          traverseFields({
            fields: field.fields,
            data,
            result,
          });
        }
        break;
      }
      default:
        if (fieldAffectsData(field)) {
          if (field.saveToJWT) {
            if (typeof field.saveToJWT === 'string') {
              result[field.saveToJWT] = data[field.name];
              delete result[field.name];
            } else {
              result[field.name] = data[field.name] as Record<string, unknown>;
            }
          } else if (field.saveToJWT === false) {
            delete result[field.name];
          }
        }
    }
  });
  return result;
};
export const getFieldsToSign = (args: {
  collectionConfig: CollectionConfig,
  user: User
  email: string
}): Record<string, unknown> => {
  const {
    collectionConfig,
    user,
    email,
  } = args;

  const result: Record<string, unknown> = {
    email,
    id: user.id,
    collection: collectionConfig.slug,
  };

  traverseFields({
    fields: collectionConfig.fields,
    data: user,
    result,
  });

  return result;
};
