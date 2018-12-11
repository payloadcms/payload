import { Component } from 'react';
import { connect } from 'react-redux';

const mapDispatchToProps = dispatch => ({
  set: nav => dispatch({ type: 'SET_STEP_NAV', payload: nav })
});

class SetStepNav extends Component {
  componentDidMount() {
    this.props.set(this.props.nav);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.nav !== this.props.nav) {
      this.props.set(this.props.nav);
    }
  }

  render() { return null; }
}

export default connect(null, mapDispatchToProps)(SetStepNav);
