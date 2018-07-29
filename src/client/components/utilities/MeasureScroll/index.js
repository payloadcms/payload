import { Component } from 'react';
import { connect } from 'react-redux';

const mapStateToProps = state => ({
  scrollPercentage: state.common.scrollPercentage,
  scrollPos: state.common.scrollPos
});

const mapDispatchToProps = dispatch => ({
  updateScroll: (pos) => dispatch({ type: 'UPDATE_SCROLL', payload: pos }),
  updateScrollPercentage : (percentage) => dispatch({ type: 'UPDATE_SCROLL_PERCENTAGE', payload: percentage })
});

class MeasureScroll extends Component {
  constructor(props) {
    super(props);

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // Throttle scroll event
    let ticking = false;
    let latestKnownScrollY = 0;
    let scrollPercentage = 0;

    this.updateScroll = () => {
      ticking = false;
      this.props.updateScroll(latestKnownScrollY);
      this.props.updateScrollPercentage(scrollPercentage);
    };

    this.onScroll = () => {
      const roundedPercent = 100;
      const roundedDecimal = 2;
      latestKnownScrollY = window.pageYOffset;
      scrollPercentage = (latestKnownScrollY / (document.body.scrollHeight - window.innerHeight) * roundedPercent).toFixed(roundedDecimal);
      this.requestTick();
    };

    this.requestTick = () => {
      if (!ticking) {
        requestAnimationFrame(this.updateScroll);
      }
      ticking = true;
    };
  }

  componentDidMount() {
    window.addEventListener('scroll', this.onScroll, false);
  }

  render() {
    return null;
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(MeasureScroll);
