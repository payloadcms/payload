'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { ArrayField } from '../../fields/Array/index.js';
import { BlocksField } from '../../fields/Blocks/index.js';
import { CheckboxField } from '../../fields/Checkbox/index.js';
import { CodeField } from '../../fields/Code/index.js';
import { CollapsibleField } from '../../fields/Collapsible/index.js';
import { DateTimeField } from '../../fields/DateTime/index.js';
import { EmailField } from '../../fields/Email/index.js';
import { GroupField } from '../../fields/Group/index.js';
import { HiddenField } from '../../fields/Hidden/index.js';
import { JoinField } from '../../fields/Join/index.js';
import { JSONField } from '../../fields/JSON/index.js';
import { NumberField } from '../../fields/Number/index.js';
import { PointField } from '../../fields/Point/index.js';
import { RadioGroupField } from '../../fields/RadioGroup/index.js';
import { RelationshipField } from '../../fields/Relationship/index.js';
import { RichTextField } from '../../fields/RichText/index.js';
import { RowField } from '../../fields/Row/index.js';
import { SelectField } from '../../fields/Select/index.js';
import { TabsField } from '../../fields/Tabs/index.js';
import { TextField } from '../../fields/Text/index.js';
import { TextareaField } from '../../fields/Textarea/index.js';
import { UIField } from '../../fields/UI/index.js';
import { UploadField } from '../../fields/Upload/index.js';
import { useFormFields } from '../../forms/Form/index.js';
export function RenderField(t0) {
  const $ = _c(13);
  const {
    clientFieldConfig,
    forceRender,
    indexPath,
    parentPath,
    parentSchemaPath,
    path,
    permissions,
    readOnly,
    schemaPath
  } = t0;
  let t1;
  if ($[0] !== path) {
    t1 = t2 => {
      const [fields] = t2;
      return fields && fields?.[path]?.customComponents?.Field;
    };
    $[0] = path;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const CustomField = useFormFields(t1);
  let t2;
  if ($[2] !== CustomField || $[3] !== clientFieldConfig || $[4] !== forceRender || $[5] !== indexPath || $[6] !== parentPath || $[7] !== parentSchemaPath || $[8] !== path || $[9] !== permissions || $[10] !== readOnly || $[11] !== schemaPath) {
    t2 = Symbol.for("react.early_return_sentinel");
    bb0: {
      const baseFieldProps = {
        forceRender,
        permissions,
        readOnly,
        schemaPath
      };
      if (clientFieldConfig.admin?.hidden) {
        t2 = _jsx(HiddenField, {
          ...baseFieldProps,
          path
        });
        break bb0;
      }
      if (CustomField !== undefined) {
        t2 = CustomField || null;
        break bb0;
      }
      const iterableFieldProps = {
        ...baseFieldProps,
        indexPath,
        parentPath,
        parentSchemaPath
      };
      switch (clientFieldConfig.type) {
        case "array":
          {
            t2 = _jsx(ArrayField, {
              ...iterableFieldProps,
              field: clientFieldConfig,
              path
            });
            break bb0;
          }
        case "blocks":
          {
            t2 = _jsx(BlocksField, {
              ...iterableFieldProps,
              field: clientFieldConfig,
              path
            });
            break bb0;
          }
        case "checkbox":
          {
            t2 = _jsx(CheckboxField, {
              ...baseFieldProps,
              field: clientFieldConfig,
              path
            });
            break bb0;
          }
        case "code":
          {
            t2 = _jsx(CodeField, {
              ...baseFieldProps,
              field: clientFieldConfig,
              path
            });
            break bb0;
          }
        case "collapsible":
          {
            t2 = _jsx(CollapsibleField, {
              ...iterableFieldProps,
              field: clientFieldConfig,
              path
            });
            break bb0;
          }
        case "date":
          {
            t2 = _jsx(DateTimeField, {
              ...baseFieldProps,
              field: clientFieldConfig,
              path
            });
            break bb0;
          }
        case "email":
          {
            t2 = _jsx(EmailField, {
              ...baseFieldProps,
              field: clientFieldConfig,
              path
            });
            break bb0;
          }
        case "group":
          {
            t2 = _jsx(GroupField, {
              ...iterableFieldProps,
              field: clientFieldConfig,
              path
            });
            break bb0;
          }
        case "join":
          {
            t2 = _jsx(JoinField, {
              ...baseFieldProps,
              field: clientFieldConfig,
              path
            });
            break bb0;
          }
        case "json":
          {
            t2 = _jsx(JSONField, {
              ...baseFieldProps,
              field: clientFieldConfig,
              path
            });
            break bb0;
          }
        case "number":
          {
            t2 = _jsx(NumberField, {
              ...baseFieldProps,
              field: clientFieldConfig,
              path
            });
            break bb0;
          }
        case "point":
          {
            t2 = _jsx(PointField, {
              ...baseFieldProps,
              field: clientFieldConfig,
              path
            });
            break bb0;
          }
        case "radio":
          {
            t2 = _jsx(RadioGroupField, {
              ...baseFieldProps,
              field: clientFieldConfig,
              path
            });
            break bb0;
          }
        case "relationship":
          {
            t2 = _jsx(RelationshipField, {
              ...baseFieldProps,
              field: clientFieldConfig,
              path
            });
            break bb0;
          }
        case "richText":
          {
            t2 = _jsx(RichTextField, {
              ...baseFieldProps,
              field: clientFieldConfig,
              path
            });
            break bb0;
          }
        case "row":
          {
            t2 = _jsx(RowField, {
              ...iterableFieldProps,
              field: clientFieldConfig
            });
            break bb0;
          }
        case "select":
          {
            t2 = _jsx(SelectField, {
              ...baseFieldProps,
              field: clientFieldConfig,
              path
            });
            break bb0;
          }
        case "tabs":
          {
            t2 = _jsx(TabsField, {
              ...iterableFieldProps,
              field: clientFieldConfig,
              path
            });
            break bb0;
          }
        case "text":
          {
            t2 = _jsx(TextField, {
              ...baseFieldProps,
              field: clientFieldConfig,
              path
            });
            break bb0;
          }
        case "textarea":
          {
            t2 = _jsx(TextareaField, {
              ...baseFieldProps,
              field: clientFieldConfig,
              path
            });
            break bb0;
          }
        case "ui":
          {
            t2 = _jsx(UIField, {});
            break bb0;
          }
        case "upload":
          {
            t2 = _jsx(UploadField, {
              ...baseFieldProps,
              field: clientFieldConfig,
              path
            });
            break bb0;
          }
      }
    }
    $[2] = CustomField;
    $[3] = clientFieldConfig;
    $[4] = forceRender;
    $[5] = indexPath;
    $[6] = parentPath;
    $[7] = parentSchemaPath;
    $[8] = path;
    $[9] = permissions;
    $[10] = readOnly;
    $[11] = schemaPath;
    $[12] = t2;
  } else {
    t2 = $[12];
  }
  if (t2 !== Symbol.for("react.early_return_sentinel")) {
    return t2;
  }
}
//# sourceMappingURL=RenderField.js.map