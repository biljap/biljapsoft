/* Biljap Soft – avis clients : les avis sont dans assets/avis.json */
(function () {
  'use strict';
  /* Réglages du carrousel */
  var SENS = 'gauche-droite';   // les avis défilent de la gauche vers la droite ; mettre 'droite-gauche' pour inverser
  var DELAI = 6000;             // temps d'affichage de chaque avis (millisecondes)
  var DUREE = 600;              // durée du glissement (millisecondes)

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

  function carrousel(root, n) {
    var piste = root.querySelector('.car-piste'), cmd = root.querySelector('.car-cmd'), bp = root.querySelector('.car-b.p');
    var reduit = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var k = 1, enCours = false, t = null, pause = false, survol = false, touche = false, x0 = null;

    function pas(versDroite) {   // versDroite : le contenu glisse vers la droite, le nouvel avis arrive par la gauche
      if (n <= k || enCours) return;
      enCours = true;
      var duree = reduit ? 0 : DUREE;
      if (versDroite) {
        piste.insertBefore(piste.lastElementChild, piste.firstElementChild);
        var d = piste.children[1].offsetLeft - piste.children[0].offsetLeft;
        piste.style.transition = 'none';
        piste.style.transform = 'translateX(-' + d + 'px)';
        void piste.offsetWidth;
        piste.style.transition = 'transform ' + duree + 'ms ease';
        piste.style.transform = 'translateX(0)';
        setTimeout(fin, duree + 40);
      } else {
        var e = piste.children[1].offsetLeft - piste.children[0].offsetLeft;
        piste.style.transition = 'transform ' + duree + 'ms ease';
        piste.style.transform = 'translateX(-' + e + 'px)';
        setTimeout(function () {
          piste.style.transition = 'none';
          piste.style.transform = 'none';
          piste.appendChild(piste.firstElementChild);
          fin();
        }, duree + 40);
      }
    }
    function fin() { enCours = false; masquer(); }
    function masquer() {   // les avis hors de l'écran ne reçoivent pas le focus du clavier
      Array.prototype.forEach.call(piste.children, function (c, i) {
        var cache = i >= k;
        c.inert = cache;
        if (cache) c.setAttribute('aria-hidden', 'true'); else c.removeAttribute('aria-hidden');
      });
    }
    function mesurer() {
      k = Math.min(n, window.innerWidth >= 760 ? 2 : 1);
      piste.style.setProperty('--k', k);
      cmd.hidden = n <= k;
      masquer();
    }
    function auto() { return !pause && !survol && !touche && !document.hidden && !reduit && n > k; }
    function planifier() {
      clearTimeout(t);
      if (!auto()) return;
      t = setTimeout(function () { pas(SENS === 'gauche-droite'); planifier(); }, DELAI);
    }

    root.querySelector('[data-d="g"]').addEventListener('click', function () { pas(true); planifier(); });
    root.querySelector('[data-d="d"]').addEventListener('click', function () { pas(false); planifier(); });
    bp.addEventListener('click', function () {
      pause = !pause;
      bp.setAttribute('aria-pressed', pause ? 'true' : 'false');
      bp.textContent = pause ? 'Lecture' : 'Pause';
      bp.setAttribute('aria-label', pause ? 'Reprendre le défilement' : 'Mettre le défilement en pause');
      piste.setAttribute('aria-live', pause ? 'polite' : 'off');
      planifier();
    });
    root.addEventListener('mouseenter', function () { survol = true; planifier(); });
    root.addEventListener('mouseleave', function () { survol = false; planifier(); });
    root.addEventListener('focusin', function () { survol = true; planifier(); });
    root.addEventListener('focusout', function () { survol = false; planifier(); });
    document.addEventListener('visibilitychange', planifier);
    window.addEventListener('resize', function () { if (!enCours) { mesurer(); planifier(); } });

    // glissement du doigt : vers la droite = l'avis précédent arrive par la gauche
    piste.addEventListener('pointerdown', function (e) { x0 = e.clientX; touche = true; planifier(); });
    function relache(e) {
      if (x0 !== null && e && typeof e.clientX === 'number') {
        var dx = e.clientX - x0;
        if (dx > 50) pas(true); else if (dx < -50) pas(false);
      }
      x0 = null; touche = false; planifier();
    }
    piste.addEventListener('pointerup', relache);
    piste.addEventListener('pointercancel', function () { x0 = null; touche = false; planifier(); });

    mesurer();
    planifier();
  }

  function monter(liste) {
    box.className = '';
    box.innerHTML = '<div class="carrousel" role="region" aria-roledescription="carrousel" aria-label="Avis de nos clients">' +
      '<div class="car-vue"><div class="car-piste avis" aria-live="off">' + liste.map(carte).join('') + '</div></div>' +
      '<div class="car-cmd"><button type="button" class="car-b" data-d="g" aria-label="Avis précédent">‹</button>' +
      '<button type="button" class="car-b p" aria-pressed="false" aria-label="Mettre le défilement en pause">Pause</button>' +
      '<button type="button" class="car-b" data-d="d" aria-label="Avis suivant">›</button></div></div>';
    carrousel(box.firstChild, liste.length);
  }

  Promise.all([
    fetch('assets/avis.json').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }),
    fetch('assets/projets.json').then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; })
  ]).then(function (res) {
    var liste = res[0];
    projets = Array.isArray(res[1]) ? res[1] : [];
    if (!Array.isArray(liste) || !liste.length) return;
    monter(liste);
  }).catch(function () { /* l'encart « premiers avis » reste affiché */ });
})();
