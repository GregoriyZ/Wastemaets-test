// WasteMates — shared behaviour
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

  // Enquiry form validation — works for both #contact-form and #pricing-form
  function bindFormValidation() {
    var forms = document.querySelectorAll('#contact-form, #pricing-form');
    forms.forEach(function (form) {
      form.setAttribute('novalidate', '');

      form.addEventListener('submit', function (e) {
        var valid = true;

        form.querySelectorAll('.field').forEach(function (field) {
          var input = field.querySelector('input, textarea, select');
          if (!input || input.type === 'hidden' || input.type === 'checkbox') return;

          var val = input.value.trim();
          var err = false;

          if (input.name === 'name') {
            err = val === '';
          } else if (input.name === 'mobile') {
            var digits = val.replace(/[\s\-]/g, '');
            err = !/^04\d{8}$/.test(digits);
          } else if (input.name === 'email') {
            err = val !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
          } else if (input.name === 'suburb') {
            err = val === '';
          } else if (input.name === 'job') {
            err = val === '';
          } else if (input.name === 'details') {
            err = val === '';
          }

          field.classList.toggle('field--error', err);
          if (err) valid = false;
        });

        if (!valid) {
          e.preventDefault();
          var first = form.querySelector('.field--error input, .field--error textarea, .field--error select');
          if (first) first.focus();
        }
      });

      // Clear error on a field as soon as the user edits it
      form.querySelectorAll('.field input, .field textarea, .field select').forEach(function (input) {
        input.addEventListener('input', function () {
          var field = input.closest('.field');
          if (field) field.classList.remove('field--error');
        });
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    bindMenu();
    bindFaq();
    handleFormSuccess();
    bindFormValidation();
  });
})();
