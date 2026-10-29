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
    var err = (payload && payload.error) || "";
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

  async function send(payload) {
    var controller = new AbortController();
    var timer = setTimeout(function () {
      controller.abort();
    }, 15000);

    try {
      var res = await fetch(CONFIG.url + "/rest/v1/rpc/create_lead_from_form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: CONFIG.anonKey,
          Authorization: "Bearer " + CONFIG.anonKey,
        },
        body: JSON.stringify({
          p_token: CONFIG.formToken,
          p_data: payload,
          p_honeypot: honeypot ? honeypot.value : "",
        }),
        signal: controller.signal,
      });

      var body = null;
      try {
        body = await res.json();
      } catch (e) {
        body = null;
      }

      if (!res.ok) {
        return { ok: false, message: friendlyError(body) };
      }
      return { ok: true, body: body || {} };
    } catch (e) {
      return {
        ok: false,
        message:
          e && e.name === "AbortError"
            ? "The request timed out. Please check your connection and try again."
            : "Network error — please check your connection, or email " + CONTACT_EMAIL + ".",
      };
    } finally {
      clearTimeout(timer);
    }
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

    var refHost = referrerHost();
    var notes =
      message +
      "\n\n—\nSource: " +
      window.location.href +
      "\nReferrer: " +
      (refHost || "direct") +
      "\nConsent: given " +
      new Date().toISOString();

    setLoading(true);
    setStatus("info", "Sending…");

    var result = await send({
      name: name,
      email: email,
      phone: phone,
      company: company,
      message: notes,
    });

    setLoading(false);

    if (!result.ok) {
      setStatus("error", result.message);
      return;
    }

    var body = result.body || {};
    if (body.spam === true || body.duplicate === true) {
      setStatus("success", "Thanks — your inquiry is in. I'll reply within 24 hours.");
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
