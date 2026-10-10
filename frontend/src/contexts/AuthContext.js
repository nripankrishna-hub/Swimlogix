import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { persistTokens, restoreTokens, setUnauthorizedHandler } from '../api/client';
import { authApi } from '../api/endpoints';

const EMPTY = {
  bootstrapping: true,
  user: null,
  institution: null,
  studentProfile: null,
  nextStep: null,
};

const AuthContext = createContext(null);

/**
 * Single source of truth for the session:
 * JWT pair (persisted in AsyncStorage), current user, institution, student profile
 * and the `nextStep` routing hint returned by the backend.
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(EMPTY);

  const applySession = useCallback((data) => {
    setSession((prev) => ({
      bootstrapping: false,
      user: data.user !== undefined ? data.user : prev.user,
      institution: data.institution !== undefined ? data.institution : prev.institution,
      studentProfile: data.studentProfile !== undefined ? data.studentProfile : prev.studentProfile,
      nextStep: data.nextStep !== undefined ? data.nextStep : prev.nextStep,
    }));
  }, []);

  const clearSession = useCallback(() => setSession({ ...EMPTY, bootstrapping: false }), []);

  /** Reload the full session from the API (also used after approvals / linking). */
  const reload = useCallback(async () => {
    const data = await authApi.me();
    applySession(data);
    return data;
  }, [applySession]);

  // Boot: restore tokens then hydrate the session.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const tokens = await restoreTokens();
        if (!tokens) {
          if (mounted) clearSession();
          return;
        }
        const data = await authApi.me();
        if (mounted) applySession(data);
      } catch (err) {
        await persistTokens(null);
        if (mounted) clearSession();
      }
    })();
    return () => {
      mounted = false;
    };
  }, [applySession, clearSession]);

  // The API client calls this when a refresh fails -> force logout.
  useEffect(() => {
    setUnauthorizedHandler(() => clearSession());
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  const requestOtp = useCallback((phone, purpose = 'login') => authApi.requestOtp(phone, purpose), []);

  const verifyOtp = useCallback(
    async (phone, otp) => {
      const data = await authApi.verifyOtp(phone, otp);
      await persistTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      applySession(data);
      // Login payloads only carry tokens + the routing hint; hydrate the rest
      // (institution / studentProfile) so screens like PendingApproval render correctly.
      try {
        await reload();
      } catch (err) {
        // Non-fatal: the routing hint from the login payload is already applied.
      }
      return data;
    },
    [applySession, reload],
  );

  const loginWithPassword = useCallback(
    async (phone, password) => {
      const data = await authApi.passwordLogin(phone, password);
      await persistTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      applySession(data);
      // Login payloads only carry tokens + the routing hint; hydrate the institution too.
      try {
        await reload();
      } catch (err) {
        // Non-fatal: the routing hint from the login payload is already applied.
      }
      return data;
    },
    [applySession, reload],
  );

  const changePassword = useCallback(
    async (newPassword, currentPassword) => {
      const data = await authApi.changePassword(newPassword, currentPassword);
      applySession({ user: data.user, nextStep: data.nextStep });
      return reload();
    },
    [applySession, reload],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.unregisterDevice('session');
    } catch (err) {
      // Best effort only.
    }
    await persistTokens(null);
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({
      ...session,
      isAuthenticated: Boolean(session.user),
      requestOtp,
      verifyOtp,
      loginWithPassword,
      changePassword,
      reload,
      logout,
    }),
    [session, requestOtp, verifyOtp, loginWithPassword, changePassword, reload, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export default AuthContext;
