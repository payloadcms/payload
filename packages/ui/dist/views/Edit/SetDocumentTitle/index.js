'use client';

import { c as _c } from "react/compiler-runtime";
import { useEffect, useRef } from 'react';
import { useFormFields } from '../../../forms/Form/context.js';
import { useDocumentTitle } from '../../../providers/DocumentTitle/index.js';
import { useTranslation } from '../../../providers/Translation/index.js';
import { formatDocTitle } from '../../../utilities/formatDocTitle/index.js';
export const SetDocumentTitle = props => {
  const $ = _c(14);
  const {
    collectionConfig,
    config,
    fallback,
    globalConfig
  } = props;
  const useAsTitle = collectionConfig?.admin?.useAsTitle;
  let t0;
  if ($[0] !== useAsTitle) {
    t0 = t1 => {
      const [fields] = t1;
      return useAsTitle && fields && fields?.[useAsTitle] || null;
    };
    $[0] = useAsTitle;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const field = useFormFields(t0);
  const hasInitialized = useRef(false);
  const {
    i18n
  } = useTranslation();
  const {
    setDocumentTitle
  } = useDocumentTitle();
  const dateFormatFromConfig = config?.admin?.dateFormat;
  const t1 = field?.value || "";
  let t2;
  if ($[2] !== collectionConfig || $[3] !== dateFormatFromConfig || $[4] !== fallback || $[5] !== globalConfig || $[6] !== i18n || $[7] !== t1 || $[8] !== useAsTitle) {
    t2 = formatDocTitle({
      collectionConfig,
      data: {
        id: "",
        [useAsTitle]: t1
      },
      dateFormat: dateFormatFromConfig,
      fallback,
      globalConfig,
      i18n
    });
    $[2] = collectionConfig;
    $[3] = dateFormatFromConfig;
    $[4] = fallback;
    $[5] = globalConfig;
    $[6] = i18n;
    $[7] = t1;
    $[8] = useAsTitle;
    $[9] = t2;
  } else {
    t2 = $[9];
  }
  const title = t2;
  let t3;
  let t4;
  if ($[10] !== setDocumentTitle || $[11] !== title) {
    t3 = () => {
      if (!hasInitialized.current) {
        hasInitialized.current = true;
        return;
      }
      setDocumentTitle(title);
    };
    t4 = [setDocumentTitle, title];
    $[10] = setDocumentTitle;
    $[11] = title;
    $[12] = t3;
    $[13] = t4;
  } else {
    t3 = $[12];
    t4 = $[13];
  }
  useEffect(t3, t4);
  return null;
};
//# sourceMappingURL=index.js.map