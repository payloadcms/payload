'use client';

import React from 'react';
import { FieldBase } from '../../../../fields/config/types';
import { WatchCondition } from './WatchCondition';
import { useFormFields } from '../Form/context';

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
      path,
      admin: {
        condition,
      } = {},
    } = props as Partial<FieldBase> & {
      path?: string
    };

    const passesCondition = useFormFields(([fields]) => fields[path]?.passesCondition);

    if (passesCondition) {
      return (
        <React.Fragment>
          <WatchCondition
            path={path}
            name={name}
            condition={condition}
          />
          <Field {...props} />
        </React.Fragment>
      );
    }

    return (
      <WatchCondition
        path={path}
        name={name}
        condition={condition}
      />
    );
  };

  return CheckForCondition;
};

export default withCondition;
