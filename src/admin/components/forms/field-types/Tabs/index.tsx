import React, { useState } from 'react';
import RenderFields from '../../RenderFields';
import withCondition from '../../withCondition';
import { Props } from './types';
import { fieldAffectsData } from '../../../../../fields/config/types';
import FieldDescription from '../../FieldDescription';
import toKebabCase from '../../../../../utilities/toKebabCase';

import './index.scss';

const baseClass = 'tabs-field';

const TabsField: React.FC<Props> = (props) => {
  const {
    tabs,
    fieldTypes,
    path,
    permissions,
    admin: {
      readOnly,
      className,
    },
  } = props;

  const [active, setActive] = useState(0);

  const activeTab = tabs[active];

  return (
    <div className={[
      className,
      baseClass,
    ].filter(Boolean).join(' ')}
    >
      <div className={`${baseClass}__tabs`}>
        {tabs.map((tab, i) => {
          return (
            <button
              key={i}
              type="button"
              className={`${baseClass}__tab`}
              onClick={() => setActive(i)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className={`${baseClass}__content-wrap`}>
        {activeTab && (
          <div className={[
            `${baseClass}__tab`,
            `${baseClass}__tab-${toKebabCase(activeTab.label)}`,
          ].join('')}
          >
            <FieldDescription
              description={activeTab.description}
            />
            <RenderFields
              forceRender
              readOnly={readOnly}
              permissions={permissions?.fields}
              fieldTypes={fieldTypes}
              fieldSchema={activeTab.fields.map((field) => ({
                ...field,
                path: `${path ? `${path}.` : ''}${fieldAffectsData(field) ? field.name : ''}`,
              }))}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default withCondition(TabsField);
