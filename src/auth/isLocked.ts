const isLocked = (date) => !!(date && date > Date.now());
export default isLocked;
