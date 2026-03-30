export const environment = {
  production: true,
  apiUrl: typeof window !== 'undefined' && window.location.origin
    ? `${window.location.origin.replace(/(:\d+)?$/, '')}/api`
    : 'https://your-backend-domain.vercel.app/api',
};
