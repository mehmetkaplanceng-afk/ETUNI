

import AsyncStorage from "@react-native-async-storage/async-storage";
import { debug } from "../utils/logger";

// export const API_URL = "https://tasha-coolish-daisy.ngrok-free.dev";
export const API_URL = "http://172.20.10.4:8080"; // Correct Backend Port

const BASE_HEADERS = {
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "1",
};

export async function setToken(token: string) {
  let t = (token || "").trim();
  if (t.toLowerCase().startsWith("bearer ")) {
    t = t.slice(7).trim();
  }
  await AsyncStorage.setItem("token", t);
}

export async function getToken() {
  const t = await AsyncStorage.getItem("token");
  if (!t) return null;
  const trimmed = t.trim();
  if (trimmed === "" || trimmed === "null" || trimmed === "undefined") return null;
  return trimmed;
}

export async function clearToken() {
  await AsyncStorage.multiRemove(["token", "universityId"]);
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
