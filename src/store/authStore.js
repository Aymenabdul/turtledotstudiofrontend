import { create } from 'zustand';

const AUTH_STORAGE_KEY = 'turtledot_auth';

const normalizeUser = (user) => {
  if (!user) return user;
  const isOldStudio = !user.studioName || user.studioName.includes('AuraLens');
  return {
    ...user,
    studioName: isOldStudio ? 'Turtledot Studio' : user.studioName,
    studioLogoUrl: user.studioLogoUrl || '/turtledot_app_icon_color.png',
    studioCurrency: user.studioCurrency || 'INR',
  };
};

const getStoredAuth = () => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem('auralens_auth');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.user) {
        parsed.user = normalizeUser(parsed.user);
      }
      return parsed;
    }
  } catch (e) {
    console.error('Failed to parse stored auth', e);
  }
  return { user: null, accessToken: null, refreshToken: null };
};

export const useAuthStore = create((set) => {
  const initial = getStoredAuth();

  return {
    user: initial.user,
    accessToken: initial.accessToken,
    refreshToken: initial.refreshToken,
    isAuthenticated: !!initial.accessToken,

    setAuth: (data) => {
      const state = {
        user: normalizeUser(data.user),
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        isAuthenticated: true,
      };
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
        localStorage.removeItem('auralens_auth');
      } catch (e) {
        console.error('Failed to store auth', e);
      }
      set(state);
    },

    setAccessToken: (token) => {
      set((prev) => {
        const updated = { ...prev, accessToken: token };
        try {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
          console.error('Failed to update access token in storage', e);
        }
        return updated;
      });
    },

    setUser: (user) => {
      set((prev) => {
        const updated = { ...prev, user: normalizeUser(user) };
        try {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
          console.error('Failed to update user in storage', e);
        }
        return updated;
      });
    },

    logout: () => {
      try {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem('auralens_auth');
      } catch (e) {
        console.error('Failed to clear stored auth', e);
      }
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
      });
    },
  };
});
