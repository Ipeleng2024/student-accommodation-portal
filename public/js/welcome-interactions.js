const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  document.body.classList.add('js-anim');
}

// ===== Sticky header shadow on scroll =====
const header = document.querySelector('.site-header');
if (header) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 12) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

// ===== Scroll-reveal for sections/cards =====
if (!prefersReducedMotion && 'IntersectionObserver' in window) {
  const revealTargets = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealTargets.forEach((el) => observer.observe(el));
}

// ===== Count-up animation for live stats =====
function animateCount(el, target, duration) {
  if (prefersReducedMotion) {
    el.textContent = target;
    return;
  }
  const start = 0;
  const startTime = performance.now();

  function tick(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const value = Math.round(start + (target - start) * progress);
    el.textContent = value;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

async function loadStatsBanner() {
  const availableEl = document.getElementById('welcome-stat-available');
  const totalEl = document.getElementById('welcome-stat-total');
  if (!availableEl || !totalEl) return;

  try {
    const res = await fetch('/api/public/summary');
    const data = await res.json();
    animateCount(availableEl, data.availableRooms, 900);
    animateCount(totalEl, data.totalRooms, 900);
  } catch (err) {
    availableEl.textContent = '-';
    totalEl.textContent = '-';
  }
}

loadStatsBanner();

// ===== Subtle cursor parallax on hero blob =====
if (!prefersReducedMotion) {
  const hero = document.querySelector('.welcome-hero');
  const blob = document.querySelector('.hero-blob');

  if (hero && blob) {
    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width - 0.5;
      const relY = (e.clientY - rect.top) / rect.height - 0.5;
      blob.style.transform = `translate(${relX * 24}px, ${relY * 24}px)`;
    });

    hero.addEventListener('mouseleave', () => {
      blob.style.transform = 'translate(0, 0)';
    });
  }
}