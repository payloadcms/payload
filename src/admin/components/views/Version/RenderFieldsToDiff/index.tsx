import React from 'react';
import { DiffMethod } from 'react-diff-viewer-continued';
import { Props } from './types';
import { fieldAffectsData, fieldHasSubFields } from '../../../../../fields/config/types';
import Nested from './fields/Nested';
import { diffMethods } from './fields/diffMethods';

import './index.scss';

const baseClass = 'render-field-diffs';

const RenderFieldsToDiff: React.FC<Props> = ({
  fields,
  fieldComponents,
  fieldPermissions,
  version,
  comparison,
  locales,
}) => (
  <div className={baseClass}>
    {fields.map((field, i) => {
      const Component = fieldComponents[field.type];

      const isRichText = field.type === 'richText';
      const diffMethod: DiffMethod = diffMethods[field.type] || 'CHARS';

      if (Component) {
        if (fieldAffectsData(field)) {
          const valueIsObject = field.type === 'code' || field.type === 'json';
          const versionValue = valueIsObject ? JSON.stringify(version?.[field.name]) : version?.[field.name];
          const comparisonValue = valueIsObject ? JSON.stringify(comparison?.[field.name]) : comparison?.[field.name];
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
                  const versionLocaleValue = versionValue?.[locale];
                  const comparisonLocaleValue = comparisonValue?.[locale];
                  return (
                    <div
                      className={`${baseClass}__locale`}
                      key={locale}
                    >
                      <div className={`${baseClass}__locale-value`}>
                        <Component
                          diffMethod={diffMethod}
                          locale={locale}
                          locales={locales}
                          field={field}
                          fieldComponents={fieldComponents}
                          version={versionLocaleValue}
                          comparison={comparisonLocaleValue}
                          permissions={subFieldPermissions}
                          isRichText={isRichText}
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
                diffMethod={diffMethod}
                locales={locales}
                field={field}
                fieldComponents={fieldComponents}
                version={versionValue}
                comparison={comparisonValue}
                permissions={subFieldPermissions}
                isRichText={isRichText}
              />
            </div>
          );
        }

        if (field.type === 'tabs') {
          const Tabs = fieldComponents.tabs;

          return (
            <Tabs
              key={i}
              version={version}
              comparison={comparison}
              field={field}
              locales={locales}
              fieldComponents={fieldComponents}
            />
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
              version={version}
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
