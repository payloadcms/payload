import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Arrow } from 'payload/components';

import './index.scss';

const mapStateToProps = state => ({
  nav: state.common.stepNav
});

class StepNav extends Component {
  render() {
    const dashboardLabel = <span>Dashboard</span>;

    return (
      <nav className="step-nav">
        {this.props.nav.length > 0
          ? <Link to="/">{dashboardLabel}<Arrow /></Link>
          : dashboardLabel
        }
        {this.props.nav.map((item, i) => {
          const StepLabel = <span key={i}>{item.label}</span>;

          const Step = this.props.nav.length === i + 1
            ? StepLabel
            : <Link to={item.url} key={i}>{StepLabel}<Arrow /></Link>;

          return Step;
        })}
      </nav>
    );
  }
}

export default connect(mapStateToProps)(StepNav);
