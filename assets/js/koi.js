// Menggambar ilustrasi koi (tampak atas) sesuai varietas.
// Dipakai sebagai gambar pengganti di katalog bila foto belum ada, dan untuk koi di bagian atas halaman.
(function () {
  var BODY = "M30,40 C55,22 120,16 160,24 C180,28 194,34 196,40 C194,46 180,52 160,56 C120,64 55,58 30,40 Z";
  var TAIL = "M32,40 C20,28 10,22 2,18 C8,32 8,48 2,62 C10,58 20,52 32,40 Z";
  var FIN_T = "M150,27 C142,12 130,5 118,4 C126,13 132,22 138,29 Z";
  var FIN_B = "M150,53 C142,68 130,75 118,76 C126,67 132,58 138,51 Z";

  var RED = "#C8102E", WHITE = "#F6F7F4", BLACK = "#1F2227", ORANGE = "#E2782F";

  var PATTERNS = {
    kohaku: { base: WHITE, fin: WHITE, marks: [
      ["e", 160, 38, 22, 11, RED], ["e", 112, 33, 24, 12, RED], ["e", 70, 44, 18, 9, RED]] },
    showa: { base: BLACK, fin: BLACK, marks: [
      ["e", 165, 40, 20, 12, RED], ["e", 118, 44, 22, 11, WHITE], ["e", 100, 32, 18, 9, RED], ["e", 66, 40, 14, 8, WHITE]] },
    sanke: { base: WHITE, fin: WHITE, marks: [
      ["e", 158, 38, 20, 11, RED], ["e", 108, 35, 22, 11, RED], ["c", 125, 46, 5, BLACK], ["c", 84, 32, 4, BLACK], ["c", 66, 46, 4, BLACK]] },
    tancho: { base: WHITE, fin: WHITE, marks: [["c", 174, 40, 10, RED]] },
    ogon: { base: "url(#gold)", fin: "#E7C25A", marks: [] },
    asagi: { base: "#6F8FA8", fin: "#D9603B", marks: [
      ["e", 110, 54, 60, 5, "#D9603B"], ["e", 110, 26, 60, 4, "#D9603B"], ["e", 175, 40, 14, 10, "#DDE6EC"]] },
    "shiro utsuri": { base: BLACK, fin: BLACK, marks: [
      ["e", 150, 36, 22, 12, WHITE], ["e", 100, 44, 22, 10, WHITE], ["e", 60, 38, 12, 7, WHITE]] },
    kujaku: { base: "#ECE7DA", fin: "#ECE7DA", marks: [
      ["e", 150, 40, 24, 12, ORANGE], ["e", 98, 38, 22, 11, ORANGE]], net: true }
  };

  var uid = 0;

  function mark(m) {
    if (m[0] === "c") return '<circle cx="' + m[1] + '" cy="' + m[2] + '" r="' + m[3] + '" fill="' + m[4] + '"/>';
    return '<ellipse cx="' + m[1] + '" cy="' + m[2] + '" rx="' + m[3] + '" ry="' + m[4] + '" fill="' + m[5] + '"/>';
  }

  window.koiSVG = function (variety, label) {
    var p = PATTERNS[String(variety || "").toLowerCase()] || PATTERNS.kohaku;
    var id = "k" + (++uid);
    var net = "";
    if (p.net) {
      for (var x = 50; x < 190; x += 12) net += '<path d="M' + x + ',20 l6,40" stroke="#3B3F45" stroke-opacity=".25" stroke-width="1"/>';
    }
    return '<svg viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + (label || "Ilustrasi koi " + variety) + '">' +
      '<defs><clipPath id="' + id + '"><path d="' + BODY + '"/></clipPath>' +
      '<linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F1D27A"/><stop offset=".5" stop-color="#D9A520"/><stop offset="1" stop-color="#B9861A"/></linearGradient></defs>' +
      '<path d="' + TAIL + '" fill="' + p.fin + '" fill-opacity=".9"/>' +
      '<path d="' + FIN_T + '" fill="' + p.fin + '" fill-opacity=".9"/>' +
      '<path d="' + FIN_B + '" fill="' + p.fin + '" fill-opacity=".9"/>' +
      '<path d="' + BODY + '" fill="' + p.base + '"/>' +
      '<g clip-path="url(#' + id + ')">' + p.marks.map(mark).join("") + net + '</g>' +
      '<path d="' + BODY + '" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="1"/>' +
      '</svg>';
  };
})();
