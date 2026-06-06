// WasteMates — shared behaviour

// Google Maps callback — dark-styled map with service area circle
function initMap() {
  var melbourne = { lat: -37.8136, lng: 144.9631 };

  var darkStyle = [
    { elementType: 'geometry',                                stylers: [{ color: '#111409' }] },
    { elementType: 'labels.text.fill',                        stylers: [{ color: '#8a9a78' }] },
    { elementType: 'labels.text.stroke',                      stylers: [{ color: '#111409' }] },
    { featureType: 'road',        elementType: 'geometry',    stylers: [{ color: '#252b1c' }] },
    { featureType: 'road.highway',elementType: 'geometry',    stylers: [{ color: '#333d26' }] },
    { featureType: 'road.highway',elementType: 'labels.text.fill', stylers: [{ color: '#61DE2A' }] },
    { featureType: 'water',       elementType: 'geometry',    stylers: [{ color: '#0d1a2d' }] },
    { featureType: 'water',       elementType: 'labels.text.fill', stylers: [{ color: '#3a5a7a' }] },
    { featureType: 'poi',         elementType: 'geometry',    stylers: [{ color: '#161b0f' }] },
    { featureType: 'poi.park',    elementType: 'geometry',    stylers: [{ color: '#1a2210' }] },
    { featureType: 'transit',     elementType: 'geometry',    stylers: [{ color: '#1e2318' }] },
    { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#2a3020' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#c5ccbd' }] },
  ];

  var opts = {
    center: melbourne,
    zoom: 9,
    styles: darkStyle,
    disableDefaultUI: true,
    zoomControl: true,
    gestureHandling: 'cooperative',
    backgroundColor: '#111409',
  };

  ['about-map', 'contact-map'].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    var map = new google.maps.Map(el, opts);
    new google.maps.Circle({
      map: map,
      center: melbourne,
      radius: 50000,
      fillColor: '#61DE2A',
      fillOpacity: 0.12,
      strokeColor: '#61DE2A',
      strokeOpacity: 0.7,
      strokeWeight: 2,
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
  });
})();
