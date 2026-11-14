module.exports = ({ config }) => {
  const projectId = process.env.EAS_PROJECT_ID || config.extra?.eas?.projectId;

  return {
    ...config,
    // Prévisualisation web locale : application monopage (le rendu statique de chaque route à
    // chaque modification rend le serveur de dev très lent). Les exports EAS restent statiques.
    web: process.env.EXPO_WEB_SPA === '1' ? { ...config.web, output: 'single' } : config.web,
    extra: {
      ...(config.extra || {}),
      apiUrl: process.env.EXPO_PUBLIC_API_URL || '',
      ...(projectId ? { eas: { projectId } } : {}),
    },
  };
};
