// Pages Function: POST /api/quote
//
// Env vars:  QUOTE_EMAIL, QUOTE_CC (optional), TURNSTILE_SECRET (secret)
// Bindings:  LEADS (Workers KV)
//
// Shared gates live in ./_intake.js — see that file for pipeline order.

import { screen, store, notify, respond } from "./_intake.js";

const SUCCESS = "/quote-received.html";

export async function onRequestPost({ request, env }) {
  const result = await screen({ request, env, route: "lead", successPath: SUCCESS });
  if (result.response) return result.response;

  const { fields, ip, receivedAt } = result;

  const recordKey = await store({ env, route: "lead", receivedAt, ip, request, fields });

  await notify({
    to: env.QUOTE_EMAIL,
    cc: env.QUOTE_CC,
    subject: "Elite Drillers — Quote Request",
    fields,
    recordKey,
  });

  return respond(request, 200, { ok: true }, SUCCESS);
}
