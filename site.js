// WasteMates — shared behaviour

// Leaflet service-area map — CartoDB light tiles, 130 km radius centred on Mooroolbark
function initMap() {
  if (typeof L === 'undefined') return;

  var serviceCentre = [-37.78247, 145.31682];

  ['about-map', 'contact-map'].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;

    var map = L.map(el, {
      center: serviceCentre,
      zoom: 8,
      zoomControl: true,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    L.circle(serviceCentre, {
      radius: 130000,
      color: '#61DE2A',
      fillColor: '#61DE2A',
      fillOpacity: 0.12,
      weight: 2,
      opacity: 0.8,
    }).addTo(map);
  });
}
(function () {
  // Mobile menu toggle
  function bindMenu() {
    var burger = document.querySelector('.burger');
    var menu = document.querySelector('.mobile-menu');
    if (!burger || !menu) return;
    burger.addEventListener('click', function () {
      menu.classList.toggle('open');
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { menu.classList.remove('open'); });
    });
  }

  // FAQ accordion — also opens any item with class="open" on load
  function bindFaq() {
    document.querySelectorAll('.faq-q').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var item = btn.closest('.faq-item');
        var ans = item.querySelector('.faq-a');
        var open = item.classList.toggle('open');
        ans.style.maxHeight = open ? ans.scrollHeight + 'px' : '0';
      });
    });
    // Initialise any pre-opened items
    document.querySelectorAll('.faq-item.open .faq-a').forEach(function (ans) {
      ans.style.maxHeight = ans.scrollHeight + 'px';
    });
  }

  // Read a cookie by name (used for Meta's _fbc/_fbp browser/click ids,
  // which significantly improve Conversions API match quality).
  function getCookie(name) {
    var m = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  }

  // Capture PII from forms just before they POST away to formsubmit.co.
  // By the time the page redirects back with ?sent=1 the form fields are
  // gone, so we stash what we need in sessionStorage and read it back in
  // handleFormSuccess(). This data is used only to improve Meta's event
  // match quality — it is never stored persistently or sent anywhere other
  // than Meta via the pixel and CAPI relay.
  function bindFormCapture() {
    ['hero-quote-form', 'contact-form'].forEach(function (id) {
      var form = document.getElementById(id);
      if (!form) return;
      form.addEventListener('submit', function () {
        var data = {};

        // Name → split into fn (first) / ln (last) for advanced matching
        var nameEl = form.querySelector('input[type="text"][name="name"]');
        if (nameEl && nameEl.value.trim()) {
          var parts = nameEl.value.trim().split(/\s+/);
          data.fn = parts[0].toLowerCase();
          if (parts.length > 1) data.ln = parts.slice(1).join(' ').toLowerCase();
        }

        // Phone → digits only, convert Australian 04xx → 614xx (E.164)
        var phoneEl = form.querySelector('input[type="tel"]');
        if (phoneEl && phoneEl.value.trim()) {
          var digits = phoneEl.value.replace(/\D/g, '');
          if (digits.charAt(0) === '0') digits = '61' + digits.slice(1);
          if (digits.length >= 9) data.ph = digits;
        }

        // Email (contact form only — hero form has no email field)
        var emailEl = form.querySelector('input[type="email"]');
        if (emailEl && emailEl.value.trim()) {
          data.em = emailEl.value.trim().toLowerCase();
        }

        if (Object.keys(data).length) {
          try { sessionStorage.setItem('_wm_lead', JSON.stringify(data)); } catch (e) {}
        }
      });
    });
  }

  // Fire a "Lead" conversion both client-side (Meta Pixel) and server-side
  // (Conversions API, via capi-relay.php — see that file for setup notes).
  // Both calls share the same event_id so Meta de-duplicates them into one
  // event rather than counting the conversion twice. The server-side leg
  // also reaches Meta even when the browser pixel itself is blocked.
  // userData keys: em (email), ph (phone E.164), fn (first name), ln (last name).
  // Meta's fbq() hashes these automatically; capi-relay.php hashes them server-side.
  function trackLead(userData) {
    userData = userData || {};
    var eventId = 'lead-' + Date.now() + '-' + Math.random().toString(36).slice(2);

    if (typeof fbq === 'function') {
      fbq('track', 'Lead', userData, { eventID: eventId });
    }

    fetch('/capi-relay.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_name: 'Lead',
        event_id: eventId,
        url: window.location.href,
        fbc: getCookie('_fbc'),
        fbp: getCookie('_fbp'),
        em: userData.em || null,
        ph: userData.ph || null,
        fn: userData.fn || null,
        ln: userData.ln || null,
      }),
    }).catch(function () { /* relay is best-effort — never block the UI on it */ });
  }

  // Show success banner when redirected back after form submission (?sent=1)
  function handleFormSuccess() {
    if (window.location.search.indexOf('sent=1') === -1) return;
    var banner = document.getElementById('form-success');
    if (banner) {
      banner.style.display = 'block';
      banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Recover PII captured just before the form posted away
    var userData = {};
    try {
      userData = JSON.parse(sessionStorage.getItem('_wm_lead') || '{}');
      sessionStorage.removeItem('_wm_lead');
    } catch (e) {}

    trackLead(userData);
    // Clean the URL so a refresh doesn't re-show the banner
    if (window.history && window.history.replaceState) {
      var clean = window.location.pathname + window.location.hash;
      window.history.replaceState(null, '', clean);
    }
  }

  // Sticky mobile call/quote bar — keeps the two highest-value actions
  // (call now, get a quote) within thumb's reach on phones, where most
  // visitors will be browsing. Injected once so every page picks it up.
  function injectStickyCta() {
    if (document.querySelector('.sticky-cta')) return;
    var bar = document.createElement('div');
    bar.className = 'sticky-cta';
    bar.innerHTML =
      '<a class="btn btn--ghost" href="tel:+61494013254">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:17px;height:17px"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>' +
        'Call now</a>' +
      '<a class="btn btn--green" href="contact.html">Get a Free Quote</a>';
    document.body.appendChild(bar);
  }

  function bindMarquee() {
    var track = document.querySelector('.marquee-track');
    if (!track) return;
    var marquee = track.closest('.marquee');
    marquee.addEventListener('mouseenter', function () {
      track.style.animationPlayState = 'paused';
    });
    marquee.addEventListener('mouseleave', function () {
      track.style.animationPlayState = 'running';
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    bindMenu();
    bindFaq();
    bindFormCapture();
    handleFormSuccess();
    bindMarquee();
    injectStickyCta();
    initMap();
  });
})();
