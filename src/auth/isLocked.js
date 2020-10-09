const isLocked = (date) => !!(date && date > Date.now());
module.exports = isLocked;
