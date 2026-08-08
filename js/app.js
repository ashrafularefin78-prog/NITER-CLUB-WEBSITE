/* ============================================================
   NITER Clubs Portal — application logic
   Router, views, member portal, form builder, cover maker.
   Plain script (no modules) so the site works from file://
   ============================================================ */
(function () {
  "use strict";

  var DB = window.ClubDB;
  var db = DB.loadDb();

  var DEMO_CODE = "niter2025";

  var state = {
    session: null,       // { clubId }
    portalTab: "notices",
    portalNotice: null,  // notice being composed/edited
    builder: null,       // form builder draft
    subFormId: null,     // form whose submissions are open
    cover: loadCoverDraft(),
    clubsFilter: ""
  };

  /* ================= Utilities ================= */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function fmtDate(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear();
  }
  function fmtDateTime(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return iso;
    var hh = d.getHours(), mm = d.getMinutes();
    var ap = hh >= 12 ? "PM" : "AM";
    hh = hh % 12 || 12;
    return fmtDate(iso) + ", " + hh + ":" + (mm < 10 ? "0" : "") + mm + " " + ap;
  }
  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function clubById(id) { return db.clubs.find(function (c) { return c.id === id; }); }
  function formById(id) { return db.forms.find(function (f) { return f.id === id; }); }
  function noticeById(id) { return db.notices.find(function (n) { return n.id === id; }); }
  function deptById(id) { return db.config.departments.find(function (d) { return d.id === id; }); }

  function clubNotices(clubId) {
    return db.notices.filter(function (n) { return n.clubId === clubId; })
      .sort(function (a, b) { return b.date.localeCompare(a.date); });
  }
  function clubForms(clubId) {
    return db.forms.filter(function (f) { return f.clubId === clubId; });
  }
  function formSubs(formId) {
    return db.submissions.filter(function (s) { return s.formId === formId; });
  }
  function isClosed(form) {
    return form.deadline && form.deadline < todayISO();
  }

  function toast(msg, kind) {
    var root = document.getElementById("toast-root");
    if (!root) return;
    var el = document.createElement("div");
    el.className = "toast " + (kind || "");
    el.textContent = msg;
    root.appendChild(el);
    setTimeout(function () {
      el.style.transition = "opacity .3s, transform .3s";
      el.style.opacity = "0";
      el.style.transform = "translateY(8px)";
      setTimeout(function () { el.remove(); }, 320);
    }, 2600);
  }

  function save() { DB.saveDb(db); }

  function download(filename, text, mime) {
    try {
      var blob = new Blob([text], { type: mime || "text/plain;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url; a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 300);
    } catch (e) {
      toast("Download failed in this browser.", "err");
    }
  }

  /* ================= Routing ================= */
  function parseRoute() {
    return location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  }
  function navigate(path) { location.hash = "#/" + path; }

  function updateNav(parts) {
    var active = parts[0] || "home";
    if (active === "club") active = "clubs";
    var links = document.querySelectorAll("[data-nav]");
    for (var i = 0; i < links.length; i++) {
      links[i].classList.toggle("active", links[i].getAttribute("data-nav") === active);
    }
  }

  function render() {
    var parts = parseRoute();
    var app = document.getElementById("app");
    updateNav(parts);
    if (parts.length === 0 || parts[0] === "home") {
      app.innerHTML = viewHome();
    } else if (parts[0] === "clubs") {
      app.innerHTML = viewClubs();
    } else if (parts[0] === "club") {
      app.innerHTML = viewClub(decodeURIComponent(parts[1] || ""));
    } else if (parts[0] === "form") {
      app.innerHTML = viewForm(parts[1] || "");
    } else if (parts[0] === "portal") {
      app.innerHTML = viewPortal();
    } else if (parts[0] === "cover") {
      app.innerHTML = viewCover();
      renderCoverPreview();
    } else {
      app.innerHTML = viewNotFound();
    }
    window.scrollTo(0, 0);
  }

  /* ================= Shared bits ================= */
  function clubCardHTML(c) {
    var n = clubNotices(c.id).length;
    var f = clubForms(c.id).length;
    return '<div class="club-card" data-action="open-club" data-id="' + esc(c.id) + '" role="button" tabindex="0">' +
      '<div class="club-icon" style="background:' + esc(c.color) + '">' + esc(c.icon) + "</div>" +
      "<h3>" + esc(c.name) + "</h3>" +
      '<p class="tagline">' + esc(c.tagline) + "</p>" +
      '<div class="meta"><span class="notices">' + n + " notice" + (n === 1 ? "" : "s") + "</span>" +
      "<span>" + f + " form" + (f === 1 ? "" : "s") + "</span></div>" +
      "</div>";
  }

  function noticeCardHTML(n, showClub) {
    var club = clubById(n.clubId);
    var actions = "";
    if (n.formId && formById(n.formId)) {
      actions = '<a class="btn btn-primary btn-sm" href="#/form/' + esc(n.formId) + '">📝 Fill the form</a>';
    }
    return '<div class="notice-card">' +
      '<div class="n-head"><h3>' + esc(n.title) + "</h3>" +
      '<span class="n-date">🗓 ' + esc(fmtDate(n.date)) + "</span></div>" +
      '<p class="n-body">' + esc(n.body) + "</p>" +
      '<div class="n-actions">' +
      (showClub && club ? '<span class="pill club">' + esc(club.icon) + " " + esc(club.name) + "</span>" : "") +
      actions +
      "</div></div>";
  }

  function formCardHTML(f) {
    var closed = isClosed(f);
    var subs = formSubs(f.id).length;
    return '<div class="form-card">' +
      "<h3>" + esc(f.title) + "</h3>" +
      '<p class="f-desc">' + esc(f.description || "") + "</p>" +
      '<div class="f-meta">' +
      '<span class="pill">' + f.fields.length + " field" + (f.fields.length === 1 ? "" : "s") + "</span>" +
      (closed ? '<span class="pill deadline">Closed</span>' : '<span class="pill deadline">⏳ ' + esc(fmtDate(f.deadline)) + "</span>") +
      "<span>" + subs + " submission" + (subs === 1 ? "" : "s") + "</span>" +
      "</div>" +
      (closed
        ? '<button class="btn btn-outline btn-sm" disabled>Closed</button>'
        : '<a class="btn btn-primary btn-sm" href="#/form/' + esc(f.id) + '">Fill the form</a>') +
      "</div>";
  }

  /* ================= Home ================= */
  function viewHome() {
    var latest = db.notices.slice().sort(function (a, b) { return b.date.localeCompare(a.date); }).slice(0, 4);
    var openForms = db.forms.filter(function (f) { return !isClosed(f); }).slice(0, 3);

    var heroNotices = latest.map(function (n) {
      var club = clubById(n.clubId);
      return '<li><span class="dot">' + esc(club ? club.icon : "📢") + "</span>" +
        "<span><b>" + esc(n.title) + "</b><br><span class='small' style='opacity:.85'>" +
        esc(club ? club.name : "") + " · " + esc(fmtDate(n.date)) + "</span></span></li>";
    }).join("");

    return (
      '<section class="hero"><div class="container hero-grid">' +
      "<div>" +
      "<h1>One portal for every club at <span class='accent'>NITER</span>.</h1>" +
      '<p class="lead">Discover notices, register for events, join clubs, and fill forms — all in one place. Club executives can post notices and publish membership forms in seconds.</p>' +
      '<div class="flex flex-wrap">' +
      '<a class="btn btn-primary" href="#/clubs">Explore Clubs →</a>' +
      '<a class="btn" style="background:rgba(255,255,255,.14);color:#fff;border-color:rgba(255,255,255,.25)" href="#/cover">📄 Assignment Cover Maker</a>' +
      "</div>" +
      '<div class="hero-badges">' +
      '<span class="stat-chip">🎓 <b>' + db.clubs.length + "</b> clubs</span>" +
      '<span class="stat-chip">📢 <b>' + db.notices.length + "</b> notices</span>" +
      '<span class="stat-chip">📝 <b>' + db.forms.length + "</b> active forms</span>" +
      "</div></div>" +
      '<div class="hero-card"><h3>📢 Latest notices</h3><ul class="hero-mini-list">' +
      heroNotices +
      "</ul></div>" +
      "</div></section>" +

      '<section class="section"><div class="container">' +
      '<div class="section-head"><div><h2>Our clubs</h2><p class="sub">Find your community — every club at NITER in one place.</p></div>' +
      '<a class="link" href="#/clubs">View all →</a></div>' +
      '<div class="club-grid">' +
      db.clubs.map(clubCardHTML).join("") +
      "</div></div></section>" +

      '<section class="section" style="background:#fff;border-top:1px solid var(--line);border-bottom:1px solid var(--line)"><div class="container">' +
      '<div class="section-head"><div><h2>Forms open now</h2><p class="sub">Memberships, events and registrations you can apply for today.</p></div>' +
      '<a class="link" href="#/clubs">Browse by club →</a></div>' +
      '<div class="club-grid" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">' +
      openForms.map(function (f) {
        return '<div class="form-card"><h3>' + esc(f.title) + "</h3>" +
          '<p class="f-desc">' + esc(f.description || "") + "</p>" +
          '<div class="f-meta"><span class="pill club">' + esc(clubById(f.clubId) ? clubById(f.clubId).icon + " " + clubById(f.clubId).name : "") + "</span></div>" +
          '<a class="btn btn-primary btn-sm" href="#/form/' + esc(f.id) + '">Apply now</a></div>';
      }).join("") +
      "</div></div></section>" +

      '<section class="section"><div class="container">' +
      '<div class="section-head"><div><h2>Latest notices</h2><p class="sub">Everything happening across campus.</p></div>' +
      '<a class="link" href="#/clubs">Per club →</a></div>' +
      '<div class="notice-list">' +
      latest.map(function (n) { return noticeCardHTML(n, true); }).join("") +
      "</div></div></section>" +

      '<section class="section"><div class="container">' +
      '<div class="panel" style="display:flex;gap:22px;align-items:center;flex-wrap:wrap;background:linear-gradient(120deg,var(--navy),var(--navy-2));color:#fff;border:none">' +
      '<div style="font-size:44px">📄</div>' +
      '<div class="grow"><h2 class="mb-0" style="color:#fff">Assignment Cover Page Maker</h2>' +
      '<p class="mb-0" style="opacity:.85">Generate a clean, print-ready cover page for any department and course — pick your course, fill in your details, and save as PDF.</p></div>' +
      '<a class="btn btn-primary" href="#/cover">Make my cover page →</a>' +
      "</div></div></section>"
    );
  }

  /* ================= Clubs ================= */
  function viewClubs() {
    var filtered = state.clubsFilter
      ? db.clubs.filter(function (c) {
        return (c.name + " " + (c.tagline || "") + " " + (c.about || "")).toLowerCase().indexOf(state.clubsFilter.toLowerCase()) !== -1;
      })
      : db.clubs;

    return (
      '<div class="page-hero"><div class="container">' +
      '<div class="crumbs"><a href="#/">Home</a> / Clubs</div>' +
      "<h1>All clubs at NITER</h1>" +
      '<p class="tagline">' + db.clubs.length + " clubs and societies — find yours and get involved.</p>" +
      "</div></div>" +
      '<section class="section"><div class="container">' +
      '<div class="mb-2"><input type="text" id="club-filter" placeholder="🔍  Search clubs… (e.g. computer, debate, science)" style="max-width:420px"></div>' +
      '<div class="club-grid" id="club-grid">' +
      (filtered.length ? filtered.map(clubCardHTML).join("") : '<div class="empty-state" style="grid-column:1/-1"><div class="icon">🔍</div><p>No clubs match your search.</p></div>') +
      "</div></div></section>"
    );
  }

  /* ================= Club detail ================= */
  function viewClub(id) {
    var c = clubById(id);
    if (!c) return viewNotFound();
    var notices = clubNotices(id);
    var forms = clubForms(id);
    var membership = forms.find(function (f) { return /membership/i.test(f.title); }) || forms[0];
    var execs = (c.executives || []).map(function (r) {
      return '<li><span class="role">' + esc(r) + "</span><span class='who'>—</span></li>";
    }).join("");

    return (
      '<div class="page-hero" style="background:linear-gradient(120deg,#131c46,' + esc(c.color) + ')"><div class="container">' +
      '<div class="crumbs"><a href="#/">Home</a> / <a href="#/clubs">Clubs</a> / ' + esc(c.name) + "</div>" +
      '<div class="flex" style="gap:16px"><span style="font-size:44px">' + esc(c.icon) + "</span>" +
      "<div><h1>" + esc(c.name) + "</h1><p class='tagline'>" + esc(c.tagline) + "</p></div></div>" +
      "</div></div>" +

      '<section class="section"><div class="container">' +
      '<div class="detail-grid">' +
      '<div class="detail-main">' +

      '<div class="panel"><h2>About the club</h2><p class="about-body mb-0">' + esc(c.about) + "</p></div>" +

      '<div class="panel"><h2>Notices (' + notices.length + ")</h2>" +
      (notices.length
        ? '<div class="notice-list">' + notices.map(function (n) { return noticeCardHTML(n, false); }).join("") + "</div>"
        : '<div class="empty-state"><div class="icon">📢</div><p>No notices posted yet.</p></div>') +
      "</div>" +

      '<div class="panel"><h2>Forms (' + forms.length + ")</h2>" +
      (forms.length
        ? '<div class="club-grid" style="grid-template-columns:repeat(auto-fill,minmax(260px,1fr))">' + forms.map(formCardHTML).join("") + "</div>"
        : '<div class="empty-state"><div class="icon">📝</div><p>No forms published yet.</p></div>') +
      "</div>" +

      "</div>" +
      '<div class="detail-side">' +

      '<div class="panel join-panel">' +
      '<div class="big-icon">' + esc(c.icon) + "</div>" +
      "<h3>Interested in joining?</h3>" +
      '<p class="mb-2">Apply through our membership form and our team will get back to you.</p>' +
      (membership && !isClosed(membership)
        ? '<a class="btn btn-primary btn-block" href="#/form/' + esc(membership.id) + '">Apply now</a>'
        : '<button class="btn btn-outline btn-block" disabled>Applications closed</button>') +
      "</div>" +

      '<div class="panel"><h3>Contact & info</h3><ul class="info-list">' +
      '<li><span class="k">Email</span><span>' + esc(c.email || "—") + "</span></li>" +
      '<li><span class="k">Room</span><span>' + esc(c.room || "—") + "</span></li>" +
      '<li><span class="k">Weekly</span><span>' + esc(c.weekly || "—") + "</span></li>" +
      "</ul></div>" +

      '<div class="panel"><h3>Executive committee</h3><ul class="exec-list">' + execs + "</ul></div>" +

      "</div>" +
      "</div></div></section>"
    );
  }

  /* ================= Form filling ================= */
  function fieldHTML(f) {
    var required = f.required ? ' <span class="req">*</span>' : "";
    var hint = f.placeholder ? '<span class="hint">' + esc(f.placeholder) + "</span>" : "";
    var name = esc(f.id);

    if (f.type === "select") {
      var opts = (f.options || []).map(function (o) {
        return '<option value="' + esc(o) + '">' + esc(o) + "</option>";
      }).join("");
      return '<div class="field"><label for="' + name + '">' + esc(f.label) + required + "</label>" +
        '<select id="' + name + '" name="' + name + '"><option value="">— Select —</option>' + opts + "</select></div>";
    }
    if (f.type === "radio") {
      var radios = (f.options || []).map(function (o) {
        return '<label><input type="radio" name="' + name + '" value="' + esc(o) + '"> ' + esc(o) + "</label>";
      }).join("");
      return '<div class="field"><label>' + esc(f.label) + required + "</label>" +
        '<div class="radio-group">' + radios + "</div></div>";
    }
    if (f.type === "textarea") {
      return '<div class="field"><label for="' + name + '">' + esc(f.label) + required + "</label>" +
        '<textarea id="' + name + '" name="' + name + '" placeholder="' + esc(f.placeholder || "") + '"></textarea></div>';
    }
    var inputType = f.type === "phone" ? "tel" : f.type;
    if (["text", "email", "tel", "number", "date", "url"].indexOf(inputType) === -1) inputType = "text";
    return '<div class="field"><label for="' + name + '">' + esc(f.label) + required + "</label>" +
      '<input type="' + inputType + '" id="' + name + '" name="' + name + '" placeholder="' + esc(f.placeholder || "") + '">' +
      (f.type === "phone" ? '<span class="hint">Bangladesh mobile number, e.g. 01712345678</span>' : "") +
      "</div>";
  }

  function viewForm(id) {
    var f = formById(id);
    if (!f) return viewNotFound();
    var club = clubById(f.clubId);

    if (state.formDone === id) {
      state.formDone = null;
      return '<div class="section"><div class="container form-shell">' +
        '<div class="form-card-lg"><div class="form-success">' +
        '<div class="ok-icon">✓</div>' +
        "<h2>Submission received!</h2>" +
        '<p class="muted">Thank you for filling out <b>' + esc(f.title) + "</b>. The " + esc(club ? club.name : "club") +
        " team will contact you soon.</p>" +
        '<div class="flex" style="justify-content:center"><a class="btn btn-outline" href="#/club/' + esc(f.clubId) + '">Back to ' + esc(club ? club.name : "club") + "</a>" +
        '<a class="btn btn-primary" href="#/">Go home</a></div>' +
        "</div></div></div></div>";
    }

    var closed = isClosed(f);
    var fields = f.fields.map(fieldHTML).join("");

    return (
      '<div class="section"><div class="container form-shell">' +
      '<div class="breadcrumbs"><a href="#/">Home</a> / <a href="#/club/' + esc(f.clubId) + '">' + esc(club ? club.name : "Club") + "</a> / Form</div>" +
      '<div class="form-card-lg" style="margin-top:34px">' +
      '<div class="form-head"><h1>' + esc(f.title) + "</h1>" +
      '<p>' + esc(f.description || "") + "</p>" +
      '<p class="mt-1" style="opacity:.8">Deadline: ' + esc(fmtDate(f.deadline)) + " · Posted by " + esc(club ? club.name : "") + "</p></div>" +
      (closed
        ? '<div class="form-body"><div class="empty-state"><div class="icon">⛔</div><h3>This form is closed</h3><p>The deadline for this form has passed.</p></div></div>'
        : '<form id="fill-form" data-form-id="' + esc(f.id) + '" novalidate>' +
          '<div class="form-body">' + fields + "</div>" +
          '<div class="form-foot"><button class="btn btn-primary btn-block" type="submit">Submit application</button>' +
          '<p class="small muted mb-0 mt-1" style="text-align:center">Your information is saved securely in this browser and shared only with the club.</p></div>' +
          "</form>") +
      "</div></div></div>"
    );
  }

  function submitForm(formId) {
    var f = formById(formId);
    if (!f) return;
    var formEl = document.getElementById("fill-form");
    if (!formEl) return;

    var data = {};
    var errors = [];

    f.fields.forEach(function (field) {
      var el = formEl.querySelector('[name="' + field.id + '"]');
      if (!el) return;
      var val = (el.value || "").trim();
      if (el.type === "radio") {
        var checked = formEl.querySelector('[name="' + field.id + '"]:checked');
        val = checked ? checked.value : "";
      }
      if (field.required && !val) {
        errors.push(field.label + " is required.");
        return;
      }
      if (val) {
        if (field.type === "email" && !/^\S+@\S+\.\S+$/.test(val)) { errors.push(field.label + " is not a valid email."); return; }
        if (field.type === "phone" && !/^01\d{9}$/.test(val)) { errors.push(field.label + " must be a valid 11-digit mobile number."); return; }
        if (field.type === "number" && isNaN(Number(val))) { errors.push(field.label + " must be a number."); return; }
      }
      data[field.id] = val;
    });

    if (errors.length) {
      toast(errors[0], "err");
      return;
    }

    db.submissions.push({
      id: DB.uid("s"),
      formId: formId,
      data: data,
      submittedAt: new Date().toISOString()
    });
    save();
    state.formDone = formId;
    render();
    toast("Application submitted successfully!", "ok");
  }

  /* ================= Member portal ================= */
  function viewPortal() {
    if (!state.session || !clubById(state.session.clubId)) {
      return (
        '<section class="section"><div class="container">' +
        '<div class="form-card-lg login-card">' +
        '<div class="lock-icon">🔐</div>' +
        "<h2>Club member portal</h2>" +
        '<p>Post notices and publish forms for your club. Select your club and enter the member code.</p>' +
        '<form id="portal-login">' +
        '<div class="field"><label for="login-club">Your club</label>' +
        '<select id="login-club" name="club">' +
        db.clubs.map(function (c) { return '<option value="' + esc(c.id) + '">' + esc(c.icon) + " " + esc(c.name) + "</option>"; }).join("") +
        "</select></div>" +
        '<div class="field"><label for="login-code">Member code</label>' +
        '<input type="password" id="login-code" name="code" placeholder="Enter member code">' +
        '<span class="hint">Demo code: <b>' + DEMO_CODE + "</b></span></div>" +
        '<button class="btn btn-primary btn-block" type="submit">Sign in</button>' +
        "</form>" +
        '<div class="hint-box">💡 This is a demo portal — data is stored locally in your browser. In a production setup this would connect to a real accounts & database system.</div>' +
        "</div></div></section>"
      );
    }
    return portalDashboard();
  }

  function portalDashboard() {
    var club = clubById(state.session.clubId);
    var tab = state.portalTab;

    var tabs = [
      { key: "notices", label: "📢 Notices" },
      { key: "forms", label: "📝 Forms" },
      { key: "submissions", label: "📥 Submissions" },
      { key: "settings", label: "⚙️ Settings" }
    ];

    var tabsHTML = tabs.map(function (t) {
      var count = 0;
      if (t.key === "notices") count = clubNotices(club.id).length;
      if (t.key === "forms") count = clubForms(club.id).length;
      if (t.key === "submissions") count = db.submissions.filter(function (s) { return formById(s.formId) && formById(s.formId).clubId === club.id; }).length;
      return '<button class="tab' + (tab === t.key ? " active" : "") + '" data-action="portal-tab" data-tab="' + t.key + '">' +
        t.label + (count ? '<span class="count">' + count + "</span>" : "") + "</button>";
    }).join("");

    var content = "";
    if (tab === "notices") content = portalNotices(club);
    else if (tab === "forms") content = portalForms(club);
    else if (tab === "submissions") content = portalSubmissions(club);
    else content = portalSettings(club);

    return (
      '<div class="page-hero"><div class="container">' +
      '<div class="crumbs">Member Portal / ' + esc(club.name) + "</div>" +
      '<div class="flex" style="justify-content:space-between;flex-wrap:wrap;gap:14px"><div class="flex" style="gap:14px">' +
      '<span style="font-size:40px">' + esc(club.icon) + "</span>" +
      "<div><h1>Club dashboard</h1><p class='tagline'>Posting as " + esc(club.name) + "</p></div></div>" +
      '<button class="btn btn-ghost" style="color:#fff;border:1px solid rgba(255,255,255,.3)" data-action="logout">Log out →</button>' +
      "</div></div></div>" +
      '<section class="section"><div class="container">' +
      '<div class="portal-layout">' +
      '<nav class="portal-tabs">' + tabsHTML + "</nav>" +
      '<div class="portal-main">' + content + "</div>" +
      "</div></div></section>"
    );
  }

  /* --- Notices tab --- */
  function portalNotices(club) {
    if (state.portalNotice !== null) {
      var editing = state.portalNotice ? noticeById(state.portalNotice) : null;
      var clubFormsSel = clubForms(club.id).map(function (f) {
        return '<option value="' + esc(f.id) + '"' + (editing && editing.formId === f.id ? " selected" : "") + ">" + esc(f.title) + "</option>";
      }).join("");
      return (
        '<div class="panel">' +
        '<div class="portal-toolbar mb-2"><h2>' + (editing ? "Edit notice" : "Post a new notice") + "</h2>" +
        '<button class="btn btn-ghost btn-sm" data-action="cancel-notice">← Cancel</button></div>' +
        '<form id="notice-form">' +
        '<div class="field mb-2"><label>Notice title <span class="req">*</span></label>' +
        '<input type="text" id="nf-title" value="' + esc(editing ? editing.title : "") + '" placeholder="e.g. CodeStorm 2025 — Registration Open"></div>' +
        '<div class="field mb-2"><label>Notice body <span class="req">*</span></label>' +
        '<textarea id="nf-body" placeholder="Write the full notice here…">' + esc(editing ? editing.body : "") + "</textarea></div>" +
        '<div class="field mb-2"><label>Attach a form (optional)</label>' +
        '<select id="nf-form"><option value="">— None —</option>' + clubFormsSel + "</select></div>" +
        '<div class="field mb-2"><label>Posting date</label><input type="date" id="nf-date" value="' + esc(editing ? editing.date : todayISO()) + '"></div>' +
        '<button class="btn btn-primary" type="submit" data-action="save-notice" data-id="' + esc(editing ? editing.id : "") + '">' +
        (editing ? "Save changes" : "Publish notice") + "</button>" +
        "</form></div>"
      );
    }

    var list = clubNotices(club.id);
    var items = list.length ? list.map(function (n) {
      return '<div class="notice-card"><div class="n-head"><h3>' + esc(n.title) + "</h3>" +
        '<span class="n-date">' + esc(fmtDate(n.date)) + "</span></div>" +
        '<p class="n-body">' + esc(n.body) + "</p>" +
        '<div class="n-actions">' +
        (n.formId && formById(n.formId) ? '<span class="pill club">📝 linked form</span>' : "") +
        '<button class="btn btn-outline btn-sm" data-action="edit-notice" data-id="' + esc(n.id) + '">Edit</button>' +
        '<button class="btn btn-danger btn-sm" data-action="delete-notice" data-id="' + esc(n.id) + '">Delete</button>' +
        "</div></div>";
    }).join("") : "";

    return (
      '<div class="panel">' +
      '<div class="portal-toolbar mb-2"><h2>Notices</h2>' +
      '<button class="btn btn-primary btn-sm" data-action="new-notice">+ Post notice</button></div>' +
      (list.length
        ? '<div class="notice-list">' + items + "</div>"
        : '<div class="empty-state"><div class="icon">📢</div><p>No notices yet. Post your first one!</p></div>') +
      "</div>"
    );
  }

  /* --- Forms tab --- */
  function portalForms(club) {
    if (state.builder !== null) {
      return builderHTML(club);
    }
    var list = clubForms(club.id);
    var items = list.length ? list.map(function (f) {
      var subs = formSubs(f.id).length;
      return '<div class="form-card">' +
        "<h3>" + esc(f.title) + "</h3>" +
        '<p class="f-desc">' + esc(f.description || "") + "</p>" +
        '<div class="f-meta"><span class="pill">' + f.fields.length + " fields</span>" +
        (isClosed(f) ? '<span class="pill deadline">Closed</span>' : '<span class="pill deadline">⏳ ' + esc(fmtDate(f.deadline)) + "</span>") +
        "<span>" + subs + " submissions</span></div>" +
        '<div class="n-actions">' +
        '<a class="btn btn-outline btn-sm" href="#/form/' + esc(f.id) + '">Preview</a>' +
        '<button class="btn btn-outline btn-sm" data-action="edit-form" data-id="' + esc(f.id) + '">Edit</button>' +
        '<button class="btn btn-danger btn-sm" data-action="delete-form" data-id="' + esc(f.id) + '">Delete</button>' +
        "</div></div>";
    }).join("") : "";

    return (
      '<div class="panel">' +
      '<div class="portal-toolbar mb-2"><h2>Forms</h2>' +
      '<button class="btn btn-primary btn-sm" data-action="new-form">+ Create form</button></div>' +
      (list.length
        ? '<div class="club-grid" style="grid-template-columns:repeat(auto-fill,minmax(270px,1fr))">' + items + "</div>"
        : '<div class="empty-state"><div class="icon">📝</div><p>No forms yet. Create a membership or event form for your club.</p></div>') +
      "</div>"
    );
  }

  /* --- Form builder --- */
  function builderHTML(club) {
    var b = state.builder;
    var isEdit = !!b.formId;

    var fieldsHTML = b.fields.map(function (f, i) {
      var optsInput = (f.type === "select" || f.type === "radio")
        ? '<div class="field"><label>Options (comma separated)</label>' +
          '<input type="text" data-bf="options" data-idx="' + i + '" value="' + esc((f.options || []).join(", ")) + '" placeholder="Option 1, Option 2, Option 3">' +
          '<span class="hint">Shown as ' + (f.type === "select" ? "a dropdown" : "radio buttons") + "</span></div>"
        : "";
      return '<div class="builder-field" data-idx="' + i + '">' +
        '<div class="bf-top"><span class="grip">☰ Field ' + (i + 1) + "</span>" +
        '<button class="btn btn-danger btn-sm" type="button" data-action="remove-field" data-idx="' + i + '">✕ Remove</button></div>' +
        '<div class="field"><label>Field label <span class="req">*</span></label>' +
        '<input type="text" data-bf="label" data-idx="' + i + '" value="' + esc(f.label) + '" placeholder="e.g. Full Name"></div>' +
        '<div class="builder-row">' +
        '<div class="field"><label>Field type</label>' +
        '<select data-action="builder-type" data-idx="' + i + '">' +
        [["text", "Short text"], ["textarea", "Long text (paragraph)"], ["email", "Email"], ["phone", "Phone number"], ["number", "Number"], ["date", "Date"], ["select", "Dropdown list"], ["radio", "Multiple choice"]]
          .map(function (t) { return '<option value="' + t[0] + '"' + (f.type === t[0] ? " selected" : "") + ">" + t[1] + "</option>"; }).join("") +
        "</select></div>" +
        '<div class="field"><label>Required?</label>' +
        '<select data-bf="required" data-idx="' + i + '">' +
        '<option value="true"' + (f.required ? " selected" : "") + ">Yes</option>" +
        '<option value="false"' + (!f.required ? " selected" : "") + ">No</option>" +
        "</select></div></div>" +
        '<div class="field"><label>Placeholder / hint (optional)</label>' +
        '<input type="text" data-bf="placeholder" data-idx="' + i + '" value="' + esc(f.placeholder || "") + '"></div>' +
        optsInput +
        "</div>";
    }).join("");

    return (
      '<div class="panel">' +
      '<div class="portal-toolbar mb-2"><h2>' + (isEdit ? "Edit form" : "Create a new form") + "</h2>" +
      '<button class="btn btn-ghost btn-sm" data-action="cancel-builder">← Cancel</button></div>' +
      '<form id="builder-form">' +
      '<div class="field mb-2"><label>Form title <span class="req">*</span></label>' +
      '<input type="text" id="bf-title" value="' + esc(b.title) + '" placeholder="e.g. NITER Computer Club Membership Form"></div>' +
      '<div class="field mb-2"><label>Description</label>' +
      '<textarea id="bf-desc" placeholder="Explain what this form is for…">' + esc(b.description || "") + "</textarea></div>" +
      '<div class="field mb-2"><label>Closing date</label>' +
      '<input type="date" id="bf-deadline" value="' + esc(b.deadline || "") + '"></div>' +
      '<h3 class="mt-2">Fields</h3>' +
      '<div id="builder-fields" class="flex" style="flex-direction:column;gap:14px;align-items:stretch">' + fieldsHTML + "</div>" +
      '<button class="btn btn-outline mt-2" type="button" data-action="add-field">+ Add field</button>' +
      '<div class="mt-2"><button class="btn btn-primary" type="submit" data-action="save-form">' +
      (isEdit ? "Save changes" : "Publish form") + "</button></div>" +
      "</form></div>"
    );
  }

  /* --- Submissions tab --- */
  function portalSubmissions(club) {
    var forms = clubForms(club.id);
    if (state.subFormId) {
      var f = formById(state.subFormId);
      if (!f || f.clubId !== club.id) { state.subFormId = null; return portalSubmissions(club); }
      var subs = formSubs(f.id);
      var thead = '<th>#</th><th>Submitted</th>' + f.fields.map(function (fl) { return "<th>" + esc(fl.label) + "</th>"; }).join("");
      var rows = subs.map(function (s, i) {
        return "<tr><td>" + (i + 1) + "</td><td>" + esc(fmtDateTime(s.submittedAt)) + "</td>" +
          f.fields.map(function (fl) { return "<td>" + esc(s.data[fl.id] || "") + "</td>"; }).join("") + "</tr>";
      }).join("");
      return (
        '<div class="panel">' +
        '<div class="portal-toolbar mb-2"><h2>' + esc(f.title) + "</h2>" +
        '<div class="flex">' +
        '<button class="btn btn-outline btn-sm" data-action="back-submissions">← All forms</button>' +
        (subs.length ? '<button class="btn btn-navy btn-sm" data-action="export-csv" data-form="' + esc(f.id) + '">⬇ Export CSV</button>' : "") +
        "</div></div>" +
        (subs.length
          ? '<div class="sub-table-wrap"><table class="sub-table"><thead><tr>' + thead + "</tr></thead><tbody>" + rows + "</tbody></table></div>"
          : '<div class="empty-state"><div class="icon">📥</div><p>No submissions for this form yet.</p></div>') +
        "</div>"
      );
    }

    var items = forms.length ? forms.map(function (f) {
      var subs = formSubs(f.id).length;
      return '<div class="form-card">' +
        "<h3>" + esc(f.title) + "</h3>" +
        '<div class="f-meta"><span class="pill">' + subs + " submission" + (subs === 1 ? "" : "s") + "</span>" +
        (isClosed(f) ? '<span class="pill deadline">Closed</span>' : '<span class="pill deadline">Open</span>') + "</div>" +
        '<button class="btn btn-outline btn-sm" data-action="view-submissions" data-form="' + esc(f.id) + '">View submissions →</button>' +
        "</div>";
    }).join("") : "";

    return (
      '<div class="panel">' +
      '<div class="portal-toolbar mb-2"><h2>Submissions</h2></div>' +
      '<p class="muted small mb-2">Responses submitted by students to your club\u2019s forms.</p>' +
      (items ? '<div class="club-grid" style="grid-template-columns:repeat(auto-fill,minmax(270px,1fr))">' + items + "</div>"
        : '<div class="empty-state"><div class="icon">📥</div><p>No forms yet — create a form to start collecting submissions.</p></div>') +
      "</div>"
    );
  }

  /* --- Settings tab --- */
  function portalSettings(club) {
    var swatches = ["#3b82f6", "#0d9488", "#059669", "#7c3aed", "#db2777", "#ea580c", "#16a34a", "#475569", "#dc2626", "#0891b2"];
    var swatchHTML = swatches.map(function (col) {
      return '<label style="cursor:pointer"><input type="radio" name="newclub-color" value="' + col + '"' + (col === "#3b82f6" ? " checked" : "") + ' style="width:auto;height:auto">' +
        '<span style="display:inline-block;width:26px;height:26px;border-radius:8px;background:' + col + ';vertical-align:middle;margin-left:4px"></span></label>';
    }).join("");

    return (
      '<div class="panel">' +
      '<div class="portal-toolbar mb-2"><h2>Add a new club</h2></div>' +
      '<p class="muted small mb-2">Did we miss a society? Add it and it appears on the homepage instantly.</p>' +
      '<form id="new-club-form" class="cover-form">' +
      '<div class="two-col"><div class="field"><label>Club name <span class="req">*</span></label><input type="text" id="nc-name" placeholder="e.g. NITER Debating Society"></div>' +
      '<div class="field"><label>Short name</label><input type="text" id="nc-short" placeholder="e.g. NDS"></div></div>' +
      '<div class="field"><label>Icon (emoji)</label><input type="text" id="nc-icon" placeholder="e.g. 🎤"></div>' +
      '<div class="field"><label>Tagline</label><input type="text" id="nc-tagline" placeholder="One line about the club"></div>' +
      '<div class="field"><label>About</label><textarea id="nc-about" placeholder="A short description of the club…"></textarea></div>' +
      '<div class="field"><label>Color</label><div class="flex flex-wrap">' + swatchHTML + "</div></div>" +
      '<div class="two-col"><div class="field"><label>Email</label><input type="text" id="nc-email"></div>' +
      '<div class="field"><label>Room / location</label><input type="text" id="nc-room"></div></div>' +
      '<button class="btn btn-primary" type="submit">Create club</button>' +
      "</form></div>" +

      '<div class="panel">' +
      '<div class="portal-toolbar mb-2"><h2>Data</h2></div>' +
      '<p class="muted small mb-2">All site data (clubs, notices, forms, submissions) is stored locally in your browser. Export a backup, or reset to the demo data.</p>' +
      '<div class="flex flex-wrap">' +
      '<button class="btn btn-outline btn-sm" data-action="export-data">⬇ Export backup (.json)</button>' +
      '<label class="btn btn-outline btn-sm" style="cursor:pointer">⬆ Import backup<input type="file" data-action="import-data" accept=".json,application/json" style="display:none"></label>' +
      '<button class="btn btn-danger btn-sm" data-action="reset-data">Reset demo data</button>' +
      "</div></div>"
    );
  }

  /* ================= Cover maker ================= */
  function loadCoverDraft() {
    try {
      var raw = localStorage.getItem("niter-cover-draft");
      if (raw) {
        var p = JSON.parse(raw);
        if (p && typeof p === "object") return p;
      }
    } catch (e) { /* ignore */ }
    return null;
  }

  function defaultCover() {
    var cfg = db.config;
    return {
      institute: cfg.institute || "",
      deptId: cfg.departments[0] ? cfg.departments[0].id : "",
      courseCode: "", courseTitle: "",
      assignmentNo: "01", assignmentTitle: "",
      teacher: "", studentName: "", studentId: "", section: "", semester: (cfg.semesters || [])[3] || "4th", batch: "",
      submitDate: todayISO()
    };
  }

  function saveCoverDraft() {
    try { localStorage.setItem("niter-cover-draft", JSON.stringify(state.cover)); } catch (e) { /* ignore */ }
  }

  function viewCover() {
    if (!state.cover) state.cover = defaultCover();
    var c = state.cover;
    var cfg = db.config;

    var deptOpts = cfg.departments.map(function (d) {
      return '<option value="' + esc(d.id) + '"' + (c.deptId === d.id ? " selected" : "") + ">" + esc(d.name) + "</option>";
    }).join("");

    var courseOpts = "";
    var deptCourses = cfg.courses.filter(function (co) { return co.deptId === c.deptId; });
    courseOpts = deptCourses.map(function (co) {
      return '<option value="' + esc(co.code + "||" + co.title) + '">' + esc(co.code + " — " + co.title) + "</option>";
    }).join("");

    var semesterOpts = (cfg.semesters || []).map(function (s) {
      return '<option' + (c.semester === s ? " selected" : "") + ">" + esc(s) + "</option>";
    }).join("");

    return (
      '<div class="page-hero"><div class="container">' +
      '<div class="crumbs"><a href="#/">Home</a> / Cover Page Maker</div>' +
      "<h1>Assignment cover page maker</h1>" +
      '<p class="tagline">Pick your department and course, fill in your details, and print or save a neat A4 cover page as PDF.</p>' +
      "</div></div>" +
      '<section class="section"><div class="container cover-layout">' +

      '<div class="panel cover-form">' +
      '<fieldset><legend>🏛 Institution</legend>' +
      '<div class="field"><label>Institute name</label><input type="text" data-cv="institute" value="' + esc(c.institute) + '"></div>' +
      '<div class="field"><label>Department</label><select data-cv="deptId" data-action="cover-dept">' + deptOpts + "</select></div>" +
      "</fieldset>" +

      '<fieldset><legend>📚 Course</legend>' +
      '<div class="field"><label>Choose a course</label>' +
      '<select data-action="cover-course"><option value="">— Pick a course —</option>' + courseOpts + "</select></div>" +
      '<div class="two-col">' +
      '<div class="field"><label>Course code</label><input type="text" data-cv="courseCode" value="' + esc(c.courseCode) + '" placeholder="e.g. CSE-305"></div>' +
      '<div class="field"><label>Course title</label><input type="text" data-cv="courseTitle" value="' + esc(c.courseTitle) + '" placeholder="e.g. Database Management Systems"></div>' +
      "</div>" +
      '<div class="field"><label>Course teacher (submitted to)</label><input type="text" data-cv="teacher" value="' + esc(c.teacher) + '" placeholder="e.g. Prof. Dr. A. Rahman"></div>' +
      "</fieldset>" +

      '<fieldset><legend>📝 Assignment</legend>' +
      '<div class="two-col">' +
      '<div class="field"><label>Assignment no.</label><input type="text" data-cv="assignmentNo" value="' + esc(c.assignmentNo) + '"></div>' +
      '<div class="field"><label>Semester</label><select data-cv="semester">' + semesterOpts + "</select></div>" +
      "</div>" +
      '<div class="field"><label>Assignment title <span class="req">*</span></label>' +
      '<input type="text" data-cv="assignmentTitle" value="' + esc(c.assignmentTitle) + '" placeholder="e.g. Design a Student Database System"></div>' +
      "</fieldset>" +

      '<fieldset><legend>🧑‍🎓 Student</legend>' +
      '<div class="two-col">' +
      '<div class="field"><label>Full name <span class="req">*</span></label><input type="text" data-cv="studentName" value="' + esc(c.studentName) + '"></div>' +
      '<div class="field"><label>Student ID <span class="req">*</span></label><input type="text" data-cv="studentId" value="' + esc(c.studentId) + '" placeholder="e.g. 2023-CSE-045"></div>' +
      "</div>" +
      '<div class="two-col">' +
      '<div class="field"><label>Section</label><input type="text" data-cv="section" value="' + esc(c.section) + '" placeholder="e.g. A"></div>' +
      '<div class="field"><label>Batch</label><input type="text" data-cv="batch" value="' + esc(c.batch) + '" placeholder="e.g. 2023"></div>' +
      "</div>" +
      '<div class="field"><label>Submission date</label><input type="date" data-cv="submitDate" value="' + esc(c.submitDate) + '"></div>' +
      "</fieldset>" +

      '<div class="flex flex-wrap">' +
      '<button class="btn btn-primary" data-action="cover-print">🖨 Print / Save as PDF</button>' +
      '<button class="btn btn-outline" data-action="cover-reset">Reset</button>' +
      "</div>" +
      "</div>" +

      '<div class="cover-preview-wrap">' +
      '<div class="cover-preview-frame">' +
      '<div class="cover-toolbar">' +
      '<button class="btn btn-navy btn-sm" data-action="cover-print">🖨 Print / PDF</button>' +
      "</div>" +
      '<div id="cover-page" class="cover-page"></div>' +
      '<p class="small muted mb-0" style="text-align:center">Live preview — click Print and choose "Save as PDF".</p>' +
      "</div></div>" +

      "</div></div></section>"
    );
  }

  function coverDeptName() {
    var d = deptById(state.cover.deptId);
    return d ? d.name : "";
  }
  function coverDeptCode() {
    var d = deptById(state.cover.deptId);
    return d ? d.code : "";
  }

  function buildCoverHTML(c) {
    var dept = coverDeptName();
    var dash = function (v) { return v ? esc(v) : '<span style="color:#bbb">———</span>'; };
    return (
      '<div class="cp-institute">' + esc(c.institute || "National Institute of Textile Engineering and Research (NITER)") + "</div>" +
      '<div class="cp-dept">' + esc(dept) + "</div>" +
      '<div class="cp-sub">' + (c.courseCode ? esc("Course Code: " + c.courseCode) : "") + (c.courseCode && c.courseTitle ? " &nbsp;•&nbsp; " : "") + (c.courseTitle ? esc(c.courseTitle) : "") + "</div>" +
      '<div class="cp-logo">NITER</div>' +
      '<div class="cp-rule"></div>' +
      '<div class="cp-label">Assignment</div>' +
      '<div class="cp-assignment">' + (c.assignmentTitle ? esc(c.assignmentTitle) : '<span style="color:#bbb">Assignment Title</span>') + "</div>" +
      '<div class="cp-title">Assignment No: ' + esc(c.assignmentNo || "—") + "</div>" +
      "<table>" +
      "<tr><td class='k'>Course Code</td><td>" + dash(c.courseCode) + "</td></tr>" +
      "<tr><td class='k'>Course Title</td><td>" + dash(c.courseTitle) + "</td></tr>" +
      "<tr><td class='k'>Submitted To</td><td>" + dash(c.teacher) + "</td></tr>" +
      "<tr><td class='k'>Submitted By</td><td>" + dash(c.studentName) + "</td></tr>" +
      "<tr><td class='k'>Student ID</td><td>" + dash(c.studentId) + "</td></tr>" +
      "<tr><td class='k'>Section</td><td>" + dash(c.section) + "</td></tr>" +
      "<tr><td class='k'>Batch</td><td>" + dash(c.batch) + "</td></tr>" +
      "<tr><td class='k'>Semester</td><td>" + dash(c.semester) + "</td></tr>" +
      "<tr><td class='k'>Submission Date</td><td>" + dash(fmtDate(c.submitDate)) + "</td></tr>" +
      "</table>" +
      '<div class="cp-foot">' +
      "<div>" + esc(dept) + "</div>" +
      "<div>National Institute of Textile Engineering and Research (NITER)</div>" +
      "</div>"
    );
  }

  function renderCoverPreview() {
    var page = document.getElementById("cover-page");
    var printArea = document.getElementById("print-area");
    if (!page) return;
    var html = buildCoverHTML(state.cover);
    page.innerHTML = html;
    if (printArea) printArea.innerHTML = '<div class="cover-page">' + html + "</div>";
  }

  /* ================= NotFound ================= */
  function viewNotFound() {
    return '<section class="section"><div class="container" style="text-align:center;padding:60px 0">' +
      '<div style="font-size:56px">🧭</div>' +
      "<h1>Page not found</h1>" +
      '<p class="muted">The page you are looking for doesn\u2019t exist.</p>' +
      '<a class="btn btn-primary" href="#/">Go home</a>' +
      "</div></section>";
  }

  /* ================= Actions ================= */
  var actions = {
    "open-club": function (el) { navigate("club/" + encodeURIComponent(el.getAttribute("data-id"))); },
    "portal-tab": function (el) {
      state.portalTab = el.getAttribute("data-tab");
      state.portalNotice = null; state.builder = null; state.subFormId = null;
      render();
    },
    "new-notice": function () { state.portalNotice = ""; render(); },
    "edit-notice": function (el) { state.portalNotice = el.getAttribute("data-id"); render(); },
    "cancel-notice": function () { state.portalNotice = null; render(); },
    "save-notice": function (el) {
      var id = el.getAttribute("data-id");
      var title = (document.getElementById("nf-title").value || "").trim();
      var body = (document.getElementById("nf-body").value || "").trim();
      var formId = document.getElementById("nf-form").value;
      var date = document.getElementById("nf-date").value || todayISO();
      if (!title || !body) { toast("Title and body are required.", "err"); return; }
      if (id) {
        var n = noticeById(id);
        if (n) { n.title = title; n.body = body; n.formId = formId || null; n.date = date; }
        toast("Notice updated.", "ok");
      } else {
        db.notices.push({ id: DB.uid("n"), clubId: state.session.clubId, title: title, body: body, formId: formId || null, date: date });
        toast("Notice published!", "ok");
      }
      save();
      state.portalNotice = null;
      render();
    },
    "delete-notice": function (el) {
      var n = noticeById(el.getAttribute("data-id"));
      if (!n) return;
      if (!confirm("Delete this notice?")) return;
      db.notices = db.notices.filter(function (x) { return x.id !== n.id; });
      save(); render(); toast("Notice deleted.", "ok");
    },
    "new-form": function () {
      state.builder = {
        formId: null, title: "", description: "", deadline: "",
        fields: [{ id: DB.uid("fld"), label: "Full Name", type: "text", required: true, placeholder: "" }]
      };
      state.portalTab = "forms";
      render();
    },
    "edit-form": function (el) {
      var f = formById(el.getAttribute("data-id"));
      if (!f) return;
      state.builder = {
        formId: f.id, title: f.title, description: f.description || "", deadline: f.deadline || "",
        fields: JSON.parse(JSON.stringify(f.fields))
      };
      state.portalTab = "forms";
      render();
    },
    "cancel-builder": function () { state.builder = null; render(); },
    "add-field": function () {
      state.builder.fields.push({ id: DB.uid("fld"), label: "", type: "text", required: false, placeholder: "" });
      render();
    },
    "remove-field": function (el) {
      state.builder.fields.splice(Number(el.getAttribute("data-idx")), 1);
      render();
    },
    "save-form": function () {
      var b = state.builder;
      var title = (document.getElementById("bf-title").value || "").trim();
      if (!title) { toast("Form title is required.", "err"); return; }
      var fields = b.fields
        .map(function (f) {
          var label = (f.label || "").trim();
          if (!label) return null;
          var out = {
            id: f.id, label: label, type: f.type, required: !!f.required,
            placeholder: (f.placeholder || "").trim()
          };
          if (f.type === "select" || f.type === "radio") {
            out.options = (f.options || []).map(function (o) { return String(o).trim(); }).filter(Boolean);
          }
          return out;
        })
        .filter(Boolean);
      if (!fields.length) { toast("Add at least one field with a label.", "err"); return; }
      var payload = {
        title: title,
        description: (document.getElementById("bf-desc").value || "").trim(),
        deadline: document.getElementById("bf-deadline").value || todayISO(),
        fields: fields
      };
      if (b.formId) {
        var f = formById(b.formId);
        if (f) { f.title = payload.title; f.description = payload.description; f.deadline = payload.deadline; f.fields = payload.fields; }
        toast("Form updated.", "ok");
      } else {
        db.forms.push(Object.assign({ id: DB.uid("f"), clubId: state.session.clubId }, payload));
        toast("Form published!", "ok");
      }
      save();
      state.builder = null;
      render();
    },
    "delete-form": function (el) {
      var f = formById(el.getAttribute("data-id"));
      if (!f) return;
      if (!confirm("Delete this form and its " + formSubs(f.id).length + " submission(s)?")) return;
      db.forms = db.forms.filter(function (x) { return x.id !== f.id; });
      db.submissions = db.submissions.filter(function (s) { return s.formId !== f.id; });
      save(); render(); toast("Form deleted.", "ok");
    },
    "view-submissions": function (el) { state.subFormId = el.getAttribute("data-form"); render(); },
    "back-submissions": function () { state.subFormId = null; render(); },
    "export-csv": function (el) {
      var f = formById(el.getAttribute("data-form"));
      if (!f) return;
      var subs = formSubs(f.id);
      var rows = [["Submitted At"].concat(f.fields.map(function (fl) { return fl.label; }))];
      subs.forEach(function (s) {
        rows.push([s.submittedAt].concat(f.fields.map(function (fl) { return s.data[fl.id] || ""; })));
      });
      var csv = rows.map(function (r) {
        return r.map(function (v) {
          v = String(v == null ? "" : v);
          return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
        }).join(",");
      }).join("\r\n");
      download(f.title.replace(/[^\w\- ]+/g, "").trim() + "-submissions.csv", csv, "text/csv;charset=utf-8");
      toast("CSV downloaded.", "ok");
    },
    "logout": function () {
      state.session = null;
      try { sessionStorage.removeItem("niter-portal-session"); } catch (e) { /* ignore */ }
      render(); toast("Signed out.", "ok");
    },
    "cover-print": function () {
      renderCoverPreview();
      setTimeout(function () { window.print(); }, 60);
    },
    "cover-reset": function () {
      state.cover = defaultCover();
      try { localStorage.removeItem("niter-cover-draft"); } catch (e) { /* ignore */ }
      render();
    },
    "cover-dept": function () {
      state.cover.deptId = document.querySelector('[data-cv="deptId"]').value;
      state.cover.courseCode = ""; state.cover.courseTitle = "";
      saveCoverDraft();
      render();
    },
    "cover-course": function (el) {
      var val = el.value;
      if (val) {
        var parts = val.split("||");
        state.cover.courseCode = parts[0] || "";
        state.cover.courseTitle = parts[1] || "";
        saveCoverDraft();
        render();
      }
    },
    "export-data": function () {
      download("niter-clubs-backup.json", DB.exportDb(), "application/json");
      toast("Backup downloaded.", "ok");
    },
    "reset-data": function () {
      if (!confirm("Reset ALL site data to the demo dataset? This cannot be undone.")) return;
      db = DB.resetDb();
      state = Object.assign(state, { portalTab: "notices", portalNotice: null, builder: null, subFormId: null, clubsFilter: "" });
      try { sessionStorage.removeItem("niter-portal-session"); } catch (e) { /* ignore */ }
      state.session = null;
      render();
      toast("Demo data restored.", "ok");
    }
  };

  /* ================= Event wiring ================= */
  document.addEventListener("click", function (e) {
    var el = e.target.closest ? e.target.closest("[data-action]") : null;
    if (!el || !document.body.contains(el)) return;
    var action = el.getAttribute("data-action");
    var handler = actions[action];
    if (handler) {
      e.preventDefault();
      handler(el, e);
    }
  });

  document.addEventListener("submit", function (e) {
    var form = e.target;
    if (form.id === "portal-login") {
      e.preventDefault();
      var clubId = document.getElementById("login-club").value;
      var code = (document.getElementById("login-code").value || "").trim();
      if (code !== DEMO_CODE) { toast("Incorrect member code.", "err"); return; }
      state.session = { clubId: clubId };
      state.portalTab = "notices";
      state.portalNotice = null; state.builder = null; state.subFormId = null;
      try { sessionStorage.setItem("niter-portal-session", JSON.stringify(state.session)); } catch (err) { /* ignore */ }
      render();
      toast("Welcome, " + (clubById(clubId) ? clubById(clubId).name : "") + "!", "ok");
    } else if (form.id === "fill-form") {
      e.preventDefault();
      submitForm(form.getAttribute("data-form-id"));
    } else if (form.id === "new-club-form") {
      e.preventDefault();
      var name = (document.getElementById("nc-name").value || "").trim();
      if (!name) { toast("Club name is required.", "err"); return; }
      var colorEl = document.querySelector('input[name="newclub-color"]:checked');
      var slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || DB.uid("club");
      db.clubs.push({
        id: slug, name: name,
        short: (document.getElementById("nc-short").value || "").trim(),
        icon: (document.getElementById("nc-icon").value || "🎓").trim(),
        tagline: (document.getElementById("nc-tagline").value || "").trim(),
        about: (document.getElementById("nc-about").value || "").trim(),
        color: colorEl ? colorEl.value : "#3b82f6",
        email: (document.getElementById("nc-email").value || "").trim(),
        room: (document.getElementById("nc-room").value || "").trim(),
        executives: ["President", "Vice President", "General Secretary"],
        weekly: ""
      });
      save(); render();
      toast("Club created!", "ok");
    }
  });

  /* Input delegation: cover form + form builder + club filter */
  document.addEventListener("input", function (e) {
    var t = e.target;
    if (t.matches && t.matches("#club-filter")) {
      state.clubsFilter = t.value;
      var grid = document.getElementById("club-grid");
      if (!grid) return;
      var cards = grid.querySelectorAll(".club-card");
      var q = state.clubsFilter.toLowerCase();
      var visible = 0;
      for (var i = 0; i < cards.length; i++) {
        var hit = cards[i].textContent.toLowerCase().indexOf(q) !== -1;
        cards[i].style.display = hit ? "" : "none";
        if (hit) visible++;
      }
      var empty = grid.querySelector(".empty-state");
      if (empty) empty.style.display = visible ? "none" : "";
      return;
    }
    if (t.matches && t.matches("[data-cv]")) {
      state.cover[t.getAttribute("data-cv")] = t.value;
      saveCoverDraft();
      renderCoverPreview();
      return;
    }
    if (t.matches && t.matches("[data-bf]")) {
      var idx = Number(t.getAttribute("data-idx"));
      var key = t.getAttribute("data-bf");
      var f = state.builder && state.builder.fields[idx];
      if (!f) return;
      if (key === "options") {
        f.options = t.value.split(",").map(function (s) { return s.trim(); });
      } else if (key === "required") {
        f.required = t.value === "true";
      } else {
        f[key] = t.value;
      }
      return;
    }
  });

  /* Change delegation: builder field type (re-render) */
  document.addEventListener("change", function (e) {
    var t = e.target;
    if (!t.matches) return;
    if (t.matches("[data-action='builder-type']")) {
      var idx = Number(t.getAttribute("data-idx"));
      var f = state.builder && state.builder.fields[idx];
      if (!f) return;
      f.type = t.value;
      render();
    }
  });

  /* File import */
  document.addEventListener("change", function (e) {
    var t = e.target;
    if (t.matches && t.matches("[data-action='import-data']")) {
      var file = t.files && t.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var parsed = JSON.parse(reader.result);
          if (!parsed || !Array.isArray(parsed.clubs) || !Array.isArray(parsed.forms)) {
            toast("Invalid backup file.", "err"); return;
          }
          db = parsed;
          save();
          state.cover = state.cover || defaultCover();
          render();
          toast("Backup imported!", "ok");
        } catch (err) {
          toast("Could not read that file.", "err");
        }
      };
      reader.readAsText(file);
      t.value = "";
    }
  });

  /* Session restore */
  try {
    var sess = sessionStorage.getItem("niter-portal-session");
    if (sess) {
      var parsed = JSON.parse(sess);
      if (parsed && parsed.clubId) state.session = parsed;
    }
  } catch (e) { /* ignore */ }

  window.addEventListener("hashchange", render);
  render();
})();
