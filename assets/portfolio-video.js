/* Biljap Soft – cartes du portfolio : si un projet a une vidéo dans assets/projets.json, sa carte affiche la vidéo.
   Les projets en photo ne changent pas. Aucun autre réglage n'est nécessaire dans index.html. */
(function () {
  'use strict';
  var cartes = document.querySelectorAll('.work');
  if (!cartes.length) return;
  var RE = /\.(webm|mp4|m4v|mov|ogv)(\?.*)?$/i;
  var TYPES = { webm: 'video/webm', mp4: 'video/mp4', m4v: 'video/mp4', mov: 'video/quicktime', ogv: 'video/ogg' };
  var reduit = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var survol = window.matchMedia && matchMedia('(hover: hover)').matches;

  function source(url, type) {
    var s = document.createElement('source');
    s.src = url + '#t=0.1';      // affiche la première image sans lancer la lecture
    if (type) s.type = type;
    return s;
  }

  fetch('assets/projets.json')
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (liste) {
      Array.prototype.forEach.call(cartes, function (c) {
        var lien = c.querySelector('a.sec'), thumb = c.querySelector('.thumb');
        if (!lien || !thumb) return;
        var id = new URLSearchParams(lien.search).get('id');
        var p = liste.filter(function (x) { return String(x.id) === id; })[0];
        if (!p) return;
        var src = p.video || (RE.test(p.image || '') ? p.image : '');
        if (!src) return;                                            // projet en photo : rien à changer

        var zone = document.createElement('div');
        zone.className = 'thumb-video';
        zone.tabIndex = 0;
        zone.setAttribute('role', 'link');
        zone.setAttribute('aria-label', 'Voir le projet en vidéo : ' + p.titre);
        var v = document.createElement('video');
        v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'metadata';
        v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true'); v.tabIndex = -1;
        if (p.poster) v.poster = p.poster;
        var m = RE.exec(src);
        v.appendChild(source(src, m ? TYPES[m[1].toLowerCase()] : ''));
        if (p.video_mp4 && p.video_mp4 !== src) v.appendChild(source(p.video_mp4, 'video/mp4'));
        var badge = document.createElement('span');
        badge.className = 'lecture'; badge.setAttribute('aria-hidden', 'true'); badge.textContent = '▶ Vidéo';
        zone.appendChild(v); zone.appendChild(badge);
        thumb.replaceWith(zone);

        function ouvrir() { location.href = lien.href; }
        zone.addEventListener('click', ouvrir);
        zone.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ouvrir(); } });
        if (survol && !reduit) {   // sur ordinateur : la vidéo démarre au survol (sans son)
          c.addEventListener('mouseenter', function () { var r = v.play(); if (r && r.catch) r.catch(function () {}); });
          c.addEventListener('mouseleave', function () { v.pause(); });
        }
      });
    })
    .catch(function () { /* en cas d'erreur, les photos restent affichées */ });
})();
