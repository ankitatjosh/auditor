/* Ai Audit shared behaviour: nav + footer, menu, reveals, clocks, copy, scramble, count-up. */
(function(){
  var page = document.body.getAttribute('data-page') || '';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ARROW = '<span class="chip"><svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
  var MARK = '<svg viewBox="0 0 26 26" aria-hidden="true"><path d="M3 24V3h20v21h-5.5V8.5h-9V24H3Z" fill="#f3f1ec"/><rect x="11" y="11" width="4" height="13" rx=".5" fill="#f3f1ec" opacity=".55"/></svg>';
  var BRAND = '<a class="brand" href="index.html" aria-label="Ai Audit home">' + MARK + '<span>Ai Audit<sup>™</sup></span></a>';
  var LINKS = [['Platform','index.html#products','platform'],['Trust center','trust.html','trust'],['About','about.html','about'],['Careers','careers.html','careers'],['Contact','contact.html','contact']];
  function links(){ return LINKS.map(function(l){ return '<a href="' + l[1] + '"' + (l[2] === page ? ' aria-current="page"' : '') + '>' + l[0] + '</a>'; }).join(''); }

  var navSlot = document.getElementById('site-nav');
  if (navSlot) navSlot.outerHTML =
    '<nav class="nav" id="nav" aria-label="Primary"><div class="wrap">' + BRAND +
    '<div class="links">' + links() + '</div>' +
    '<a class="signin" href="app.html">Sign in</a>' +
    '<a class="btn btn-primary nav-cta" href="contact.html"' + (page === 'contact' ? ' aria-current="page"' : '') + '>Contact ' + ARROW + '</a>' +
    '<button class="burger" id="burger" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="menu"><span><i></i><i></i></span></button>' +
    '</div></nav>' +
    '<div class="menu" id="menu" aria-hidden="true">' + links() + '<a href="contact.html"' + (page === 'contact' ? ' aria-current="page"' : '') + '>Contact</a>' +
    '<a href="app.html">Sign in</a><a class="btn btn-primary" href="index.html#demo">Book a demo ' + ARROW + '</a></div>';

  var footSlot = document.getElementById('site-footer');
  function cur(p){ return p === page ? ' aria-current="page"' : ''; }
  if (footSlot) footSlot.outerHTML =
    '<footer><div class="wrap"><div class="fgrid">' +
    '<div>' + BRAND + '<p>The security layer for AI coding agents.</p><div class="fvalues"><span>Vigilance</span><span>Precision</span><span>Resilience</span></div></div>' +
    '<div><h4>Products</h4><ul><li><a href="index.html#products">Warden</a></li><li><a href="index.html#products">Portcullis</a></li><li><a href="index.html#products">Sieve</a></li><li><a href="index.html#products">Logbook</a></li></ul></div>' +
    '<div><h4>Company</h4><ul><li><a href="about.html"' + cur('about') + '>About</a></li><li><a href="careers.html"' + cur('careers') + '>Careers</a></li><li><a href="trust.html"' + cur('trust') + '>Trust center</a></li><li><a href="contact.html"' + cur('contact') + '>Contact</a></li></ul></div>' +
    '<div><h4>Resources</h4><ul><li><a href="index.html#install">Docs</a></li><li><a href="index.html#pricing">Pricing</a></li><li><a href="trust.html#status">Status</a></li><li><a href="trust.html#disclosure">Report a vulnerability</a></li></ul></div>' +
    '</div><div class="fbase"><span>© 2026 Ai Audit Security, Inc.</span><span>security@Ai Audit.dev</span></div></div></footer>';

  /* nav state */
  var nav = document.getElementById('nav');
  function onScroll(){ if (nav) nav.classList.toggle('scrolled', window.scrollY > 24); }
  window.addEventListener('scroll', onScroll, {passive: true}); onScroll();

  /* menu */
  var root = document.documentElement, burger = document.getElementById('burger'), menu = document.getElementById('menu');
  function setMenu(open){
    if (!burger) return;
    root.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open); burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('aria-hidden', !open); document.body.style.overflow = open ? 'hidden' : '';
  }
  if (burger){
    burger.addEventListener('click', function(){ setMenu(!root.classList.contains('menu-open')); });
    menu.addEventListener('click', function(e){ if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') setMenu(false); });
    window.addEventListener('resize', function(){ if (window.innerWidth > 1100) setMenu(false); });
  }

  /* reveals (transform only, content always visible) */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce){
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }); }, {threshold: .12});
    revealEls.forEach(function(el){ io.observe(el); });
  } else revealEls.forEach(function(el){ el.classList.add('in'); });

  /* clocks */
  function pad(n){ return (n < 10 ? '0' : '') + n; }
  function tick(){
    var d = new Date();
    document.querySelectorAll('[data-clock]').forEach(function(el){
      var k = el.getAttribute('data-clock');
      if (k === 'local') el.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
      else if (k === 'local-hm') el.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes());
      else if (k === 'utc') el.textContent = pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds());
    });
  }
  tick(); setInterval(tick, 1000);

  /* toast */
  var toastEl;
  function toast(msg){
    if (!toastEl){ toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastEl._t); toastEl._t = setTimeout(function(){ toastEl.classList.remove('show'); }, 1800);
  }

  /* copy buttons: data-copy="text" */
  document.addEventListener('click', function(e){
    var b = e.target.closest('[data-copy]'); if (!b) return;
    var text = b.getAttribute('data-copy');
    function fallback(){ toast('Select and copy: ' + text); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function(){ toast('Copied ' + text); }, fallback); else fallback();
  });

  /* scramble: decode text in place */
  var GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789/<>-_';
  function scramble(el, text){
    if (reduce){ el.textContent = text; return; }
    var start = performance.now(), dur = 520, from = el.textContent;
    cancelAnimationFrame(el._sr);
    (function frame(now){
      var p = Math.min(1, (now - start) / dur), out = '';
      for (var i = 0; i < text.length; i++){
        if (text[i] === ' ' || i / text.length < p) out += text[i];
        else out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      if (p < 1) el._sr = requestAnimationFrame(frame); else el.textContent = text;
    })(start);
  }

  /* count-up: data-count="7" */
  function countUp(el){
    var to = +el.getAttribute('data-count'), padTo = (el.getAttribute('data-pad') || '').length, start = performance.now(), dur = 1400;
    function fmt(v){ var s = String(v); while (s.length < padTo) s = '0' + s; return s; }
    if (reduce){ el.textContent = fmt(to); return; }
    (function f(now){ var p = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(Math.round(to * e)); if (p < 1) requestAnimationFrame(f); })(start);
  }
  document.querySelectorAll('[data-count]').forEach(countUp);

  /* run a callback only while an element is on screen */
  function whileVisible(el, start, stop){
    if (!('IntersectionObserver' in window)){ start(); return; }
    new IntersectionObserver(function(es){ es.forEach(function(e){ e.isIntersecting ? start() : stop(); }); }, {threshold: 0}).observe(el);
  }

  window.GH = {reduce: reduce, scramble: scramble, toast: toast, pad: pad, whileVisible: whileVisible, countUp: countUp};
})();
