/* ---------------------------------------------------------------------------
   Trimax7 portfolio — anonymous visitor tracking (Stage 3)
   ---------------------------------------------------------------------------
   Sends anonymous page views / CTA clicks / form starts to LeadPilot AI.

   Privacy model (deliberate, not an afterthought):
     * no cookies, no IP address, no user-agent string, no fingerprint
     * visitor id  = random UUID in localStorage (not derived from the device)
     * session id  = random UUID in sessionStorage
     * referrer    = hostname only, never the full URL, and never same-site
     * no form contents, no names, no emails — those go through the contact
       form only, and are stored as a separate, identified lead record
     * respects Do Not Track and Global Privacy Control (skips entirely)
     * opt out any time:  localStorage.setItem("trimax7:analytics-optout","1")

   Configuration: paste the site `public_key` printed by
   supabase/seed/portfolio_site.sql into CONFIG.siteKey below. It is a public
   identifier, not a secret. Until it is set, this script does nothing.
   --------------------------------------------------------------------------- */

(function () {
  "use strict";

  var CONFIG = {
    url: "https://ugnkndxkzaqgealymxwl.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbmtuZHhremFxZ2VhbHlteHdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwOTQ2OTIsImV4cCI6MjEwMzY3MDY5Mn0.i7hS2VM9MV8_uUAB-9zdkB5vzX54nb9UV1iR-ZLJ_UU",
    siteKey: "b9c00ebc51f850c0bb69fb1436368d9de75e70ee5d061def",
  };

  /* Not configured yet (placeholder still in place) — stay inert. */
  if (!CONFIG.siteKey || CONFIG.siteKey.indexOf("__") === 0) return;
  if (!CONFIG.url || CONFIG.url.indexOf("__") === 0) return;

  /* Honour explicit privacy signals before touching any storage. */
  if (
    navigator.doNotTrack === "1" ||
    window.doNotTrack === "1" ||
    navigator.globalPrivacyControl === true
  ) {
    return;
  }

  var LS_VID = "trimax7:vid";
  var LS_OPTOUT = "trimax7:analytics-optout";
  var SS_SID = "trimax7:sid";
  var SS_LAST = "trimax7:last-view";

  var MIN_PATH_GAP_MS = 30000; // same path twice in 30s = one view
  var failures = 0;
  var MAX_FAILURES = 3;
  var started = false;

  function read(store, key) {
    try {
      return window[store].getItem(key);
    } catch (e) {
      return null;
    }
  }

  function write(store, key, value) {
    try {
      window[store].setItem(key, value);
    } catch (e) {
      /* private mode / storage disabled — degrade quietly */
    }
  }

  function optedOut() {
    return read("localStorage", LS_OPTOUT) === "1";
  }

  function randomId() {
    try {
      if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
      }
      if (window.crypto && typeof window.crypto.getRandomValues === "function") {
        var bytes = new Uint8Array(16);
        window.crypto.getRandomValues(bytes);
        return Array.prototype.map
          .call(bytes, function (b) {
            return ("0" + b.toString(16)).slice(-2);
          })
          .join("");
      }
    } catch (e) {
      /* fall through */
    }
    return "v" + Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
  }

  function visitorId() {
    var id = read("localStorage", LS_VID);
    if (!id || id.length < 8) {
      id = randomId();
      write("localStorage", LS_VID, id);
    }
    return id;
  }

  function sessionId() {
    var id = read("sessionStorage", SS_SID);
    if (!id || id.length < 8) {
      id = randomId();
      write("sessionStorage", SS_SID, id);
    }
    return id;
  }

  function deviceCategory() {
    var w = window.innerWidth || document.documentElement.clientWidth || 0;
    if (w < 768) return "mobile";
    if (w < 1024) return "tablet";
    if (w > 0) return "desktop";
    return "other";
  }

  function referrerHost() {
    try {
      if (!document.referrer) return "";
      var host = new URL(document.referrer).hostname;
      /* Internal navigation is not a traffic source. */
      if (host === window.location.hostname) return "";
      return host;
    } catch (e) {
      return "";
    }
  }

  function param(name) {
    try {
      return new URLSearchParams(window.location.search).get(name) || "";
    } catch (e) {
      return "";
    }
  }

  function currentPath() {
    var p = window.location.pathname || "/";
    return p.length > 300 ? p.slice(0, 300) : p;
  }

  function shouldSkipDuplicate(eventType, path) {
    if (eventType !== "page_view") return false;
    var raw = read("sessionStorage", SS_LAST);
    var now = Date.now();
    if (raw) {
      try {
        var last = JSON.parse(raw);
        if (last && last.path === path && now - Number(last.at || 0) < MIN_PATH_GAP_MS) {
          return true;
        }
      } catch (e) {
        /* ignore malformed value */
      }
    }
    write("sessionStorage", SS_LAST, JSON.stringify({ path: path, at: now }));
    return false;
  }

  function track(eventType) {
    if (failures >= MAX_FAILURES) return;
    if (optedOut()) return;
    if (document.visibilityState === "prerender") return;

    var path = currentPath();
    if (shouldSkipDuplicate(eventType, path)) return;

    var payload = {
      event_type: eventType,
      path: path,
      referrer_host: referrerHost(),
      utm_source: param("utm_source"),
      utm_medium: param("utm_medium"),
      utm_campaign: param("utm_campaign"),
      device_category: deviceCategory(),
      visitor_id: visitorId(),
      session_id: sessionId(),
    };

    try {
      fetch(CONFIG.url + "/rest/v1/rpc/track_analytics_event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: CONFIG.anonKey,
          Authorization: "Bearer " + CONFIG.anonKey,
        },
        body: JSON.stringify({ p_key: CONFIG.siteKey, p_payload: payload }),
        keepalive: true,
        credentials: "omit",
      })
        .then(function (res) {
          if (!res.ok) failures += 1;
        })
        .catch(function () {
          failures += 1;
        });
    } catch (e) {
      failures += 1;
    }
  }

  /* Expose the anonymous ids so the contact form can attach its conversion
     event to this exact session (and nothing older). */
  window.trimax7Analytics = {
    visitorId: visitorId,
    sessionId: sessionId,
    deviceCategory: deviceCategory,
    referrerHost: referrerHost,
    track: track,
    optOut: function () {
      write("localStorage", LS_OPTOUT, "1");
      failures = MAX_FAILURES;
    },
  };

  function start() {
    if (started) return;
    started = true;

    track("page_view");

    /* First interaction with the contact form = form_start (once per page). */
    var form = document.getElementById("contactForm");
    if (form) {
      var formStarted = false;
      form.addEventListener(
        "input",
        function () {
          if (formStarted) return;
          formStarted = true;
          track("form_start");
        },
        { passive: true }
      );
    }

    /* Explicit CTA clicks (opt-in via data-track). */
    document.addEventListener(
      "click",
      function (event) {
        var el = event.target;
        while (el && el !== document.body) {
          if (el.getAttribute && el.hasAttribute("data-track")) {
            track("cta_click");
            return;
          }
          el = el.parentElement;
        }
      },
      { passive: true }
    );

    /* Coming back from the bfcache: count the view again only if it is a new
       path (the 30s same-path guard already covers double fires). */
    window.addEventListener("pageshow", function (event) {
      if (event.persisted) track("page_view");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
