export const INITIAL_BALANCE_CENTS = 100_00; // $1000

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  AUTH_CALLBACK: "/auth/callback",
  DASHBOARD: "/dashboard",
  CHANNELS: "/channels",
  CHANNEL: (id: string) => `/channels/${id}`,
  MARKET: (id: string) => `/markets/${id}`,
} as const;
