'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import { getFieldPaths, toKebabCase } from 'payload/shared';
import React, { useCallback, useEffect, useState } from 'react';
import { useCollapsible } from '../../elements/Collapsible/provider.js';
import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js';
import { useFormFields } from '../../forms/Form/index.js';
import { RenderFields } from '../../forms/RenderFields/index.js';
import { useField } from '../../forms/useField/index.js';
import { withCondition } from '../../forms/withCondition/index.js';
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js';
import { usePreferences } from '../../providers/Preferences/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { FieldDescription } from '../FieldDescription/index.js';
import { fieldBaseClass } from '../shared/index.js';
import { TabsProvider } from './provider.js';
import { TabComponent } from './Tab/index.js';
import './index.scss';
const baseClass = 'tabs-field';
export { TabsProvider };
const TabsFieldComponent = props => {
  const $ = _c(43);
  const {
    field: t0,
    forceRender: t1,
    indexPath: t2,
    parentPath: t3,
    parentSchemaPath: t4,
    path: t5,
    permissions,
    readOnly,
    schemaPath: t6
  } = props;
  const {
    admin: t7,
    tabs: t8
  } = t0;
  let t9;
  if ($[0] !== t7) {
    t9 = t7 === undefined ? {} : t7;
    $[0] = t7;
    $[1] = t9;
  } else {
    t9 = $[1];
  }
  const {
    className
  } = t9;
  let t10;
  if ($[2] !== t8) {
    t10 = t8 === undefined ? [] : t8;
    $[2] = t8;
    $[3] = t10;
  } else {
    t10 = $[3];
  }
  const tabs = t10;
  const forceRender = t1 === undefined ? false : t1;
  const indexPath = t2 === undefined ? "" : t2;
  const parentPath = t3 === undefined ? "" : t3;
  const parentSchemaPath = t4 === undefined ? "" : t4;
  const path = t5 === undefined ? "" : t5;
  const schemaPath = t6 === undefined ? "" : t6;
  const {
    getPreference,
    setPreference
  } = usePreferences();
  const {
    preferencesKey
  } = useDocumentInfo();
  const {
    i18n
  } = useTranslation();
  const {
    isWithinCollapsible
  } = useCollapsible();
  let t11;
  if ($[4] !== tabs) {
    t11 = t12 => {
      const [fields] = t12;
      return tabs.map((tab, index) => {
        const id = tab?.id;
        return {
          index,
          passesCondition: fields?.[id]?.passesCondition ?? true,
          tab
        };
      });
    };
    $[4] = tabs;
    $[5] = t11;
  } else {
    t11 = $[5];
  }
  const tabStates = useFormFields(t11);
  let t12;
  if ($[6] !== tabStates) {
    t12 = () => tabStates.filter(_temp)?.[0]?.index ?? 0;
    $[6] = tabStates;
    $[7] = t12;
  } else {
    t12 = $[7];
  }
  const [activeTabIndex, setActiveTabIndex] = useState(t12);
  const tabsPrefKey = `tabs-${indexPath}`;
  const activeTabInfo = tabStates[activeTabIndex];
  const activeTabConfig = activeTabInfo?.tab;
  const activeTabDescription = activeTabConfig.admin?.description ?? activeTabConfig.description;
  const activeTabStaticDescription = typeof activeTabDescription === "function" ? activeTabDescription({
    i18n,
    t: i18n.t
  }) : activeTabDescription;
  const hasVisibleTabs = tabStates.some(_temp2);
  let t13;
  if ($[8] !== getPreference || $[9] !== path || $[10] !== preferencesKey || $[11] !== setPreference || $[12] !== tabsPrefKey) {
    t13 = async incomingTabIndex => {
      setActiveTabIndex(incomingTabIndex);
      const existingPreferences = await getPreference(preferencesKey);
      if (preferencesKey) {
        setPreference(preferencesKey, {
          ...existingPreferences,
          ...(path ? {
            fields: {
              ...(existingPreferences?.fields || {}),
              [path]: {
                ...existingPreferences?.fields?.[path],
                tabIndex: incomingTabIndex
              }
            }
          } : {
            fields: {
              ...existingPreferences?.fields,
              [tabsPrefKey]: {
                ...existingPreferences?.fields?.[tabsPrefKey],
                tabIndex: incomingTabIndex
              }
            }
          })
        });
      }
    };
    $[8] = getPreference;
    $[9] = path;
    $[10] = preferencesKey;
    $[11] = setPreference;
    $[12] = tabsPrefKey;
    $[13] = t13;
  } else {
    t13 = $[13];
  }
  const handleTabChange = t13;
  let t14;
  if ($[14] !== getPreference || $[15] !== path || $[16] !== preferencesKey || $[17] !== tabsPrefKey) {
    t14 = () => {
      if (preferencesKey) {
        const getInitialPref = async () => {
          const existingPreferences_0 = await getPreference(preferencesKey);
          const initialIndex = path ? existingPreferences_0?.fields?.[path]?.tabIndex : existingPreferences_0?.fields?.[tabsPrefKey]?.tabIndex;
          const newIndex = initialIndex || 0;
          setActiveTabIndex(newIndex);
        };
        getInitialPref();
      }
    };
    $[14] = getPreference;
    $[15] = path;
    $[16] = preferencesKey;
    $[17] = tabsPrefKey;
    $[18] = t14;
  } else {
    t14 = $[18];
  }
  let t15;
  if ($[19] !== getPreference || $[20] !== parentPath || $[21] !== parentSchemaPath || $[22] !== path || $[23] !== preferencesKey || $[24] !== tabs || $[25] !== tabsPrefKey) {
    t15 = [path, getPreference, preferencesKey, tabsPrefKey, tabs, parentPath, parentSchemaPath];
    $[19] = getPreference;
    $[20] = parentPath;
    $[21] = parentSchemaPath;
    $[22] = path;
    $[23] = preferencesKey;
    $[24] = tabs;
    $[25] = tabsPrefKey;
    $[26] = t15;
  } else {
    t15 = $[26];
  }
  useEffect(t14, t15);
  let t16;
  if ($[27] !== activeTabInfo?.passesCondition || $[28] !== handleTabChange || $[29] !== tabStates) {
    t16 = () => {
      if (activeTabInfo?.passesCondition === false) {
        const nextTab = tabStates.find(_temp3);
        if (nextTab) {
          handleTabChange(nextTab.index);
        }
      }
    };
    $[27] = activeTabInfo?.passesCondition;
    $[28] = handleTabChange;
    $[29] = tabStates;
    $[30] = t16;
  } else {
    t16 = $[30];
  }
  let t17;
  if ($[31] !== activeTabInfo || $[32] !== handleTabChange || $[33] !== tabStates) {
    t17 = [activeTabInfo, tabStates, handleTabChange];
    $[31] = activeTabInfo;
    $[32] = handleTabChange;
    $[33] = tabStates;
    $[34] = t17;
  } else {
    t17 = $[34];
  }
  useEffect(t16, t17);
  const t18 = isWithinCollapsible && `${baseClass}--within-collapsible`;
  const t19 = !hasVisibleTabs && `${baseClass}--hidden`;
  let t20;
  if ($[35] !== className || $[36] !== t18 || $[37] !== t19) {
    t20 = [fieldBaseClass, className, baseClass, t18, t19].filter(Boolean);
    $[35] = className;
    $[36] = t18;
    $[37] = t19;
    $[38] = t20;
  } else {
    t20 = $[38];
  }
  let t21;
  if ($[39] !== activeTabIndex || $[40] !== handleTabChange || $[41] !== path) {
    t21 = t22 => {
      const {
        index: index_0,
        passesCondition: passesCondition_2,
        tab: tab_0
      } = t22;
      return _jsx(TabComponent, {
        hidden: !passesCondition_2,
        isActive: activeTabIndex === index_0,
        parentPath: path,
        setIsActive: () => {
          handleTabChange(index_0);
        },
        tab: tab_0
      }, index_0);
    };
    $[39] = activeTabIndex;
    $[40] = handleTabChange;
    $[41] = path;
    $[42] = t21;
  } else {
    t21 = $[42];
  }
  return _jsx("div", {
    className: t20.join(" "),
    children: _jsxs(TabsProvider, {
      children: [_jsx("div", {
        className: `${baseClass}__tabs-wrap`,
        children: _jsx("div", {
          className: `${baseClass}__tabs`,
          children: tabStates.map(t21)
        })
      }), _jsx("div", {
        className: `${baseClass}__content-wrap`,
        children: activeTabConfig && _jsx(TabContent, {
          description: activeTabStaticDescription,
          field: activeTabConfig,
          forceRender,
          hidden: false,
          parentIndexPath: indexPath,
          parentPath: path,
          parentSchemaPath: schemaPath,
          path,
          permissions: permissions && typeof permissions === "object" && "name" in activeTabConfig ? permissions[activeTabConfig.name] && typeof permissions[activeTabConfig.name] === "object" && "fields" in permissions[activeTabConfig.name] ? permissions[activeTabConfig.name].fields : permissions[activeTabConfig.name] : permissions,
          readOnly,
          tabIndex: activeTabIndex
        })
      })]
    })
  });
};
export const TabsField = withCondition(TabsFieldComponent);
function TabContent(t0) {
  const $ = _c(21);
  const {
    description,
    field,
    forceRender,
    hidden,
    label,
    parentIndexPath,
    parentPath,
    parentSchemaPath,
    permissions,
    readOnly,
    tabIndex
  } = t0;
  const {
    i18n
  } = useTranslation();
  const {
    customComponents: t1
  } = useField();
  let t2;
  let t3;
  if ($[0] !== description || $[1] !== field || $[2] !== forceRender || $[3] !== hidden || $[4] !== i18n || $[5] !== label || $[6] !== parentIndexPath || $[7] !== parentPath || $[8] !== parentSchemaPath || $[9] !== permissions || $[10] !== readOnly || $[11] !== t1 || $[12] !== tabIndex) {
    t3 = Symbol.for("react.early_return_sentinel");
    bb0: {
      const {
        AfterInput,
        BeforeInput,
        Description,
        Field
      } = t1 === undefined ? {} : t1;
      if (Field) {
        t3 = Field;
        break bb0;
      }
      const {
        indexPath,
        path,
        schemaPath
      } = getFieldPaths({
        field,
        index: tabIndex,
        parentIndexPath,
        parentPath,
        parentSchemaPath
      });
      const t4 = hidden && `${baseClass}__tab--hidden`;
      let t5;
      if ($[15] !== i18n || $[16] !== label) {
        t5 = label && `${baseClass}__tabConfigLabel-${toKebabCase(getTranslation(label, i18n))}`;
        $[15] = i18n;
        $[16] = label;
        $[17] = t5;
      } else {
        t5 = $[17];
      }
      let t6;
      if ($[18] !== t4 || $[19] !== t5) {
        t6 = [t4, `${baseClass}__tab`, t5].filter(Boolean);
        $[18] = t4;
        $[19] = t5;
        $[20] = t6;
      } else {
        t6 = $[20];
      }
      t2 = _jsxs("div", {
        className: t6.join(" "),
        children: [_jsx(RenderCustomComponent, {
          CustomComponent: Description,
          Fallback: _jsx(FieldDescription, {
            description,
            marginPlacement: "bottom",
            path: parentPath
          })
        }), BeforeInput, _jsx(RenderFields, {
          fields: field.fields,
          forceRender,
          parentIndexPath: indexPath,
          parentPath: path,
          parentSchemaPath: schemaPath,
          permissions,
          readOnly
        }), AfterInput]
      });
    }
    $[0] = description;
    $[1] = field;
    $[2] = forceRender;
    $[3] = hidden;
    $[4] = i18n;
    $[5] = label;
    $[6] = parentIndexPath;
    $[7] = parentPath;
    $[8] = parentSchemaPath;
    $[9] = permissions;
    $[10] = readOnly;
    $[11] = t1;
    $[12] = tabIndex;
    $[13] = t2;
    $[14] = t3;
  } else {
    t2 = $[13];
    t3 = $[14];
  }
  if (t3 !== Symbol.for("react.early_return_sentinel")) {
    return t3;
  }
  return t2;
}
function _temp(t0) {
  const {
    passesCondition
  } = t0;
  return passesCondition;
}
function _temp2(t0) {
  const {
    passesCondition: passesCondition_0
  } = t0;
  return passesCondition_0;
}
function _temp3(t0) {
  const {
    passesCondition: passesCondition_1
  } = t0;
  return passesCondition_1;
}
//# sourceMappingURL=index.js.map