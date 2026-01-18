export const getLoginOptions = (loginWithUsername)=>{
    return {
        canLoginWithEmail: !loginWithUsername || loginWithUsername.allowEmailLogin,
        canLoginWithUsername: Boolean(loginWithUsername)
    };
};

//# sourceMappingURL=getLoginOptions.js.map