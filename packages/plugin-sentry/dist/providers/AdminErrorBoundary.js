'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { ErrorBoundary } from '@sentry/nextjs';
/**
 * Captures errored components to Sentry
 */ export const AdminErrorBoundary = ({ children })=>{
    return /*#__PURE__*/ _jsx(ErrorBoundary, {
        children: children
    });
};

//# sourceMappingURL=AdminErrorBoundary.js.map