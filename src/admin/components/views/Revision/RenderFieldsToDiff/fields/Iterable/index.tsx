import React from 'react';
import RenderFieldsToDiff from '../..';
import { Props } from '../types';
import Label from '../../Label';
import { ArrayField, BlockField, Field, fieldAffectsData } from '../../../../../../../fields/config/types';
import getUniqueListBy from '../../../../../../../utilities/getUniqueListBy';

import './index.scss';

const baseClass = 'iterable-diff';

const Iterable: React.FC<Props & { field: ArrayField | BlockField }> = ({
  revision,
  comparison,
  permissions,
  field,
  locale,
  locales,
  fieldComponents,
}) => {
  const revisionRowCount = Array.isArray(revision) ? revision.length : 0;
  const comparisonRowCount = Array.isArray(comparison) ? comparison.length : 0;
  const maxRows = Math.max(revisionRowCount, comparisonRowCount);

  return (
    <div className={baseClass}>
      {field.label && (
        <Label>
          {locale && (
          <span className={`${baseClass}__locale-label`}>{locale}</span>
          )}
          {field.label}
        </Label>
      )}
      {maxRows > 0 && (
        <React.Fragment>
          {Array.from(Array(maxRows).keys()).map((row, i) => {
            const revisionRow = revision?.[i] || {};
            const comparisonRow = comparison?.[i] || {};

            let subFields: Field[] = [];

            if (field.type === 'array') subFields = field.fields;

            if (field.type === 'blocks') {
              subFields = [
                {
                  name: 'blockType',
                  label: 'Block Type',
                  type: 'text',
                },
              ];

              if (revisionRow?.blockType === comparisonRow?.blockType) {
                const matchedBlock = field.blocks.find((block) => block.slug === revisionRow?.blockType) || { fields: [] };
                subFields = [
                  ...subFields,
                  ...matchedBlock.fields,
                ];
              } else {
                const matchedRevisionBlock = field.blocks.find((block) => block.slug === revisionRow?.blockType) || { fields: [] };
                const matchedComparisonBlock = field.blocks.find((block) => block.slug === comparisonRow?.blockType) || { fields: [] };

                subFields = getUniqueListBy<Field>([
                  ...subFields,
                  ...matchedRevisionBlock.fields,
                  ...matchedComparisonBlock.fields,
                ], 'name');
              }
            }

            return (
              <div
                className={`${baseClass}__wrap`}
                key={i}
              >
                <RenderFieldsToDiff
                  locales={locales}
                  revision={revisionRow}
                  comparison={comparisonRow}
                  fieldPermissions={permissions}
                  fields={subFields.filter((subField) => !(fieldAffectsData(subField) && subField.name === 'id'))}
                  fieldComponents={fieldComponents}
                />
              </div>
            );
          })}
        </React.Fragment>
      )}
      {maxRows === 0 && (
        <div className={`${baseClass}__no-rows`}>
          No
          {' '}
          {field.labels.plural}
          {' '}
          found
        </div>
      )}
    </div>
  );
};

export default Iterable;
