import formatName from './formatName';

const combineParentName = (parent, name) => formatName(`${parent ? `${parent}_` : ''}${name}`);

export default combineParentName;
