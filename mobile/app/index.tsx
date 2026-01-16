import React, { useEffect } from "react";
import { Redirect, useRouter } from "expo-router";
import { getToken } from "../api/authFetch";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (token) {
        router.replace("/(tabs)");
      } else {
        router.replace("/login");
      }
    })();
  }, []);

  return null;
}
