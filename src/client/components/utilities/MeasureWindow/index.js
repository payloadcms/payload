import { Component } from 'react';
import { connect } from 'react-redux';

const mapStateToProps = state => ({
  windowWidth: state.common.windowWidth,
  windowHeight: state.common.windowHeight
});

const mapDispatchToProps = dispatch => ({
  setWindowSize: (size) => dispatch({ type: 'SET_WINDOW_SIZE', payload: size }),
});

class MeasureWindow extends Component {
  constructor() {
    super();
    this.setSize = this.setSize.bind(this);
    this.onResize = this.onResize.bind(this);
  }

  setSize() {
    this.props.setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight
    });
  }

  onResize() {
    // Only resize on screens larger than mobile
    // To avoid toolbars hiding and orientation change
    const mobileWidth = 450;

    if (window.innerWidth > mobileWidth) {
      this.setSize();
    }
  }

  componentDidMount() {
    window.addEventListener('resize', this.onResize);

    window.addEventListener('orientationchange', () => {
      const delay = 500;
      setTimeout(() => {
        this.setSize();
      }, delay);
    });

    this.setSize();
  }

  render() {
    return false;
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(MeasureWindow);
