const appJson = require('./app.json');

const projectId = process.env.EAS_PROJECT_ID || appJson.expo.extra?.eas?.projectId;

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...(appJson.expo.extra || {}),
      apiUrl: process.env.EXPO_PUBLIC_API_URL || '',
      ...(projectId ? { eas: { projectId } } : {}),
    },
  },
};
