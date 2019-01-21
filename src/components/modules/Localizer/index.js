import React from 'react';
import { connect } from 'react-redux';

const mapState = state => ({
  config: state.common.config
})

const Localizer = props => {

  if (props.config) {
    const { languages } = props.config.localization;

    return (
      <div className="localizer">
        <span></span>
      </div>
    )
  }

  return null;
}

export default connect(mapState)(Localizer);
