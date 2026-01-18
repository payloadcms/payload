'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { ShimmerEffect, useConfig } from '@payloadcms/ui';
import React, { lazy, Suspense, useEffect, useState } from 'react';
import { defaultEditorLexicalConfig } from '../lexical/config/client/default.js';
import { loadClientFeatures } from '../lexical/config/client/loader.js';
import { sanitizeClientEditorConfig } from '../lexical/config/client/sanitize.js';
const RichTextEditor = /*#__PURE__*/lazy(() => import('./Field.js').then(module => ({
  default: module.RichText
})));
export const RichTextField = props => {
  const $ = _c(18);
  const {
    admin: t0,
    clientFeatures,
    featureClientImportMap: t1,
    featureClientSchemaMap,
    field,
    lexicalEditorConfig: t2,
    schemaPath
  } = props;
  let t3;
  if ($[0] !== t0) {
    t3 = t0 === undefined ? {} : t0;
    $[0] = t0;
    $[1] = t3;
  } else {
    t3 = $[1];
  }
  const admin = t3;
  let t4;
  if ($[2] !== t1) {
    t4 = t1 === undefined ? {} : t1;
    $[2] = t1;
    $[3] = t4;
  } else {
    t4 = $[3];
  }
  const featureClientImportMap = t4;
  const lexicalEditorConfig = t2 === undefined ? defaultEditorLexicalConfig : t2;
  const {
    config
  } = useConfig();
  const [finalSanitizedEditorConfig, setFinalSanitizedEditorConfig] = useState(null);
  let t5;
  let t6;
  if ($[4] !== admin || $[5] !== clientFeatures || $[6] !== config || $[7] !== featureClientImportMap || $[8] !== featureClientSchemaMap || $[9] !== field || $[10] !== finalSanitizedEditorConfig || $[11] !== lexicalEditorConfig || $[12] !== schemaPath) {
    t5 = () => {
      if (finalSanitizedEditorConfig) {
        return;
      }
      const featureProvidersLocal = [];
      for (const clientFeature of Object.values(clientFeatures)) {
        if (!clientFeature.clientFeatureProvider) {
          continue;
        }
        featureProvidersLocal.push(clientFeature.clientFeatureProvider(clientFeature.clientFeatureProps));
      }
      const resolvedClientFeatures = loadClientFeatures({
        config,
        featureClientImportMap,
        featureClientSchemaMap,
        field,
        schemaPath: schemaPath ?? field.name,
        unSanitizedEditorConfig: {
          features: featureProvidersLocal,
          lexical: lexicalEditorConfig
        }
      });
      setFinalSanitizedEditorConfig(sanitizeClientEditorConfig(resolvedClientFeatures, lexicalEditorConfig, admin));
    };
    t6 = [admin, clientFeatures, config, featureClientImportMap, featureClientSchemaMap, field, finalSanitizedEditorConfig, lexicalEditorConfig, schemaPath];
    $[4] = admin;
    $[5] = clientFeatures;
    $[6] = config;
    $[7] = featureClientImportMap;
    $[8] = featureClientSchemaMap;
    $[9] = field;
    $[10] = finalSanitizedEditorConfig;
    $[11] = lexicalEditorConfig;
    $[12] = schemaPath;
    $[13] = t5;
    $[14] = t6;
  } else {
    t5 = $[13];
    t6 = $[14];
  }
  useEffect(t5, t6);
  let t7;
  if ($[15] !== finalSanitizedEditorConfig || $[16] !== props) {
    t7 = _jsx(Suspense, {
      fallback: _jsx(ShimmerEffect, {
        height: "35vh"
      }),
      children: finalSanitizedEditorConfig && _jsx(RichTextEditor, {
        ...props,
        editorConfig: finalSanitizedEditorConfig
      })
    });
    $[15] = finalSanitizedEditorConfig;
    $[16] = props;
    $[17] = t7;
  } else {
    t7 = $[17];
  }
  return t7;
};
//# sourceMappingURL=index.js.map