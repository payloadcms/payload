export const getOffsetTop = element => {
  let el = element;
  // Set our distance placeholder
  let distance = 0;
  // Loop up the DOM
  if (el.offsetParent) {
    do {
      distance += el.offsetTop;
      el = el.offsetParent;
    } while (el);
  }
  // Return our distance
  return distance < 0 ? 0 : distance;
};
//# sourceMappingURL=getOffsetTop.js.map