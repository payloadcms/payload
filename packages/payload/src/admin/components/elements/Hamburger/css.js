import { createUseStyles } from 'react-jss';
import vars, { colors, base } from '../../../css/vars';

export default createUseStyles({
  hamburger: {
    position: 'relative',
    padding: '0',
    border: '0',
    cursor: 'pointer',
    width: base(),
    height: base(),
    backgroundColor: 'transparent',
    '&:focus': {
      outline: 'none',
    },
  },
  hamburgerLayer: {
    transition: 'all linear 250ms',
    backgroundColor: colors.darkGray,
    width: base(),
    height: `${vars.strokeWidth}px`,
    position: 'absolute',
  },
  hamburgerTop: {
    extend: 'hamburgerLayer',
    top: `${vars.strokeWidth}px`,
    transform: 'translate3d(0, 0, 0) rotate(0)',
  },
  hamburgerMiddle: {
    extend: 'hamburgerLayer',
    top: '50%',
    transform: 'translate3d(0, -50%, 0) rotate(0)',
  },
  hamburgerBottom: {
    extend: 'hamburgerLayer',
    bottom: `${vars.strokeWidth}px`,
    transform: 'translate3d(0, 0, 0) rotate(0)',
  },
  isHovered: {
    backgroundColor: colors.lighterGray,
    '&:first-child': {
      transform: 'rotate(0, 0, 0)',
    },
    '&:last-child': {
      transform: 'rotate(0, 0, 0)',
    },
  },
});
