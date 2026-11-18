'use strict';
// Google Forms IDs are connected only after publication is explicitly authorized.
// Empty configuration never submits, and never displays a false confirmation.
for (const form of document.querySelectorAll('[data-feedback-form]')) {
  const kind = form.dataset.feedbackForm;
  const details = form.querySelector('textarea');
  const status = form.querySelector('[role="status"]');
  const button = form.querySelector('button[type="submit"]');
  const notify = text => { status.textContent = text; status.hidden = false; };
  if (!window.BURNER_FORM?.FORM_ID) {
    notify('Feedback is temporarily unavailable. Nothing you enter will be sent.');
  }
  details.addEventListener('input', () => details.setCustomValidity(''));
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (button.disabled) return;
    const comment = details.value.trim();
    if (details.required && !comment) {
      details.setCustomValidity('Please tell us what should be better.');
      details.reportValidity();
      return;
    }
    const config = window.BURNER_FORM || {};
    const reason = form.querySelector('input[name="reason"]:checked')?.value;
    if (!config.FORM_ID || !config.ENTRY_DETAILS || (kind === 'uninstall' && !config.ENTRY_REASON)) {
      notify('Feedback is not connected yet. Nothing was sent.');
      return;
    }
    if (!navigator.onLine) {
      notify('You are offline. Reconnect and try again.');
      return;
    }
    const data = new FormData();
    if (kind === 'uninstall') data.append(config.ENTRY_REASON, reason || '');
    data.append(config.ENTRY_DETAILS, comment);
    button.disabled = true;
    button.textContent = 'Sending…';
    notify('Sending your feedback…');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      await fetch(`https://docs.google.com/forms/d/e/${encodeURIComponent(config.FORM_ID)}/formResponse`, {
        method: 'POST', mode: 'no-cors', credentials: 'omit', body: data, signal: controller.signal,
      });
      // The response is opaque. It cannot confirm persistence; the release check verifies the form through its API.
      for (const element of form.elements) element.disabled = true;
      button.textContent = 'Thank you';
      notify('Thank you for your feedback.');
    } catch {
      button.disabled = false;
      button.textContent = 'Send feedback';
      notify('We could not confirm delivery. Your text is still here. Try again when your connection is stable.');
    } finally {
      clearTimeout(timeout);
    }
  });
}
