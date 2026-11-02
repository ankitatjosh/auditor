/*
 * Sends the site's contact forms to the AI Audit backend (POST /api/public/inquiries).
 *
 * The endpoint comes from <meta name="enquiry-endpoint" content="..."> on each page.
 * Links with data-cta (and optional data-product, data-plan, data-topic) remember why the
 * visitor came to a form, and campaign tags (utm_*) and the external referrer are kept for the
 * visit, so the team sees which button and campaign led to each enquiry.
 */
(function () {
  'use strict';

  var meta = document.querySelector('meta[name="enquiry-endpoint"]');
  var ENDPOINT = (meta && meta.getAttribute('content')) || '';
  var STORE = 'gh_enquiry_context';
  var TIMEOUT_MS = 15000;
  var UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

  function read() {
    try { return JSON.parse(sessionStorage.getItem(STORE) || '{}') || {}; } catch (e) { return {}; }
  }
  function write(ctx) {
    try { sessionStorage.setItem(STORE, JSON.stringify(ctx)); } catch (e) { /* storage blocked: send without context */ }
  }

  // Campaign tags and the external referrer, captured on the first page of the visit
  (function captureVisit() {
    var ctx = read(), params = new URLSearchParams(window.location.search), changed = false;
    UTM.forEach(function (key) {
      var value = params.get(key);
      if (value) { ctx[key] = value.slice(0, 200); changed = true; }
    });
    if (!ctx.referrer && document.referrer) {
      try {
        if (new URL(document.referrer).host !== window.location.host) { ctx.referrer = document.referrer; changed = true; }
      } catch (e) { /* not a URL */ }
    }
    if (changed) write(ctx);
  })();

  // Remember which button brought the visitor to a form
  document.addEventListener('click', function (e) {
    var link = e.target.closest && e.target.closest('[data-cta]');
    if (!link) return;
    var ctx = read();
    ctx.cta = link.getAttribute('data-cta');
    if (link.hasAttribute('data-topic')) ctx.topic = link.getAttribute('data-topic');
    if (link.hasAttribute('data-plan')) ctx.plan = link.getAttribute('data-plan');
    var product = link.getAttribute('data-product');
    if (product) {
      ctx.products = (ctx.products || []).filter(function (p) { return p !== product; });
      ctx.products.push(product);
    }
    write(ctx);
  });

  function context() { return read(); }

  /**
   * Send an enquiry. `fields` holds the form values (email, name, topic, ...).
   * Resolves with {reference}; rejects with an Error whose message can be shown to the visitor.
   */
  function send(fields) {
    if (!ENDPOINT) return Promise.reject(new Error('The contact form is not connected yet. Please email us instead.'));
    var ctx = read(), body = {};
    UTM.forEach(function (key) { if (ctx[key]) body[key] = ctx[key]; });
    if (ctx.referrer) body.referrer = ctx.referrer;
    body.source_url = window.location.href.split('#')[0];
    Object.keys(fields).forEach(function (key) {
      var value = fields[key];
      if (value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length)) return;
      body[key] = value;
    });

    var controller = 'AbortController' in window ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, TIMEOUT_MS) : null;
    return fetch(ENDPOINT, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller ? controller.signal : undefined
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (res.ok && data.reference) {
          // The visit's button context is used up; campaign tags stay for the rest of the visit
          var left = read(); delete left.cta; delete left.topic; delete left.plan; delete left.products; write(left);
          return { reference: data.reference };
        }
        var detail = typeof data.detail === 'string' ? data.detail : '';
        if (res.status === 429) throw new Error('Too many messages from this address. Please try again later, or email us.');
        if (res.status === 400 && detail) throw new Error(detail.charAt(0).toUpperCase() + detail.slice(1) + '.');
        throw new Error('Something went wrong on our side. Please try again, or email us.');
      });
    }, function () {
      throw new Error("We couldn't reach our server. Check your connection and try again, or email us.");
    }).finally(function () { if (timer) clearTimeout(timer); });
  }

  window.GHEnquiry = { send: send, context: context };
})();
