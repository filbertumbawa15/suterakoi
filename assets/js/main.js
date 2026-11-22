(function () {
  var S = window.SITE || {};
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function waLink(text) {
    return "https://wa.me/" + S.whatsapp + "?text=" + encodeURIComponent(text || "");
  }

  function external(a, href) {
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener";
  }

  // ---------- Tautan kontak ----------
  document.querySelectorAll(".js-wa").forEach(function (a) { external(a, waLink(a.getAttribute("data-wa"))); });
  document.querySelectorAll(".js-ig").forEach(function (a) { external(a, "https://www.instagram.com/" + S.instagram + "/"); });
  document.querySelectorAll(".js-ig-cattery").forEach(function (a) { external(a, "https://www.instagram.com/" + S.instagramCattery + "/"); });
  document.querySelectorAll(".js-maps").forEach(function (a) {
    external(a, "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(S.mapsQuery || S.alamat));
  });
  document.querySelectorAll(".js-email").forEach(function (a) {
    a.href = "mailto:" + S.email;
    a.textContent = S.email;
  });
  var alamat = document.getElementById("alamat");
  if (alamat) alamat.textContent = S.alamat;
  document.getElementById("tahun").textContent = new Date().getFullYear();
  document.querySelectorAll("[data-koi]").forEach(function (el) {
    el.innerHTML = koiSVG(el.getAttribute("data-koi"), "");
  });

  // ---------- Menu di layar kecil ----------
  var toggle = document.querySelector(".nav__toggle");
  var menu = document.getElementById("menu");
  toggle.addEventListener("click", function () {
    var open = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!open));
    menu.classList.toggle("is-open", !open);
  });
  menu.addEventListener("click", function (e) {
    if (e.target.tagName === "A") {
      toggle.setAttribute("aria-expanded", "false");
      menu.classList.remove("is-open");
    }
  });

  // ---------- Kolam: koi berenang dan mengikuti kursor/sentuhan ----------
  (function pond() {
    var hero = document.getElementById("pond");
    var school = document.getElementById("school");
    if (!hero || !school) return;

    var small = window.innerWidth < 700;
    var kinds = small ? ["kohaku", "showa", "ogon"] : ["kohaku", "showa", "ogon", "sanke", "tancho", "kohaku"];
    var W = 0, H = 0;
    var pointer = { x: 0, y: 0, t: -1e9 };
    var fish = [];

    function size() {
      var r = hero.getBoundingClientRect();
      W = r.width;
      H = r.height;
    }
    size();
    window.addEventListener("resize", size);

    function rand(a, b) { return a + Math.random() * (b - a); }

    kinds.forEach(function (kind, i) {
      var el = document.createElement("div");
      el.className = "fish";
      var w = small ? rand(130, 170) : rand(170, 260);
      el.style.width = w + "px";
      el.innerHTML = '<div class="fish__body" style="animation-delay:' + (-i * 0.37) + 's">' + koiSVG(kind, "") + "</div>";
      school.appendChild(el);
      fish.push({
        el: el, w: w, h: w * 0.4,
        x: rand(0.1, 0.9) * W, y: rand(0.15, 0.85) * H,
        a: rand(0, Math.PI * 2),
        v: rand(0.9, 1.4),
        tx: rand(0, W), ty: rand(0, H),
        lag: rand(0.75, 1.25)
      });
    });

    function place(f) {
      f.el.style.transform = "translate(" + (f.x - f.w / 2) + "px," + (f.y - f.h / 2) + "px) rotate(" + f.a + "rad)";
    }

    if (reduceMotion) {
      fish.forEach(place);
      return;
    }

    function setPointer(e) {
      var r = hero.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      pointer.t = performance.now();
    }
    hero.addEventListener("pointermove", setPointer);
    hero.addEventListener("pointerdown", setPointer);

    var running = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        running = entries[0].isIntersecting;
        if (running) requestAnimationFrame(tick);
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
          // Tiap ikan mengelilingi kursor dengan jarak sedikit berbeda supaya tidak bertumpuk
          var ang = now / 900 * f.lag + i * 1.3;
          var rad = 40 + i * 18;
          tx = pointer.x + Math.cos(ang) * rad;
          ty = pointer.y + Math.sin(ang) * rad;
        } else {
          if (Math.hypot(f.tx - f.x, f.ty - f.y) < 60) {
            f.tx = rand(0.05, 0.95) * W;
            f.ty = rand(0.1, 0.9) * H;
          }
          tx = f.tx;
          ty = f.ty;
        }
        var want = Math.atan2(ty - f.y, tx - f.x);
        var diff = Math.atan2(Math.sin(want - f.a), Math.cos(want - f.a));
        var turn = (chasing ? 0.06 : 0.025) * f.lag;
        f.a += Math.max(-turn, Math.min(turn, diff)) * dt;

        var speed = (chasing ? 2.6 : 1) * f.v;
        f.x += Math.cos(f.a) * speed * dt;
        f.y += Math.sin(f.a) * speed * dt;

        // Tetap di dalam kolam
        var m = f.w * 0.3;
        if (f.x < -m) f.x = -m; if (f.x > W + m) f.x = W + m;
        if (f.y < -m) f.y = -m; if (f.y > H + m) f.y = H + m;
        place(f);
      });
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  })();

  // ---------- Katalog ----------
  var list = document.getElementById("catalog");
  var filters = document.getElementById("filters");
  var empty = document.getElementById("catalog-empty");
  var items = [];
  var active = "Semua";

  function card(k) {
    var sold = String(k.status).toLowerCase() === "terjual";
    var name = k.varietas + " " + k.ukuran_cm + " cm";
    var pic = k.foto
      ? '<img src="' + esc(k.foto) + '" alt="' + esc(name) + '" loading="lazy">'
      : koiSVG(k.varietas, "Ilustrasi " + esc(k.varietas));
    var rows = [
      ["Breeder", k.breeder],
      ["Umur", k.umur],
      ["Gender", k.gender],
      ["Harga", k.harga || "Tanya via WA"]
    ].filter(function (r) { return r[1]; }).map(function (r) {
      return "<div><dt>" + r[0] + "</dt><dd>" + esc(r[1]) + "</dd></div>";
    }).join("");
    var badge = sold ? '<span class="badge badge--sold">Terjual</span>' : '<span class="badge">Ready</span>';
    var action = sold
      ? '<span class="koi__sold">Sudah punya rumah baru</span>'
      : '<a class="btn btn--red btn--block" target="_blank" rel="noopener" href="' +
        waLink("Halo Sutera Koi, saya tertarik dengan ikan " + k.kode + " (" + name + "). Masih ada?") +
        '">Tanya ikan ini</a>';
    return '<li class="koi' + (sold ? " is-sold" : "") + '">' +
      '<div class="koi__pic' + (k.foto ? " has-photo" : "") + '">' + badge + pic +
      '<span class="koi__size">' + esc(k.ukuran_cm) + " cm</span></div>" +
      '<div class="koi__body">' +
      "<h3>" + esc(k.varietas) + "</h3>" +
      '<p class="koi__code">' + esc(k.kode) + "</p>" +
      "<dl>" + rows + "</dl>" + action +
      "</div></li>";
  }

  function render() {
    var shown = items.filter(function (k) { return active === "Semua" || k.varietas === active; });
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
      filters.querySelectorAll("button").forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.textContent === active));
      });
      render();
    });
  }

  fetch("data/koi.json", { cache: "no-cache" })
    .then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    })
    .then(function (data) {
      items = data.ikan || [];
      document.getElementById("catalog-notice").hidden = !data.contoh;
      buildFilters();
      render();
    })
    .catch(function () {
      empty.textContent = "Katalog belum bisa dimuat. Tanya stok terbaru lewat WhatsApp ya.";
      empty.hidden = false;
    });
})();
