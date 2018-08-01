import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import Label from '../../type/Label';

import './index.css';

const mapStateToProps = state => ({
  nav: state.common.stepNav
});

class StepNav extends Component {
  render() {
    const dashboardLabel = <Label>Dashboard</Label>;

    return (
      <nav className="current-view-nav">
        {this.props.nav.length > 0
          ? <Link to="/">{dashboardLabel}</Link>
          : dashboardLabel
        }
        {this.props.nav.map((item, i) => {
          const StepLabel = <Label key={i}>{item.label}</Label>;

          const Step = this.props.nav.length === i + 1
            ? StepLabel
            : <Link to={item.url} key={i}>{StepLabel}</Link>;

          return Step;
        })}
      </nav>
    );
  }
}

export default connect(mapStateToProps)(StepNav);
