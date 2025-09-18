// Utility to build app URLs that work even when the host doesn't support SPA rewrites.
// If VITE_ROUTER_MODE=hash, links will use hash routing: origin + '/#/path?query'.
// Otherwise, use normal browser routing: origin + '/path?query'.

export const getRouterMode = () => (import.meta.env.VITE_ROUTER_MODE || 'browser').toLowerCase();

export function buildAppUrl(pathWithQuery = '/') {
  const origin = window.location.origin;
  const mode = getRouterMode();
  if (mode === 'hash') {
    // Accept input that may already start with '/'; ensure single slash after #
    const hasLeadingSlash = pathWithQuery.startsWith('/');
    return `${origin}/#${hasLeadingSlash ? '' : '/'}${pathWithQuery}`;
  }
  return `${origin}${pathWithQuery.startsWith('/') ? '' : '/'}${pathWithQuery}`;
}

export function buildSharedChatUrl(encodedData) {
  return buildAppUrl(`/shared-chat?data=${encodedData}`);
}

export function buildResetPasswordUrl(email, prt) {
  const q = new URLSearchParams({ email, prt }).toString();
  return buildAppUrl(`/reset-password?${q}`);
}
