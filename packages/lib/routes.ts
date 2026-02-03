// Public routes
export const HOME_ROUTE = '/';
export const AUTH_SIGNIN_ROUTE = '/auth/signin';
export const AUTH_SIGNUP_ROUTE = '/auth/signup';

// Protected routes
export const DASHBOARD_ROUTE = '/dashboard';
export const REPORTS_ROUTE = '/reports';
export const SETTINGS_ROUTE = '/settings';

// API routes
export const API_ROUTE = '/api';
export const API_AUTH_SIGNUP_ROUTE = `${API_ROUTE}/auth/signup`;
export const API_REPORTS_GENERATE_ROUTE = `${API_ROUTE}/reports/generate`;
export const API_REPORTS_GET_ROUTE = (reportId: string) => `${API_ROUTE}/reports/${reportId}`;
