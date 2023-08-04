import { Field } from 'payload/types';
import toSnakeCase from 'to-snake-case';
import { fieldAffectsData } from 'payload/dist/fields/config/types';
import { PostgresAdapter } from '../types';

type Args = {
  adapter: PostgresAdapter
  columnPrefix?: string
  data: Record<string, unknown>
  fields: Field[]
  locale: string
  localeRow: Record<string, unknown>
  relationshipRows: Record<string, unknown>[]
  row: Record<string, unknown>
  tableName: string
}

export const traverseFields = async ({
  adapter,
  columnPrefix,
  data,
  fields,
  locale,
  localeRow,
  relationshipRows,
  row,
  tableName,
}: Args) => {
  let targetRow = row;

  fields.forEach((field) => {
    let columnName: string;

    if (fieldAffectsData(field)) {
      columnName = `${columnPrefix || ''}${toSnakeCase(field.name)}`;

      if (field.localized) {
        targetRow = localeRow;
      }
    }

    switch (field.type) {
      case 'number': {
        // TODO: handle hasMany
        targetRow[columnName] = data[columnName];
        break;
      }

      case 'select': {
        break;
      }

      case 'array': {
        break;
      }

      case 'blocks': {
        // field.blocks.forEach((block) => {
        //   const baseColumns: Record<string, AnyPgColumnBuilder> = {
        //     _order: integer('_order').notNull(),
        //     _path: text('_path').notNull(),
        //     _parentID: parentIDColumnMap[parentIDColType]('_parent_id').references(() => adapter.tables[tableName].id).notNull(),
        //   };

        //   if (field.localized && adapter.payload.config.localization) {
        //     baseColumns._locale = adapter.enums._locales('_locale').notNull();
        //   }

        //   const blockTableName = `${tableName}_${toSnakeCase(block.slug)}`;

        //   if (!adapter.tables[blockTableName]) {
        //     const { arrayBlockRelations: subArrayBlockRelations } = buildTable({
        //       adapter,
        //       baseColumns,
        //       fields: block.fields,
        //       tableName: blockTableName,
        //     });

        //     const blockTableRelations = relations(adapter.tables[blockTableName], ({ many, one }) => {
        //       const result: Record<string, Relation<string>> = {
        //         _parentID: one(adapter.tables[tableName], {
        //           fields: [adapter.tables[blockTableName]._parentID],
        //           references: [adapter.tables[tableName].id],
        //         }),
        //       };

        //       if (field.localized) {
        //         result._locales = many(adapter.tables[`${blockTableName}_locales`]);
        //       }

        //       subArrayBlockRelations.forEach((val, key) => {
        //         result[key] = many(adapter.tables[val]);
        //       });

        //       return result;
        //     });

        //     adapter.relations[blockTableName] = blockTableRelations;
        //   }

        //   arrayBlockRelations.set(`_${fieldPrefix || ''}${field.name}`, blockTableName);
        // });

        break;
      }

      case 'group': {
        // Todo: determine what should happen if groups are set to localized
        // const { hasLocalizedField: groupHasLocalizedField } = traverseFields({
        //   adapter,
        //   arrayBlockRelations,
        //   buildRelationships,
        //   columnPrefix: `${columnName}_`,
        //   columns,
        //   fieldPrefix: `${fieldPrefix || ''}${field.name}_`,
        //   fields: field.fields,
        //   indexes,
        //   localesColumns,
        //   localesIndexes,
        //   tableName,
        //   relationships,
        // });

        // if (groupHasLocalizedField) hasLocalizedField = true;

        break;
      }

      case 'tabs': {
        // field.tabs.forEach((tab) => {
        //   if ('name' in tab) {
        //     const { hasLocalizedField: tabHasLocalizedField } = traverseFields({
        //       adapter,
        //       arrayBlockRelations,
        //       buildRelationships,
        //       columnPrefix: `${columnName}_`,
        //       columns,
        //       fieldPrefix: `${fieldPrefix || ''}${tab.name}_`,
        //       fields: tab.fields,
        //       indexes,
        //       localesColumns,
        //       localesIndexes,
        //       tableName,
        //       relationships,
        //     });

        //     if (tabHasLocalizedField) hasLocalizedField = true;
        //   } else {
        //     ({ hasLocalizedField } = traverseFields({
        //       adapter,
        //       arrayBlockRelations,
        //       buildRelationships,
        //       columns,
        //       fields: tab.fields,
        //       indexes,
        //       localesColumns,
        //       localesIndexes,
        //       tableName,
        //       relationships,
        //     }));
        //   }
        // });
        break;
      }

      case 'row':
      case 'collapsible': {
        // ({ hasLocalizedField } = traverseFields({
        //   adapter,
        //   arrayBlockRelations,
        //   buildRelationships,
        //   columns,
        //   fields: field.fields,
        //   indexes,
        //   localesColumns,
        //   localesIndexes,
        //   tableName,
        //   relationships,
        // }));
        break;
      }

      case 'relationship':
      case 'upload':
        // if (Array.isArray(field.relationTo)) {
        //   field.relationTo.forEach((relation) => relationships.add(relation));
        // } else {
        //   relationships.add(field.relationTo);
        // }
        break;

      default: {
        if (typeof data[field.name] !== 'undefined') {
          targetRow[field.name] = data[field.name];
        }
        break;
      }
    }
  });
};
