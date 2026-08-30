// Shared intake pipeline for /api/quote and /api/careers.
// Leading underscore keeps Pages from routing this file.
//
// Order is deliberate: honeypot (free) → rate limit (one KV read) →
// Turnstile (network call) → durable store → email. Cheap rejections first,
// and nothing is persisted or forwarded until the request is proven human.

const RATE_LIMIT = 5; // submissions per IP per hour, per route

export function wantsJson(request) {
  return (request.headers.get("Accept") || "").includes("application/json");
}

export function respond(request, status, body, redirectTo) {
  if (wantsJson(request)) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (redirectTo) return Response.redirect(new URL(redirectTo, request.url), 303);
  return new Response(body.message || "", {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

// Runs every gate. Returns either { response } (stop and send it) or
// { fields, ip, receivedAt } for the caller to finish handling.
export async function screen({ request, env, route, successPath }) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";

  let form;
  try {
    form = await request.formData();
  } catch (e) {
    return {
      response: respond(request, 400, {
        ok: false,
        message: "Could not read the form. Please try again.",
      }),
    };
  }

  const fields = Object.fromEntries(form.entries());

  // 1. Honeypot — bots see a normal success; nothing stored, nothing sent.
  if (fields._honey) {
    return { response: respond(request, 200, { ok: true }, successPath) };
  }
  delete fields._honey;

  // 2. Rate limit per IP, per route (hourly bucket).
  const bucket = Math.floor(Date.now() / 3600000);
  const rlKey = `rl:${route}:${ip}:${bucket}`;
  const count = parseInt((await env.LEADS.get(rlKey)) || "0", 10);
  if (count >= RATE_LIMIT) {
    return {
      response: respond(request, 429, {
        ok: false,
        message:
          "We've received several submissions from this connection. Please call us at (432) 994-8855 and we'll take it from there.",
      }),
    };
  }
  await env.LEADS.put(rlKey, String(count + 1), { expirationTtl: 3700 });

  // 3. Turnstile, verified server-side.
  const token = fields["cf-turnstile-response"];
  delete fields["cf-turnstile-response"];
  if (!token) {
    return {
      response: respond(request, 400, {
        ok: false,
        message: "Please complete the security check below, then submit again.",
      }),
    };
  }
  const verify = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: env.TURNSTILE_SECRET,
        response: token,
        remoteip: ip,
      }),
    }
  )
    .then((r) => r.json())
    .catch(() => ({ success: false }));
  if (!verify.success) {
    return {
      response: respond(request, 403, {
        ok: false,
        message:
          "The security check didn't go through. Please reload the page and try again, or call (432) 994-8855.",
      }),
    };
  }

  return { fields, ip, receivedAt: new Date().toISOString() };
}

// Durable copy. Always called BEFORE any email so a delivery failure
// can never lose a submission.
export async function store({ env, route, receivedAt, ip, request, fields, extra }) {
  const key = `${route}:${receivedAt}:${crypto.randomUUID().slice(0, 8)}`;
  await env.LEADS.put(
    key,
    JSON.stringify({
      receivedAt,
      ip,
      userAgent: request.headers.get("User-Agent") || "",
      fields,
      ...extra,
    })
  );
  return key;
}

// Email via FormSubmit's JSON endpoint. Destination comes from env only.
// Failures are logged, not surfaced — the record is already durable.
export async function notify({ to, cc, subject, fields, recordKey }) {
  try {
    const payload = { _subject: subject, _template: "table", ...fields };
    if (cc) payload._cc = cc;
    const mail = await fetch(`https://formsubmit.co/ajax/${to}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    if (!mail.ok) console.error("formsubmit failed", mail.status, recordKey);
  } catch (e) {
    console.error("formsubmit error", e, recordKey);
  }
}
