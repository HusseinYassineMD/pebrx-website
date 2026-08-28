export function initContactForm(): void {
  const form = document.getElementById('contact-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const firstName = String(data.get('firstName') ?? '').trim();
    const lastName = String(data.get('lastName') ?? '').trim();
    const email = String(data.get('email') ?? '').trim();
    const phone = String(data.get('phone') ?? '').trim();
    const message = String(data.get('message') ?? '').trim();

    if (!firstName || !lastName || !email || !message) {
      form.reportValidity();
      return;
    }

    const subject = encodeURIComponent(`PebRx Contact: ${firstName} ${lastName}`);
    const body = encodeURIComponent(
      `Name: ${firstName} ${lastName}\nEmail: ${email}\nPhone: ${phone}\n\nMessage:\n${message}`
    );

    window.location.href = `mailto:contact@pebrx.co?subject=${subject}&body=${body}`;
  });
}
