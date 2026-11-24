/* Biljap Soft – fiche projet : une seule page, plusieurs projets (assets/projets.json) */
(function () {
  'use strict';
  /* Réglages */
  var WA = 'https://wa.me/243899829244';
  var CATALOGUE = 'catalogue.html';
  var DATA = 'assets/projets.json';

  var d = document;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = d.getElementById('fiche');

  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function info(l, v) { return v ? '<div><dt>' + l + '</dt><dd>' + esc(v) + '</dd></div>' : ''; }
  function fact(t, v) { return v ? '<div><h3>' + t + '</h3><p>' + esc(v) + '</p></div>' : ''; }
  function zoomBtn(src, alt) {
    return '<button type="button" data-zoom="' + esc(src) + '" data-alt="' + esc(alt) + '" aria-label="Agrandir : ' + esc(alt) + '"><img src="' + esc(src) + '" alt="' + esc(alt) + '"></button>';
  }

  function render(p, all) {
    d.title = p.titre + ' – Biljap Soft';
    var meta = $('meta[name="description"]');
    if (meta) meta.setAttribute('content', p.resume + ' Projet de Biljap Soft, agence de création visuelle et numérique à Lubumbashi.');
    $('#p-cat').textContent = p.categorie;
    $('#p-titre').textContent = p.titre;
    $('#p-resume').textContent = p.resume;
    if (p.exemple) $('#p-badge').hidden = false;

    var msg = 'Bonjour Biljap Soft, j’ai vu le projet « ' + p.titre + ' » sur votre site. Je souhaite un devis pour : ' + p.service + ' (' + p.prix + ').';
    var h = '<section><div class="wrap"><figure class="cover">' + zoomBtn(p.image, p.alt || p.titre) + '</figure>' +
      '<dl class="infos">' + info('Type de projet', p.categorie) + info('Secteur', p.secteur) +
      info('Prestations', (p.prestations || []).join(', ')) + (p.exemple ? info('Statut', 'Projet d’exemple') : '') + '</dl></div></section>';

    h += '<section class="alt"><div class="wrap"><h2>Du besoin au résultat</h2><div class="facts">' +
      fact('Le besoin', p.besoin) + fact('Notre approche', p.approche) + fact('Le résultat', p.resultat) + '</div></div></section>';

    if ((p.couleurs && p.couleurs.length) || (p.polices && p.polices.length)) {
      h += '<section><div class="wrap"><h2>Couleurs et polices</h2><ul class="pal">';
      (p.couleurs || []).forEach(function (c) { h += '<li><i style="background:' + esc(c) + '"></i>' + esc(c) + '</li>'; });
      (p.polices || []).forEach(function (f) { h += '<li class="t">' + esc(f) + '</li>'; });
      h += '</ul></div></section>';
    }
    if (p.galerie && p.galerie.length) {
      h += '<section><div class="wrap"><h2>En images</h2><div class="gal">';
      p.galerie.forEach(function (g) { h += zoomBtn(g.src, g.alt || p.titre); });
      h += '</div></div></section>';
    }

    h += '<section class="contact offre"><div class="wrap"><h2>Un projet comme celui-ci ?</h2>' +
      '<p class="lead">Prix annoncé à l’avance, contenu défini, devis écrit sur WhatsApp.</p>' +
      '<div class="pxl">' + esc(p.prix) + ' <small>· ' + esc(p.unite) + '</small></div>' +
      '<div class="btns"><a class="btn main" href="' + WA + '?text=' + encodeURIComponent(msg) + '">Demander un devis</a>' +
      '<a class="btn ghost" href="' + CATALOGUE + '">Voir le catalogue</a></div></div></section>';

    var autres = all.filter(function (x) { return x.id !== p.id; }).slice(0, 3);
    if (autres.length) {
      h += '<section class="others"><div class="wrap"><h2>Autres projets</h2><div class="works">';
      autres.forEach(function (x) {
        h += '<article class="work"><div class="thumb flat"><img src="' + esc(x.image) + '" alt="' + esc(x.alt || x.titre) + '" width="320" height="180"></div>' +
          '<div class="t"><h3>' + esc(x.titre) + '</h3><div class="k">' + esc(x.categorie) + '</div><p>' + esc(x.resume) + '</p>' +
          '<a href="projet.html?id=' + encodeURIComponent(x.id) + '">Voir le projet</a></div></article>';
      });
      h += '</div></div></section>';
    }
    root.innerHTML = h;
    reveal();
  }

  /* Apparition au défilement, comme sur le reste du site */
  function reveal() {
    if (reduce || !('IntersectionObserver' in window)) return;
    var vh = window.innerHeight;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        el.classList.add('aos-in');
        io.unobserve(el);
        setTimeout(function () { el.removeAttribute('data-aos'); el.classList.remove('aos-in'); el.style.transitionDelay = ''; }, 1100);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    $$('#fiche h2, #fiche .lead, #fiche .cover, #fiche .infos, #fiche .facts > div, #fiche .pal, #fiche .gal button, #fiche .pxl, #fiche .btns, #fiche .work').forEach(function (el) {
      if (el.getBoundingClientRect().top < vh * 0.92) return;
      var i = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.setAttribute('data-aos', el.classList.contains('work') ? 'zoom-in' : 'fade-up');
      el.style.transitionDelay = (i % 4) * 80 + 'ms';
      io.observe(el);
    });
  }

  /* Agrandissement des images */
  var lb = null, last = null;
  function closeLb() {
    if (!lb) return;
    lb.remove(); lb = null;
    d.body.classList.remove('noscroll');
    d.removeEventListener('keydown', onKey);
    if (last) last.focus();
  }
  function onKey(e) { if (e.key === 'Escape') closeLb(); }
  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-zoom]');
    if (!b) return;
    last = b;
    lb = d.createElement('div');
    lb.className = 'lb';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', b.dataset.alt || '');
    lb.innerHTML = '<button type="button" class="lb-x" aria-label="Fermer">×</button><figure><img src="' + esc(b.dataset.zoom) + '" alt="' + esc(b.dataset.alt) + '"><figcaption>' + esc(b.dataset.alt) + '</figcaption></figure>';
    d.body.appendChild(lb);
    d.body.classList.add('noscroll');
    lb.addEventListener('click', closeLb);
    $('.lb-x', lb).focus();
    d.addEventListener('keydown', onKey);
  });

  var id = new URLSearchParams(location.search).get('id');
  fetch(DATA)
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (all) {
      var ref = (id || '').trim().toLowerCase();
      var p = all.filter(function (x) { return String(x.id).toLowerCase() === ref || String(x.titre).toLowerCase() === ref; })[0] || (id ? null : all[0]);
      if (!p) { root.innerHTML = '<section><div class="wrap"><p class="lead">Ce projet est introuvable. <a href="index.html#portfolio">Retour au portfolio</a></p></div></section>'; return; }
      render(p, all);
    })
    .catch(function () {
      root.innerHTML = '<section><div class="wrap"><p class="lead">Impossible de charger le projet. Réessayez dans un instant.</p></div></section>';
    });
})();
