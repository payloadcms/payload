export const isEntityHidden = ({ hidden, user })=>{
    return typeof hidden === 'function' ? hidden({
        user: user
    }) : hidden === true;
};

//# sourceMappingURL=isEntityHidden.js.map