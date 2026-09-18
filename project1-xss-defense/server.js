/**
 * ============================================================================
 *  server.js — Express Backend for DOM XSS & Trusted Types Seminar Demo
 * ============================================================================
 *
 *  Two routes expose the same "document.write" sink but with radically
 *  different trust boundaries:
 *
 *    GET /vulnerable  →  No server-side CSP; client relies on a naïve
 *                        string-matching filter that is trivially bypassed.
 *
 *    GET /secure      →  Strict CSP header with `require-trusted-types-for
 *                        'script'` forces all injection sinks through a
 *                        DOMPurify-backed Trusted Types policy.
 *
 *  Author : Akarsh Shrivastav (24CSE1002)
 *  Course : Undergraduate Seminar — Browser Security
 * ============================================================================
 */

const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

/* ---------- Serve static assets from /public ---------- */
app.use(express.static(path.join(__dirname, "public")));

/* ------------------------------------------------------------------
 * ROUTE 1 — Vulnerable Page (no CSP, naïve filter only)
 *
 * The query-string parameters `id` and `name` are reflected directly
 * into the HTML response body.  The *client-side* filter in
 * vulnerable.html attempts to block payloads, but it can be bypassed.
 * ------------------------------------------------------------------ */
app.get("/vulnerable", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "vulnerable.html"));
});

/* ------------------------------------------------------------------
 * ROUTE 2 — Secure Page (Strict CSP + Trusted Types)
 *
 * The Content-Security-Policy header below does two things:
 *   1. `require-trusted-types-for 'script'`
 *      → The browser will REJECT any raw string passed to dangerous
 *        sinks (innerHTML, document.write, eval, etc.) unless it is
 *        wrapped in a TrustedHTML / TrustedScript object.
 *
 *   2. `trusted-types dompurify-policy`
 *      → Only the policy named "dompurify-policy" is permitted to
 *        create Trusted Type objects.  Any other attempt to call
 *        trustedTypes.createPolicy() will throw.
 *
 *   3. Additional directives lock down script sources and object embeds.
 * ------------------------------------------------------------------ */
app.get("/secure", (_req, res) => {
  res.set(
    "Content-Security-Policy",
    [
      "require-trusted-types-for 'script'",
      "trusted-types dompurify-policy",
      "default-src 'self'",
      "script-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src https://fonts.gstatic.com",
      "object-src 'none'",
      "base-uri 'self'",
    ].join("; ")
  );
  res.sendFile(path.join(__dirname, "public", "secure.html"));
});

/* ---------- Fallback: redirect root to /vulnerable ---------- */
app.get("/", (_req, res) => res.redirect("/vulnerable"));

/* ---------- Start ---------- */
app.listen(PORT, () => {
  console.log(`\n  ✦  XSS Demo Server running at  http://localhost:${PORT}`);
  console.log(`     ├─ Vulnerable page : http://localhost:${PORT}/vulnerable?id=42&name=Akarsh`);
  console.log(`     └─ Secure page     : http://localhost:${PORT}/secure?id=42&name=Akarsh\n`);
});
