/* Pacito Coffee — vanilla JS for the single page.
   Live status (Asia/Kuala_Lumpur), RSVP drawer, tagged-photo wall, stamp card, copy address. */
(function () {
  "use strict";

  var SITE = {
    timeZone: "Asia/Kuala_Lumpur",
    address: "L-02-03, Level 2, Block D, PJ8, 23, Jalan Barat, Seksyen 8, 46050 Petaling Jaya, Selangor",
    slotsTotal: 10,
    slotsTaken: 6,          // placeholder until the Google Sheet webhook is wired up
    stampsTotal: 10
  };

  function $(sel, root) { return (root || document).querySelector(sel); }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* private mode */ } }
  };

  /* ---------------- live status pill (UTC+8) ---------------- */
  var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var fmt = new Intl.DateTimeFormat("en-GB", { timeZone: SITE.timeZone, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  function klParts(date) {
    var o = {};
    fmt.formatToParts(date).forEach(function (p) { o[p.type] = p.value; });
    return { day: DAYS.indexOf(o.weekday), hour: parseInt(o.hour, 10) % 24 };
  }
  function getStatus(date) {
    var p = klParts(date || new Date());
    var openDay = p.day >= 4 && p.day <= 6;
    if (openDay && p.hour >= 19 && p.hour < 23) return { state: "open", tone: "marigold", label: "OPEN TONIGHT · TIL 11PM", day: p.day };
    if (openDay && p.hour < 19) return { state: "opens", tone: "paper", label: "OPENS TONIGHT · 7PM", day: p.day };
    if ((p.day === 4 || p.day === 5) && p.hour >= 23) return { state: "closed", tone: "slate", label: "CLOSED · BACK TOMORROW 7PM", day: p.day };
    return { state: "closed", tone: "slate", label: "CLOSED · BACK THU 7PM", day: p.day };
  }
  // ?now=2026-11-27T21:00:00+08:00 pins the clock for testing
  var pinned = new URLSearchParams(location.search).get("now");
  function now() { return pinned ? new Date(pinned) : new Date(); }

  function renderStatus() {
    var s = getStatus(now());
    var pill = $("#status-pill");
    pill.className = "pc-pill pc-header__status pc-pill--" + s.tone;
    pill.setAttribute("data-state", s.state);
    pill.textContent = "";
    if (s.state === "open") { var dot = el("span", "pc-pill__dot"); dot.setAttribute("aria-hidden", "true"); pill.appendChild(dot); }
    pill.appendChild(document.createTextNode(s.label));
    document.querySelectorAll("#hours tr").forEach(function (tr) {
      tr.classList.toggle("is-today", Number(tr.getAttribute("data-day")) === s.day);
    });
  }
  renderStatus();
  setInterval(renderStatus, 30000);

  /* ---------------- section nav highlight ---------------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".site-nav a"));
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) { a.setAttribute("aria-current", a.getAttribute("href") === "#" + en.target.id ? "true" : "false"); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    navLinks.forEach(function (a) { var t = $(a.getAttribute("href")); if (t) io.observe(t); });
  }

  /* ---------------- Puisi Purnama RSVP ---------------- */
  var slotsLeft = Math.max(0, SITE.slotsTotal - SITE.slotsTaken);
  var drawer = $("#rsvp"), form = $("#rsvp-form"), lastFocus = null;

  function slotLabel() { return slotsLeft === 0 ? "ALL " + SITE.slotsTotal + " POET SLOTS TAKEN" : slotsLeft + " OF " + SITE.slotsTotal + " POET SLOTS LEFT"; }
  function renderSlots() {
    var full = slotsLeft === 0;
    [$("#slots-pill"), $("#rsvp-slots")].forEach(function (p) {
      p.textContent = slotLabel();
      p.className = "pc-pill " + (full ? "pc-pill--slate" : "pc-pill--marigold");
    });
    var btn = $("#rsvp-open");
    btn.textContent = full ? "Audience walk-in (free)" : "Sign up to read";
    btn.classList.toggle("pc-btn--marigold", !full);
  }
  function openDrawer() {
    if (slotsLeft === 0) { location.hash = "#find"; return; }
    lastFocus = document.activeElement;
    drawer.hidden = false;
    document.body.style.overflow = "hidden";
    var first = form && form.querySelector("input"); (first || $(".pc-close", drawer)).focus();
  }
  function closeDrawer() {
    drawer.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }
  $("#rsvp-open").addEventListener("click", openDrawer);
  drawer.addEventListener("click", function (ev) { if (ev.target === drawer || ev.target.closest("[data-close]")) closeDrawer(); });
  document.addEventListener("keydown", function (ev) {
    if (drawer.hidden) return;
    if (ev.key === "Escape") closeDrawer();
    if (ev.key === "Tab") { // keep focus inside the drawer
      var f = drawer.querySelectorAll("button, input, a[href]"); if (!f.length) return;
      var a = f[0], z = f[f.length - 1];
      if (ev.shiftKey && document.activeElement === a) { ev.preventDefault(); z.focus(); }
      else if (!ev.shiftKey && document.activeElement === z) { ev.preventDefault(); a.focus(); }
    }
  });
  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var name = form.elements.name.value.trim(), err = $("#rsvp-err");
    if (!name) { err.hidden = false; err.textContent = "× Tell us your name or stage name."; form.elements.name.setAttribute("aria-invalid", "true"); form.elements.name.focus(); return; }
    err.hidden = true; form.elements.name.removeAttribute("aria-invalid");
    // TODO: POST to the Google Apps Script webhook (site-config.json event.rsvpWebhook); the sheet enforces the cap.
    slotsLeft = Math.max(0, slotsLeft - 1);
    renderSlots();
    var done = el("div", "pc-done");
    done.setAttribute("role", "status");
    done.appendChild(el("strong", null, "You're on the list"));
    done.appendChild(document.createTextNode("See you at Puisi Purnama, " + name + ". Arrive by 8PM and find us at the mic."));
    $("#rsvp-body").replaceChildren(done);
  });
  renderSlots();

  /* ---------------- tagged-photo wall ---------------- */
  // Placeholder posts. Swap `art` for real photo URLs once tagged posts are curated.
  var POSTS = [
    { handle: "@aina.lepak", note: "first Mengada of the run", bg: "peri", art: "cup", likes: 214 },
    { handle: "@kopi_kawan", note: "vinyl night again", bg: "slate", art: "vinyl", likes: 168 },
    { handle: "@syaz.draws", note: "got my RM30 sticker!", bg: "mari", art: "sticker", likes: 301 },
    { handle: "@the.geng.pj", note: "courtyard picnic, 9PM", bg: "slate", art: "lights", likes: 122 },
    { handle: "@puisi.pj", note: "Puisi Purnama, full moon", bg: "peri", art: "moon", likes: 187 },
    { handle: "@hafiz.on.film", note: "Ais Coklat supremacy", bg: "mari", art: "two-cups", likes: 95 }
  ];
  var FILL = { peri: "var(--periwinkle)", slate: "var(--slate-panel)", mari: "var(--marigold)", paper: "var(--paper)" };
  var SVGNS = "http://www.w3.org/2000/svg";
  function photoSvg(p) {
    var s = document.createElementNS(SVGNS, "svg");
    s.setAttribute("viewBox", "0 0 200 200");
    s.setAttribute("aria-hidden", "true");
    var onDark = p.bg === "slate";
    var bits = '<rect width="200" height="200" style="fill:' + FILL[p.bg] + '"/>';
    var spark = function (x, y, k, cls) { return '<use href="#sparkle" class="' + (cls || (onDark ? "s-paper" : "s-paper s-line s-thin")) + '" transform="translate(' + x + " " + y + ") scale(" + k + ')"/>'; };
    switch (p.art) {
      case "cup":
        bits += '<path class="s-mari s-line" d="M-6 160L206 150V206H-6Z"/>' +
          '<use href="#bigcup" transform="translate(46 22) scale(.86)"/>' + spark(166, 40, 1.1) + spark(28, 70, .6);
        break;
      case "vinyl":
        bits += '<circle class="s-ink" cx="100" cy="104" r="70" style="stroke:var(--paper);stroke-width:3"/>' +
          '<circle class="s-none" cx="100" cy="104" r="50" style="stroke:var(--slate-panel);stroke-width:2"/>' +
          '<circle class="s-none" cx="100" cy="104" r="34" style="stroke:var(--slate-panel);stroke-width:2"/>' +
          '<circle class="s-mari" cx="100" cy="104" r="18"/><circle class="s-ink" cx="100" cy="104" r="4"/>' +
          '<path class="s-none s-line-paper" d="M170 24V70L136 84"/>' + spark(36, 36, .8) + spark(172, 170, .6, "s-mari");
        break;
      case "sticker":
        bits += '<rect class="s-paper s-line" x="40" y="40" width="120" height="120" transform="rotate(-6 100 100)"/>' +
          '<circle class="s-peri s-line" cx="100" cy="98" r="34"/>' +
          '<path class="s-none s-line" d="M86 92h0M114 92h0M84 108Q100 122 116 108"/>' +
          '<use href="#sparkle" class="s-mari s-line" transform="translate(146 56) scale(1.1)"/>';
        break;
      case "lights":
        bits += '<path class="s-line-paper" d="M-10 30Q60 80 110 56T210 40"/>';
        [[14, 44], [46, 62], [80, 66], [112, 58], [146, 48], [180, 44]].forEach(function (b) { bits += '<circle class="s-mari" cx="' + b[0] + '" cy="' + (b[1] + 6) + '" r="5"/>'; });
        bits += '<path class="s-peri s-line" d="M10 150L190 140L204 204H-4Z"/>' +
          '<rect class="s-paper s-line" x="48" y="118" width="26" height="34"/><rect class="s-mari s-line" x="118" y="112" width="26" height="38"/>' + spark(150, 92, .7);
        break;
      case "moon":
        bits += '<circle class="s-paper s-line" cx="132" cy="66" r="36"/>' +
          '<rect class="s-ink" x="88" y="118" width="8" height="70"/><circle class="s-ink s-line" cx="92" cy="114" r="12"/>' +
          '<path class="s-mari s-line" d="M-6 182L206 176V206H-6Z"/>' + spark(40, 46, .8, "s-paper") + spark(60, 98, .5, "s-mari");
        break;
      default: // two cups
        bits += '<use href="#bigcup" transform="translate(14 46) scale(.66)"/><use href="#bigcup" transform="translate(104 34) scale(.72)"/>' + spark(98, 30, .8);
    }
    s.innerHTML = bits;
    return s;
  }

  var grid = $("#wall-grid"), viewer = $("#viewer");
  var tilts = [-2, 1.5, -1, 2, -1.5, 1];
  POSTS.forEach(function (p, i) {
    var li = el("li");
    li.style.setProperty("--tilt", tilts[i % tilts.length] + "deg");
    var b = el("button", "polaroid");
    b.type = "button";
    b.setAttribute("aria-label", "Photo by " + p.handle + ": " + p.note);
    if (i === 0) { var pin = el("span", "pc-ribbon pc-ribbon--sm pc-ribbon--marigold polaroid__pin", "Pick of the week"); pin.style.setProperty("--pc-tilt", "-4deg"); b.appendChild(pin); }
    var art = el("span", "polaroid__art"); art.appendChild(photoSvg(p)); b.appendChild(art);
    var cap = el("span", "polaroid__cap");
    cap.appendChild(el("span", "polaroid__handle", p.handle));
    cap.appendChild(el("span", "polaroid__note", p.note));
    b.appendChild(cap);
    b.addEventListener("click", function () {
      $("#viewer-cap").textContent = p.handle;
      $("#viewer-art").replaceChildren(photoSvg(p));
      $("#viewer-text").textContent = "“" + p.note + "” · " + p.likes + " likes · #MinumJomPacito";
      if (viewer.showModal) viewer.showModal(); else viewer.setAttribute("open", "");
    });
    li.appendChild(b);
    grid.appendChild(li);
  });
  viewer.addEventListener("click", function (ev) { if (ev.target === viewer || ev.target.closest("[data-close]")) viewer.close(); });

  /* ---------------- stamp card ---------------- */
  var KEY = "pacito.stamps";
  var stamps = Math.min(SITE.stampsTotal, parseInt(store.get(KEY) || "0", 10) || 0);
  var rots = [-8, 6, -14, 10, -4, 12, -10, 4, -6, 0];
  var stampGrid = $("#stamp-grid");

  function stampSvg(i) {
    var s = document.createElementNS(SVGNS, "svg");
    s.setAttribute("viewBox", "-30 -30 60 60");
    s.setAttribute("aria-hidden", "true");
    s.style.setProperty("--rot", rots[i] + "deg");
    s.innerHTML = '<circle class="s-mari s-line" r="27"/><circle class="s-none s-line s-thin" r="21" stroke-dasharray="3 4"/>' +
      '<use href="#sparkle" class="s-paper s-line s-thin" transform="scale(1.05)"/>';
    return s;
  }
  function renderStamps(justAdded) {
    stampGrid.replaceChildren();
    for (var i = 0; i < SITE.stampsTotal; i++) {
      var last = i === SITE.stampsTotal - 1, filled = i < stamps;
      var li = el("li", "stamp" + (last && !filled ? " stamp--free" : "") + (filled ? " is-filled" : "") + (justAdded && i === stamps - 1 ? " is-new" : ""));
      li.setAttribute("aria-label", (last ? "Stamp 10, free drink" : "Stamp " + (i + 1)) + (filled ? ", collected" : ", empty"));
      li.appendChild(el("span", "stamp__n", last && !filled ? "FREE" : String(i + 1)));
      if (filled) li.appendChild(stampSvg(i));
      stampGrid.appendChild(li);
    }
    $("#stamp-count").textContent = stamps + " OF " + SITE.stampsTotal;
    var left = SITE.stampsTotal - stamps;
    $("#stamp-msg").textContent = stamps === 0 ? "Your card is empty. Order something nice tonight."
      : left === 0 ? "Card full! Show this at the counter for your free drink."
      : left === 1 ? "One more stamp and your next drink is free."
      : left + " more stamps to a free drink.";
    var add = $("#stamp-add");
    add.disabled = left === 0;
  }
  $("#stamp-add").addEventListener("click", function () {
    if (stamps >= SITE.stampsTotal) return;
    stamps++; store.set(KEY, String(stamps)); renderStamps(true);
  });
  $("#stamp-reset").addEventListener("click", function () { stamps = 0; store.set(KEY, "0"); renderStamps(false); });
  renderStamps(false);

  /* ---------------- copy address ---------------- */
  var copyBtn = $("#copy-addr");
  copyBtn.addEventListener("click", function () {
    var done = function () { copyBtn.textContent = "Copied!"; setTimeout(function () { copyBtn.textContent = "Copy address"; }, 2000); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(SITE.address).then(done, done); else done();
  });
})();
