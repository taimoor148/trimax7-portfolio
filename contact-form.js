/* ---------------------------------------------------------------------------
   Trimax7 portfolio — LeadPilot AI contact form (Stage 2)
   ---------------------------------------------------------------------------
   Sends inquiries straight to the LeadPilot AI CRM through the existing
   public lead-form RPC (`create_lead_from_form`). No service-role key, no
   direct table access — the database decides what is allowed.

   Public values only:
     - the Supabase anon key (RLS-protected, safe in a browser)
     - the lead form's public token (already embedded in public form URLs)

   Spam / abuse layers (client + database):
     1. honeypot field
     2. minimum time-on-form
     3. field validation + link-spam heuristic
     4. in-flight + 2-minute duplicate guard
     5. database: 20 submissions / minute / form, SECURITY DEFINER RPC
   --------------------------------------------------------------------------- */

(function () {
  "use strict";

  var CONFIG = {
    url: "https://ugnkndxkzaqgealymxwl.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbmtuZHhremFxZ2VhbHlteHdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwOTQ2OTIsImV4cCI6MjEwMzY3MDY5Mn0.i7hS2VM9MV8_uUAB-9zdkB5vzX54nb9UV1iR-ZLJ_UU",
    formToken: "57cce8fb94fccb5c57f0314742579fad29148bddbdb8865a",
    /* Public site key printed by supabase/seed/portfolio_site.sql.
       While it is still a placeholder the form uses the Stage 2 RPC. */
    siteKey: "b9c00ebc51f850c0bb69fb1436368d9de75e70ee5d061def",
  };

  var form = document.getElementById("contactForm");
  if (!form) return;

  var statusEl = document.getElementById("cf-status");
  var submitBtn = document.getElementById("cf-submit");
  var labelEl = submitBtn ? submitBtn.querySelector(".btn-label") : null;
  var honeypot = document.getElementById("cf-website");

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var STARTED_AT = Date.now();
  var MIN_FILL_MS = 1500;
  var COOLDOWN_MS = 2 * 60 * 1000;
  var STORAGE_KEY = "trimax7:last-inquiry";
  var CONTACT_EMAIL = "taimoormateen80@gmail.com";
  var CONSENT_TEXT = "I agree to be contacted about this inquiry.";

  var submitting = false;

  function val(name) {
    var el = form.elements[name];
    return el && typeof el.value === "string" ? el.value.trim() : "";
  }

  function setStatus(state, text) {
    if (!statusEl) return;
    statusEl.dataset.state = state || "";
    statusEl.textContent = text || "";
  }

  function fieldWrap(name) {
    return form.querySelector('[data-field="' + name + '"]');
  }

  function setFieldError(name, message) {
    var wrap = fieldWrap(name);
    var slot = form.querySelector('[data-error-for="' + name + '"]');
    var input = form.elements[name];
    if (slot) slot.textContent = message || "";
    if (wrap) wrap.classList.toggle("is-invalid", !!message);
    if (input) {
      if (message) input.setAttribute("aria-invalid", "true");
      else input.removeAttribute("aria-invalid");
    }
  }

  function clearErrors() {
    ["name", "email", "phone", "message"].forEach(function (n) {
      setFieldError(n, "");
    });
    setStatus("", "");
  }

  function firstInvalidName() {
    var wrap = form.querySelector(".field.is-invalid");
    return wrap ? wrap.getAttribute("data-field") : null;
  }

  function validate() {
    clearErrors();
    var ok = true;

    var name = val("name");
    if (name.length < 2) {
      setFieldError("name", "Please enter your name.");
      ok = false;
    } else if (name.length > 120) {
      setFieldError("name", "That name is too long.");
      ok = false;
    }

    var email = val("email");
    if (!email) {
      setFieldError("email", "Please enter your email so I can reply.");
      ok = false;
    } else if (!EMAIL_RE.test(email) || email.length > 254) {
      setFieldError("email", "That email address doesn't look right.");
      ok = false;
    }

    var phone = val("phone");
    if (phone) {
      var digits = phone.replace(/\D/g, "");
      if (digits.length < 7 || digits.length > 15) {
        setFieldError("phone", "Please enter a valid phone number, or leave it empty.");
        ok = false;
      }
    }

    var message = val("message");
    if (message.length < 10) {
      setFieldError("message", "Please add a little detail (at least 10 characters).");
      ok = false;
    } else if (message.length > 5000) {
      setFieldError("message", "That message is too long — please trim it a bit.");
      ok = false;
    } else if ((message.match(/https?:\/\//gi) || []).length > 3) {
      setFieldError("message", "Please remove the extra links and try again.");
      ok = false;
    }

    var consent = form.elements["consent"];
    if (!consent || !consent.checked) {
      setStatus("error", "Please tick the consent box so I'm allowed to reply.");
      ok = false;
    }

    if (!ok) {
      var first = firstInvalidName();
      if (first && form.elements[first]) form.elements[first].focus();
    }
    return ok;
  }

  function fingerprint(parts) {
    var input = parts.join("|").toLowerCase();
    var hash = 0x811c9dc5;
    for (var i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i);
      hash = (hash * 0x01000193) >>> 0;
    }
    return hash.toString(16);
  }

  function readLast() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function writeLast(value) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch (e) {
      /* private mode — duplicate guard degrades to in-memory only */
    }
  }

  function referrerHost() {
    try {
      return document.referrer ? new URL(document.referrer).hostname : "";
    } catch (e) {
      return "";
    }
  }

  function setLoading(on) {
    submitting = on;
    if (!submitBtn) return;
    submitBtn.disabled = on;
    submitBtn.setAttribute("aria-busy", on ? "true" : "false");
    if (labelEl) labelEl.textContent = on ? "Sending…" : "Send inquiry";
  }

  function friendlyError(payload) {
    var err = String((payload && (payload.error || payload.code)) || "").toLowerCase();
    var map = {
      site_not_found: "The form is temporarily unavailable. Please email " + CONTACT_EMAIL + " instead.",
      form_disabled: "This form isn't accepting messages right now. Please email " + CONTACT_EMAIL + ".",
      rate_limited: "Too many messages right now — please try again in a minute.",
      name_required: "Please add your name.",
      contact_required: "Please add an email address or phone number so I can reply.",
      invalid_email: "That email address doesn't look right.",
      message_too_short: "Please add a little more detail (at least 10 characters).",
      invalid_message: "Please remove the extra links and try again.",
      consent_required: "Please tick the consent box so I'm allowed to reply.",
      workspace_not_configured: "The form isn't fully set up yet. Please email " + CONTACT_EMAIL + ".",
    };
    if (map[err]) return map[err];
    if (/not found/i.test(err)) {
      return "The form is temporarily unavailable. Please email " + CONTACT_EMAIL + " instead.";
    }
    if (/no longer accepting/i.test(err)) {
      return "This form isn't accepting messages right now. Please email " + CONTACT_EMAIL + ".";
    }
    if (/too many/i.test(err)) {
      return "Too many messages right now — please try again in a minute.";
    }
    if (/name is required/i.test(err)) {
      return "Please add your name.";
    }
    return "Something went wrong sending your message. Please try again, or email " + CONTACT_EMAIL + ".";
  }

  /* Anonymous ids from analytics.js — may be absent when the visitor has
     opted out or sent Do Not Track. The form still works without them. */
  function analyticsIds() {
    var a = window.trimax7Analytics;
    if (!a) return { visitor: "", session: "", device: "", referrer: "" };
    try {
      return {
        visitor: a.visitorId(),
        session: a.sessionId(),
        device: a.deviceCategory(),
        referrer: a.referrerHost(),
      };
    } catch (e) {
      return { visitor: "", session: "", device: "", referrer: "" };
    }
  }

  function hasSiteKey() {
    return !!CONFIG.siteKey && CONFIG.siteKey.indexOf("__") !== 0;
  }

  function missingFunction(result) {
    if (!result) return false;
    if (result.status === 404) return true;
    var code = result.body && result.body.code;
    if (code === "PGRST202" || code === "42883") return true;
    return /could not find the function|function .* does not exist/i.test(result.text || "");
  }

  async function callRpc(fn, body) {
    var controller = new AbortController();
    var timer = setTimeout(function () {
      controller.abort();
    }, 15000);

    try {
      var res = await fetch(CONFIG.url + "/rest/v1/rpc/" + fn, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: CONFIG.anonKey,
          Authorization: "Bearer " + CONFIG.anonKey,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      var text = await res.text();
      var json = null;
      try {
        json = JSON.parse(text);
      } catch (e) {
        json = null;
      }
      return { ok: res.ok, status: res.status, body: json, text: text };
    } catch (e) {
      return {
        ok: false,
        status: 0,
        body: null,
        text: "",
        aborted: !!(e && e.name === "AbortError"),
      };
    } finally {
      clearTimeout(timer);
    }
  }

  function networkMessage(result) {
    return result && result.aborted
      ? "The request timed out. Please check your connection and try again."
      : "Network error — please check your connection, or email " + CONTACT_EMAIL + ".";
  }

  /* Stage 3 path: submit_site_inquiry stores the inquiry, the CRM lead, the
     form_submit conversion event and the notification in one transaction.
     Falls back to the Stage 2 RPC when the Stage 3 migration isn't applied. */
  async function sendInquiry(fields) {
    var ids = analyticsIds();
    var honeypotValue = honeypot ? honeypot.value : "";

    if (hasSiteKey()) {
      var v2 = await callRpc("submit_site_inquiry", {
        p_key: CONFIG.siteKey,
        p_payload: {
          name: fields.name,
          email: fields.email,
          phone: fields.phone,
          company: fields.company,
          message: fields.message,
          source_url: window.location.href,
          referrer_host: ids.referrer || referrerHost(),
          consent: true,
          consent_text: CONSENT_TEXT,
          device_category: ids.device,
        },
        p_honeypot: honeypotValue,
        p_elapsed_ms: Date.now() - STARTED_AT,
        p_visitor_id: ids.visitor || null,
        p_session_id: ids.session || null,
      });

      if (!missingFunction(v2)) {
        if (v2.status === 0) return { ok: false, message: networkMessage(v2) };
        if (!v2.ok) return { ok: false, message: friendlyError(v2.body) };
        return { ok: true, body: v2.body || {}, mode: "v2" };
      }
    }

    /* Legacy (Stage 2) path — provenance goes into the lead notes. */
    var notes =
      fields.message +
      "\n\n—\nSource: " +
      window.location.href +
      "\nReferrer: " +
      (ids.referrer || referrerHost() || "direct") +
      "\nConsent: given " +
      new Date().toISOString();

    var legacy = await callRpc("create_lead_from_form", {
      p_token: CONFIG.formToken,
      p_data: {
        name: fields.name,
        email: fields.email,
        phone: fields.phone,
        company: fields.company,
        message: notes,
      },
      p_honeypot: honeypotValue,
    });

    if (legacy.status === 0) return { ok: false, message: networkMessage(legacy) };
    if (!legacy.ok) return { ok: false, message: friendlyError(legacy.body) };
    return { ok: true, body: legacy.body || {}, mode: "legacy" };
  }

  form.addEventListener("input", function (event) {
    var name = event.target && event.target.name;
    if (name && fieldWrap(name)) setFieldError(name, "");
    if (statusEl && statusEl.dataset.state === "error") setStatus("", "");
  });

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (submitting) return;

    /* Honeypot: pretend everything is fine so bots learn nothing. */
    if (honeypot && honeypot.value.trim() !== "") {
      setStatus("success", "Thanks — your inquiry is in. I'll reply within 24 hours.");
      form.reset();
      return;
    }

    if (!validate()) return;

    /* Bots submit instantly; a human needs a moment to read the form. */
    if (Date.now() - STARTED_AT < MIN_FILL_MS) {
      setStatus("success", "Thanks — your inquiry is in. I'll reply within 24 hours.");
      form.reset();
      return;
    }

    var name = val("name");
    var email = val("email");
    var phone = val("phone");
    var company = val("company");
    var message = val("message");

    var fp = fingerprint([name, email, message]);
    var last = readLast();
    if (last && last.fp === fp && Date.now() - Number(last.at || 0) < COOLDOWN_MS) {
      setStatus("info", "This inquiry was already sent — I've got it. Give me up to 24 hours to reply.");
      return;
    }

    setLoading(true);
    setStatus("info", "Sending…");

    var result = await sendInquiry({
      name: name,
      email: email,
      phone: phone,
      company: company,
      message: message,
    });

    setLoading(false);

    if (!result.ok) {
      setStatus("error", result.message);
      return;
    }

    var body = result.body || {};
    if (body.spam === true) {
      setStatus("success", "Thanks — your inquiry is in. I'll reply within 24 hours.");
      form.reset();
      return;
    }

    if (body.duplicate === true) {
      setStatus("info", "This inquiry was already sent — I've got it. Give me up to 24 hours to reply.");
      writeLast({ fp: fp, at: Date.now() });
      form.reset();
      return;
    }

    if (body.ok === false) {
      setStatus("error", friendlyError(body));
      return;
    }

    writeLast({ fp: fp, at: Date.now() });
    form.reset();
    setStatus("success", "Thanks, " + name.split(" ")[0] + " — your inquiry is in. I'll reply within 24 hours.");
  });
})();
