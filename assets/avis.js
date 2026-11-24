/* Biljap Soft – avis clients : les avis sont dans assets/avis.json */
(function () {
  'use strict';
  var box = document.getElementById('avis-liste');
  if (!box) return;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var projets = [];
  function trouver(ref) {   // accepte l'identifiant ou le titre du projet, sans tenir compte des majuscules
    var r = String(ref || '').trim().toLowerCase();
    if (!r) return null;
    return projets.filter(function (p) { return String(p.id).toLowerCase() === r || String(p.titre).toLowerCase() === r; })[0] || null;
  }
  function carte(a) {
    var n = parseInt(a.note, 10);
    var etoiles = n >= 1 && n <= 5
      ? '<div class="stars" role="img" aria-label="Note : ' + n + ' sur 5">' + '★'.repeat(n) + '☆'.repeat(5 - n) + '</div>' : '';
    var qui = [a.role, a.entreprise].filter(Boolean).map(esc).join(', ');
    var pr = trouver(a.projet);   // le lien n'apparaît que si le projet existe vraiment
    var lien = pr ? ' <a href="projet.html?id=' + encodeURIComponent(pr.id) + '">Voir le projet</a>' : '';
    return '<figure>' + etoiles + '<blockquote>« ' + esc(a.texte) + ' »</blockquote><figcaption><b>' + esc(a.nom) + '</b>' +
      (qui ? qui + '<br>' : '') + (a.service ? esc(a.service) : '') + lien + '</figcaption></figure>';
  }

  Promise.all([
    fetch('assets/avis.json').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }),
    fetch('assets/projets.json').then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; })
  ]).then(function (res) {
    var liste = res[0];
    projets = Array.isArray(res[1]) ? res[1] : [];
    if (!Array.isArray(liste) || !liste.length) return;
    box.className = 'avis';
    box.innerHTML = liste.map(carte).join('');
  }).catch(function () { /* l'encart « premiers avis » reste affiché */ });
})();
