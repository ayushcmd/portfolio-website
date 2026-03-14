// ── CUSTOM CURSOR ────────────────────────────
const dot  = document.getElementById('cursor-dot');
const ring = document.getElementById('cursor-ring');

document.addEventListener('mousemove', e => {
  dot.style.left = e.clientX + 'px';
  dot.style.top  = e.clientY + 'px';

  // Ring follows with slight lag
  setTimeout(() => {
    ring.style.left = e.clientX + 'px';
    ring.style.top  = e.clientY + 'px';
  }, 60);
});

// Cursor scales on interactive elements
document.querySelectorAll('a, button').forEach(el => {
  el.addEventListener('mouseenter', () => {
    ring.style.width       = '50px';
    ring.style.height      = '50px';
    ring.style.borderColor = 'var(--amber)';
  });
  el.addEventListener('mouseleave', () => {
    ring.style.width  = '32px';
    ring.style.height = '32px';
  });
});


// ── SPA NAVIGATION ───────────────────────────
const navLinks = document.querySelectorAll('[data-section]');
const sections = document.querySelectorAll('.section');

function navigate(target) {
  sections.forEach(s => s.classList.toggle('active', s.id === target));
  navLinks.forEach(l => l.classList.toggle('active', l.dataset.section === target));
  // Close mobile sidebar on navigate
  document.getElementById('sidebar').classList.remove('open');
}

navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    navigate(link.dataset.section);
  });
});


// ── MOBILE HAMBURGER ─────────────────────────
document.getElementById('hamburger').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// ── CLOSE SIDEBAR ON OUTSIDE CLICK ──────────
document.addEventListener('click', (e) => {
  const sidebar   = document.getElementById('sidebar');
  const hamburger = document.getElementById('hamburger');
  if (sidebar.classList.contains('open') &&
      !sidebar.contains(e.target) &&
      !hamburger.contains(e.target)) {
    sidebar.classList.remove('open');
  }
});


// ── TYPEWRITER EFFECT ────────────────────────
const phrases = [
  "data visualization dashboards",
  "full-stack web interfaces",
  "machine learning experiments",
  "clean, readable code",
  "solutions that actually matter"
];

let phraseIndex  = 0;
let charIndex    = 0;
let isDeleting   = false;
const twEl       = document.getElementById('typewriter');

function typeLoop() {
  const current = phrases[phraseIndex];

  if (!isDeleting) {
    twEl.textContent = current.slice(0, ++charIndex);
    if (charIndex === current.length) {
      isDeleting = true;
      setTimeout(typeLoop, 1800); // pause at full phrase
      return;
    }
  } else {
    twEl.textContent = current.slice(0, --charIndex);
    if (charIndex === 0) {
      isDeleting    = false;
      phraseIndex   = (phraseIndex + 1) % phrases.length;
    }
  }

  setTimeout(typeLoop, isDeleting ? 40 : 70);
}



typeLoop();


// ── SKILLS TABS ──────────────────────────────
document.querySelectorAll('.skill-cat-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    // Deactivate all
    document.querySelectorAll('.skill-cat-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.skill-panel').forEach(p => p.classList.remove('active'));

    // Activate clicked
    btn.classList.add('active');
    document.getElementById('panel-' + btn.dataset.panel).classList.add('active');
  });
});

//enquiryform
// ── ENQUIRY FORM ─────────────────────────────
const enquiryToggle = document.getElementById('enquiry-toggle');
const enquiryForm   = document.getElementById('enquiry-form');
const enquiryClose  = document.getElementById('enquiry-close');
const enqSubmit     = document.getElementById('enq-submit');
const enqStatus     = document.getElementById('enq-status');

enquiryToggle.addEventListener('click', () => {
  enquiryForm.classList.toggle('open');
});

enquiryClose.addEventListener('click', () => {
  enquiryForm.classList.remove('open');
});

enqSubmit.addEventListener('click', async () => {
  const name  = document.getElementById('enq-name').value.trim();
  const email = document.getElementById('enq-email').value.trim();
  const msg   = document.getElementById('enq-msg').value.trim();

  if (!name || !email || !msg) {
    enqStatus.textContent = 'Please fill all fields.';
    enqStatus.className   = 'enquiry-status error';
    return;
  }

  enqSubmit.textContent = 'Sending…';
  enqSubmit.disabled    = true;

  try {
    const res = await fetch('https://formspree.io/f/mreyzbyr', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, email, message: msg })
    });

    if (res.ok) {
      enqStatus.textContent = '✓ Message sent!';
      enqStatus.className   = 'enquiry-status success';
      document.getElementById('enq-name').value  = '';
      document.getElementById('enq-email').value = '';
      document.getElementById('enq-msg').value   = '';
    } else {
      throw new Error();
    }
  } catch {
    enqStatus.textContent = '✗ Failed. Try again.';
    enqStatus.className   = 'enquiry-status error';
  }

  enqSubmit.textContent = 'Send ↗';
  enqSubmit.disabled    = false;
});

// ── SCROLL PROGRESS BAR ──────────────────────
const progressBar = document.getElementById('scroll-progress');
const mainEl = document.querySelector('.main');

function updateProgress() {
  const scrollTop = mainEl.scrollTop;
  const scrollHeight = mainEl.scrollHeight - mainEl.clientHeight;
  const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
  progressBar.style.width = pct + '%';
}

mainEl.addEventListener('scroll', updateProgress, { passive: true });
// Reset progress on section switch  
document.querySelectorAll('[data-section]').forEach(link => {
  link.addEventListener('click', () => setTimeout(updateProgress, 80));
});


// ── KEYBOARD NAVIGATION ──────────────────────
const sectionKeys = { '1': 'home', '2': 'about', '3': 'skills', '4': 'projects', '5': 'contact' };

document.addEventListener('keydown', e => {
  // Don't fire when typing in inputs
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (sectionKeys[e.key]) {
    navigate(sectionKeys[e.key]);
    // Flash the keyboard hint
    const hint = document.getElementById('keyboard-hint');
    if (hint) {
      hint.style.opacity = '1';
      hint.style.color = 'var(--amber)';
      setTimeout(() => {
        hint.style.opacity = '0.5';
        hint.style.color = '';
      }, 600);
    }
  }
});


// ── GITHUB ACTIVITY FEED ─────────────────────
async function loadGithubActivity() {
  const container = document.getElementById('gh-events');
  if (!container) return;

  try {
    const res = await fetch('https://api.github.com/users/ayushcmd/events/public?per_page=15');
    if (!res.ok) throw new Error('API error');
    const events = await res.json();

    const iconMap = {
      PushEvent: '↑',
      CreateEvent: '+',
      WatchEvent: '★',
      ForkEvent: '⑂',
      PullRequestEvent: '⤷',
      IssuesEvent: '!',
      DeleteEvent: '×',
    };

    const rendered = [];

    for (const ev of events) {
      if (rendered.length >= 5) break;

      let text = '';
      let icon = iconMap[ev.type] || '·';
      const repo = ev.repo.name.replace('ayushcmd/', '');

      if (ev.type === 'PushEvent') {
        const msg = ev.payload.commits?.[0]?.message?.split('\n')[0] || 'pushed commits';
        const count = ev.payload.size || 1;
        text = `pushed ${count} commit${count > 1 ? 's' : ''} to <strong>${repo}</strong> — ${msg.length > 52 ? msg.slice(0, 52) + '…' : msg}`;
      } else if (ev.type === 'CreateEvent') {
        const ref = ev.payload.ref || ev.payload.ref_type;
        text = `created ${ev.payload.ref_type} <strong>${ref || repo}</strong>${ev.payload.ref_type === 'repository' ? '' : ` in <strong>${repo}</strong>`}`;
      } else if (ev.type === 'WatchEvent') {
        text = `starred <strong>${repo}</strong>`;
      } else if (ev.type === 'ForkEvent') {
        text = `forked <strong>${repo}</strong>`;
      } else if (ev.type === 'PullRequestEvent') {
        text = `${ev.payload.action} PR in <strong>${repo}</strong>: ${(ev.payload.pull_request?.title || '').slice(0, 50)}`;
      } else {
        continue; // skip uninteresting event types
      }

      const date = new Date(ev.created_at);
      const ago = getRelativeTime(date);

      rendered.push({ icon, text, ago, repo });
    }

    if (rendered.length === 0) {
      container.innerHTML = '<div class="gh-error">No recent public activity.</div>';
      return;
    }

    container.innerHTML = rendered.map(ev => `
      <div class="gh-event">
        <span class="gh-event-icon">${ev.icon}</span>
        <div class="gh-event-body">
          <div class="gh-event-text">${ev.text}</div>
          <div class="gh-event-meta">${ev.ago}</div>
        </div>
      </div>
    `).join('');

  } catch (err) {
    document.getElementById('gh-events').innerHTML =
      '<div class="gh-error">Could not load activity — check back later.</div>';
  }
}

function getRelativeTime(date) {
  const diff = Math.floor((Date.now() - date) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// Load when page is ready
loadGithubActivity();