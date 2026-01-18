'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Button, DrawerToggler, ItemsDrawer, ReactSelect, useStepNav, useTranslation } from '@payloadcms/ui';
import { useEffect, useId } from 'react';
export function DashboardStepNav(t0) {
  const $ = _c(15);
  const {
    addWidget,
    cancel,
    isEditing,
    resetLayout,
    saveLayout,
    setIsEditing,
    widgets
  } = t0;
  const {
    t
  } = useTranslation();
  const {
    setStepNav
  } = useStepNav();
  const uuid = useId();
  const drawerSlug = `widgets-drawer-${uuid}`;
  let t1;
  let t2;
  if ($[0] !== cancel || $[1] !== drawerSlug || $[2] !== isEditing || $[3] !== resetLayout || $[4] !== saveLayout || $[5] !== setIsEditing || $[6] !== setStepNav) {
    t1 = () => {
      setStepNav([{
        label: _jsx(DashboardBreadcrumbDropdown, {
          isEditing,
          onCancel: cancel,
          onEditClick: () => setIsEditing(true),
          onResetLayout: resetLayout,
          onSaveChanges: saveLayout,
          widgetsDrawerSlug: drawerSlug
        })
      }]);
    };
    t2 = [isEditing, drawerSlug, cancel, resetLayout, saveLayout, setIsEditing, setStepNav];
    $[0] = cancel;
    $[1] = drawerSlug;
    $[2] = isEditing;
    $[3] = resetLayout;
    $[4] = saveLayout;
    $[5] = setIsEditing;
    $[6] = setStepNav;
    $[7] = t1;
    $[8] = t2;
  } else {
    t1 = $[7];
    t2 = $[8];
  }
  useEffect(t1, t2);
  let t3;
  if ($[9] !== addWidget || $[10] !== drawerSlug || $[11] !== isEditing || $[12] !== t || $[13] !== widgets) {
    t3 = _jsx(_Fragment, {
      children: isEditing && _jsx(ItemsDrawer, {
        drawerSlug,
        items: widgets,
        onItemClick: widget => addWidget(widget.slug),
        searchPlaceholder: t("dashboard:searchWidgets"),
        title: t("dashboard:addWidget")
      })
    });
    $[9] = addWidget;
    $[10] = drawerSlug;
    $[11] = isEditing;
    $[12] = t;
    $[13] = widgets;
    $[14] = t3;
  } else {
    t3 = $[14];
  }
  return t3;
}
export function DashboardBreadcrumbDropdown(props) {
  const {
    isEditing,
    onCancel,
    onEditClick,
    onResetLayout,
    onSaveChanges,
    widgetsDrawerSlug
  } = props;
  if (isEditing) {
    return /*#__PURE__*/_jsxs("div", {
      className: "dashboard-breadcrumb-dropdown__editing",
      children: [/*#__PURE__*/_jsx("span", {
        children: "Editing Dashboard"
      }), /*#__PURE__*/_jsxs("div", {
        className: "dashboard-breadcrumb-dropdown__actions",
        children: [/*#__PURE__*/_jsx(DrawerToggler, {
          className: "drawer-toggler--unstyled",
          slug: widgetsDrawerSlug,
          children: /*#__PURE__*/_jsx(Button, {
            buttonStyle: "pill",
            el: "span",
            size: "small",
            children: "Add +"
          })
        }), /*#__PURE__*/_jsx(Button, {
          buttonStyle: "pill",
          onClick: onSaveChanges,
          size: "small",
          children: "Save Changes"
        }), /*#__PURE__*/_jsx(Button, {
          buttonStyle: "pill",
          onClick: onCancel,
          size: "small",
          children: "Cancel"
        })]
      })]
    });
  }
  const options = [{
    label: 'Edit Dashboard',
    value: 'edit'
  }, {
    label: 'Reset Layout',
    value: 'reset'
  }];
  const handleChange = selectedOption => {
    // Since isMulti is false, we expect a single Option
    const option = Array.isArray(selectedOption) ? selectedOption[0] : selectedOption;
    if (option?.value === 'edit') {
      onEditClick();
    } else if (option?.value === 'reset') {
      onResetLayout();
    }
  };
  return /*#__PURE__*/_jsx(ReactSelect, {
    className: "dashboard-breadcrumb-select",
    isClearable: false,
    isSearchable: false,
    menuIsOpen: undefined,
    onChange: handleChange,
    options: options,
    placeholder: "Dashboard",
    value: {
      label: 'Dashboard',
      value: 'dashboard'
    }
  });
}
//# sourceMappingURL=DashboardStepNav.js.map