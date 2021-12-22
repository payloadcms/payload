import React from 'react';
import { Props } from './types';
import { fieldAffectsData, fieldHasSubFields } from '../../../../../fields/config/types';
import Nested from './fields/Nested';

import './index.scss';

const baseClass = 'render-field-diffs';

const RenderFieldsToDiff: React.FC<Props> = ({
  fields,
  fieldComponents,
  fieldPermissions,
  revision,
  comparison,
  locales,
}) => (
  <div className={baseClass}>
    {fields.map((field, i) => {
      const Component = fieldComponents[field.type];

      const format = field.type === 'richText';

      if (Component) {
        if (fieldAffectsData(field)) {
          const revisionValue = revision[field.name];
          const comparisonValue = comparison?.[field.name];
          const hasPermission = fieldPermissions?.[field.name]?.read?.permission;
          const subFieldPermissions = fieldPermissions?.[field.name]?.fields;

          if (hasPermission === false) return null;

          if (field.localized) {
            return (
              <div
                className={`${baseClass}__field`}
                key={i}
              >
                {locales.map((locale) => {
                  const revisionLocaleValue = revisionValue?.[locale];
                  const comparisonLocaleValue = comparisonValue?.[locale];
                  return (
                    <div
                      className={`${baseClass}__locale`}
                      key={locale}
                    >
                      <div className={`${baseClass}__locale-value`}>
                        <Component
                          locale={locale}
                          locales={locales}
                          field={field}
                          fieldComponents={fieldComponents}
                          revision={revisionLocaleValue}
                          comparison={comparisonLocaleValue}
                          permissions={subFieldPermissions}
                          format={format}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          }

          return (
            <div
              className={`${baseClass}__field`}
              key={i}
            >
              <Component
                locales={locales}
                field={field}
                fieldComponents={fieldComponents}
                revision={revisionValue}
                comparison={comparisonValue}
                permissions={subFieldPermissions}
                format={format}
              />
            </div>
          );
        }

        // At this point, we are dealing with a `row` or similar
        if (fieldHasSubFields(field)) {
          return (
            <Nested
              key={i}
              locales={locales}
              disableGutter
              field={field}
              fieldComponents={fieldComponents}
              revision={revision}
              comparison={comparison}
              permissions={fieldPermissions}
            />
          );
        }
      }

      return null;
    })}
  </div>
);

export default RenderFieldsToDiff;
