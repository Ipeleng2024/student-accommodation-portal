function roomTypeOptionsMarkup(property) {
  return property.roomTypes
    .map(
      (t) => `
        <label class="room-type-option">
          <input type="radio" name="roomType" value="${t.id}" required />
          <span class="room-type-name">${t.name}</span>
          <span class="room-type-price">${formatMoney(t.priceMonthly)} / month</span>
        </label>`
    )
    .join('');
}

function bookingPanelMarkup(property) {
  const types = property.roomTypes || [];

  if (types.length === 0) {
    return `
      <div class="booking-panel" id="book-${property.id}">
        <h3>Book ${property.name} for 2027</h3>
        <p class="panel-sub">Room types and prices for ${property.name} are being finalised. Please <a href="/contact.html">contact us</a> to enquire or to book a viewing.</p>
      </div>`;
  }

  return `
    <div class="booking-panel" id="book-${property.id}">
      <h3>Book ${property.name} for 2027</h3>
      <p class="panel-sub">Choose a room type and send your details. We will confirm availability and next steps.</p>

      <form class="booking-form">
        <fieldset class="room-type-options">
          <legend>Room type</legend>

          ${roomTypeOptionsMarkup(property)}
        </fieldset>

        <div class="booking-fields">
          <input type="text" name="name" placeholder="Full name" required class="full" />
          <input type="email" name="email" placeholder="Email" required />
          <input type="tel" name="phone" placeholder="Phone" required />
          <textarea name="message" rows="3" placeholder="Anything else we should know? (optional)" class="full"></textarea>
        </div>

        <button type="submit" class="cta-button cta-button-lg">Book ${property.name} for 2027</button>
        <p class="form-status" role="status"></p>
      </form>
    </div>`;
}

function wireBookingForm(form, property) {
  const status = form.querySelector('.form-status');
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalLabel = submitBtn.textContent;

  function showStatus(text, isError) {
    status.textContent = text;
    status.style.color = isError ? 'var(--rust)' : '#1D4FB8';
    status.style.display = 'block';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.style.display = 'none';

    const data = new FormData(form);

    const roomTypeId = data.get('roomType');

    if (!roomTypeId) {
      showStatus('Please choose a room type.', true);
      return;
    }

    const payload = {
      kind: 'room',
      propertyId: property.id,
      roomTypeId: roomTypeId,
      name: data.get('name'),
      email: data.get('email'),
      phone: data.get('phone'),
      message: data.get('message')
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const body = await res.json().catch(() => ({}));

      if (res.ok) {
        form.reset();
        showStatus('Booking request received for 2027. We will be in touch to confirm availability and next steps.', false);
      } else {

        showStatus(body.error || 'Something went wrong. Please try again.', true);
      }
    } catch (err) {
      showStatus('Could not send your request. Check your connection and try again.', true);
    }

    submitBtn.disabled = false;
    submitBtn.textContent = originalLabel;
  });
}

function scrollToHash() {
  if (!window.location.hash) return;
  try {
    const target = document.querySelector(window.location.hash);
    if (target) target.scrollIntoView();
  } catch (err) {
    // ignore a malformed hash
  }
}

async function loadProperties() {
  const main = document.getElementById('properties');
  let data;

  try {
    const res = await fetch('/api/public/properties');
    data = await res.json();
  } catch (err) {
    main.innerHTML = '<p>Could not load the properties. Please refresh the page.</p>';
    return;
  }


  main.innerHTML = '';

  const fromEl = document.getElementById('from-price');
  const lowest = lowestPrice(data.properties);
  if (fromEl && lowest !== null) fromEl.textContent = formatMoney(lowest);

  for (const property of data.properties) {
    const propertyLowest = lowestPrice([property]);
    const fromLabel = propertyLowest !== null ? ' - from ' + formatMoney(propertyLowest) : '';

    const section = document.createElement('section');
    section.className = 'property';
    section.id = property.id;

    section.innerHTML = `
      <div class="property-head">
        <h2>${property.name}</h2>
        <span class="property-area">${property.area}${fromLabel}</span>
      </div>

      <div class="gallery-carousel" data-gallery="${property.id}">
        <img class="gallery-img" id="gallery-img-${property.id}" src="" alt="${property.name}" />
        <button class="gallery-nav gallery-prev" data-target="${property.id}" aria-label="Previous photo" style="display:none;">&#8592;</button>
        <button class="gallery-nav gallery-next" data-target="${property.id}" aria-label="Next photo" style="display:none;">&#8594;</button>
      </div>

      <p class="property-desc">${property.description}</p>

      <ul class="perks-list">
        ${property.amenities.map((a) => `<li class="perk-item"><span class="perk-icon">&#10003;</span>${a}</li>`).join('')}
      </ul>


      ${bookingPanelMarkup(property)}
    `;

    main.appendChild(section);

    const form = section.querySelector('.booking-form');
    if (form) wireBookingForm(form, property);
  }

  // The sections are built by script, so the browser cannot jump to a #link on its own
  scrollToHash();

  for (const property of data.properties) {
    await initGallery(property.id, property.gallerySlug || property.id, property.name);
  }
}

loadProperties();