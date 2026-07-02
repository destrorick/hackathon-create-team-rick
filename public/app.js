const registerEl = document.getElementById('register');
const formEl = document.getElementById('risk-form');

function timeAgo(ts) {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function renderAssessments(items) {
  registerEl.innerHTML = items
    .map(
      (a) => `
        <div class="risk-card band-${a.band.toLowerCase()}">
          <div class="meta">
            <b>${a.assetName}</b> &middot; ${a.assetOwner} &middot; ${timeAgo(a.ts)}
            <span class="band">${a.band} (${a.score})</span>
          </div>
          <div class="tags">
            <span class="tag">${a.dataSensitivity}</span>
            <span class="tag">${a.internetFacing === 'Yes' ? 'internet-facing' : 'internal only'}</span>
            <span class="tag">${a.compliance}</span>
          </div>
          ${a.controls ? `<div class="controls"><b>Controls:</b> ${a.controls}</div>` : ''}
          ${a.notes ? `<div class="notes">${a.notes}</div>` : ''}
          ${a.assetUrl ? `<button class="btn small" data-check="${a.id}">Check asset URL</button><span class="check-result" id="check-${a.id}"></span>` : ''}
        </div>
      `
    )
    .join('');

  registerEl.querySelectorAll('[data-check]').forEach((btn) => {
    btn.addEventListener('click', () => checkUrl(btn.dataset.check));
  });
}

async function checkUrl(id) {
  const resultEl = document.getElementById(`check-${id}`);
  resultEl.textContent = ' checking...';
  try {
    const res = await fetch(`/api/assessments/${id}/check-url`);
    const data = await res.json();
    resultEl.textContent = data.status ? ` -> HTTP ${data.status}` : ` -> ${data.error}`;
  } catch (err) {
    resultEl.textContent = ' -> request failed';
  }
}

async function loadAssessments() {
  const res = await fetch('/api/assessments');
  const items = await res.json();
  renderAssessments(items);
}

formEl.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(formEl).entries());
  await fetch('/api/assessments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  formEl.reset();
  loadAssessments();
});

loadAssessments();
setInterval(loadAssessments, 5000);
