"use client";

import { useEffect } from "react";
import { setSessionFromLink } from "@/app/auth/actions";

// Los links que Supabase arma sin código (por ejemplo "Send password recovery"
// desde el panel) traen la sesión en el "#..." de la URL, que el servidor no ve.
export function AuthLinkHandler() {
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    if (hash.get("error_code")) {
      window.location.replace("/login?error=link");
      return;
    }
    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");
    if (!accessToken || !refreshToken) return;

    const next = hash.get("type") === "recovery" ? "/nueva-clave" : "/";
    setSessionFromLink(accessToken, refreshToken).then(({ ok }) =>
      window.location.replace(ok ? next : "/login?error=link"),
    );
  }, []);

  return null;
}
