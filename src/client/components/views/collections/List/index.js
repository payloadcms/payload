import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import DefaultList from './Default';
import customComponents from '../../../customComponents';
import { useStepNav } from '../../../elements/StepNav';
import formatListFields from './formatListFields';

import './index.scss';

const ListView = (props) => {
  const {
    collection,
    collection: {
      slug,
      labels: {
        plural,
      },
    },
  } = props;
  const { setStepNav } = useStepNav();

  const [fields, setFields] = useState(collection.fields);

  useEffect(() => {
    setFields(formatListFields(collection));
  }, [collection]);

  useEffect(() => {
    setStepNav([
      {
        label: plural,
      },
    ]);
  }, [setStepNav, plural]);

  const List = customComponents?.[slug]?.views?.List || DefaultList;

  return (
    <>
      <List collection={{ ...collection, fields }} />
    </>
  );
};

ListView.propTypes = {
  collection: PropTypes.shape({
    labels: PropTypes.shape({
      singular: PropTypes.string,
      plural: PropTypes.string,
    }),
    slug: PropTypes.string,
    useAsTitle: PropTypes.string,
    fields: PropTypes.arrayOf(PropTypes.shape),
    timestamps: PropTypes.bool,
  }).isRequired,
};

export default ListView;
