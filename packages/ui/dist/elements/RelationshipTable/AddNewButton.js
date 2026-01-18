'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import { Button } from '../../elements/Button/index.js';
import { Popup, PopupList } from '../Popup/index.js';
export const AddNewButton = ({
  allowCreate,
  baseClass,
  buttonStyle,
  className,
  collections,
  i18n,
  icon,
  label,
  onClick,
  permissions,
  relationTo
}) => {
  if (!allowCreate) {
    return null;
  }
  const isPolymorphic = Array.isArray(relationTo);
  if (!isPolymorphic) {
    return /*#__PURE__*/_jsx(Button, {
      buttonStyle: buttonStyle,
      className: className,
      onClick: () => onClick(),
      children: label
    });
  }
  return /*#__PURE__*/_jsx("div", {
    className: `${baseClass}__add-new-polymorphic-wrapper`,
    children: /*#__PURE__*/_jsx(Popup, {
      button: /*#__PURE__*/_jsx(Button, {
        buttonStyle: buttonStyle,
        className: className,
        icon: icon,
        children: label
      }),
      buttonType: "custom",
      horizontalAlign: "center",
      render: ({
        close: closePopup
      }) => /*#__PURE__*/_jsx(PopupList.ButtonGroup, {
        children: relationTo.map(relatedCollection => {
          if (permissions.collections[relatedCollection]?.create) {
            return /*#__PURE__*/_jsx(PopupList.Button, {
              className: `${baseClass}__relation-button--${relatedCollection}`,
              onClick: () => {
                closePopup();
                onClick(relatedCollection);
              },
              children: getTranslation(collections.find(each => each.slug === relatedCollection).labels.singular, i18n)
            }, relatedCollection);
          }
          return null;
        })
      }),
      size: "medium"
    })
  });
};
//# sourceMappingURL=AddNewButton.js.map