/**
 * Inquiry Form Handler - AJAX submission with Netlify Forms
 * Handles form submit, loading state, and success/error display
 */
(function() {
  document.querySelectorAll('.inquiry-form').forEach(function(form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();

      var submitBtn = form.querySelector('.form-submit-btn');
      var formWrapper = form.closest('.inquiry-form-wrapper');
      var successEl = formWrapper ? formWrapper.querySelector('.form-success') : null;

      // Loading state
      submitBtn.classList.add('loading');
      submitBtn.disabled = true;

      var formData = new FormData(form);
      // Handle flexible date checkbox
      var flexCheck = form.querySelector('input[name="flexible-date"]');
      if (flexCheck && flexCheck.checked) {
        formData.set('preferred-date', 'Flexible');
      }

      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData).toString()
      })
      .then(function(response) {
        if (response.ok) {
          // Show success
          form.style.display = 'none';
          if (successEl) {
            successEl.classList.add('visible');
          }
        } else {
          throw new Error('Form submission failed');
        }
      })
      .catch(function() {
        alert('Something went wrong. Please try again or email info@ceezaer.com directly.');
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
      });
    });
  });

  // Pre-fill service from URL parameter
  var params = new URLSearchParams(window.location.search);
  var serviceParam = params.get('service');
  if (serviceParam) {
    document.querySelectorAll('select[name="service"]').forEach(function(select) {
      for (var i = 0; i < select.options.length; i++) {
        if (select.options[i].value === serviceParam) {
          select.selectedIndex = i;
          break;
        }
      }
    });
  }
})();
