// Pages Function: POST /api/careers
//
// Env vars:  CAREERS_EMAIL, CAREERS_CC (optional), TURNSTILE_SECRET (secret)
// Bindings:  LEADS (Workers KV)
//
// Plain fields only — no file upload. Applicants are invited to email a
// resume directly to the careers address, so nothing is stored as a blob.
// Shared gates live in ./_intake.js.

import { screen, store, notify, respond } from "./_intake.js";

const SUCCESS = "/thanks.html";

// Triage fields first, so the notification is readable from an inbox preview.
const FIELD_ORDER = [
  "Position",
  "Years of experience",
  "CDL status",
  "First Name",
  "Last Name",
  "Phone",
  "Email",
  "Licenses and certifications",
  "Equipment and rigs",
  "Why they are a fit",
];

function ordered(fields) {
  const out = {};
  for (const key of FIELD_ORDER) {
    if (fields[key] !== undefined && fields[key] !== "") out[key] = fields[key];
  }
  // anything unexpected still gets through rather than being dropped silently
  for (const [k, v] of Object.entries(fields)) {
    if (!(k in out) && v !== "") out[k] = v;
  }
  return out;
}

export async function onRequestPost({ request, env }) {
  const result = await screen({ request, env, route: "application", successPath: SUCCESS });
  if (result.response) return result.response;

  const { fields, ip, receivedAt } = result;

  // Reject the unselected placeholder as well as a missing value, so tapping
  // straight through the form cannot submit an empty triage answer.
  for (const key of ["Position", "Years of experience", "CDL status"]) {
    if (!fields[key]) {
      return respond(request, 400, {
        ok: false,
        message: "Please choose a position, your years of experience, and your CDL status.",
      });
    }
  }

  const recordKey = await store({ env, route: "application", receivedAt, ip, request, fields });

  const subject = `Elite Drillers — ${fields.Position} application (${fields["Years of experience"]}) — ${fields["First Name"]} ${fields["Last Name"]}`;

  await notify({
    to: env.CAREERS_EMAIL,
    cc: env.CAREERS_CC,
    subject,
    fields: {
      ...ordered(fields),
      Resume: "Not attached — applicant invited to email careers@elitedrillers.com directly.",
      "Application record": recordKey,
    },
    recordKey,
  });

  return respond(request, 200, { ok: true }, SUCCESS);
}
