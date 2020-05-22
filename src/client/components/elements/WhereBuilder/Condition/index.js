import React, { useState } from 'react';
import PropTypes from 'prop-types';
import ReactSelect from '../../ReactSelect';
import Button from '../../Button';

import './index.scss';

const baseClass = 'condition';

const Condition = (props) => {
  const {
    fields,
    handleChange,
    hideRelation,
    relation,
  } = props;

  const [condition, setCondition] = useState({});

  return (
    <div className={baseClass}>
      {!hideRelation && (
        <div className={`${baseClass}__label`}>
          {relation === 'and' && 'And'}
          {relation === 'or' && 'Or'}
        </div>
      )}
      <div className={`${baseClass}__wrap`}>
        <div className={`${baseClass}__field`}>
          <ReactSelect onChange={() => console.log('changing')} />
        </div>
        <div className={`${baseClass}__operator`}>
          <ReactSelect onChange={() => console.log('changing')} />
        </div>
        <div className={`${baseClass}__value`}>
          <ReactSelect onChange={() => console.log('changing')} />
        </div>
      </div>
      <div className={`${baseClass}__actions`}>
        <Button
          icon="x"
          round
          buttonStyle="none"
          onClick={() => console.log('remove')}
        />
        <Button
          icon="plus"
          round
          buttonStyle="none"
          onClick={() => console.log('add')}
        />
      </div>
    </div>
  );
};

Condition.defaultProps = {
  relation: 'and',
  hideRelation: false,
};

Condition.propTypes = {
  hideRelation: PropTypes.bool,
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      name: PropTypes.string,
      type: PropTypes.string,
    }),
  ).isRequired,
  handleChange: PropTypes.func.isRequired,
  relation: PropTypes.oneOf(['and', 'or']),
};

export default Condition;
