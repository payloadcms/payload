import { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import qs from 'qs';

const mapState = state => ({
  config: state.common.config
})

const mapDispatch = dispatch => ({
  setLocale: locale => dispatch({ type: 'SET_LOCALE', payload: locale })
})

class SetLocale extends Component {

  setLocale = () => {
    const params = qs.parse(
      this.props.location.search,
      { ignoreQueryPrefix: true }
    );

    if (params.lang && this.props.config.localization.languages[params.lang]) {
      this.props.setLocale(params.lang);
    } else {
      this.props.setLocale(this.props.config.localization.defaultLanguage);
    }
  }

  componentDidMount() {
    this.setLocale();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.location.search !== this.props.location.search) {
      this.setLocale();
    }
  }

  render() {
    return null;
  }
}

export default withRouter(connect(mapState, mapDispatch)(SetLocale));
