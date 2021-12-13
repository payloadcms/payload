import React from 'react';

const baseClass = 'iterable-diff';

type Props = {
  revision: string
  comparison: string
}

const Iterable: React.FC<Props> = ({ revision, comparison }) => (
  <div className={baseClass}>
    <div className={`${baseClass}__revision`}>
      {revision}
    </div>
    <div className={`${baseClass}__comparison`}>
      {comparison}
    </div>
  </div>
);

export default Iterable;
