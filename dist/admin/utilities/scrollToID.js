"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrollToID = void 0;
const scrollToID = (id) => {
    const element = document.getElementById(id);
    if (element) {
        const bounds = element.getBoundingClientRect();
        window.scrollBy({
            top: bounds.top - 100,
            behavior: 'smooth',
        });
    }
};
exports.scrollToID = scrollToID;
//# sourceMappingURL=scrollToID.js.map