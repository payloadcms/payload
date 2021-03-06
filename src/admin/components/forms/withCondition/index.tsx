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
    const field = getField(path);
    const siblingData = getSiblingData(path);
    const passesCondition = condition ? condition(data, siblingData) : true;
    const fieldExists = Boolean(field);

    useEffect(() => {
      if (!passesCondition && fieldExists) {
        dispatchFields({ type: 'REMOVE', path });
      }
    }, [dispatchFields, passesCondition, path, fieldExists]);

    if (passesCondition) {
      return <Field {...props} />;
    }

    return null;
  };

  return CheckForCondition;
};

export default withCondition;
