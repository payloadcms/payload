import { wrapInternalEndpoints } from '../../utilities/wrapInternalEndpoints.js';
import { accessHandler } from './access.js';
import { forgotPasswordHandler } from './forgotPassword.js';
import { initHandler } from './init.js';
import { loginHandler } from './login.js';
import { logoutHandler } from './logout.js';
import { meHandler } from './me.js';
import { refreshHandler } from './refresh.js';
import { registerFirstUserHandler } from './registerFirstUser.js';
import { resetPasswordHandler } from './resetPassword.js';
import { unlockHandler } from './unlock.js';
import { verifyEmailHandler } from './verifyEmail.js';
export const authRootEndpoints = wrapInternalEndpoints([
    {
        handler: accessHandler,
        method: 'get',
        path: '/access'
    }
]);
export const authCollectionEndpoints = wrapInternalEndpoints([
    {
        handler: forgotPasswordHandler,
        method: 'post',
        path: '/forgot-password'
    },
    {
        handler: initHandler,
        method: 'get',
        path: '/init'
    },
    {
        handler: loginHandler,
        method: 'post',
        path: '/login'
    },
    {
        handler: logoutHandler,
        method: 'post',
        path: '/logout'
    },
    {
        handler: meHandler,
        method: 'get',
        path: '/me'
    },
    {
        handler: refreshHandler,
        method: 'post',
        path: '/refresh-token'
    },
    {
        handler: registerFirstUserHandler,
        method: 'post',
        path: '/first-register'
    },
    {
        handler: resetPasswordHandler,
        method: 'post',
        path: '/reset-password'
    },
    {
        handler: unlockHandler,
        method: 'post',
        path: '/unlock'
    },
    {
        handler: verifyEmailHandler,
        method: 'post',
        path: '/verify/:id'
    }
]);

//# sourceMappingURL=index.js.map