'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { appendUploadSelectFields, formatAdminURL } from 'payload/shared';
import * as qs from 'qs-esm';
import React, { createContext, use, useCallback, useEffect, useReducer, useRef } from 'react';
import { useDebounce } from '../../../hooks/useDebounce.js';
import { useConfig } from '../../../providers/Config/index.js';
import { useLocale } from '../../../providers/Locale/index.js';
import { useTranslation } from '../../../providers/Translation/index.js';
import { reducer } from './reducer.js';
const Context = /*#__PURE__*/createContext({});
export const RelationshipProvider = t0 => {
  const $ = _c(15);
  const {
    children
  } = t0;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = {};
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  const [documents, dispatchDocuments] = useReducer(reducer, t1);
  const debouncedDocuments = useDebounce(documents, 100);
  const {
    config: t2
  } = useConfig();
  const {
    collections,
    routes: t3
  } = t2;
  const {
    api
  } = t3;
  const {
    i18n
  } = useTranslation();
  const {
    code: locale
  } = useLocale();
  const prevLocale = useRef(locale);
  let t4;
  if ($[1] !== api || $[2] !== collections || $[3] !== debouncedDocuments || $[4] !== i18n || $[5] !== locale) {
    t4 = t5 => {
      const reloadAll = t5 === undefined ? false : t5;
      Object.entries(debouncedDocuments).forEach(async t6 => {
        const [slug, docs] = t6;
        const idsToLoad = [];
        Object.entries(docs).forEach(t7 => {
          const [id, value] = t7;
          if (value === null || reloadAll) {
            idsToLoad.push(id);
          }
        });
        if (idsToLoad.length > 0) {
          const url = formatAdminURL({
            apiRoute: api,
            path: `/${slug}`
          });
          const params = new URLSearchParams();
          const select = {};
          params.append("depth", "0");
          params.append("limit", "250");
          const collection = collections.find(c => c.slug === slug);
          if (collection.admin.enableListViewSelectAPI) {
            const fieldToSelect = collection.admin.useAsTitle ?? "id";
            select[fieldToSelect] = true;
            if (collection.upload) {
              appendUploadSelectFields({
                collectionConfig: collection,
                select
              });
            }
          }
          if (locale) {
            params.append("locale", locale);
          }
          const idsToString = idsToLoad.map(_temp);
          params.append("where[id][in]", idsToString.join(","));
          const query = `?${params.toString()}&${qs.stringify({
            select
          })}`;
          const result = await fetch(`${url}${query}`, {
            credentials: "include",
            headers: {
              "Accept-Language": i18n.language
            }
          });
          if (result.ok) {
            const json = await result.json();
            if (json.docs) {
              dispatchDocuments({
                type: "ADD_LOADED",
                docs: json.docs,
                idsToLoad,
                relationTo: slug
              });
            }
          } else {
            dispatchDocuments({
              type: "ADD_LOADED",
              docs: [],
              idsToLoad,
              relationTo: slug
            });
          }
        }
      });
    };
    $[1] = api;
    $[2] = collections;
    $[3] = debouncedDocuments;
    $[4] = i18n;
    $[5] = locale;
    $[6] = t4;
  } else {
    t4 = $[6];
  }
  const loadRelationshipDocs = t4;
  let t5;
  let t6;
  if ($[7] !== loadRelationshipDocs || $[8] !== locale) {
    t5 = () => {
      loadRelationshipDocs(locale && prevLocale.current !== locale);
      prevLocale.current = locale;
    };
    t6 = [locale, loadRelationshipDocs];
    $[7] = loadRelationshipDocs;
    $[8] = locale;
    $[9] = t5;
    $[10] = t6;
  } else {
    t5 = $[9];
    t6 = $[10];
  }
  useEffect(t5, t6);
  let t7;
  if ($[11] === Symbol.for("react.memo_cache_sentinel")) {
    t7 = relationships => {
      dispatchDocuments({
        type: "REQUEST",
        docs: relationships
      });
    };
    $[11] = t7;
  } else {
    t7 = $[11];
  }
  const getRelationships = t7;
  let t8;
  if ($[12] !== children || $[13] !== documents) {
    t8 = _jsx(Context, {
      value: {
        documents,
        getRelationships
      },
      children
    });
    $[12] = children;
    $[13] = documents;
    $[14] = t8;
  } else {
    t8 = $[14];
  }
  return t8;
};
export const useListRelationships = () => use(Context);
function _temp(id_0) {
  return String(id_0);
}
//# sourceMappingURL=index.js.map