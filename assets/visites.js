/* Biljap Soft – compteur de visites anonyme.
   Un identifiant aléatoire est gardé sur l'appareil ; aucune donnée personnelle n'est envoyée. */
(function () {
  'use strict';
  var c = window.BILJAP_DB;
  if (!c || !c.url || !c.key || c.url.indexOf('VOTRE') !== -1) return;
  if (navigator.webdriver) return;
  try {
    if (sessionStorage.getItem('bj_visite')) return;          // une visite par session
    var id = localStorage.getItem('bj_id');
    if (!id) {
      id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() :
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (k) {
          var r = Math.random() * 16 | 0; return (k === 'x' ? r : (r & 3 | 8)).toString(16);
        });
      localStorage.setItem('bj_id', id);
    }
    fetch(c.url + '/rest/v1/rpc/enregistrer_visite', {
      method: 'POST',
      headers: { 'apikey': c.key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_visiteur: id }),
      keepalive: true
    }).then(function (r) { if (r.ok) sessionStorage.setItem('bj_visite', '1'); }).catch(function () {});
  } catch (e) { /* stockage bloqué : on ne compte pas */ }
})();
