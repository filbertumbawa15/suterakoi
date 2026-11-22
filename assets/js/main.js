(function () {
  var S = window.SITE || {};
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function waLink(text) { return "https://wa.me/" + S.whatsapp + "?text=" + encodeURIComponent(text || ""); }
  function external(a, href) { a.href = href; a.target = "_blank"; a.rel = "noopener"; }
  var igUrl = "https://www.instagram.com/" + S.instagram + "/";

  // ---------- Tautan kontak ----------
  document.querySelectorAll(".js-wa").forEach(function (a) { external(a, waLink(a.getAttribute("data-wa"))); });
  document.querySelectorAll(".js-ig").forEach(function (a) { external(a, igUrl); });
  document.querySelectorAll(".js-ig-cattery").forEach(function (a) { external(a, "https://www.instagram.com/" + S.instagramCattery + "/"); });
  document.querySelectorAll(".js-maps").forEach(function (a) {
    external(a, "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(S.mapsQuery || S.alamat));
  });
  document.querySelectorAll(".js-email").forEach(function (a) { a.href = "mailto:" + S.email; a.textContent = S.email; });
  var alamat = document.getElementById("alamat");
  if (alamat) alamat.textContent = S.alamat;
  document.getElementById("tahun").textContent = new Date().getFullYear();
  document.querySelectorAll("[data-koi]").forEach(function (el) { el.innerHTML = koiSVG(el.getAttribute("data-koi"), ""); });

  // ---------- Menu di layar kecil ----------
  var toggle = document.querySelector(".nav__toggle");
  var menu = document.getElementById("menu");
  toggle.addEventListener("click", function () {
    var open = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!open));
    menu.classList.toggle("is-open", !open);
  });
  menu.addEventListener("click", function (e) {
    if (e.target.tagName === "A") { toggle.setAttribute("aria-expanded", "false"); menu.classList.remove("is-open"); }
  });

  // Navigasi berubah warna setelah melewati kolam
  var nav = document.querySelector(".nav");
  var hero = document.getElementById("pond");
  function navState() { nav.classList.toggle("is-light", hero.getBoundingClientRect().bottom < 80); }
  window.addEventListener("scroll", navState, { passive: true });
  navState();

  // ---------- Kolam malam: koi mengikuti kursor/sentuhan ----------
  (function pond() {
    var school = document.getElementById("school");
    var ripples = document.getElementById("ripples");
    var small = window.innerWidth < 700;
    var kinds = small ? ["kohaku", "showa", "ogon"] : ["kohaku", "showa", "ogon", "sanke", "tancho", "kohaku"];
    var W = 0, H = 0;
    var pointer = { x: 0, y: 0, t: -1e9 };
    var fish = [];

    function size() { var r = hero.getBoundingClientRect(); W = r.width; H = r.height; }
    size();
    window.addEventListener("resize", size);
    function rand(a, b) { return a + Math.random() * (b - a); }

    kinds.forEach(function (kind, i) {
      var el = document.createElement("div");
      el.className = "fish";
      var w = small ? rand(130, 170) : rand(170, 250);
      el.style.width = w + "px";
      el.innerHTML = '<div class="fish__body" style="animation-delay:' + (-i * 0.37) + 's">' + koiSVG(kind, "") + "</div>";
      school.appendChild(el);
      fish.push({ el: el, w: w, h: w * 0.4, x: rand(0.3, 0.95) * W, y: rand(0.15, 0.85) * H,
        a: rand(0, Math.PI * 2), v: rand(0.9, 1.4), tx: rand(0, W), ty: rand(0, H), lag: rand(0.75, 1.25) });
    });

    function place(f) {
      f.el.style.transform = "translate(" + (f.x - f.w / 2) + "px," + (f.y - f.h / 2) + "px) rotate(" + f.a + "rad)";
    }
    if (reduceMotion) { fish.forEach(place); return; }

    function local(e) { var r = hero.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    function setPointer(e) { var p = local(e); pointer.x = p.x; pointer.y = p.y; pointer.t = performance.now(); }
    var lastRipple = 0;
    function ripple(p, big) {
      var now = performance.now();
      if (!big && now - lastRipple < 220) return;
      lastRipple = now;
      var r = document.createElement("span");
      r.className = "ripple" + (big ? " ripple--big" : "");
      r.style.left = p.x + "px";
      r.style.top = p.y + "px";
      ripples.appendChild(r);
      setTimeout(function () { r.remove(); }, 1600);
    }
    hero.addEventListener("pointermove", function (e) { setPointer(e); ripple(local(e), false); });
    hero.addEventListener("pointerdown", function (e) { setPointer(e); ripple(local(e), true); });

    var running = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        var was = running;
        running = entries[0].isIntersecting;
        if (running && !was) { last = performance.now(); requestAnimationFrame(tick); }
      }).observe(hero);
    }

    var last = performance.now();
    function tick(now) {
      if (!running) return;
      var dt = Math.min(48, now - last) / 16.67;
      last = now;
      var chasing = now - pointer.t < 2500;
      fish.forEach(function (f, i) {
        var tx, ty;
        if (chasing) {
          var ang = now / 900 * f.lag + i * 1.3;
          var rad = 40 + i * 18;
          tx = pointer.x + Math.cos(ang) * rad;
          ty = pointer.y + Math.sin(ang) * rad;
        } else {
          if (Math.hypot(f.tx - f.x, f.ty - f.y) < 60) { f.tx = rand(0.05, 0.95) * W; f.ty = rand(0.1, 0.9) * H; }
          tx = f.tx; ty = f.ty;
        }
        var want = Math.atan2(ty - f.y, tx - f.x);
        var diff = Math.atan2(Math.sin(want - f.a), Math.cos(want - f.a));
        var turn = (chasing ? 0.06 : 0.025) * f.lag;
        f.a += Math.max(-turn, Math.min(turn, diff)) * dt;
        var speed = (chasing ? 2.6 : 1) * f.v;
        f.x += Math.cos(f.a) * speed * dt;
        f.y += Math.sin(f.a) * speed * dt;
        var m = f.w * 0.3;
        f.x = Math.max(-m, Math.min(W + m, f.x));
        f.y = Math.max(-m, Math.min(H + m, f.y));
        place(f);
      });
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  })();

  // ---------- Lelang: hitung mundur ----------
  (function auction() {
    var L = S.lelang || {};
    var title = document.getElementById("auction-title");
    var note = document.getElementById("auction-note");
    var cta = document.getElementById("auction-cta");
    var box = document.getElementById("countdown");
    title.textContent = L.judul || "Lelang Sutera Koi berikutnya";
    external(cta, L.link || igUrl);
    if (!L.link) cta.textContent = "Pantau jadwal di Instagram";

    var start = L.mulai ? new Date(L.mulai) : null;
    if (!start || isNaN(start)) {
      note.textContent = "Jadwal berikutnya segera diumumkan. Follow Instagram kami supaya nggak ketinggalan.";
      return;
    }
    var fmt = start.toLocaleString("id-ID", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
    box.hidden = false;
    var el = { d: document.getElementById("cd-d"), h: document.getElementById("cd-h"), m: document.getElementById("cd-m"), s: document.getElementById("cd-s") };
    function pad(n) { return String(n).padStart(2, "0"); }
    function update() {
      var ms = start - new Date();
      if (ms <= 0) {
        box.hidden = true;
        note.textContent = "Lelang sudah dimulai " + fmt + " WIB. Buruan cek sebelum ditutup.";
        return false;
      }
      var s = Math.floor(ms / 1000);
      el.d.textContent = pad(Math.floor(s / 86400));
      el.h.textContent = pad(Math.floor(s % 86400 / 3600));
      el.m.textContent = pad(Math.floor(s % 3600 / 60));
      el.s.textContent = pad(s % 60);
      note.textContent = "Dimulai " + fmt + " WIB.";
      return true;
    }
    if (update()) {
      var t = setInterval(function () { if (!update()) clearInterval(t); }, 1000);
    }
  })();

  // ---------- Katalog dan ikan pilihan ----------
  var list = document.getElementById("catalog");
  var filters = document.getElementById("filters");
  var sortSel = document.getElementById("sort");
  var empty = document.getElementById("catalog-empty");
  var items = [];
  var active = "Semua";

  function isSold(k) { return String(k.status).toLowerCase() === "terjual"; }
  function askText(k) { return "Halo Sutera Koi, saya tertarik dengan ikan " + k.kode + " (" + k.varietas + " " + k.ukuran_cm + " cm). Masih ada?"; }
  function picture(k, cls) {
    return k.foto
      ? '<img src="' + esc(k.foto) + '" alt="' + esc(k.varietas + " " + k.ukuran_cm + " cm") + '" loading="lazy">'
      : koiSVG(k.varietas, "Ilustrasi " + esc(k.varietas));
  }
  function metaRows(k) {
    return [["Breeder", k.breeder], ["Umur", k.umur], ["Gender", k.gender], ["Harga", k.harga || "Tanya via WA"]]
      .filter(function (r) { return r[1]; })
      .map(function (r) { return "<div><dt>" + r[0] + "</dt><dd>" + esc(r[1]) + "</dd></div>"; }).join("");
  }

  function card(k) {
    var sold = isSold(k);
    var label = String(k.label || "").toLowerCase();
    var badge = sold ? '<span class="badge badge--sold">Terjual</span>'
      : label === "hot" ? '<span class="badge badge--hot">🔥 Hot</span>'
      : label === "baru" ? '<span class="badge badge--new">Baru datang</span>'
      : '<span class="badge">Ready</span>';
    var action = sold
      ? '<span class="koi__sold">Sudah punya rumah baru</span>'
      : '<a class="btn btn--ink btn--block" target="_blank" rel="noopener" href="' + waLink(askText(k)) + '">Tanya ikan ini</a>';
    return '<li class="koi' + (sold ? " is-sold" : "") + '">' +
      '<div class="koi__pic' + (k.foto ? " has-photo" : "") + '">' + badge + picture(k) +
      '<span class="koi__size">' + esc(k.ukuran_cm) + " cm</span></div>" +
      '<div class="koi__body"><h3>' + esc(k.varietas) + '</h3><p class="koi__code">' + esc(k.kode) + "</p>" +
      "<dl>" + metaRows(k) + "</dl>" + action + "</div></li>";
  }

  function render() {
    var shown = items.filter(function (k) { return active === "Semua" || k.varietas === active; });
    var mode = sortSel.value;
    if (mode !== "default") {
      shown = shown.slice().sort(function (a, b) { return mode === "besar" ? b.ukuran_cm - a.ukuran_cm : a.ukuran_cm - b.ukuran_cm; });
    }
    list.innerHTML = shown.map(card).join("");
    empty.hidden = shown.length > 0;
  }

  function buildFilters() {
    var names = ["Semua"];
    items.forEach(function (k) { if (names.indexOf(k.varietas) < 0) names.push(k.varietas); });
    filters.innerHTML = names.map(function (n) {
      return '<button type="button" aria-pressed="' + (n === active) + '">' + esc(n) + "</button>";
    }).join("");
    filters.addEventListener("click", function (e) {
      if (e.target.tagName !== "BUTTON") return;
      active = e.target.textContent;
      filters.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.textContent === active)); });
      render();
    });
    sortSel.addEventListener("change", render);
  }

  function featured() {
    var k = items.filter(function (x) { return x.unggulan && !isSold(x); })[0];
    if (!k) return;
    document.getElementById("feat-pic").innerHTML = picture(k);
    document.getElementById("feat-pic").classList.toggle("has-photo", !!k.foto);
    document.getElementById("feat-title").textContent = k.varietas + ", " + k.ukuran_cm + " cm";
    document.getElementById("feat-meta").innerHTML = '<div><dt>Kode</dt><dd>' + esc(k.kode) + "</dd></div>" + metaRows(k);
    external(document.getElementById("feat-cta"), waLink(askText(k)));
    document.getElementById("unggulan").hidden = false;
  }

  fetch("data/koi.json", { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) {
      items = data.ikan || [];
      document.getElementById("catalog-notice").hidden = !data.contoh;
      featured();
      buildFilters();
      render();
    })
    .catch(function () {
      empty.textContent = "Katalog belum bisa dimuat. Tanya stok terbaru lewat WhatsApp ya.";
      empty.hidden = false;
    });
})();
