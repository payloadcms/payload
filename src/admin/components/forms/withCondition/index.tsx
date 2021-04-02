import React, { useEffect } from 'react';
import { FieldBase } from '../../../../fields/config/types';
import { useWatchForm } from '../Form/context';

const withCondition = <P extends Record<string, unknown>>(Field: React.ComponentType<P>): React.FC<P> => {
  const CheckForCondition: React.FC<P> = (props) => {
    const {
      admin: {
        condition,
      } = {},
    } = props as FieldBase;

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
    } = props as FieldBase & {
      path?: string
    };

    const path = pathFromProps || name;

    const { getData, getSiblingData, getField, dispatchFields } = useWatchForm();

    const data = getData();
    const siblingData = getSiblingData(path);
    const passesCondition = condition ? condition(data, siblingData) : true;

    useEffect(() => {
      if (!passesCondition) {
        const field = getField(path);
        dispatchFields({
          ...field,
          path,
          valid: true,
        });
      }
    }, [passesCondition, getField, dispatchFields, path]);

    if (passesCondition) {
      return <Field {...props} />;
    }

    return null;
  };

  return CheckForCondition;
};

export default withCondition;
