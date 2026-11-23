/* Biljap Soft – comptes clients, commandes et tableau de bord (Supabase) */
(function () {
  'use strict';
  var d = document, cfg = window.BILJAP_DB || {};
  function $(s, c) { return (c || d).querySelector(s); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var V = { chargement: $('#vue-chargement'), auth: $('#vue-auth'), mdp: $('#vue-mdp'), client: $('#vue-client'), admin: $('#vue-admin') };
  function montrer(noms) { Object.keys(V).forEach(function (k) { V[k].hidden = noms.indexOf(k) === -1; }); }
  function dire(el, texte, type) { el.textContent = texte; el.className = 'msg' + (type ? ' ' + type : ''); }
  function usd(n) { return Number(n).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' $'; }
  function jour(t) { return new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); }
  var MODES = { mobile_money: 'Mobile Money', virement: 'Virement', especes: 'Espèces' };
  function erreur(e) {
    var m = (e && e.message) || '';
    if (/invalid login/i.test(m)) return 'E-mail ou mot de passe incorrect.';
    if (/not confirmed/i.test(m)) return 'Confirmez d’abord votre adresse e-mail (message envoyé à l’inscription).';
    if (/already registered/i.test(m)) return 'Un compte existe déjà avec cet e-mail.';
    if (/password/i.test(m) && /characters|short|weak/i.test(m)) return 'Mot de passe trop court : 8 caractères minimum.';
    if (/rate limit|too many/i.test(m)) return 'Trop de tentatives. Réessayez dans quelques minutes.';
    return 'Une erreur est survenue. Réessayez.';
  }

  if (!cfg.url || !cfg.key || cfg.url.indexOf('VOTRE') !== -1 || !window.supabase) {
    $('p', V.chargement).textContent = 'Les comptes clients ne sont pas encore activés sur ce site. Revenez bientôt.';
    return;
  }
  var db = window.supabase.createClient(cfg.url, cfg.key);
  var courant = null, recup = /type=recovery/.test(location.hash);

  /* Connexion, inscription, mot de passe */
  function onglet(connexion) {
    $('#tab-connexion').setAttribute('aria-selected', connexion ? 'true' : 'false');
    $('#tab-inscription').setAttribute('aria-selected', connexion ? 'false' : 'true');
    $('#f-connexion').hidden = !connexion;
    $('#f-inscription').hidden = connexion;
    dire($('#msg-auth'), '');
  }
  $('#tab-connexion').addEventListener('click', function () { onglet(true); });
  $('#tab-inscription').addEventListener('click', function () { onglet(false); });

  $('#f-connexion').addEventListener('submit', async function (e) {
    e.preventDefault();
    var f = e.target.elements, m = $('#msg-auth');
    if (!f.email.value || !f.mdp.value) { dire(m, 'Saisissez votre e-mail et votre mot de passe.', 'err'); return; }
    dire(m, 'Connexion…');
    var r = await db.auth.signInWithPassword({ email: f.email.value.trim(), password: f.mdp.value });
    if (r.error) dire(m, erreur(r.error), 'err');
  });
  $('#f-inscription').addEventListener('submit', async function (e) {
    e.preventDefault();
    var f = e.target.elements, m = $('#msg-auth');
    if (!f.nom.value.trim() || !f.email.value.trim()) { dire(m, 'Le nom et l’e-mail sont obligatoires.', 'err'); return; }
    if (f.mdp.value.length < 8) { dire(m, 'Mot de passe trop court : 8 caractères minimum.', 'err'); return; }
    dire(m, 'Création du compte…');
    var r = await db.auth.signUp({
      email: f.email.value.trim(), password: f.mdp.value,
      options: { data: { nom: f.nom.value.trim(), telephone: f.tel.value.trim() }, emailRedirectTo: location.origin + location.pathname }
    });
    if (r.error) { dire(m, erreur(r.error), 'err'); return; }
    if (!r.data.session) dire(m, 'Compte créé. Un e-mail de confirmation vous a été envoyé : cliquez sur le lien, puis connectez-vous.', 'ok');
  });
  $('#oubli').addEventListener('click', async function () {
    var m = $('#msg-auth'), email = $('#c-email').value.trim();
    if (!email) { dire(m, 'Saisissez d’abord votre e-mail dans le champ ci-dessus.', 'err'); return; }
    var r = await db.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
    dire(m, r.error ? erreur(r.error) : 'Si cette adresse a un compte, un e-mail de réinitialisation vient d’être envoyé.', r.error ? 'err' : 'ok');
  });
  $('#f-mdp').addEventListener('submit', async function (e) {
    e.preventDefault();
    var m = $('#msg-mdp'), v = e.target.elements.mdp.value;
    if (v.length < 8) { dire(m, 'Mot de passe trop court : 8 caractères minimum.', 'err'); return; }
    var r = await db.auth.updateUser({ password: v });
    if (r.error) { dire(m, erreur(r.error), 'err'); return; }
    recup = false; history.replaceState(null, '', location.pathname);
    var s = await db.auth.getSession(); charger(s.data.session);
  });
  $('#deco').addEventListener('click', function () { db.auth.signOut(); });

  /* Espace client */
  function carte(c, admin) {
    var annulee = c.statut === 'annulee';
    var qui = admin && c.profiles ? '<small>' + esc(c.profiles.nom || '') + ' (' + esc(c.profiles.email || '') + ')</small>' : '';
    var det = [MODES[c.mode_paiement], c.reference_paiement].filter(Boolean).map(esc).join(', ');
    return '<article class="cmd' + (annulee ? ' annulee' : '') + '"><h3>' + esc(c.service) +
      (annulee ? '<span class="tag">Annulée</span>' : '') + '</h3>' + qui +
      '<div class="m">' + usd(c.montant_usd) + '</div><small>Commande n° ' + esc(c.numero) + ', ' + jour(c.created_at) + '</small>' +
      (c.description ? '<small>' + esc(c.description) + '</small>' : '') +
      (admin && det ? '<small>' + det + '</small>' : '') +
      (admin && !annulee ? '<button type="button" data-annuler="' + esc(c.id) + '">Annuler cette commande</button>' : '') + '</article>';
  }
  async function mesCommandes(id) {
    var r = await db.from('commandes').select('id,numero,service,description,montant_usd,statut,created_at')
      .eq('client_id', id).order('created_at', { ascending: false });
    var box = $('#mes-commandes');
    if (r.error) { box.innerHTML = '<p class="vide">Impossible de charger vos commandes.</p>'; return; }
    box.innerHTML = r.data.length ? r.data.map(function (c) { return carte(c, false); }).join('')
      : '<p class="vide">Aucune commande enregistrée pour le moment.</p>';
  }

  /* Tableau de bord administrateur */
  async function tableauDeBord() {
    var s = await db.rpc('stats_visites'), c = await db.from('commandes').select('montant_usd').eq('statut', 'reussie');
    var st = s.data || {}, lignes = c.data || [], ca = lignes.reduce(function (t, x) { return t + Number(x.montant_usd); }, 0);
    function cell(v, l) { return '<div class="stat"><b>' + esc(v) + '</b><span>' + l + '</span></div>'; }
    $('#stats').innerHTML = cell(st.visiteurs_uniques == null ? '–' : st.visiteurs_uniques, 'visiteurs uniques') +
      cell(st.visites_totales == null ? '–' : st.visites_totales, 'visites au total') +
      cell(st.actifs_7_jours == null ? '–' : st.actifs_7_jours, 'visiteurs actifs sur 7 jours') +
      cell(st.clients_inscrits == null ? '–' : st.clients_inscrits, 'clients inscrits') +
      cell(lignes.length, 'commandes réussies') + cell(usd(ca), 'montant encaissé');
    var cl = await db.from('profiles').select('id,nom,email').eq('role', 'client').order('nom');
    $('#k-client').innerHTML = (cl.data && cl.data.length)
      ? cl.data.map(function (x) { return '<option value="' + esc(x.id) + '">' + esc(x.nom || x.email) + ' (' + esc(x.email) + ')</option>'; }).join('')
      : '<option value="">Aucun client inscrit</option>';
    var r = await db.from('commandes').select('id,numero,service,description,montant_usd,mode_paiement,reference_paiement,statut,created_at,profiles(nom,email)')
      .order('created_at', { ascending: false }).limit(30);
    $('#admin-commandes').innerHTML = (r.data && r.data.length) ? r.data.map(function (x) { return carte(x, true); }).join('')
      : '<p class="vide">Aucune commande enregistrée.</p>';
  }
  $('#f-commande').addEventListener('submit', async function (e) {
    e.preventDefault();
    var f = e.target.elements, m = $('#msg-cmd'), montant = parseFloat(String(f.montant.value).replace(',', '.'));
    if (!f.client.value) { dire(m, 'Choisissez un client inscrit.', 'err'); return; }
    if (!f.service.value.trim()) { dire(m, 'Indiquez le service ou le pack.', 'err'); return; }
    if (!(montant > 0)) { dire(m, 'Saisissez un montant supérieur à 0.', 'err'); return; }
    dire(m, 'Enregistrement…');
    var r = await db.from('commandes').insert({
      client_id: f.client.value, service: f.service.value.trim(), description: f.desc.value.trim() || null,
      montant_usd: montant, mode_paiement: f.mode.value, reference_paiement: f.ref.value.trim() || null
    });
    if (r.error) { dire(m, 'Échec de l’enregistrement : ' + r.error.message, 'err'); return; }
    e.target.reset(); dire(m, 'Commande enregistrée.', 'ok'); tableauDeBord();
  });
  $('#admin-commandes').addEventListener('click', async function (e) {
    var b = e.target.closest('[data-annuler]');
    if (!b || !confirm('Annuler cette commande ? Elle ne sera plus comptée.')) return;
    var r = await db.from('commandes').update({ statut: 'annulee' }).eq('id', b.getAttribute('data-annuler'));
    if (!r.error) tableauDeBord();
  });

  async function charger(session) {
    if (recup) { montrer(['mdp']); return; }
    if (!session) { courant = null; montrer(['auth']); return; }
    courant = session.user.id;
    var p = await db.from('profiles').select('nom,email,role').eq('id', courant).single();
    var profil = p.data || { nom: '', email: session.user.email, role: 'client' };
    $('#bonjour').textContent = 'Bonjour ' + (profil.nom || profil.email);
    await mesCommandes(courant);
    var vues = ['client'];
    if (profil.role === 'admin') { await tableauDeBord(); vues.push('admin'); }
    montrer(vues);
  }

  db.auth.onAuthStateChange(function (ev, session) {
    if (ev === 'PASSWORD_RECOVERY') { recup = true; montrer(['mdp']); return; }
    if (['INITIAL_SESSION', 'SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED'].indexOf(ev) === -1) return;
    if (ev === 'SIGNED_IN' && session && session.user.id === courant) return;
    setTimeout(function () { charger(session); }, 0);   // évite d'appeler la base dans la fonction de rappel
  });
})();