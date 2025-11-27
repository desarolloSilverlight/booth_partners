// Configuración global en memoria (no se persiste en sessionStorage por seguridad)
const config = {
  rutaApi: import.meta.env.VITE_API_URL,
  rutaApiBuk: import.meta.env.VITE_API_BUK_URL,
  tokenApiBuk: import.meta.env.VITE_TOKEN_API_BUK,
  profile: 0, // será sobreescrito tras login
};

export const getSystemProfile = (): number => config.profile || 0;
export const setSystemProfile = (p: number) => { config.profile = Number(p) || 0; };

export default config;