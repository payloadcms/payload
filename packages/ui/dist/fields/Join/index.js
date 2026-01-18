'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import ObjectIdImport from 'bson-objectid';
import { fieldAffectsData, flattenTopLevelFields } from 'payload/shared';
import React, { useMemo } from 'react';
import { RelationshipTable } from '../../elements/RelationshipTable/index.js';
import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js';
import { useField } from '../../forms/useField/index.js';
import { withCondition } from '../../forms/withCondition/index.js';
import { useConfig } from '../../providers/Config/index.js';
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js';
import { FieldDescription } from '../FieldDescription/index.js';
import { FieldError } from '../FieldError/index.js';
import { FieldLabel } from '../FieldLabel/index.js';
import { fieldBaseClass } from '../index.js';
const ObjectId = 'default' in ObjectIdImport ? ObjectIdImport.default : ObjectIdImport;
/**
 * Recursively builds the default data for joined collection
 */
const getInitialDrawerData = ({
  collectionSlug,
  config,
  docID,
  fields,
  segments
}) => {
  const flattenedFields = flattenTopLevelFields(fields, {
    keepPresentationalFields: true
  });
  const path = segments[0];
  const field = flattenedFields.find(field => field.name === path);
  if (!field) {
    return null;
  }
  if (field.type === 'relationship' || field.type === 'upload') {
    let value = docID;
    if (Array.isArray(field.relationTo)) {
      value = {
        relationTo: collectionSlug,
        value: docID
      };
    }
    return {
      [field.name]: field.hasMany ? [value] : value
    };
  }
  const nextSegments = segments.slice(1, segments.length);
  if (field.type === 'tab' || field.type === 'group' && fieldAffectsData(field)) {
    return {
      [field.name]: getInitialDrawerData({
        collectionSlug,
        config,
        docID,
        fields: field.fields,
        segments: nextSegments
      })
    };
  }
  if (field.type === 'array') {
    const initialData = getInitialDrawerData({
      collectionSlug,
      config,
      docID,
      fields: field.fields,
      segments: nextSegments
    });
    initialData.id = ObjectId().toHexString();
    return {
      [field.name]: [initialData]
    };
  }
  if (field.type === 'blocks') {
    for (const _block of field.blockReferences ?? field.blocks) {
      const block = typeof _block === 'string' ? config.blocksMap[_block] : _block;
      const blockInitialData = getInitialDrawerData({
        collectionSlug,
        config,
        docID,
        fields: block.fields,
        segments: nextSegments
      });
      if (blockInitialData) {
        blockInitialData.id = ObjectId().toHexString();
        blockInitialData.blockType = block.slug;
        return {
          [field.name]: [blockInitialData]
        };
      }
    }
  }
};
const JoinFieldComponent = props => {
  const {
    field,
    field: {
      admin: {
        allowCreate,
        description
      },
      collection,
      label,
      localized,
      on,
      required
    },
    path: pathFromProps
  } = props;
  const {
    id: docID,
    docConfig
  } = useDocumentInfo();
  const {
    config,
    getEntityConfig
  } = useConfig();
  const {
    customComponents: {
      AfterInput,
      BeforeInput,
      Description,
      Error,
      Label
    } = {},
    path,
    showError,
    value
  } = useField({
    potentiallyStalePath: pathFromProps
  });
  const filterOptions = useMemo(() => {
    if (!docID) {
      return null;
    }
    let value_0 = docID;
    if (Array.isArray(field.targetField.relationTo)) {
      value_0 = {
        relationTo: docConfig.slug,
        value: value_0
      };
    }
    const where = Array.isArray(collection) ? {} : {
      [on]: {
        equals: value_0
      }
    };
    if (field.where) {
      return {
        and: [where, field.where]
      };
    }
    return where;
  }, [docID, collection, field.targetField.relationTo, field.where, on, docConfig?.slug]);
  const initialDrawerData = useMemo(() => {
    const relatedCollection = getEntityConfig({
      collectionSlug: Array.isArray(field.collection) ? field.collection[0] : field.collection
    });
    return getInitialDrawerData({
      collectionSlug: docConfig?.slug,
      config,
      docID,
      fields: relatedCollection?.fields,
      segments: field.on.split('.')
    });
  }, [getEntityConfig, field.collection, field.on, docConfig?.slug, docID, config]);
  if (!docConfig) {
    return null;
  }
  return /*#__PURE__*/_jsxs("div", {
    className: [fieldBaseClass, showError && 'error', 'join'].filter(Boolean).join(' '),
    id: `field-${path?.replace(/\./g, '__')}`,
    children: [/*#__PURE__*/_jsx(RenderCustomComponent, {
      CustomComponent: Error,
      Fallback: /*#__PURE__*/_jsx(FieldError, {
        path: path,
        showError: showError
      })
    }), /*#__PURE__*/_jsx(RelationshipTable, {
      AfterInput: AfterInput,
      allowCreate: typeof docID !== 'undefined' && allowCreate,
      BeforeInput: BeforeInput,
      disableTable: filterOptions === null,
      field: field,
      fieldPath: path,
      filterOptions: filterOptions,
      initialData: docID && value ? value : {
        docs: []
      },
      initialDrawerData: initialDrawerData,
      Label: /*#__PURE__*/_jsx("h4", {
        style: {
          margin: 0
        },
        children: Label || /*#__PURE__*/_jsx(FieldLabel, {
          label: label,
          localized: localized,
          path: path,
          required: required
        })
      }),
      parent: Array.isArray(collection) ? {
        id: docID,
        collectionSlug: docConfig.slug,
        joinPath: path
      } : undefined,
      relationTo: collection
    }), /*#__PURE__*/_jsx(RenderCustomComponent, {
      CustomComponent: Description,
      Fallback: /*#__PURE__*/_jsx(FieldDescription, {
        description: description,
        path: path
      })
    })]
  });
};
export const JoinField = withCondition(JoinFieldComponent);
//# sourceMappingURL=index.js.map