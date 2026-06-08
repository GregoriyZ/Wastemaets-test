// WasteMates — shared behaviour

// Leaflet service-area map — CartoDB light tiles, 130 km radius (Mooroolbark → Ballarat)
function initMap() {
  if (typeof L === 'undefined') return;

  var melbourne = [-37.8136, 144.9631];

  ['about-map', 'contact-map'].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;

    var map = L.map(el, {
      center: melbourne,
      zoom: 8,
      zoomControl: true,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    L.circle(melbourne, {
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

  // Show success banner when redirected back after form submission (?sent=1)
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
    handleFormSuccess();
    bindMarquee();
    injectStickyCta();
    initMap();
  });
})();
