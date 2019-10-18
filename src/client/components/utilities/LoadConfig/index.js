import { Component } from 'react';
import { connect } from 'react-redux';
import api from '../../../api';

const mapDispatch = dispatch => ({
  loadConfig: payload => dispatch({ type: 'LOAD_CONFIG', payload })
})

class LoadConfig extends Component {
  componentDidMount() {
    api.requests.get('/config').then((config) => {
      this.props.loadConfig(config)
    })
  }

  render() {
    return null;
  }
}

export default connect(null, mapDispatch)(LoadConfig);
