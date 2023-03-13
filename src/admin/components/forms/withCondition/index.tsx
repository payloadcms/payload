'use client';

import React, { useEffect } from 'react';
import { FieldBase } from '../../../../fields/config/types';
import { useAllFormFields } from '../Form/context';
import getSiblingData from '../Form/getSiblingData';
import reduceFieldsToValues from '../Form/reduceFieldsToValues';

const withCondition = <P extends Record<string, unknown>>(Field: React.ComponentType<P>): React.FC<P> => {
  const CheckForCondition: React.FC<P> = (props) => {
    const {
      admin: {
        condition,
      } = {},
    } = props as Partial<FieldBase>;

    if (condition) {
      return <WithCondition {...props} />;
    }

    return <Field {...props} />;
  };

  const WithCondition: React.FC<P> = (props) => {
    const {
      name,
      path: pathFromProps,
      admin: {
        condition,
      } = {},
    } = props as Partial<FieldBase> & {
      path?: string
    };

    const path = typeof pathFromProps === 'string' ? pathFromProps : name;

    const [fields, dispatchFields] = useAllFormFields();

    const data = reduceFieldsToValues(fields, true);
    const siblingData = getSiblingData(fields, path);
    const hasCondition = Boolean(condition);
    const currentlyPassesCondition = hasCondition ? condition(data, siblingData) : true;
    const field = fields[path];
    const existingConditionPasses = field?.passesCondition;

    useEffect(() => {
      if (hasCondition) {
        if (!existingConditionPasses && currentlyPassesCondition) {
          dispatchFields({ type: 'MODIFY_CONDITION', path, result: true });
        }

        if (!currentlyPassesCondition && (existingConditionPasses || typeof existingConditionPasses === 'undefined')) {
          dispatchFields({ type: 'MODIFY_CONDITION', path, result: false });
        }
      }
    }, [currentlyPassesCondition, existingConditionPasses, dispatchFields, path, hasCondition]);

    if (currentlyPassesCondition) {
      return <Field {...props} />;
    }

    return null;
  };

  return CheckForCondition;
};

export default withCondition;
