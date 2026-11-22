(function () {
  var S = window.SITE || {};

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function waLink(text) {
    return "https://wa.me/" + S.whatsapp + "?text=" + encodeURIComponent(text || "");
  }

  // Tautan kontak
  document.querySelectorAll(".js-wa").forEach(function (a) {
    a.href = waLink(a.getAttribute("data-wa"));
    a.target = "_blank";
    a.rel = "noopener";
  });
  document.querySelectorAll(".js-ig").forEach(function (a) {
    a.href = "https://www.instagram.com/" + S.instagram + "/";
    a.target = "_blank";
    a.rel = "noopener";
  });
  document.querySelectorAll(".js-ig-cattery").forEach(function (a) {
    a.href = "https://www.instagram.com/" + S.instagramCattery + "/";
    a.target = "_blank";
    a.rel = "noopener";
  });
  document.querySelectorAll(".js-email").forEach(function (a) {
    a.href = "mailto:" + S.email;
    a.textContent = S.email;
  });
  document.querySelectorAll(".js-maps").forEach(function (a) {
    a.href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(S.mapsQuery || S.alamat);
  });
  var alamat = document.getElementById("alamat");
  if (alamat) alamat.textContent = S.alamat;
  document.getElementById("tahun").textContent = new Date().getFullYear();

  // Koi di bagian atas halaman
  var mainKoi = document.querySelector(".pond__koi--main");
  var smallKoi = document.querySelector(".pond__koi--small");
  if (mainKoi) mainKoi.innerHTML = koiSVG("kohaku", "");
  if (smallKoi) smallKoi.innerHTML = koiSVG("showa", "");

  // Menu di layar kecil
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

  // Katalog
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
      ["Harga", k.harga || "Tanyakan via WhatsApp"]
    ].filter(function (r) { return r[1]; }).map(function (r) {
      return "<div><dt>" + r[0] + "</dt><dd>" + esc(r[1]) + "</dd></div>";
    }).join("");
    var action = sold
      ? '<span class="koi__sold">Sudah terjual</span>'
      : '<a class="koi__ask" target="_blank" rel="noopener" href="' +
        waLink("Halo Sutera Koi, saya tertarik dengan ikan " + k.kode + " (" + name + "). Apakah masih tersedia?") +
        '">Tanya ikan ini</a>';
    return '<li class="koi' + (sold ? " is-sold" : "") + '">' +
      '<div class="koi__pic' + (k.foto ? " has-photo" : "") + '">' + pic + "</div>" +
      '<div class="koi__body">' +
      '<h3>' + esc(k.varietas) + ' <span>' + esc(k.ukuran_cm) + ' cm</span></h3>' +
      '<p class="koi__code">Kode ' + esc(k.kode) + "</p>" +
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
      empty.textContent = "Katalog tidak dapat dimuat saat ini. Tanyakan stok terbaru lewat WhatsApp.";
      empty.hidden = false;
    });
})();
