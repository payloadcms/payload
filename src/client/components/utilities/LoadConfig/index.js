import { Component } from 'react';
import { connect } from 'react-redux';

import config from '~local/payload.config.js';

const mapDispatch = dispatch => ({
  loadConfig: payload => dispatch({ type: 'LOAD_CONFIG', payload })
})

class LoadConfig extends Component {
  componentDidMount() {
    this.props.loadConfig(config);
  }

  render() {
    return null;
  }
}

export default connect(null, mapDispatch)(LoadConfig);
