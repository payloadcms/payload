import React from 'react';
import { Props } from './types';
import fieldComponents from './fields';
import { fieldAffectsData } from '../../../../../fields/config/types';
import Label from './Label';

import './index.scss';

const baseClass = 'render-field-diffs';

const RenderFieldsToDiff: React.FC<Props> = ({ fields, fieldPermissions, revision, comparison, locales }) => (
  <div className={baseClass}>
    {fields.map((field, i) => {
      const Component = fieldComponents[field.type];
      if (Component) {
        if (fieldAffectsData(field)) {
          const revisionValue = revision[field.name];
          const comparisonValue = comparison?.[field.name];
          const hasPermission = fieldPermissions?.[field.name]?.read?.permission;

          if (!hasPermission) return null;

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
                          field={field}
                          revision={revisionLocaleValue}
                          comparison={comparisonLocaleValue}
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
                field={field}
                revision={revisionValue}
                comparison={comparisonValue}
              />
            </div>
          );
        }
      }

      return null;
    })}
  </div>
);

export default RenderFieldsToDiff;
