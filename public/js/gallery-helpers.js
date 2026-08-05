function checkImageExists(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

async function buildGallery(slug, maxCandidates) {
  const extensions = ['jpg', 'jpeg', 'png', 'webp'];
  const found = [];

  for (let i = 1; i <= maxCandidates; i++) {
    let matchedUrl = null;
    for (const ext of extensions) {
      const url = `/images/gallery/${slug}-${i}.${ext}`;
      const exists = await checkImageExists(url);
      if (exists) {
        matchedUrl = url;
        break;
      }
    }
    if (matchedUrl) found.push(matchedUrl);
  }

  return found;
}

const galleryState = {};

function renderGalleryFrame(propertyId) {
  const state = galleryState[propertyId];
  const img = document.getElementById(`gallery-img-${propertyId}`);
  if (img) img.src = state.images[state.index];

  const carousel = document.querySelector(`.gallery-carousel[data-gallery="${propertyId}"]`);
  if (carousel) {
    const showNav = state.images.length > 1;
    carousel.querySelectorAll('.gallery-nav').forEach((btn) => {
      btn.style.display = showNav ? 'flex' : 'none';
    });
  }
}

function wireGalleryNav(propertyId) {
  const prevBtn = document.querySelector(`.gallery-prev[data-target="${propertyId}"]`);
  const nextBtn = document.querySelector(`.gallery-next[data-target="${propertyId}"]`);

  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const state = galleryState[propertyId];
      state.index = (state.index - 1 + state.images.length) % state.images.length;
      renderGalleryFrame(propertyId);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const state = galleryState[propertyId];
      state.index = (state.index + 1) % state.images.length;
      renderGalleryFrame(propertyId);
    });
  }
}

function placeholderImage(label) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='640' height='360'><rect width='640' height='360' fill='%23EDF1F5'/><text x='320' y='185' font-family='monospace' font-size='16' fill='%236B7280' text-anchor='middle'>${label}</text></svg>`;
  return `data:image/svg+xml,${svg}`;
}

async function initGallery(propertyId, slug, label) {
  const images = await buildGallery(slug, 8);
  galleryState[propertyId] = {
    images: images.length > 0 ? images : [placeholderImage(label)],
    index: 0
  };
  renderGalleryFrame(propertyId);
  wireGalleryNav(propertyId);
}