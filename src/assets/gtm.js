(function (w, d, s, l, i) {
  if (!/^(www\.)?viexsalud\.cl$/.test(location.hostname) || /^\/(admin|ejecutivos|recursos-ejecutivos)(\/|$)/.test(location.pathname)) return;
  w[l] = w[l] || [];
  w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
  var f = d.getElementsByTagName(s)[0],
    j = d.createElement(s),
    dl = l != 'dataLayer' ? '&l=' + l : '';
  j.async = true;
  j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
  f.parentNode.insertBefore(j, f);
})(window, document, 'script', 'dataLayer', 'GTM-T72HZJ28');
