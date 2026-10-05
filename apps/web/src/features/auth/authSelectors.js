export function selectCurrentUser(state) {
  return state.auth.user;
}

export function selectIsAuthenticated(state) {
  return Boolean(state.auth.user);
}

export function selectAuthStatus(state) {
  return state.auth.status;
}

export function selectRestoreStatus(state) {
  return state.auth.restoreStatus;
}

export function selectAuthError(state) {
  return state.auth.error;
}

export function selectLogoutStatus(state) {
  return state.auth.logoutStatus;
}

export function selectLogoutError(state) {
  return state.auth.logoutError;
}
