import React from 'react';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';
import qs from 'qs';

const mapState = state => ({
  config: state.common.config,
  locale: state.common.locale,
  searchParams: state.common.searchParams
})

const Localizer = props => {
  const { languages } = props.config.localization;

  return (
    <div className="localizer">
      <span>{props.locale}</span>
      <ul>
        {languages.map((lang, i) => {

          const newParams = {
            ...props.searchParams,
            lang: lang
          };

          const search = qs.stringify(newParams);

          return (
            <li key={i}>
              <Link to={{ search }}>
                {lang}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  )
}

export default withRouter(connect(mapState)(Localizer));
