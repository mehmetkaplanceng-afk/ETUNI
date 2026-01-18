
import AsyncStorage from "@react-native-async-storage/async-storage";
import { debug } from "../utils/logger";

// export const API_URL = "https://tasha-coolish-daisy.ngrok-free.dev";
export const API_URL = "http://13.53.170.220:8080"; // Correct Backend Port

const BASE_HEADERS = {
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "1",
};

// Memory cache for the token to avoid AsyncStorage latency during redirects
let cachedToken: string | null = null;
let isInitialized = false;

export async function setToken(token: string) {
  let t = (token || "").trim();
  if (t.toLowerCase().startsWith("bearer ")) {
    t = t.slice(7).trim();
  }
  cachedToken = t;
  await AsyncStorage.setItem("token", t);
}

export async function getToken() {
  // If not initialized, load from storage once
  if (!isInitialized) {
    const t = await AsyncStorage.getItem("token");
    if (t) {
      const trimmed = t.trim();
      if (trimmed !== "" && trimmed !== "null" && trimmed !== "undefined") {
        cachedToken = trimmed;
      }
    }
    isInitialized = true;
  }

  return cachedToken;
}

export async function clearToken() {
  cachedToken = null;
  isInitialized = true; // Mark as initialized so it doesn't try to reload the deleted token
  await AsyncStorage.multiRemove(["token", "universityId"]);
  debug("AUTH: Token cleared from memory and storage");
}

export async function logoutFromServer() {
  try {
    // First, delete the push token from backend
    try {
      await authFetch("/api/push-token", { method: "DELETE" });
      debug("AUTH: Push token deleted from backend");
    } catch (e) {
      debug("AUTH: Failed to delete push token, continuing with logout");
    }

    // Then perform server logout
    await authFetch("/api/auth/logout", { method: "POST" });
  } catch (e) {
    debug("AUTH: Server logout failed or already cleared");
  } finally {
    await clearToken();
  }
}

export async function authFetch(path: string, options: RequestInit = {}) {
  const token = await getToken();

  debug("MOBILE TOKEN:", token ? token.slice(0, 20) + "..." : "NULL");
  debug("REQUEST PATH:", path);

  const headers: Record<string, string> = {
    ...BASE_HEADERS,
    ...(options.headers as any),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  /*
  const res = await fetch(API_URL + path, {
    ...options,
    headers,
  });
  */

  // Using a robust fetch wrapper
  try {
    const res = await fetch(API_URL + path, {
      ...options,
      headers,
    });

    if (res.status === 401 || res.status === 403) {
      debug("AUTH_ERROR: Clearing token due to " + res.status);
      await clearToken();
      // Optionally execute a callback if provided, but for now just clearing ensures next check fails
    }

    return res;
  } catch (error) {
    throw error;
  }
}
