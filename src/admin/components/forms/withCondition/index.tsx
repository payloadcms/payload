'use client';

import React from 'react';
import { FieldBase } from '../../../../fields/config/types';
import { WatchCondition } from './WatchCondition';

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

    const [showField, setShowField] = React.useState(false);

    if (showField) {
      return (
        <React.Fragment>
          <WatchCondition
            path={path}
            name={name}
            condition={condition}
            setShowField={setShowField}
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
        setShowField={setShowField}
      />
    );
  };

  return CheckForCondition;
};

export default withCondition;
