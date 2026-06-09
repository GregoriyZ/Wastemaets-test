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

  // Send a payload to capi-relay.php using sendBeacon where available.
  // sendBeacon is specifically designed to survive page navigation — a regular
  // fetch() is cancelled the moment the browser navigates away (which happens
  // immediately after a form submit). sendBeacon queues the request at the OS
  // level so it completes even after the tab has moved on.
  function sendRelay(payload) {
    var body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/capi-relay.php', new Blob([body], { type: 'application/json' }));
    } else {
      fetch('/capi-relay.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body,
      }).catch(function () { /* best-effort */ });
    }
  }

  // Fire a Lead event both client-side (Meta Pixel) and server-side (CAPI relay).
  // Both share the same event_id so Meta de-duplicates them into one conversion
  // rather than double-counting.
  // userData keys: em (email), ph (E.164 phone), fn (first name), ln (last name).
  // fbq() hashes PII automatically; capi-relay.php SHA-256 hashes them server-side.
  function trackLead(userData) {
    userData = userData || {};
    var eventId = 'lead-' + Date.now() + '-' + Math.random().toString(36).slice(2);

    if (typeof fbq === 'function') {
      fbq('track', 'Lead', userData, { eventID: eventId });
    }

    sendRelay({
      event_name: 'Lead',
      event_id: eventId,
      url: window.location.href,
      fbc: getCookie('_fbc'),
      fbp: getCookie('_fbp'),
      em: userData.em || null,
      ph: userData.ph || null,
      fn: userData.fn || null,
      ln: userData.ln || null,
    });
  }

  // Fire a Contact event when any phone number link is clicked.
  // This captures call intent before the browser switches to the dialler.
  function trackContact() {
    var eventId = 'contact-' + Date.now() + '-' + Math.random().toString(36).slice(2);

    if (typeof fbq === 'function') {
      fbq('track', 'Contact', {}, { eventID: eventId });
    }

    sendRelay({
      event_name: 'Contact',
      event_id: eventId,
      url: window.location.href,
      fbc: getCookie('_fbc'),
      fbp: getCookie('_fbp'),
    });
  }

  // Wire up the quote/enquiry form submit buttons.
  // Fires trackLead on form submit, capturing whatever PII the user typed
  // (name → fn/ln, phone → E.164, email) to maximise Meta's match quality.
  // Uses sendBeacon under the hood so the relay request survives the page
  // navigation that immediately follows the form POST to formsubmit.co.
  function bindFormEvents() {
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

        trackLead(data);
      });
    });
  }

  // Fire a Contact event whenever any phone link (tel:) is clicked.
  function bindPhoneEvents() {
    document.querySelectorAll('a[href^="tel:"]').forEach(function (link) {
      link.addEventListener('click', function () {
        trackContact();
      });
    });
  }

  // Show success banner when redirected back after form submission (?sent=1).
  // trackLead already fired on submit — we only show the UI confirmation here.
  function handleFormSuccess() {
    if (window.location.search.indexOf('sent=1') === -1) return;
    var banner = document.getElementById('form-success');
    if (banner) {
      banner.style.display = 'block';
      banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
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
    bindFormEvents();
    bindPhoneEvents();
    handleFormSuccess();
    bindMarquee();
    injectStickyCta();
    initMap();
  });
})();
