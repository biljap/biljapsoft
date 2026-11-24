/* Biljap Soft – barre de navigation : fond au défilement, menu hamburger, lien actif */
(function () {
  'use strict';
  var nav = document.getElementById('topnav');
  if (!nav) return;
  var burger = nav.querySelector('.burger'), menu = nav.querySelector('.menu');
  var liens = Array.prototype.slice.call(menu.querySelectorAll('a'));
  var large = window.matchMedia('(min-width: 1100px)');

  liens.forEach(function (a, i) { a.style.setProperty('--i', i); });

  function ouvert() { return nav.classList.contains('open'); }
  function ouvrir() {
    nav.classList.remove('cache');
    nav.classList.add('open');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Fermer le menu');
    document.body.classList.add('noscroll');
  }
  function fermer(rendreFocus) {
    nav.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Ouvrir le menu');
    document.body.classList.remove('noscroll');
    if (rendreFocus) burger.focus();
  }
  burger.addEventListener('click', function () { if (ouvert()) fermer(false); else ouvrir(); });
  menu.addEventListener('click', function (e) { if (e.target === menu || e.target.closest('a')) fermer(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && ouvert()) fermer(true); });
  large.addEventListener ? large.addEventListener('change', function () { if (large.matches) fermer(false); })
                         : large.addListener(function () { if (large.matches) fermer(false); });

  /* Fond flou dès que la page défile ; la barre se cache en descendant et réapparaît en remontant */
  var dernier = window.pageYOffset, attente = false, SEUIL = 8, HAUT = 90;
  function defile() {
    attente = false;
    var y = window.pageYOffset, max = document.documentElement.scrollHeight - window.innerHeight;
    nav.classList.toggle('solid', y > 24);
    if (y < 0 || y > max) return;                               // rebond élastique en bord de page (iPhone)
    var delta = y - dernier;
    if (ouvert() || y < HAUT) { nav.classList.remove('cache'); dernier = y; return; }
    if (delta > SEUIL) { nav.classList.add('cache'); dernier = y; }
    else if (delta < -SEUIL) { nav.classList.remove('cache'); dernier = y; }
  }
  window.addEventListener('scroll', function () {
    if (!attente) { attente = true; requestAnimationFrame(defile); }
  }, { passive: true });
  nav.addEventListener('focusin', function () { nav.classList.remove('cache'); });   // la navigation au clavier la fait réapparaître
  defile();

  /* Lien de la section affichée */
  if ('IntersectionObserver' in window) {
    var carte = {};
    liens.forEach(function (a) {
      if (a.hash && a.pathname === location.pathname) {
        var s = document.querySelector(a.hash);
        if (s) carte[s.id] = a;
      }
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting || !carte[en.target.id]) return;
        liens.forEach(function (x) { x.removeAttribute('aria-current'); });
        carte[en.target.id].setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    Object.keys(carte).forEach(function (id) { io.observe(document.getElementById(id)); });
  }
})();
