// Dynamic Expo config – reads API URL from environment variable.
// Takes precedence over app.json while keeping all static fields intact.
module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    apiBaseUrl:
      process.env.EXPO_PUBLIC_API_URL ??
      config.extra?.apiBaseUrl ??
      'http://localhost:3000',
  },
});
