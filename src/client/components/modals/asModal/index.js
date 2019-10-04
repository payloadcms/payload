///////////////////////////////////////////////////////
// Takes a modal component and
// a slug to match against a 'modal' URL param
///////////////////////////////////////////////////////

import React, { Component } from 'react';
import { createPortal } from 'react-dom';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import queryString from 'qs';
import { Close, Button } from 'payload/components';

import './index.scss';

const mapStateToProps = state => ({
  searchParams: state.common.searchParams
})

const asModal = (PassedComponent, modalSlug) => {

  class AsModal extends Component {

    constructor(props) {
      super(props);

      this.state = {
        open: false,
        el: null
      }
    }

    bindEsc = event => {
      if (event.keyCode === 27) {
        const params = { ...this.props.searchParams };
        delete params.modal;

        this.props.history.push({
          search: queryString.stringify(params)
        })
      }
    }

    isOpen = () => {

      // Slug can come from either a HOC or from a prop
      const slug = this.props.modalSlug ? this.props.modalSlug : modalSlug;

      if (this.props.searchParams.modal === slug) {
        return true;
      }

      return false;
    }

    componentDidMount() {
      document.addEventListener('keydown', this.bindEsc, false);

      if (this.isOpen()) {
        this.setState({ open: true })
      }

      // Slug can come from either a HOC or from a prop
      const slug = this.props.modalSlug ? this.props.modalSlug : modalSlug;

      this.setState({
        el: document.querySelector(`#${slug}`)
      })
    }

    componentWillUnmount() {
      document.removeEventListener('keydown', this.bindEsc, false);
    }

    componentDidUpdate(prevProps, prevState) {

      let open = this.isOpen();

      if (open !== prevState.open && open) {
        this.setState({ open: true })
      } else if (open !== prevState.open) {
        this.setState({ open: false })
      }
    }

    render() {

      // Slug can come from either a HOC or from a prop
      const slug = this.props.modalSlug ? this.props.modalSlug : modalSlug;
      const modalDomNode = document.getElementById('portal');

      return createPortal(
        <div className={`modal${this.state.open ? ' open' : ''}`}>
          <Button el="link" type="icon" className="close" to={{ search: '' }}>
            <Close />
          </Button>
          <PassedComponent id={slug} {...this.props} isOpen={this.state.open} />
        </div>,
        modalDomNode
      );
    }
  }

  return withRouter(connect(mapStateToProps)(AsModal));
}

export default asModal;
