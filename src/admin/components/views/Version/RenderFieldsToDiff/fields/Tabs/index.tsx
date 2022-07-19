import React from 'react';
import RenderFieldsToDiff from '../..';
import { Props } from '../types';
import { TabsField } from '../../../../../../../fields/config/types';

const baseClass = 'tabs-diff';

const Tabs: React.FC<Props & { field: TabsField}> = ({
  version,
  comparison,
  permissions,
  field,
  locales,
  fieldComponents,
}) => (
  <div className={baseClass}>
    <div className={`${baseClass}__wrap`}>
      {field.tabs.map((tab, i) => {
        return (
          <RenderFieldsToDiff
            key={i}
            locales={locales}
            version={version}
            comparison={comparison}
            fieldPermissions={permissions}
            fields={tab.fields}
            fieldComponents={fieldComponents}
          />
        );
      })}
    </div>
  </div>
);

export default Tabs;
