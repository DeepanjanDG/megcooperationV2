/* =========================================================================
   Department of Cooperation, Government of Meghalaya
   Redesign behaviour — nav, hero slider, tabs, search, accessibility tools
   Vanilla JS, no dependencies.
   ========================================================================= */
(function () {
  "use strict";

  var STORE = {
    scale: "rd-font-scale",
    contrast: "rd-contrast",
    lang: "rd-lang"
  };

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* matchMedia is missing in some embedded/legacy engines — degrade gracefully */
  function media(query) {
    if (typeof window.matchMedia === "function") { return window.matchMedia(query).matches; }
    return false;
  }

  function get(key, fallback) {
    try { var v = window.localStorage.getItem(key); return v === null ? fallback : v; }
    catch (e) { return fallback; }
  }
  function set(key, val) {
    try { window.localStorage.setItem(key, val); } catch (e) { /* private mode */ }
  }

  /* -------------------------------------------------------- topbar tools */
  /* Text sizing and contrast used to live here as A-/A/A+ and a High contrast
     pill. Both are now owned by the accessibility widget at the bottom of this
     file, so all that remains in the topbar is the language switch. Any scale
     or contrast preference stored by the old controls is cleared once. */
  function clearLegacyPrefs() {
    if (get(STORE.contrast, "0") === "1") document.body.classList.remove("hc");
    set(STORE.scale, "0");
    set(STORE.contrast, "0");
  }

  function initA11y() {
    clearLegacyPrefs();

    /* language switch — the site is English-only for now, so we surface a notice */
    var note = $("#rd-lang-note");
    var buttons = $$("[data-lang]");
    function setLang(code) {
      buttons.forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("data-lang") === code); });
      if (note) note.style.display = code === "en" ? "none" : "block";
      set(STORE.lang, code);
    }
    buttons.forEach(function (b) {
      b.addEventListener("click", function () { setLang(b.getAttribute("data-lang")); });
    });
    if (buttons.length) setLang(get(STORE.lang, "en"));
  }

  /* --------------------------------------------------------- header tiers */
  /* The markup keeps the menu inside <header> so the page still reads
     correctly without JS. Here we lift it into its own full-width band
     directly below the header, which lets it stick to the top on scroll. */
  function initHeader() {
    var header = $(".site-header");
    var nav = $(".main-nav");
    if (!header || !nav) return;
    if (nav.parentNode && nav.parentNode.parentNode &&
        nav.parentNode.parentNode.className.indexOf("navbar") > -1) return;

    var bar = document.createElement("div");
    bar.className = "navbar";
    var inner = document.createElement("div");
    inner.className = "wrap";
    bar.appendChild(inner);
    inner.appendChild(nav);
    header.parentNode.insertBefore(bar, header.nextSibling);
  }

  /* ------------------------------------------------------------- nav menu */
  function initNav() {
    var items = $$(".nav-item");

    items.forEach(function (item) {
      var btn = $("button", item);
      if (!btn) return;
      btn.setAttribute("aria-expanded", "false");

      function open() {
        items.forEach(function (o) { if (o !== item) { o.classList.remove("is-open"); var b = $("button", o); if (b) b.setAttribute("aria-expanded", "false"); } });
        item.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
      }
      function close() {
        item.classList.remove("is-open");
        btn.setAttribute("aria-expanded", "false");
      }

      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        if (item.classList.contains("is-open")) { close(); } else { open(); }
      });

      if (media("(min-width: 981px)")) {
        item.addEventListener("mouseenter", open);
        item.addEventListener("mouseleave", close);
      }
      item.addEventListener("keydown", function (e) { if (e.key === "Escape") { close(); btn.focus(); } });
    });

    document.addEventListener("click", function () {
      items.forEach(function (o) { o.classList.remove("is-open"); var b = $("button", o); if (b) b.setAttribute("aria-expanded", "false"); });
    });

    var toggle = $(".nav-toggle"), nav = $(".main-nav");
    if (toggle && nav) {
      toggle.addEventListener("click", function () {
        var open = nav.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }
  }

  /* ---------------------------------------------------------- hero slider */
  function initHero() {
    var stage = $(".hero-stage");
    if (!stage) return;

    var slides = $$(".hero-slide", stage);
    var dots = $$(".hero-dots button");
    var caption = $("#hero-caption-text");
    if (slides.length < 2) return;

    var i = 0, timer = null, DELAY = 6000;

    function show(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle("is-active", k === i); });
      dots.forEach(function (d, k) {
        d.classList.toggle("is-on", k === i);
        d.setAttribute("aria-current", k === i ? "true" : "false");
      });
      if (caption) caption.textContent = slides[i].getAttribute("data-caption") || "";
    }
    function next() { show(i + 1); }
    function prev() { show(i - 1); }
    function start() { stop(); timer = setInterval(next, DELAY); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    var nextBtn = $(".hero-arrow.next"), prevBtn = $(".hero-arrow.prev");
    if (nextBtn) nextBtn.addEventListener("click", function () { next(); start(); });
    if (prevBtn) prevBtn.addEventListener("click", function () { prev(); start(); });
    dots.forEach(function (d, k) { d.addEventListener("click", function () { show(k); start(); }); });

    var motionPaused = false;

    stage.addEventListener("mouseenter", stop);
    stage.addEventListener("mouseleave", function () { if (!motionPaused) start(); });
    stage.addEventListener("focusin", stop);
    stage.addEventListener("focusout", function () { if (!motionPaused) start(); });

    /* the accessibility widget's "Pause animation" tool broadcasts these */
    document.addEventListener("rd:motion-pause", function () { motionPaused = true; stop(); });
    document.addEventListener("rd:motion-resume", function () { motionPaused = false; start(); });

    show(0);
    if (!media("(prefers-reduced-motion: reduce)")) start();
  }

  /* ----------------------------------------------------------------- tabs */
  function initTabs() {
    $$("[data-tabs]").forEach(function (group) {
      var tabs = $$(".tab", group);
      /* panels live alongside the tab strip, inside the same .wrap / section */
      var scope = group.closest ? (group.closest(".wrap") || group.closest("section") || document) : document;
      var panels = $$("[data-panel]", scope);
      tabs.forEach(function (tab) {
        tab.addEventListener("click", function () {
          var name = tab.getAttribute("data-tab");
          tabs.forEach(function (t) {
            var on = t === tab;
            t.classList.toggle("is-on", on);
            t.setAttribute("aria-selected", on ? "true" : "false");
          });
          panels.forEach(function (p) {
            p.classList.toggle("is-on", p.getAttribute("data-panel") === name);
          });
        });
      });
    });
  }

  /* --------------------------------------------------------------- search */
  var SEARCH_INDEX = [
    { kind: "Page",     title: "Introduction to the Department",                    url: "introduction.html" },
    { kind: "Page",     title: "Organisational Setup",                              url: "orgsetup.html" },
    { kind: "Page",     title: "Development Schemes",                               url: "schemes.html" },
    { kind: "Page",     title: "Notifications",                                     url: "notifications.html" },
    { kind: "Page",     title: "Contact Us",                                        url: "contactus.html" },
    { kind: "Page",     title: "Contact Persons — full directory",                  url: "contact.html" },
    { kind: "Page",     title: "Subject Allocated to the Department",               url: "suballocated.html" },
    { kind: "Page",     title: "Functions and Duties",                              url: "functionnduties.html" },
    { kind: "Page",     title: "Committees under the Department",                   url: "committee.html" },
    { kind: "Page",     title: "From the desk of the Registrar",                    url: "desk-rcs.html" },
    { kind: "Page",     title: "Registrars of Cooperative Societies since 1970",    url: "registrar_list.html" },
    { kind: "Page",     title: "Photo gallery",                                     url: "photogallery.html" },
    { kind: "Scheme",   title: "Share Capital Contribution to cooperative societies", url: "schemes.html#state-plan" },
    { kind: "Scheme",   title: "Managerial Subsidy",                                url: "schemes.html#state-plan" },
    { kind: "Scheme",   title: "Godown loan, repair and renovation",                url: "schemes.html#css" },
    { kind: "Scheme",   title: "ICDP — Integrated Cooperative Development Project", url: "icdp.html" },
    { kind: "Scheme",   title: "Subsidy Programme",                                 url: "subsidy.html" },
    { kind: "Scheme",   title: "Piggery Mission (MLEADS)",                          url: "piggery_mission.html" },
    { kind: "Scheme",   title: "Duck farming through cooperative societies",        url: "duckfarming_Coop.html" },
    { kind: "Society",  title: "Meghalaya Co-operative Apex Bank Limited",          url: "mcab.html" },
    { kind: "Society",  title: "MECOFED — Federation and Marketing Societies",      url: "mecofed.html" },
    { kind: "Society",  title: "Meghalaya State Housing Financial Coop Society",    url: "mshfcsl.html" },
    { kind: "Society",  title: "Meghalaya Apex Handloom Weavers Coop Federation",   url: "mahwhcfl.html" },
    { kind: "Notice",   title: "Strengthening Meghalaya Cooperatives — Five Year Action Plan", url: "notifications/Strengthening_Meghalaya_Cooperatives.pdf" },
    { kind: "Notice",   title: "Revised guidelines for registration of cooperative societies", url: "notifications/RevisedGuidelines_Promotion.pdf" },
    { kind: "Form",     title: "Application form for registration of a society",    url: "online_regn/Registration-Cooperative-Society.pdf" },
    { kind: "Form",     title: "Enclosures for online registration",                url: "online_regn/Enclosures.pdf" },
    { kind: "Act",      title: "The Meghalaya Cooperative Societies Act, 2015",     url: "actsnrules/The Meghalaya Cooperative Societies Act 2015.pdf" },
    { kind: "Act",      title: "The Meghalaya Cooperative Service Rules, 2003",     url: "actsnrules/Meghalaya_Cooperative_Service_Rule_2003.pdf" },
    { kind: "RTI",      title: "Right to Information manuals",                      url: "rtimanuals.html" },
    { kind: "Report",   title: "Rules and Regulations — Acts, rules and service rules", url: "rules.html" },
    { kind: "Report",   title: "Personnel Department instructions",                 url: "rules_personnel.html" },
    { kind: "Report",   title: "Important judgments",                               url: "judgments.html" },
    { kind: "Report",   title: "News clips",                                        url: "newsclips.html" },
    { kind: "Report",   title: "Registered societies as on 31 March 2019",          url: "list_coop_300319.html" },
    { kind: "Report",   title: "Archives — success stories and older lists",        url: "archives.html" },
    { kind: "Report",   title: "What's New archive",                                url: "news-archive.html" },
    { kind: "Report",   title: "Statistical data on cooperative societies",         url: "statistics.html" },
    { kind: "Report",   title: "Publications of the Department",                    url: "publications.html" },
    { kind: "Page",     title: "Citizen's Charter",                                 url: "citizencharter.html" },
    { kind: "Page",     title: "Frequently Asked Questions",                        url: "faqs.html" },
    { kind: "Page",     title: "Success stories",                                   url: "success.html" },
    { kind: "Page",     title: "Education and training",                            url: "training.html" },
    { kind: "Page",     title: "Financial assistance to societies",                 url: "finassistance.html" },
    { kind: "Page",     title: "Advertisements and recruitment",                    url: "advertisements.html" },
    { kind: "Page",     title: "Related websites and useful links",                 url: "relatedsite.html" },
    { kind: "Page",     title: "Sitemap — index of all pages",                      url: "sitemap.html" },
    { kind: "Page",     title: "Help — using this website",                         url: "help.html" },
    { kind: "Page",     title: "Accessibility statement",                           url: "accessibility-statement.html" },
    { kind: "Page",     title: "Screen reader access and assistive technologies",   url: "screen-reader-access.html" },
    { kind: "Page",     title: "Accessibility options in browsers",                 url: "accessible-browsers.html" },
    { kind: "Page",     title: "Terms of use, copyright and privacy policy",        url: "terms-use.html" }
  ];

  function initSearch() {
    var input = $("#rd-search-input");
    var box = $("#rd-search-results");
    var form = $("#rd-search-form");
    if (!input || !box) return;

    function render(list) {
      if (!list.length) {
        box.innerHTML = '<div class="empty">No matching pages. Try &ldquo;registration&rdquo;, &ldquo;subsidy&rdquo; or &ldquo;RTI&rdquo;.</div>';
        box.classList.add("is-open");
        return;
      }
      box.innerHTML = list.map(function (r) {
        return '<a href="' + r.url + '"><span class="kind">' + r.kind + '</span><span class="title">' + r.title + '</span></a>';
      }).join("");
      box.classList.add("is-open");
    }

    input.addEventListener("input", function () {
      var q = input.value.trim().toLowerCase();
      if (q.length < 2) { box.classList.remove("is-open"); return; }
      render(SEARCH_INDEX.filter(function (r) {
        return r.title.toLowerCase().indexOf(q) > -1 || r.kind.toLowerCase().indexOf(q) > -1;
      }).slice(0, 6));
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { box.classList.remove("is-open"); input.blur(); }
    });

    if (form) form.addEventListener("submit", function (e) {
      e.preventDefault();
      var first = $("a", box);
      if (first) { window.location.href = first.getAttribute("href"); }
    });

    document.addEventListener("click", function (e) {
      if (!box.contains(e.target) && e.target !== input) box.classList.remove("is-open");
    });
  }

  /* --------------------------------------------------------- last updated */
  function initLastUpdated() {
    var el = $("#rd-last-updated");
    if (!el) return;
    var d = new Date(document.lastModified);
    if (isNaN(d.getTime())) return;
    var months = ["January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December"];
    el.textContent = months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
  }

  /* -------------------------------------------------------- table filter */
  function initTableFilter() {
    $$("[data-filter-table]").forEach(function (input) {
      var table = document.getElementById(input.getAttribute("data-filter-table"));
      if (!table) return;
      var countEl = document.getElementById(input.getAttribute("data-filter-count") || "");
      var rows = $$("tbody tr", table);
      input.addEventListener("input", function () {
        var q = input.value.trim().toLowerCase();
        var shown = 0;
        rows.forEach(function (tr) {
          var hit = !q || tr.textContent.toLowerCase().indexOf(q) > -1;
          tr.style.display = hit ? "" : "none";
          if (hit) shown++;
        });
        if (countEl) countEl.textContent = shown + (shown === 1 ? " entry" : " entries");
      });
    });
  }

  function ready(fn) {
    if (document.readyState !== "loading") { fn(); }
    else { document.addEventListener("DOMContentLoaded", fn); }
  }

  /* each feature is isolated so a failure in one cannot disable the others */
  function safely(name, fn) {
    try { fn(); }
    catch (e) { if (window.console && console.warn) console.warn("redesign.js: " + name + " failed", e); }
  }

  ready(function () {
    safely("a11y", initA11y);
    safely("header", initHeader);
    safely("nav", initNav);
    safely("hero", initHero);
    safely("tabs", initTabs);
    safely("search", initSearch);
    safely("lastUpdated", initLastUpdated);
    safely("tableFilter", initTableFilter);
  });
})();


/* =========================================================================
   ACCESSIBILITY WIDGET — UX4G-style, self-hosted, no dependencies.
   Mirrors the tool set published at ux4g.gov.in/resources/accessibility-widget.
   Styles live in css/redesign.css under "ACCESSIBILITY WIDGET".

   If the Department later registers for the official NeGD-issued widget,
   drop its <script> tag in and delete this block — nothing else references it.
   ========================================================================= */
(function () {
  "use strict";

  var KEY = "rd-a11y-state";
  var ROOT = document.documentElement;

  /* ------------------------------------------------------------- defaults */
  function blank() {
    return {
      text: 0,        /* 0-3   bigger text            */
      spacing: false, /*       letter / word spacing  */
      leading: false, /*       line height            */
      links: false,   /*       highlight links        */
      read: false,    /*       screen reader          */
      cursor: 0,      /* 0-2   cursor size            */
      pause: false,   /*       pause animation        */
      sat: "",        /*       mono | high | low      */
      invert: false,  /*       invert colours         */
      dark: false,    /*       dark mode              */
      dyslexia: false,
      hideImg: false,
      focus: false,   /*       focus mode             */
      guide: false,   /*       reading guide          */
      magnify: false, /*       text magnify           */
      profile: ""
    };
  }

  var S = blank();
  var TEXT_STEPS = [1, 1.15, 1.3, 1.5];

  function load() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      Object.keys(S).forEach(function (k) {
        if (Object.prototype.hasOwnProperty.call(saved, k)) S[k] = saved[k];
      });
    } catch (e) { /* corrupt or unavailable — fall back to defaults */ }
  }
  function save() {
    try { window.localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
  }

  /* ------------------------------------------------------------- profiles */
  var PROFILES = [
    { id: "seizure",  name: "Seizure safe",
      desc: "Stops motion and softens colour intensity.",
      set: { pause: true, sat: "low" } },
    { id: "lowvision", name: "Low vision",
      desc: "Larger text, generous spacing and clearly marked links.",
      set: { text: 2, leading: true, spacing: true, links: true } },
    { id: "senior",   name: "Senior citizen",
      desc: "Comfortable reading size, roomier lines and a larger pointer.",
      set: { text: 1, leading: true, cursor: 1, links: true } },
    { id: "blind",    name: "Blind — read aloud",
      desc: "Click any paragraph or heading to have it spoken.",
      set: { read: true } },
    { id: "colour",   name: "Colour blind",
      desc: "Renders the page in greyscale so colour is never the only cue.",
      set: { sat: "mono", links: true } },
    { id: "motor",    name: "Motor difficulty",
      desc: "Large pointer and bigger, clearly outlined targets.",
      set: { cursor: 2, links: true, text: 1 } },
    { id: "dyslexia", name: "Dyslexia and reading difficulty",
      desc: "Highly legible typeface, wider spacing and a reading guide.",
      set: { dyslexia: true, leading: true, spacing: true, guide: true } },
    { id: "adhd",     name: "Cognitive / ADHD",
      desc: "Dims everything but the section you are reading.",
      set: { focus: true, pause: true, hideImg: true } }
  ];

  /* ------------------------------------------------------------ icon pack */
  function svg(inner) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
           'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
           inner + '</svg>';
  }
  var I = {
    text:    svg('<path d="M4 7V5h16v2M12 5v14M9 19h6"/>'),
    spacing: svg('<path d="M3 5v14M21 5v14M7 12h10M7 12l2.5-2.5M7 12l2.5 2.5M17 12l-2.5-2.5M17 12l-2.5 2.5"/>'),
    leading: svg('<path d="M4 6h16M4 12h16M4 18h16"/>'),
    link:    svg('<path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1-1"/>'),
    reader:  svg('<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/>'),
    cursor:  svg('<path d="M5 3l13 8-5.5 1.2L15 19l-2.6 1.3-2.6-6.6L5 17z"/>'),
    pause:   svg('<circle cx="12" cy="12" r="9"/><path d="M10 9v6M14 9v6"/>'),
    mono:    svg('<circle cx="12" cy="12" r="9"/><path d="M12 3v18" /><path d="M12 3a9 9 0 0 1 0 18" fill="currentColor" stroke="none"/>'),
    satHi:   svg('<path d="M12 3s6 6.4 6 10a6 6 0 0 1-12 0c0-3.6 6-10 6-10z"/><path d="M12 17a2 2 0 0 0 2-2"/>'),
    satLo:   svg('<path d="M12 3s6 6.4 6 10a6 6 0 0 1-12 0c0-3.6 6-10 6-10z"/>'),
    invert:  svg('<circle cx="12" cy="12" r="9"/><path d="M12 3v18a9 9 0 0 0 0-18z" fill="currentColor" stroke="none"/>'),
    dark:    svg('<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>'),
    dyslex:  svg('<path d="M4 17V7l4 10V7M13 7h4M15 7v10M12 20h8"/>'),
    noImg:   svg('<rect x="3" y="4" width="18" height="15" rx="2"/><path d="M3 15l4.5-4.5 3 3M4 4l16 15"/>'),
    focus:   svg('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 1v3M12 20v3M1 12h3M20 12h3"/>'),
    guide:   svg('<path d="M3 8h18M3 16h18M7 12h10"/>'),
    magnify: svg('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2M9 11h4M11 9v4"/>'),
    person:  svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="6.6" r="1.3" fill="currentColor" stroke="none"/><path d="M6 9.2c4 1.1 8 1.1 12 0M12 9.8v4M12 13.8l-2.4 6M12 13.8l2.4 6"/>'),
    reset:   svg('<path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4"/>')
  };

  /* --------------------------------------------------------- text scaling */
  var TEXT_SEL = "h1,h2,h3,h4,h5,h6,p,li,dd,dt,td,th,caption,a,span,strong,em,b,i,small,label," +
                 "button,input,select,textarea,figcaption,summary,blockquote,cite,legend,time,address";

  var lastMult = 1;
  function scaleText(mult) {
    /* nothing to do if we are at 1x and have never scaled away from it */
    if (mult === 1 && lastMult === 1) return;
    lastMult = mult;
    var nodes = document.body.querySelectorAll(TEXT_SEL);
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.closest && el.closest("#rd-a11y-root")) continue;
      var base = el.getAttribute("data-a11y-fs");
      if (base === null) {
        base = parseFloat(window.getComputedStyle(el).fontSize) || 16;
        el.setAttribute("data-a11y-fs", String(base));
      } else {
        base = parseFloat(base);
      }
      if (mult === 1) { el.style.fontSize = ""; }
      else { el.style.fontSize = (base * mult).toFixed(2) + "px"; }
    }
  }

  /* --------------------------------------------------------------- render */
  function applyAll() {
    var cl = ROOT.classList;

    scaleText(TEXT_STEPS[S.text] || 1);

    cl.toggle("a11y-spacing", !!S.spacing);
    cl.toggle("a11y-leading", !!S.leading);
    cl.toggle("a11y-links", !!S.links);
    cl.toggle("a11y-read", !!S.read);
    cl.toggle("a11y-cursor-1", S.cursor === 1);
    cl.toggle("a11y-cursor-2", S.cursor === 2);
    cl.toggle("a11y-dark", !!S.dark);
    cl.toggle("a11y-dyslexia", !!S.dyslexia);
    cl.toggle("a11y-hide-img", !!S.hideImg);
    cl.toggle("a11y-focus", !!S.focus);
    cl.toggle("a11y-guide-on", !!S.guide);
    cl.toggle("a11y-invert", !!S.invert);

    /* motion */
    var wasPaused = cl.contains("a11y-pause");
    cl.toggle("a11y-pause", !!S.pause);
    if (!!S.pause !== wasPaused) {
      document.dispatchEvent(new CustomEvent(S.pause ? "rd:motion-pause" : "rd:motion-resume"));
    }

    /* composed colour filter */
    var fx = [];
    if (S.sat === "mono") fx.push("grayscale(1)");
    if (S.sat === "high") fx.push("saturate(2)");
    if (S.sat === "low")  fx.push("saturate(.45)");
    if (S.invert) fx.push("invert(1)", "hue-rotate(180deg)");
    if (fx.length) {
      ROOT.style.setProperty("--a11y-filter", fx.join(" "));
      cl.add("a11y-filter");
    } else {
      ROOT.style.removeProperty("--a11y-filter");
      cl.remove("a11y-filter");
    }

    if (!S.read && window.speechSynthesis) window.speechSynthesis.cancel();
    if (!S.read) speakPill.classList.remove("is-on");
    if (!S.magnify) magnifier.classList.remove("is-on");
    if (!S.focus) clearFocusHit();

    syncButtons();
    save();
  }

  /* ------------------------------------------------------------ DOM build */
  var root, scrim, panel, launcher, guideBar, magnifier, speakPill, lastFocus;

  var TOOLS = [
    { id: "text",     label: "Bigger text",     icon: I.text,    steps: 4 },
    { id: "spacing",  label: "Text spacing",    icon: I.spacing },
    { id: "leading",  label: "Line height",     icon: I.leading },
    { id: "links",    label: "Highlight links", icon: I.link },
    { id: "read",     label: "Screen reader",   icon: I.reader },
    { id: "cursor",   label: "Cursor size",     icon: I.cursor,  steps: 3 },
    { id: "pause",    label: "Pause animation", icon: I.pause },
    { id: "sat:mono", label: "Monochrome",      icon: I.mono },
    { id: "sat:high", label: "High saturate",   icon: I.satHi },
    { id: "sat:low",  label: "Low saturate",    icon: I.satLo },
    { id: "invert",   label: "Invert colours",  icon: I.invert },
    { id: "dark",     label: "Dark mode",       icon: I.dark },
    { id: "dyslexia", label: "Dyslexia friendly", icon: I.dyslex },
    { id: "hideImg",  label: "Hide images",     icon: I.noImg },
    { id: "focus",    label: "Focus mode",      icon: I.focus },
    { id: "guide",    label: "Reading guide",   icon: I.guide },
    { id: "magnify",  label: "Text magnify",    icon: I.magnify }
  ];

  function build() {
    root = document.createElement("div");
    root.id = "rd-a11y-root";

    scrim = document.createElement("div");
    scrim.className = "a11y-scrim";
    scrim.hidden = false;

    panel = document.createElement("div");
    panel.className = "a11y-panel";
    panel.id = "rd-a11y-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-labelledby", "rd-a11y-title");

    var tools = TOOLS.map(function (t) {
      return '<button type="button" class="a11y-tool" data-tool="' + t.id + '" aria-pressed="false">' +
             t.icon + '<span>' + t.label + '</span>' +
             '<span class="a11y-step" data-step></span></button>';
    }).join("");

    var profiles = PROFILES.map(function (p) {
      return '<button type="button" class="a11y-profile" data-profile="' + p.id + '" aria-pressed="false">' +
             I.person +
             '<span><span class="p-name">' + p.name + '</span>' +
             '<span class="p-desc">' + p.desc + '</span></span></button>';
    }).join("");

    panel.innerHTML =
      '<div class="a11y-head">' +
        I.person.replace("<svg", '<svg style="width:26px;height:26px;flex:none"') +
        '<h2 id="rd-a11y-title">Accessibility options</h2>' +
        '<button type="button" class="a11y-close" aria-label="Close accessibility options">&#10005;</button>' +
      '</div>' +
      '<div class="a11y-body">' +
        '<div class="a11y-sec"><h3>Ready-made profiles</h3>' +
          '<div class="a11y-profiles">' + profiles + '</div></div>' +
        '<div class="a11y-sec"><h3>Individual tools</h3>' +
          '<div class="a11y-grid">' + tools + '</div></div>' +
        '<div class="a11y-sec">' +
          '<p class="a11y-note">Your choices are stored on this device only and stay ' +
          'applied as you move between pages. Nothing is sent to the Department.</p>' +
        '</div>' +
      '</div>' +
      '<div class="a11y-foot">' +
        '<button type="button" class="a11y-reset">Reset all</button>' +
        '<button type="button" class="a11y-done">Done</button>' +
      '</div>';

    guideBar = document.createElement("div");
    guideBar.className = "a11y-guide";

    magnifier = document.createElement("div");
    magnifier.className = "a11y-magnify";

    speakPill = document.createElement("div");
    speakPill.className = "a11y-speak";
    speakPill.innerHTML = '<span>Reading aloud…</span><button type="button">Stop</button>';

    root.appendChild(scrim);
    root.appendChild(panel);
    root.appendChild(guideBar);
    root.appendChild(magnifier);
    root.appendChild(speakPill);
    document.body.appendChild(root);
  }

  /* ------------------------------------------------------------ open/close */
  function isOpen() { return panel.classList.contains("is-open"); }

  function open() {
    lastFocus = document.activeElement;
    panel.classList.add("is-open");
    scrim.classList.add("is-open");
    if (launcher) launcher.setAttribute("aria-expanded", "true");
    var first = panel.querySelector(".a11y-close");
    if (first) first.focus();
    document.addEventListener("keydown", onKeydown, true);
  }

  function close() {
    panel.classList.remove("is-open");
    scrim.classList.remove("is-open");
    if (launcher) launcher.setAttribute("aria-expanded", "false");
    document.removeEventListener("keydown", onKeydown, true);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function onKeydown(e) {
    if (e.key === "Escape") { e.preventDefault(); close(); return; }
    if (e.key !== "Tab") return;
    var f = panel.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* -------------------------------------------------------------- toggling */
  function toggleTool(id) {
    S.profile = "";
    if (id === "text")   { S.text = (S.text + 1) % 4; }
    else if (id === "cursor") { S.cursor = (S.cursor + 1) % 3; }
    else if (id.indexOf("sat:") === 0) {
      var want = id.slice(4);
      S.sat = (S.sat === want) ? "" : want;
    }
    else { S[id] = !S[id]; }
    applyAll();
  }

  function applyProfile(id) {
    var p = null;
    for (var i = 0; i < PROFILES.length; i++) if (PROFILES[i].id === id) p = PROFILES[i];
    if (!p) return;
    var already = S.profile === id;
    S = blank();
    if (!already) {
      Object.keys(p.set).forEach(function (k) { S[k] = p.set[k]; });
      S.profile = id;
    }
    applyAll();
  }

  function resetAll() {
    S = blank();
    applyAll();
  }

  function syncButtons() {
    Array.prototype.forEach.call(panel.querySelectorAll("[data-tool]"), function (b) {
      var id = b.getAttribute("data-tool");
      var on, step = "";
      if (id === "text")        { on = S.text > 0;   step = S.text ? "Level " + S.text : ""; }
      else if (id === "cursor") { on = S.cursor > 0; step = S.cursor ? (S.cursor === 1 ? "Large" : "Extra large") : ""; }
      else if (id.indexOf("sat:") === 0) { on = S.sat === id.slice(4); }
      else                      { on = !!S[id]; }
      b.setAttribute("aria-pressed", on ? "true" : "false");
      var s = b.querySelector("[data-step]");
      if (s) s.textContent = step;
    });
    Array.prototype.forEach.call(panel.querySelectorAll("[data-profile]"), function (b) {
      b.setAttribute("aria-pressed", S.profile === b.getAttribute("data-profile") ? "true" : "false");
    });
  }

  /* ------------------------------------------------------- pointer effects */
  var focusHit = null;
  function clearFocusHit() {
    if (focusHit) { focusHit.classList.remove("a11y-focus-hit"); focusHit = null; }
  }

  function onPointerMove(e) {
    if (S.guide) guideBar.style.top = (e.clientY - 16) + "px";

    if (S.focus) {
      var n = e.target;
      while (n && n.parentNode !== document.body) n = n.parentNode;
      if (n && n !== root && n !== focusHit) {
        clearFocusHit();
        focusHit = n;
        focusHit.classList.add("a11y-focus-hit");
      }
    }
  }

  var MAG_SEL = "p,li,h1,h2,h3,h4,h5,h6,td,th,dd,dt,a,figcaption,blockquote,summary,label";
  function onMagnify(e) {
    if (!S.magnify) return;
    var el = e.target.closest ? e.target.closest(MAG_SEL) : null;
    if (!el || root.contains(el)) { magnifier.classList.remove("is-on"); return; }
    var txt = (el.textContent || "").trim();
    if (!txt) { magnifier.classList.remove("is-on"); return; }
    magnifier.textContent = txt.length > 320 ? txt.slice(0, 320) + "…" : txt;
    magnifier.classList.add("is-on");
    var top = e.clientY + 26;
    var h = magnifier.offsetHeight;
    if (top + h > window.innerHeight - 12) top = Math.max(12, e.clientY - h - 20);
    magnifier.style.top = top + "px";
    magnifier.style.left = Math.min(Math.max(12, e.clientX - 60), window.innerWidth - magnifier.offsetWidth - 12) + "px";
  }

  var READ_SEL = "p,li,h1,h2,h3,h4,h5,h6,td,th,dd,blockquote,figcaption";
  function onReadClick(e) {
    if (!S.read || !window.speechSynthesis) return;
    if (root.contains(e.target)) return;
    var el = e.target.closest ? e.target.closest(READ_SEL) : null;
    if (!el) return;
    var txt = (el.textContent || "").trim();
    if (!txt) return;
    if (e.target.closest("a,button,input,select,textarea")) return;
    e.preventDefault();
    window.speechSynthesis.cancel();
    var u = new window.SpeechSynthesisUtterance(txt);
    u.lang = document.documentElement.lang || "en";
    u.rate = 0.95;
    u.onend = function () { speakPill.classList.remove("is-on"); };
    speakPill.classList.add("is-on");
    window.speechSynthesis.speak(u);
  }

  /* ----------------------------------------------------------------- wire */
  function init() {
    if (!document.body) return;
    build();
    load();

    launcher = document.getElementById("rd-a11y-launch");
    if (launcher) launcher.addEventListener("click", function () { isOpen() ? close() : open(); });

    scrim.addEventListener("click", close);
    panel.querySelector(".a11y-close").addEventListener("click", close);
    panel.querySelector(".a11y-done").addEventListener("click", close);
    panel.querySelector(".a11y-reset").addEventListener("click", resetAll);

    panel.addEventListener("click", function (e) {
      var t = e.target.closest("[data-tool]");
      if (t) { toggleTool(t.getAttribute("data-tool")); return; }
      var p = e.target.closest("[data-profile]");
      if (p) { applyProfile(p.getAttribute("data-profile")); }
    });

    speakPill.querySelector("button").addEventListener("click", function () {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      speakPill.classList.remove("is-on");
    });

    /* small public surface so the topbar A-/A/A+ buttons can drive the same
       text scale instead of fighting it with their own inline sizes */
    window.rdA11y = {
      nudgeText: function (step) {
        S.profile = "";
        S.text = step === 0 ? 0 : Math.max(0, Math.min(3, S.text + step));
        applyAll();
      },
      open: open,
      close: close,
      reset: resetAll
    };

    document.addEventListener("mousemove", onPointerMove, { passive: true });
    document.addEventListener("mouseover", onMagnify, { passive: true });
    document.addEventListener("click", onReadClick, true);
    window.addEventListener("beforeunload", function () {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    });

    applyAll();
  }

  function ready(fn) {
    if (document.readyState !== "loading") { fn(); }
    else { document.addEventListener("DOMContentLoaded", fn); }
  }

  ready(function () {
    try { init(); }
    catch (e) { if (window.console && console.warn) console.warn("a11y widget failed", e); }
  });
})();
