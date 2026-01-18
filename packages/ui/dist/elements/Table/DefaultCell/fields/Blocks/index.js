'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import React from 'react';
import { useConfig } from '../../../../../providers/Config/index.js';
import { useTranslation } from '../../../../../providers/Translation/index.js';
export const BlocksCell = t0 => {
  const $ = _c(2);
  const {
    cellData,
    field: t1
  } = t0;
  const {
    blockReferences,
    blocks,
    labels
  } = t1;
  const {
    i18n
  } = useTranslation();
  const {
    config
  } = useConfig();
  const selectedBlocks = Array.isArray(cellData) ? cellData.map(_temp) : [];
  const translatedBlockLabels = (blockReferences ?? blocks)?.map(b => {
    const block = typeof b === "string" ? config.blocksMap[b] : b;
    return {
      slug: block.slug,
      label: getTranslation(block.labels.singular, i18n)
    };
  });
  let label = `0 ${getTranslation(labels?.plural, i18n)}`;
  const formatBlockList = blocks_0 => blocks_0.map(b_0 => {
    const filtered = translatedBlockLabels.filter(f => f.slug === b_0)?.[0];
    return filtered?.label;
  }).join(", ");
  if (selectedBlocks.length > 5) {
    const more = selectedBlocks.length - 5;
    label = `${selectedBlocks.length} ${getTranslation(labels?.plural, i18n)} - ${i18n.t("fields:itemsAndMore", {
      count: more,
      items: formatBlockList(selectedBlocks.slice(0, 5))
    })}`;
  } else {
    if (selectedBlocks.length > 0) {
      label = `${selectedBlocks.length} ${getTranslation(selectedBlocks.length === 1 ? labels?.singular : labels?.plural, i18n)} - ${formatBlockList(selectedBlocks)}`;
    }
  }
  let t2;
  if ($[0] !== label) {
    t2 = _jsx("span", {
      children: label
    });
    $[0] = label;
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  return t2;
};
function _temp(t0) {
  const {
    blockType
  } = t0;
  return blockType;
}
//# sourceMappingURL=index.js.map