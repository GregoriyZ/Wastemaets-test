// WasteMates — shared behaviour

// Mapbox service-area map — dark theme, 130 km radius (Mooroolbark → Ballarat)
function initMap() {
  if (typeof mapboxgl === 'undefined') return;

  mapboxgl.accessToken = 'YOUR_MAPBOX_TOKEN';

  var center = [144.9631, -37.8136]; // Melbourne CBD [lng, lat]
  var radiusKm = 130;

  // Build a GeoJSON circle polygon (geographic, not screen-space)
  function makeCircle(centerLngLat, km, steps) {
    steps = steps || 80;
    var coords = [];
    var latR  = km / 111.32;
    var lngR  = km / (111.32 * Math.cos(centerLngLat[1] * Math.PI / 180));
    for (var i = 0; i <= steps; i++) {
      var angle = (i / steps) * 2 * Math.PI;
      coords.push([
        centerLngLat[0] + lngR * Math.sin(angle),
        centerLngLat[1] + latR * Math.cos(angle)
      ]);
    }
    return { type: 'Feature', geometry: { type: 'Polygon', coordinates: [coords] } };
  }

  var circle = makeCircle(center, radiusKm);

  ['about-map', 'contact-map'].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;

    var map = new mapboxgl.Map({
      container: el,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: center,
      zoom: 7.8,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }));

    map.on('load', function () {
      map.addSource('service-area', { type: 'geojson', data: circle });
      map.addLayer({
        id: 'service-fill',
        type: 'fill',
        source: 'service-area',
        paint: { 'fill-color': '#61DE2A', 'fill-opacity': 0.12 }
      });
      map.addLayer({
        id: 'service-outline',
        type: 'line',
        source: 'service-area',
        paint: { 'line-color': '#61DE2A', 'line-width': 2, 'line-opacity': 0.8 }
      });
    });
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
    initMap();
  });
})();
