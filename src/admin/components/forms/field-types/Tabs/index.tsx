import React, { useState } from 'react';
import RenderFields from '../../RenderFields';
import withCondition from '../../withCondition';
import { Props } from './types';
import { fieldAffectsData, tabHasName } from '../../../../../fields/config/types';
import FieldDescription from '../../FieldDescription';
import toKebabCase from '../../../../../utilities/toKebabCase';
import { useCollapsible } from '../../../elements/Collapsible/provider';
import { TabsProvider } from './provider';

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

  const isWithinCollapsible = useCollapsible();
  const [active, setActive] = useState(0);

  const activeTab = tabs[active];

  return (
    <div className={[
      className,
      baseClass,
      isWithinCollapsible && `${baseClass}--within-collapsible`,
    ].filter(Boolean).join(' ')}
    >
      <TabsProvider>
        <div className={`${baseClass}__tabs-wrap`}>
          <div className={`${baseClass}__tabs`}>
            {tabs.map((tab, i) => {
              return (
                <button
                  key={i}
                  type="button"
                  className={[
                    `${baseClass}__tab-button`,
                    active === i && `${baseClass}__tab-button--active`,
                  ].filter(Boolean).join(' ')}
                  onClick={() => setActive(i)}
                >
                  {tab.label ? tab.label : (tabHasName(tab) && tab.name)}
                </button>
              );
            })}
          </div>
        </div>
        <div className={`${baseClass}__content-wrap`}>
          {activeTab && (
            <div className={[
              `${baseClass}__tab`,
              `${baseClass}__tab-${toKebabCase(activeTab.label)}`,
            ].join(' ')}
            >
              <FieldDescription
                className={`${baseClass}__description`}
                description={activeTab.description}
              />
              <RenderFields
                key={String(activeTab.label)}
                forceRender
                readOnly={readOnly}
                permissions={tabHasName(activeTab) ? permissions[activeTab.name].fields : permissions}
                fieldTypes={fieldTypes}
                fieldSchema={activeTab.fields.map((field) => ({
                  ...field,
                  path: `${path ? `${path}.` : ''}${tabHasName(activeTab) ? `${activeTab.name}.` : ''}${fieldAffectsData(field) ? field.name : ''}`,
                }))}
              />
            </div>
          )}
        </div>
      </TabsProvider>
    </div>
  );
};

export default withCondition(TabsField);
