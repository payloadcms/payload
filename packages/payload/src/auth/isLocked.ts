const isLocked = (date: number): boolean => !!(date && date > Date.now());
export default isLocked;
