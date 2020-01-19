import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useStepNav } from '../../../modules/StepNav';

import './index.scss';

const ListView = (props) => {
  const { setStepNav } = useStepNav();

  const { collection } = props;

  useEffect(() => {
    setStepNav([
      {
        label: collection.labels.plural,
      },
    ]);
  }, []);

  return (
    <article className="collection-list">
      <h1>{collection.labels.plural}</h1>
    </article>
  );
};

ListView.propTypes = {
  collection: PropTypes.shape({
    labels: PropTypes.shape({
      plural: PropTypes.string,
    }),
  }).isRequired,
};

export default ListView;
