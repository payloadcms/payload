'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { FieldContext, FieldPathContext, ServerFunctionsContext, ShimmerEffect, useServerFunctions } from '@payloadcms/ui';
import React, { useCallback, useEffect, useRef } from 'react';
/**
 * Utility to render a lexical editor on the client.
 *
 * @experimental - may break in minor releases
 * @todo - replace this with a general utility that works for all fields. Maybe merge with packages/ui/src/forms/RenderFields/RenderField.tsx
 */
export const RenderLexical = args => {
  const $ = _c(9);
  const {
    field,
    initialValue,
    Loading,
    path,
    schemaPath,
    setValue,
    value
  } = args;
  const [Component, setComponent] = React.useState(null);
  const serverFunctionContext = useServerFunctions();
  const {
    _internal_renderField
  } = serverFunctionContext;
  const [entityType, entitySlug] = schemaPath.split(".", 2);
  const fieldPath = path ?? (field && "name" in field ? field?.name : "") ?? "";
  let t0;
  if ($[0] !== _internal_renderField || $[1] !== field || $[2] !== initialValue || $[3] !== path || $[4] !== schemaPath) {
    t0 = () => {
      const render = async function render() {
        const {
          Field
        } = await _internal_renderField({
          field: {
            ...(field || {}),
            type: "richText",
            admin: {
              ...(field?.admin || {}),
              hidden: false
            }
          },
          initialValue: initialValue ?? undefined,
          path,
          schemaPath
        });
        setComponent(Field);
      };
      render();
    };
    $[0] = _internal_renderField;
    $[1] = field;
    $[2] = initialValue;
    $[3] = path;
    $[4] = schemaPath;
    $[5] = t0;
  } else {
    t0 = $[5];
  }
  const renderLexical = t0;
  const mounted = useRef(false);
  let t1;
  let t2;
  if ($[6] !== renderLexical) {
    t1 = () => {
      if (mounted.current) {
        return;
      }
      mounted.current = true;
      renderLexical();
    };
    t2 = [renderLexical];
    $[6] = renderLexical;
    $[7] = t1;
    $[8] = t2;
  } else {
    t1 = $[7];
    t2 = $[8];
  }
  useEffect(t1, t2);
  if (!Component) {
    return typeof Loading !== "undefined" ? Loading : _jsx(ShimmerEffect, {});
  }
  const adjustedServerFunctionContext = {
    ...serverFunctionContext,
    getFormState: async getFormStateArgs => serverFunctionContext.getFormState({
      ...getFormStateArgs,
      collectionSlug: entityType === "collection" ? entitySlug : undefined,
      globalSlug: entityType === "global" ? entitySlug : undefined
    })
  };
  if (typeof value === "undefined" && !setValue) {
    return _jsx(ServerFunctionsContext, {
      value: {
        ...adjustedServerFunctionContext
      },
      children: _jsx(FieldPathContext, {
        value: fieldPath,
        children: Component
      }, fieldPath)
    });
  }
  const fieldValue = {
    disabled: false,
    formInitializing: false,
    formProcessing: false,
    formSubmitted: false,
    initialValue: value,
    path: fieldPath,
    setValue: setValue ?? _temp,
    showError: false,
    value
  };
  return _jsx(ServerFunctionsContext, {
    value: {
      ...adjustedServerFunctionContext
    },
    children: _jsx(FieldPathContext, {
      value: fieldPath,
      children: _jsx(FieldContext, {
        value: fieldValue,
        children: Component
      })
    }, fieldPath)
  });
};
function _temp() {}
//# sourceMappingURL=index.js.map