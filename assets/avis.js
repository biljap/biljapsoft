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
  function carte(a) {
    var n = parseInt(a.note, 10);
    var etoiles = n >= 1 && n <= 5
      ? '<div class="stars" role="img" aria-label="Note : ' + n + ' sur 5">' + '★'.repeat(n) + '☆'.repeat(5 - n) + '</div>' : '';
    var qui = [a.role, a.entreprise].filter(Boolean).map(esc).join(', ');
    var lien = a.projet ? ' <a href="projet.html?id=' + encodeURIComponent(a.projet) + '">Voir le projet</a>' : '';
    return '<figure>' + etoiles + '<blockquote>« ' + esc(a.texte) + ' »</blockquote><figcaption><b>' + esc(a.nom) + '</b>' +
      (qui ? qui + '<br>' : '') + (a.service ? esc(a.service) : '') + lien + '</figcaption></figure>';
  }

  fetch('assets/avis.json')
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (liste) {
      if (!Array.isArray(liste) || !liste.length) return;
      box.className = 'avis';
      box.innerHTML = liste.map(carte).join('');
    })
    .catch(function () { /* l'encart « premiers avis » reste 
    ([
  {
    "nom": "Junior Baleke",
    "role": "Gérant",
    "entreprise": "Café kivu",
    "service": "Identité visuelle",
    "texte": "J'apprécie le travail 🤜",
    "note": 5,
    "projet": "Rénovation"
  }
])
;
