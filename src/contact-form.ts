const WEB3FORMS_URL = 'https://api.web3forms.com/submit';

type Web3FormsResponse = {
  success: boolean;
  message?: string;
};

function getAccessKey(): string {
  return (import.meta.env.VITE_WEB3FORMS_ACCESS_KEY ?? '').trim();
}

function setFormStatus(
  statusEl: HTMLElement | null,
  type: 'idle' | 'loading' | 'success' | 'error',
  message: string
): void {
  if (!statusEl) return;
  statusEl.hidden = type === 'idle';
  statusEl.className = `contact-form-status contact-form-status--${type}`;
  statusEl.textContent = message;
}

export function initContactForm(): void {
  const form = document.getElementById('contact-form') as HTMLFormElement | null;
  if (!form) return;

  const submitBtn = form.querySelector('.contact-submit') as HTMLButtonElement | null;
  const statusEl = document.getElementById('contact-form-status');
  const defaultBtnLabel = submitBtn?.textContent?.trim() ?? 'Send message';

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const accessKey = getAccessKey();
    if (!accessKey) {
      setFormStatus(
        statusEl,
        'error',
        'The contact form is not configured yet. Please email us at contact@pebrx.co.'
      );
      return;
    }

    const data = new FormData(form);
    const firstName = String(data.get('firstName') ?? '').trim();
    const lastName = String(data.get('lastName') ?? '').trim();
    const email = String(data.get('email') ?? '').trim();
    const phone = String(data.get('phone') ?? '').trim();
    const message = String(data.get('message') ?? '').trim();
    const botcheck = String(data.get('botcheck') ?? '').trim();

    if (botcheck) return;

    if (!firstName || !lastName || !email || !message) {
      form.reportValidity();
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
    }
    setFormStatus(statusEl, 'loading', 'Submitting your inquiry…');

    const payload = {
      access_key: accessKey,
      subject: `PebRx website: ${firstName} ${lastName}`,
      from_name: `${firstName} ${lastName}`,
      name: `${firstName} ${lastName}`,
      email,
      phone: phone || 'Not provided',
      message,
    };

    try {
      const response = await fetch(WEB3FORMS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as Web3FormsResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.message ?? 'Unable to send message.');
      }

      form.reset();
      setFormStatus(
        statusEl,
        'success',
        'Thank you for contacting PebRx. Your inquiry has been received, and our team will respond shortly.'
      );
    } catch {
      setFormStatus(
        statusEl,
        'error',
        'We were unable to submit your inquiry. Please try again or contact us at contact@pebrx.co.'
      );
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = defaultBtnLabel;
      }
    }
  });
}
