/* Biljap Soft – interactions du site (sans dépendance) */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var WA = 'whatsapp://send?phone=243899829244';
  root.classList.add('js');

  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function make(tag, cls, html) {
    var e = d.createElement(tag);
    if (cls) e.className = cls;
    if (html) e.innerHTML = html;
    return e;
  }

  /* 1. Apparition progressive au défilement (type AOS) */
  function initReveal() {
    if (reduce || !('IntersectionObserver' in window)) return;
    var sel = 'main h2, .lead, .sub3, .svc article, .cat, .pack, .work, .steps li, .facts > div, ' +
              '.rows, .item, .mission, .chips, .incl, .clist li, .rules > div, .grp > h3, .note';
    var vh = window.innerHeight;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        el.classList.add('aos-in');
        io.unobserve(el);
        setTimeout(function () {
          el.removeAttribute('data-aos');
          el.classList.remove('aos-in');
          el.style.transitionDelay = '';
        }, 1100);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    $$(sel).forEach(function (el) {
      if (el.getBoundingClientRect().top < vh * 0.92) return;
      var i = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      var zoom = el.classList.contains('pack') || el.classList.contains('work');
      el.setAttribute('data-aos', zoom ? 'zoom-in' : 'fade-up');
      el.style.transitionDelay = (i % 4) * 80 + 'ms';
      io.observe(el);
    });
  }

  /* 2. Barre de progression, retour en haut, bouton WhatsApp */
  function initChrome() {
    var bar = make('div', 'progress');
    bar.setAttribute('aria-hidden', 'true');
    var up = make('button', 'totop', '↑');
    up.type = 'button';
    up.setAttribute('aria-label', 'Retour en haut de la page');
    var fab = make('a', 'fab', '<img src="assets/icon-whatsapp.svg" alt="" width="30" height="30">');
    fab.href = WA + '?text=' + encodeURIComponent('Bonjour Biljap Soft, j’ai une question.');
    fab.setAttribute('aria-label', 'Écrire à Biljap Soft sur WhatsApp');
    d.body.appendChild(bar);
    d.body.appendChild(up);
    d.body.appendChild(fab);
    var ticking = false;
    function update() {
      var h = root.scrollHeight - window.innerHeight;
      var p = h > 0 ? Math.min(1, window.pageYOffset / h) : 0;
      bar.style.transform = 'scaleX(' + p + ')';
      up.classList.toggle('show', window.pageYOffset > 700);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    up.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
    update();
  }

  /* 3. Menu de navigation : section active */
  function initSpy() {
    var nav = $('.cnav');
    if (!nav || !('IntersectionObserver' in window)) return;
    var links = $$('a[href^="#"]', nav), map = {};
    links.forEach(function (a) {
      var s = $(a.getAttribute('href'));
      if (s) map[s.id] = a;
    });
    function setActive(a) {
      links.forEach(function (x) { x.removeAttribute('aria-current'); });
      a.setAttribute('aria-current', 'true');
      var left = a.offsetLeft - (nav.clientWidth - a.offsetWidth) / 2;
      if (nav.scrollTo) nav.scrollTo({ left: left, behavior: reduce ? 'auto' : 'smooth' });
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) setActive(map[en.target.id]);
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    Object.keys(map).forEach(function (id) { io.observe(d.getElementById(id)); });
  }

  /* 4. Agrandissement des images du portfolio */
  function initLightbox() {
    var thumbs = $$('.work .thumb');
    if (!thumbs.length) return;
    var lb = null, last = null;
    function close() {
      if (!lb) return;
      lb.remove(); lb = null;
      d.body.classList.remove('noscroll');
      d.removeEventListener('keydown', onKey);
      if (last) last.focus();
    }
    function onKey(e) { if (e.key === 'Escape') close(); }
    function open(t) {
      var img = $('img', t), title = $('h3', t.parentElement);
      last = t;
      lb = make('div', 'lb');
      lb.setAttribute('role', 'dialog');
      lb.setAttribute('aria-modal', 'true');
      lb.setAttribute('aria-label', img.alt);
      lb.innerHTML = '<button type="button" class="lb-x" aria-label="Fermer">×</button>' +
        '<figure><img src="' + img.getAttribute('src') + '" alt="' + img.alt + '"><figcaption>' +
        (title ? title.textContent : img.alt) + '</figcaption></figure>';
      d.body.appendChild(lb);
      d.body.classList.add('noscroll');
      lb.addEventListener('click', close);
      $('.lb-x', lb).focus();
      d.addEventListener('keydown', onKey);
    }
    thumbs.forEach(function (t) {
      t.tabIndex = 0;
      t.setAttribute('role', 'button');
      t.setAttribute('aria-label', 'Agrandir : ' + $('img', t).alt);
      t.addEventListener('click', function () { open(t); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(t); }
      });
    });
  }

  /* 5. Devis estimatif (page catalogue) */
  function initQuote() {
    if (!d.body.hasAttribute('data-quote')) return;
    var items = [];
    var bar = make('div', 'qbar');
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Mon devis estimatif');
    bar.innerHTML = '<div class="qinfo"><span class="qn" aria-live="polite"></span><b class="qt"></b></div>' +
      '<button type="button" class="qclear">Vider</button>' +
      '<a class="qsend" href="#">Envoyer sur WhatsApp</a>';
    d.body.appendChild(bar);
    var qn = $('.qn', bar), qt = $('.qt', bar), qs = $('.qsend', bar);

    function totals() {
      var one = 0, mo = 0, from = false;
      items.forEach(function (x) {
        if (x.monthly) mo += x.price; else one += x.price;
        if (x.from) from = true;
      });
      var parts = [];
      if (one) parts.push(one + ' $');
      if (mo) parts.push(mo + ' $ par mois');
      return (from ? 'dès ' : '') + parts.join(' + ');
    }
    function refresh() {
      var n = items.length;
      bar.classList.toggle('show', n > 0);
      d.body.classList.toggle('has-bar', n > 0);
      qn.textContent = n + (n > 1 ? ' éléments' : ' élément') + ' · total indicatif';
      qt.textContent = totals();
      var lines = items.map(function (x) {
        return '- ' + x.name + ' (' + (x.from ? 'dès ' : '') + x.price + ' $' + (x.monthly ? ' par mois' : '') + ')';
      });
      var text = 'Bonjour Biljap Soft, je souhaite un devis pour :\n' + lines.join('\n') +
        '\n\nTotal indicatif : ' + totals() + '\nMerci de me confirmer le prix et le délai.';
      qs.href = WA + '?text=' + encodeURIComponent(text);
    }
    $$('.rows .row, .pack').forEach(function (card) {
      var pEl = $('.pr', card) || $('.p', card);
      if (!pEl) return;
      var txt = pEl.textContent.replace(/\u00a0/g, ' ');
      var m = txt.match(/(\d[\d ]*)\s*\$/);
      if (!m || /^\s*\+/.test(txt)) return;
      var isPack = card.classList.contains('pack');
      var name = (isPack ? $('h3', card) : $('b', card)).textContent.trim();
      if (card.closest && card.closest('#abonnements')) name = 'Abonnement ' + name;
      var item = { name: name, price: parseInt(m[1].replace(/\s/g, ''), 10), from: /dès/i.test(txt), monthly: /par mois/i.test(txt) };
      var btn = make('button', 'add', '+');
      btn.type = 'button';
      btn.setAttribute('aria-pressed', 'false');
      btn.setAttribute('aria-label', 'Ajouter au devis : ' + name);
      btn.addEventListener('click', function () {
        var i = items.indexOf(item), on = i === -1;
        if (on) items.push(item); else items.splice(i, 1);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        btn.textContent = on ? '✓' : '+';
        btn.setAttribute('aria-label', (on ? 'Retirer du devis : ' : 'Ajouter au devis : ') + name);
        card.classList.toggle('sel', on);
        refresh();
      });
      card.appendChild(btn);
    });
    $('.qclear', bar).addEventListener('click', function () {
      items = [];
      $$('.add').forEach(function (b) {
        b.setAttribute('aria-pressed', 'false'); b.textContent = '+';
      });
      $$('.sel').forEach(function (c) { c.classList.remove('sel'); });
      refresh();
    });
    refresh();
  }

  function init() {
    initReveal(); initChrome(); initSpy(); initLightbox(); initQuote();
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init); else init();
})();
