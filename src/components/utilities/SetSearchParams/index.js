import { Component } from 'react'
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import qs from 'qs';

const mapDispatch = dispatch => ({
  setParams: params => dispatch({ type: 'SET_SEARCH_PARAMS', payload: params })
})

class SetSearchParams extends Component {

  setParams = () => {
    const params = qs.parse(
      this.props.location.search,
      { ignoreQueryPrefix: true }
    );

    this.props.setParams(params);
  }

  componentDidMount() {
    this.setParams();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.location !== this.props.location) {
      this.setParams();
    }
  }

  render() {
    return null;
  }
}

export default withRouter(connect(null, mapDispatch)(SetSearchParams));
