/**
 * TypingMasterProOnline Social API — Cloudflare Worker starter
 *
 * This is a secure API foundation only. It deliberately does NOT claim to
 * publish until each platform's approved OAuth app and publishing adapter
 * have been configured and tested.
 */
const PLATFORMS = ["facebook", "youtube", "instagram", "tiktok"];

function json(data, status = 200, origin = "*") {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "Content-Type, Authorization",
      "vary": "Origin"
    }
  });
}

function configured(env, platform) {
  // These flags are intentionally false until real OAuth + publisher adapters exist.
  return env[`${platform.toUpperCase()}_PUBLISHING_ENABLED`] === "true";
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const allowedOrigin = env.ALLOWED_ORIGIN || "https://typingmasterproonline.com";

    if (origin && origin !== allowedOrigin) {
      return json({ ok: false, error: "Origin not allowed." }, 403, allowedOrigin);
    }
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": allowedOrigin,
          "access-control-allow-methods": "GET,POST,OPTIONS",
          "access-control-allow-headers": "Content-Type, Authorization",
          "access-control-max-age": "86400",
          "vary": "Origin"
        }
      });
    }

    if (url.pathname === "/" || url.pathname === "/health") {
      return json({
        ok: true,
        service: "TypingMasterProOnline Social API",
        state: "backend-foundation",
        message: "Worker is running. Platform OAuth and publishing adapters still need setup."
      }, 200, allowedOrigin);
    }

    if (url.pathname === "/api/social/status" && request.method === "GET") {
      return json({
        ok: true,
        platforms: Object.fromEntries(PLATFORMS.map(p => [p, {
          connected: false,
          publishingEnabled: configured(env, p),
          status: "not-connected",
          message: "OAuth app and publishing adapter are not configured."
        }]))
      }, 200, allowedOrigin);
    }

    const startMatch = url.pathname.match(/^\/api\/social\/(facebook|youtube|instagram|tiktok)\/start$/);
    if (startMatch && request.method === "GET") {
      const platform = startMatch[1];
      return json({
        ok: false,
        platform,
        error: "OAUTH_NOT_CONFIGURED",
        message: "This platform's developer app, callback URL, OAuth flow and token storage must be configured before connecting."
      }, 501, allowedOrigin);
    }

    if (url.pathname === "/api/social/publish" && request.method === "POST") {
      return json({
        ok: false,
        error: "PUBLISHING_NOT_CONFIGURED",
        message: "No video was published. Platform OAuth, account permissions, upload adapters and secure token storage are not configured yet."
      }, 501, allowedOrigin);
    }

    return json({ ok: false, error: "Not found." }, 404, allowedOrigin);
  }
};
