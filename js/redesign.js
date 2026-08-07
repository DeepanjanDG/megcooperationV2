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

  /* ------------------------------------------------ accessibility toolbar */
  var scale = parseInt(get(STORE.scale, "0"), 10) || 0;

  function applyScale() {
    var main = $("#main") || document.body;
    main.style.fontSize = (100 + scale * 10) + "%";
    set(STORE.scale, String(scale));
  }

  function applyContrast(on) {
    document.body.classList.toggle("hc", !!on);
    var btn = $("#rd-contrast");
    if (btn) {
      btn.classList.toggle("is-on", !!on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    }
    set(STORE.contrast, on ? "1" : "0");
  }

  function initA11y() {
    var inc = $("#rd-font-inc"), dec = $("#rd-font-dec"), rst = $("#rd-font-rst"),
        con = $("#rd-contrast");

    if (inc) inc.addEventListener("click", function (e) { e.preventDefault(); scale = Math.min(4, scale + 1); applyScale(); });
    if (dec) dec.addEventListener("click", function (e) { e.preventDefault(); scale = Math.max(-2, scale - 1); applyScale(); });
    if (rst) rst.addEventListener("click", function (e) { e.preventDefault(); scale = 0; applyScale(); });
    if (con) con.addEventListener("click", function (e) {
      e.preventDefault();
      applyContrast(!document.body.classList.contains("hc"));
    });

    applyScale();
    applyContrast(get(STORE.contrast, "0") === "1");

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

    stage.addEventListener("mouseenter", stop);
    stage.addEventListener("mouseleave", start);
    stage.addEventListener("focusin", stop);
    stage.addEventListener("focusout", start);

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
    safely("nav", initNav);
    safely("hero", initHero);
    safely("tabs", initTabs);
    safely("search", initSearch);
    safely("lastUpdated", initLastUpdated);
    safely("tableFilter", initTableFilter);
  });
})();
