export const environment = {
  production: true,
  /**
   * Set this to your deployed API base URL.
   * The Angular build will tree-shake environment.ts out and use this value.
   * Example: 'https://api.skillswap.app/api'
   */
  apiUrl: 'https://api.skillswap.app/api',
  appName: 'SkillSwap',
  jwtTokenKey:    'skillswap_token',
  jwtRefreshKey:  'skillswap_refresh',
  userKey:        'skillswap_user',
  googleAuthUrl:  'https://api.skillswap.app/api/auth/google',
  enableDebugLogging: false,
};
