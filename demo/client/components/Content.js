import { Component } from 'react';
import { connect } from 'react-redux';
import Page from '../../Page/Page.config';
import Order from '../../Order/Order.config';

const collections = [
  Page,
  Order
];

const mapDispatchToProps = dispatch => ({
  loadCollections: data => dispatch({ type: 'LOAD_COLLECTIONS', payload: data }),
});

class Content extends Component {

  componentDidMount() {
    this.props.loadCollections(collections);
  }

  render() {
    return false;
  }
}

export default connect(null, mapDispatchToProps)(Content);
