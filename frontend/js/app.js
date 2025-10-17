import { login, isLoggedIn, logout } from './auth.js';
import {
  fetchExhibitions, fetchLinks,
  addExhibition, updateExhibition, deleteExhibition,
  addLink, updateLink, deleteLink,
  fetchCategories, fetchSubcategories, addCategory, updateCategory, deleteCategory,
  addSubcategory, updateSubcategory, deleteSubcategory,
  getBiography, saveBiography,
  listPaintings, uploadPaintings, deletePainting
} from './fetchData.js';

// -- Helper: normalize paged responses to a flat array --
function asList(resp){ return Array.isArray(resp) ? resp : (resp && Array.isArray(resp.items) ? resp.items : []); }

// --- Minimal modal to create a subcategory when none exists ---
function showQuickCreateSubModal(parentCatId, onCreated) {
  // Backdrop
  const overlay = document.createElement('div');
  overlay.id = 'quickSubModal';
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.background = 'rgba(0,0,0,0.45)';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = '9999';

  // Dialog
  const box = document.createElement('div');
  box.style.background = '#fff';
  box.style.borderRadius = '12px';
  box.style.width = 'min(520px, 92vw)';
  box.style.boxShadow = '0 10px 35px rgba(0,0,0,0.25)';
  box.style.padding = '20px';

  box.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
      <h3 style="margin:0;font-size:18px">Νέα υποκατηγορία</h3>
      <button id="qsClose" class="secondary" style="border:none;background:transparent;font-size:18px;cursor:pointer">✕</button>
    </div>
    <p style="margin:0 0 12px 0;color:#555">Δεν υπάρχουν υποκατηγορίες. Δημιούργησε μία για να συνεχίσεις.</p>
    <div style="display:flex;gap:10px">
      <input id="qsName" class="control" placeholder="Όνομα υποκατηγορίας" style="flex:1"/>
      <button id="qsCreate" class="button">Δημιουργία</button>
    </div>
  `;

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  const input = box.querySelector('#qsName');
  const btnCreate = box.querySelector('#qsCreate');
  const btnClose = box.querySelector('#qsClose');
  input.focus();

  // Tear down the modal
  function destroy(){ overlay.remove(); }
  btnClose.addEventListener('click', destroy);
  overlay.addEventListener('click', (e)=>{ if(e.target===overlay) destroy(); });

  // Create subcategory and refresh menus
  btnCreate.addEventListener('click', async ()=>{
    const name = (input.value||'').trim();
    if (!name) { input.focus(); return; }
    if (typeof isLoggedIn === 'function' && !isLoggedIn()) { alert('Απαιτείται σύνδεση για τη δημιουργία υποκατηγορίας.'); return; }
    try{
      const created = await addSubcategory(parentCatId, { name });
      destroy();
      if (typeof onCreated === 'function') onCreated(created);
      try { await loadAsideMenus(); } catch(_) {}
    }catch(err){
      alert('Αποτυχία δημιουργίας υποκατηγορίας.');
      console.error(err);
    }
  });
}

// Boot logic and UI wiring
document.addEventListener('DOMContentLoaded', () => {
  const loginFormContainer = document.getElementById('loginFormContainer');
  const loggedInContainer = document.getElementById('loggedInContainer');
  const managementMenu = document.getElementById('managementMenu');

  // Dynamically add management entries (prepend keeps them at the top)
  const manageCategoriesBtn = document.createElement('a');
  manageCategoriesBtn.href = '#';
  manageCategoriesBtn.id = 'manageCategories';
  manageCategoriesBtn.className = 'management-option';
  manageCategoriesBtn.innerHTML = '<div class="management-card"><h3>Κατηγορίες</h3></div>';

  const manageBiographyBtn = document.createElement('a');
  manageBiographyBtn.href = '#';
  manageBiographyBtn.id = 'manageBiography';
  manageBiographyBtn.className = 'management-option';
  manageBiographyBtn.innerHTML = '<div class="management-card"><h3>Βιογραφία</h3></div>';

  const managePaintingsBtn = document.createElement('a');
  managePaintingsBtn.href = '#';
  managePaintingsBtn.id = 'managePaintings';
  managePaintingsBtn.className = 'management-option';
  managePaintingsBtn.innerHTML = '<div class="management-card"><h3>Πίνακες</h3></div>';

  // Prepend new options before existing ones
  const optionsContainer = document.querySelector('.management-options-container');
  optionsContainer.prepend(document.getElementById('manageLinks'));
  optionsContainer.prepend(document.getElementById('manageExhibitions'));
  optionsContainer.prepend(managePaintingsBtn);
  optionsContainer.prepend(manageBiographyBtn);
  optionsContainer.prepend(manageCategoriesBtn);
    

  // Check auth state on load and toggle management section
  if (isLoggedIn()) {
    loginFormContainer.classList.add('hidden');
    loggedInContainer.classList.remove('hidden');
    managementMenu.classList.add('visible');
  
      try { localStorage.setItem('activeSection','biography'); } catch(_) {}
      const bioLink = document.querySelector('nav a[data-section="biography"]');
      if (bioLink) bioLink.click();
} else {
    loginFormContainer.classList.remove('hidden');
    loggedInContainer.classList.add('hidden');
    managementMenu.classList.remove('visible');
  }

  // Handle login submit
  const loginForm = document.getElementById('loginForm');
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const success = await login(username, password);
    if (success) {
      loginFormContainer.classList.add('hidden');
      loggedInContainer.classList.remove('hidden');
      managementMenu.classList.add('visible');
    }
  });

  // Handle logout
  const logoutButton = document.getElementById('logoutButton');
  logoutButton.addEventListener('click', () => {
  await logout(); // clean server-side cookies
  try { localStorage.setItem('activeSection','biography'); } catch(_) {}
  const bioLink = document.querySelector('nav a[data-section="biography"]');
  if (bioLink) bioLink.click();
  loginFormContainer.classList.remove('hidden');
  loggedInContainer.classList.add('hidden');
  managementMenu.classList.remove('visible');
  });

  // Top nav: swap main/aside sections based on selected tab
  const navLinks = document.querySelectorAll('nav a');
  const asideSections = document.querySelectorAll('aside > div');
  const mainContent = document.getElementById('content');

  navLinks.forEach(link => { link.addEventListener('click', event => { event.preventDefault(); const a = event.currentTarget; const section = a.dataset.section; navLinks.forEach(l=>l.classList.remove('active')); a.classList.add('active');
      try { localStorage.setItem('activeSection', section); } catch(_) {}

      // Show corresponding aside panel
      asideSections.forEach(aside => aside.classList.add('hidden'));
      const asideToShow = document.getElementById(`aside-${section}`);
      if (asideToShow) asideToShow.classList.remove('hidden');

      // Update main content scaffold
      switch (section) {
        case 'biography':
          mainContent.innerHTML = '<p>Επιλέξτε κατηγορία βιογραφίας απο το πλευρικό μενού.</p>';
          break;
        case 'paintings':
          mainContent.innerHTML = '<p>Επιλέξτε κατηγορία πίνακα από το πλευρικό μενού.</p>';
          break;
        case 'exhibitions':
          mainContent.innerHTML = '<p>Επιλέξτε κατηγορία εκθέσεων από το πλευρικό μενού.</p>';
          break;
        case 'links':
          mainContent.innerHTML = '<p>Επιλέξτε κατηγορία συνδέσμων από το πλευρικό μενού.</p>';
          break;
        case 'management':
          if (isLoggedIn()) {
            mainContent.innerHTML = '<p>Επιλέξτε ενέργεια από το μενού διαχείρισης.</p>';
          } else {
            mainContent.innerHTML = '<p>Παρακαλώ συνδεθείτε για πρόσβαση στη διαχείριση.</p>';
          }
          break;
        default:
          mainContent.innerHTML = '<p>Καλώς ήρθατε στην εφαρμογή.</p>';
      }
    });
  });

  // Aside category navigation (biography/paintings custom previews)
  const asideLinks = document.querySelectorAll('aside a');
  asideLinks.forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      const category = event.target.dataset.category;
      const section = event.target.closest('div').id.replace('aside-', '');

      // Render simple gallery/previews for predefined sections
      if (section === 'biography') {
        mainContent.innerHTML = biographyContent[category] || '<p>Το περιεχόμενο δεν είναι διαθέσιμο.</p>';
      } else if (section === 'paintings') {
        let content = '';
        mainContent.innerHTML = content;
      }
    });
  });

  // Aside: fetch and render dynamic collections (exhibitions/links)
  document.querySelectorAll('aside a[data-category]').forEach(link => {
    link.addEventListener('click', async (event) => {
      event.preventDefault();
      const category = event.target.dataset.category;
      const section = event.target.closest('div').id.replace('aside-', '');

      if (section === 'exhibitions') {
        await loadExhibitionsByCategory(category);
      } else if (section === 'links') {
        await loadLinksByCategory(category);
      }
    });
  });

  // Admin entries
  const manageExhibitions = document.getElementById('manageExhibitions');
  manageExhibitions.addEventListener('click', async (e) => { e.preventDefault(); await renderExhibitionsAdmin(); });

  const manageLinks = document.getElementById('manageLinks');
  manageLinks.addEventListener('click', async (e) => { e.preventDefault(); await renderLinksAdmin(); });

  // Startup: populate sidebars and open last active section
  (async () => {
    try { await loadAsideMenus(); } catch (e) { console.error('Failed to load aside menus on startup', e); }
    let target = null;
    try { target = localStorage.getItem('activeSection'); } catch(_) {}
    if (!target) target = isLoggedIn() ? 'management' : 'biography';
    const defaultLink = document.querySelector(`nav a[data-section="${target}"]`);
    if (defaultLink) defaultLink.click();
  })();

});

// ---- Legacy list renderers kept for compatibility ----
async function loadExhibitions() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/exhibitions', {
      headers: {
        'Authorization': token
      }
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const exhibitions = await response.json();
    const list = document.getElementById('exhibitionsList');
    list.innerHTML = exhibitions.map(ex => `
      <div class="item">
        <p>${ex.title} - ${ex.date} (${ex.location}) - ${ex.category}</p>
        <div class="manage-buttons">
          <button class="edit-button" onclick="editExhibition('${ex._id}', '${ex.title}', '${ex.date}', '${ex.location}', '${ex.category}')">
            Επεξεργασία
          </button>
          <button class="delete-button" onclick="deleteExhibition('${ex._id}')">
            Διαγραφή
          </button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading exhibitions:', error);
    document.getElementById('exhibitionsList').innerHTML = 
      '<p>Σφάλμα κατά τη φόρτωση των εκθέσεων. Παρακαλώ προσπαθήστε ξανά.</p>';
  }
}

async function loadLinks() {
  try {
    const response = await fetch('/api/links');
    const links = await response.json();
    const list = document.getElementById('linksList');
    list.innerHTML = links.map(link => `
      <div class="item">
        <p><a href="${link.url}" target="_blank">${link.description}</a> (${link.category})</p>
        <div class="manage-buttons">
          <button class="edit-button" onclick="editLink('${link._id}', '${link.url}', '${link.description}', '${link.category}')">
            Επεξεργασία
          </button>
          <button class="delete-button" onclick="deleteLink('${link._id}')">
            Διαγραφή
          </button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading links:', error);
    document.getElementById('linksList').innerHTML = 
      '<p>Σφάλμα κατά τη φόρτωση των συνδέσμων. Παρακαλώ προσπαθήστε ξανά.</p>';
  }
}

// Inline editors for legacy views
window.editExhibition = function(id, title, date, location, category) {
  document.getElementById('exhibitionId').value = id;
  document.getElementById('title').value = title;
  document.getElementById('date').value = date;
  document.getElementById('location').value = location;
  document.getElementById('category').value = category;
};

window.editLink = function(id, url, description, category) {
  document.getElementById('linkId').value = id;
  document.getElementById('url').value = url;
  document.getElementById('description').value = description;
  document.getElementById('category').value = category;
};

// Delete handlers for legacy views
window.deleteExhibition = async function(id) {
  if (confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την έκθεση;')) {
    try {
      await deleteExhibition(id);
      loadExhibitions();
      alert('Η έκθεση διαγράφηκε επιτυχώς!');
    } catch (error) {
      alert('Σφάλμα κατά τη διαγραφή της έκθεσης. Παρακαλώ προσπαθήστε ξανά.');
    }
  }
};

window.deleteLink = async function(id) {
  if (confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το σύνδεσμο;')) {
    try {
      await deleteLink(id);
      await loadLinks();
      alert('Ο σύνδεσμος διαγράφηκε επιτυχώς!');
    } catch (error) {
      console.error('Error:', error);
      alert('Σφάλμα κατά τη διαγραφή του συνδέσμου. Παρακαλώ προσπαθήστε ξανά.');
    }
  }
};

// Public rendering by selected subcategory (from sidebar)
async function loadExhibitionsByCategory(category) {
  try {
    const response = await fetch('/api/exhibitions');
    const exhibitions = await response.json();
    const filteredExhibitions = exhibitions.filter(ex => ex.category === category);
    
    const mainContent = document.getElementById('content');
    mainContent.innerHTML = `
      <h2>${category}</h2>
      <div id="exhibitionsList">
        ${filteredExhibitions.map(ex => `
          <div class="exhibition-item">
            <h3>${ex.title}</h3>
            <p>Ημερομηνία: ${ex.date}</p>
            <p>Τοποθεσία: ${ex.location}</p>
          </div>
        `).join('')}
      </div>
    `;
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('content').innerHTML = 
      '<p>Σφάλμα κατά τη φόρτωση των εκθέσεων.</p>';
  }
}

async function loadLinksByCategory(category) {
  try {
    const response = await fetch('/api/links');
    const links = await response.json();
    const filteredLinks = links.filter(link => link.category === category);
    
    const mainContent = document.getElementById('content');
    mainContent.innerHTML = `
      <h2>${category}</h2>
      <div id="linksList">
        ${filteredLinks.map(link => `
          <div class="link-item">
            <h3>${link.description}</h3>
            <p><a href="${link.url}" target="_blank">${link.url}</a></p>
          </div>
        `).join('')}
      </div>
    `;
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('content').innerHTML = 
      '<p>Σφάλμα κατά τη φόρτωση των συνδέσμων.</p>';
  }
}


// --- Admin/public render orchestrators ---



// High-level delegation for management tiles
document.addEventListener('click', (e) => {
  const catEl = e.target.closest('a#manageCategories');
  if (catEl) { e.preventDefault(); renderCategoriesAdmin(); return; }
  const bioEl = e.target.closest('a#manageBiography');
  if (bioEl) { e.preventDefault(); renderBiographyAdmin(); return; }
  const paintEl = e.target.closest('a#managePaintings');
  if (paintEl) { e.preventDefault(); renderPaintingsAdmin(); return; }
});


// NOTE: Only subcategories are managed here; categories are fixed (e.g., Biography, Paintings)


/**
 * Load sidebar menus for all four top-level categories and bind click handlers.
 * Builds lists from server-side subcategories; falls back to informative placeholders.
 */
async function loadAsideMenus() {
  try {
    const cats = await fetchCategories();
    const getByKey = k => cats.find(c => c.key === k);

    const catBio  = getByKey('biography');
    const catPaint= getByKey('paintings');
    const catExh  = getByKey('exhibitions');
    const catLink = getByKey('links');

    const bioList = document.getElementById('bioList');
    if (bioList) {
      if (catBio) {
        const subs = await fetchSubcategories(catBio._id);
        bioList.innerHTML = subs.length
          ? subs.map(s => `<li><a href="#" data-category="${s.key}">${s.name}</a></li>`).join('')
          : '<li><em>Δεν υπάρχουν υποκατηγορίες</em></li>';
      } else { bioList.innerHTML = '<li><em>Δεν υπάρχει κατηγορία Βιογραφία</em></li>'; }
    }

    const paintList = document.getElementById('paintList');
    if (paintList) {
      if (catPaint) {
        const subs = await fetchSubcategories(catPaint._id);
        paintList.innerHTML = subs.length
          ? subs.map(s => `<li><a href="#" data-category="${s.key}">${s.name}</a></li>`).join('')
          : '<li><em>Δεν υπάρχουν υποκατηγορίες</em></li>';
      } else { paintList.innerHTML = '<li><em>Δεν υπάρχει κατηγορία Πίνακες</em></li>'; }
    }

    const exhList = document.getElementById('exhList');
    if (exhList) {
      if (catExh) {
        const subs = await fetchSubcategories(catExh._id);
        exhList.innerHTML = subs.length
          ? subs.map(s => `<li><a href="#" data-category="${s.key||s.name}">${s.name}</a></li>`).join('')
          : '<li><em>Δεν υπάρχουν υποκατηγορίες</em></li>';
      } else { exhList.innerHTML = '<li><em>Δεν υπάρχει κατηγορία Εκθέσεις</em></li>'; }
    }

    const linkList = document.getElementById('linkList');
    if (linkList) {
      if (catLink) {
        const subs = await fetchSubcategories(catLink._id);
        linkList.innerHTML = subs.length
          ? subs.map(s => `<li><a href="#" data-category="${s.key||s.name}">${s.name}</a></li>`).join('')
          : '<li><em>Δεν υπάρχουν υποκατηγορίες</em></li>';
      } else { linkList.innerHTML = '<li><em>Δεν υπάρχει κατηγορία Συνδέσμοι</em></li>'; }
    }
    bindSidebarClicksOnce();
  } catch (err) {
    console.error('loadAsideMenus error', err);
  }
}

/**
 * Resolve a subcategory by human-friendly token: prefer key, then case-insensitive name.
 * Returns the matched subcategory document or null.
 */
async function resolveSubcategory(catKey, token) {
  const cats = await fetchCategories();
  const cat = cats.find(c => c.key === catKey);
  if (!cat) return null;
  const subs = await fetchSubcategories(cat._id);
  // Try key match first, then case-insensitive name match
  let sub = subs.find(s => s.key === token);
  if (!sub) sub = subs.find(s => (s.name || '').toLowerCase() === (token||'').toLowerCase());
  return sub || null;
}

/**
 * Public renderer for Biography section (HTML or plain text with minimal paragraphing).
 */
async function renderBiographyPublic(token) {
  const sub = await resolveSubcategory('biography', token);
  const content = document.getElementById('content');
  if (!sub) { content.innerHTML = '<div class="card"><p>Δεν βρέθηκε η ενότητα.</p></div>'; return; }
  const data = await getBiography(sub._id);

  // Accept either HTML or plain text; minimally escape plain text and paragraph it
  function renderFromPlain(rawText){
    const norm = String(rawText || '').replace(/\r\n/g, '\n');                // normalize CRLF
    // If it already looks like HTML, return as-is
    const looksLikeHtml = /<\s*(p|br|ul|ol|li|strong|em|h\d)\b/i.test(norm);
    if (looksLikeHtml) return norm;
    const esc = norm.replace(/[&<>]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[s]));
    // Preserve blank lines as paragraph breaks
    const paragraphs = esc.split(/\n{2,}/).map(part => part.replace(/\n/g,'<br>'));
    return paragraphs.map(p => `<p>${p}</p>`).join('');
  }

  let inner = '';
  if (data && typeof data.contentHtml === 'string') {
    // If contentHtml has no tags, treat it as plain text
    const hasTags = /<\s*\w+[^>]*>/.test(data.contentHtml);
    inner = hasTags ? data.contentHtml : renderFromPlain(data.contentHtml);
  } else if (data && (data.content || data.text)) {
    inner = renderFromPlain(data.content || data.text);
  }

  content.innerHTML = inner
    ? `<div class="card bio-card"><div class="headline"><h2>${sub.name}</h2></div><div class="prose">${inner}</div></div>`
    : `<div class="card bio-card"><div class="headline"><h2>${sub.name}</h2></div><p>Δεν υπάρχει περιεχόμενο ακόμη.</p></div>`;
}

/**
 * Public renderer for Paintings section with incremental "Load more".
 */
async function renderPaintingsPublic(token) {
  const sub = await resolveSubcategory('paintings', token);
  const content = document.getElementById('content');
  if (!sub) { content.innerHTML = '<div class="card"><p>Δεν βρέθηκε η ενότητα.</p></div>'; return; }
  const resp = await listPaintings(sub._id);
  const items = asList(resp);
  content.innerHTML = `<div class="card"><div class="headline"><h2>${sub.name}</h2></div><div id="gallery" class="gallery"></div></div>`;
  const gal = document.getElementById('gallery');
  gal.innerHTML = items.length
    ? items.map(i => `
      <figure>
        <div class="media">
          <img src="${i.dataUrl}" alt="${(i.description||i.title||'').replace(/`/g,'´')}" loading="lazy" />
        </div>
        <figcaption title="${(i.description||i.title||'').replace(/`/g,'´')}">
          ${i.description||i.title||""}
        </figcaption>
      </figure>`).join('')
    : '<p>Δεν υπάρχουν εικόνες ακόμη.</p>';

  // Progressive loading for public gallery
  (async () => {
    let pg = (resp.page ?? 0);
    const L = 12;
    const wrap = document.createElement('div');
    wrap.className = 'gallery-loadmore';
    wrap.style.marginTop = '12px';
    if (resp && resp.hasMore) {
      const more = document.createElement('button');
      more.className = 'button admin-button';
      more.textContent = 'Εμφάνιση περισσότερων';
      wrap.appendChild(more);
      gal.parentElement.appendChild(wrap);
      more.addEventListener('click', async () => {
        const nxt = await listPaintings(sub._id, pg + 1, L);
        const moreItems = asList(nxt);
        gal.insertAdjacentHTML('beforeend', moreItems.map(i => `
          <figure>
            <div class="media">
              <img src="${i.dataUrl}" alt="${(i.description||i.title||'').replace(/`/g,'´')}" loading="lazy" />
            </div>
            <figcaption title="${(i.description||i.title||'').replace(/`/g,'´')}">
              ${i.description||i.title||""}
            </figcaption>
          </figure>`).join(''));
        pg = nxt.page ?? (pg + 1);
        if (!nxt.hasMore) wrap.remove();
      });
    }
  })();

}

/**
 * Public renderer for Exhibitions section (list layout, supports paging).
 */
async function renderExhibitionsPublic(token) {
  const sub = await resolveSubcategory('exhibitions', token);
  const content = document.getElementById('content');
  const subId = sub && sub._id ? sub._id : undefined;
  const exResp = await fetchExhibitions(subId);
  const filtered = asList(exResp);
  content.innerHTML = `<div class="card"><div class="headline"><h2>${sub ? sub.name : 'Εκθέσεις'}</h2></div><ul class="exhibitions-list"></ul></div>`;
  const ul = document.querySelector('.exhibitions-list');
  if (!filtered.length) { ul.innerHTML = '<li>Δεν υπάρχουν εγγραφές ακόμη.</li>'; return; }
  const parts = [];
  filtered.forEach(e => {
    const title = (e.title || '').replace(/`/g,'´');
    const date  = e.date ? String(e.date) : '';
    const loc   = e.location ? String(e.location) : '';
    const cat   = e.category ? String(e.category) : '';
    const desc  = e.description ? String(e.description) : '';
    parts.push(
      `<li class="exh-item">
        <div class="exh-header">
          <div class="exh-title">${title}</div>
          ${date ? `<span class="badge">${date}</span>` : ''}
        </div>
        <div class="exh-meta">
          ${loc ? `<span>📍 ${loc}</span>` : ''}
          ${cat ? `<span>🏷️ ${cat}</span>` : ''}
        </div>
        ${desc ? `<p class="exh-desc">${desc}</p>` : ''}
      </li>`
    );
  });
  ul.innerHTML = parts.join('');
}

/**
 * Public renderer for Links section (list layout, supports paging).
 */
async function renderLinksPublic(token) {
  const sub = await resolveSubcategory('links', token);
  const content = document.getElementById('content');
  const subId = sub && sub._id ? sub._id : undefined;
  const lnResp = await fetchLinks(subId);
  const filtered = asList(lnResp);
  content.innerHTML = `<div class="card"><div class="headline"><h2>${sub ? sub.name : 'Σύνδεσμοι'}</h2></div><ul class="links-list"></ul></div>`;
  const ul = document.querySelector('.links-list');
  if (!filtered.length) { ul.innerHTML = '<li>Δεν υπάρχουν σύνδεσμοι ακόμη.</li>'; return; }
  const parts = [];
  filtered.forEach(l => {
    const url = l.url || '#';
    let host = '';
    try{ host = new URL(url).hostname.replace(/^www\./,''); }catch(e){}
    const title = (l.title || '').trim() || host || 'Σύνδεσμος';
    parts.push(
      `<li class="link-item">
         <div class="link-header">
           <div class="link-title"><a href="${url}" target="_blank" rel="noopener">🔗 ${title}</a></div>
         </div>
         ${host ? `<div class="link-host">🌐 ${host}</div>` : ''}
       </li>`
    );
  });
  ul.innerHTML = parts.join('');
}

/**
 * Bind a single click delegation for all sidebar lists (idempotent).
 * Highlights active link and routes to the proper renderer.
 */
function bindSidebarClicksOnce() {
  if (window.__sidebarBound) return;
  window.__sidebarBound = true;
  document.addEventListener('click', async (e) => { const a = e.target.closest('#bioList a, #paintList a, #exhList a, #linkList a'); if (!a) return; e.preventDefault(); document.querySelectorAll('#bioList a, #paintList a, #exhList a, #linkList a').forEach(x=>x.classList.remove('active')); a.classList.add('active');
    const token = a.getAttribute('data-category');
    if (a.closest('#bioList')) return renderBiographyPublic(token);
    if (a.closest('#paintList')) return renderPaintingsPublic(token);
    if (a.closest('#exhList')) return renderExhibitionsPublic(token);
    if (a.closest('#linkList')) return renderLinksPublic(token);
  });
}


// --- Admin: Subcategories CRUD table ---
async function renderCategoriesAdmin() {
  const content = document.getElementById('content');
  content.innerHTML = `<div class="card">
    <div class="headline"><h2>Διαχείριση Υποκατηγοριών</h2></div>

    <div class="admin-form">
      <div class="form-grid">
        <div class="form-row wide">
          <label>Κατηγορία</label>
          <select id="catSel" class="control"></select>
        </div>
        <div class="form-row wide">
          <label>Νέα υποκατηγορία:</label>
          <input id="newSubName" class="control" placeholder="Όνομα" />
        </div>
        <div class="form-row wide">
          <button id="saveSubBtn" class="button">Αποθήκευση</button>
        </div>
      </div>
    </div>

    <hr/>

    <div class="table-wrap">
      <table class="table">
        <thead><tr><th>Όνομα</th><th style="width:220px">Ενέργειες</th></tr></thead>
        <tbody id="subsTable"><tr><td colspan="2">Φόρτωση...</td></tr></tbody>
      </table>
    </div>
  </div>`;

  const ALL = await fetchCategories();
  const ALLOWED_KEYS = ['biography','paintings','exhibitions','links'];
  const titleMap = { biography:'Βιογραφία', paintings:'Πίνακες', exhibitions:'Εκθέσεις', links:'Σύνδεσμοι' };
  const cats = ALL.filter(c => ALLOWED_KEYS.includes(c.key));
  const catSel = document.getElementById('catSel');
  catSel.innerHTML = cats.map(c => `<option value="${c._id}">${titleMap[c.key]||c.name}</option>`).join('');

  const subsTable = document.getElementById('subsTable');
  const nameInput = document.getElementById('newSubName');
  const saveBtn = document.getElementById('saveSubBtn');
  let editId = null;

  // Fetch and render subcategories for the selected category
  async function loadSubs() {
    const subs = await fetchSubcategories(catSel.value);
    subsTable.innerHTML = subs.length ? subs.map(s => `
      <tr data-id="${s._id}">
        <td>${s.name}</td>
        <td class="actions-cell">
          <button class="edit">Επεξεργασία</button>
          <span class="spacer"></span>
          <button class="danger delete">Διαγραφή</button>
        </td>
      </tr>`).join('') : `<tr><td colspan="2">Δεν υπάρχουν υποκατηγορίες.</td></tr>`;
  }
  catSel.addEventListener('change', async ()=>{ editId=null; nameInput.value=''; await loadSubs(); await loadAsideMenus(); });
  await loadSubs();

  // Create/update subcategory
  saveBtn.addEventListener('click', async () => { if (typeof isLoggedIn==='function' && !isLoggedIn()) { alert('Απαιτείται σύνδεση.'); return; } if (typeof isLoggedIn==='function' && !isLoggedIn()) { alert('Απαιτείται σύνδεση.'); return; }
    const name = nameInput.value.trim();
    if (!name) return alert('Συμπλήρωσε όνομα.');
    if (editId) { await updateSubcategory(editId, { name }); }
    else { await addSubcategory(catSel.value, { name }); }
    nameInput.value=''; editId=null;
    await loadSubs(); await loadAsideMenus();
  });

  // Inline edit/delete
  subsTable.addEventListener('click', async (e) => {
    const tr = e.target.closest('tr[data-id]'); if (!tr) return;
    const id = tr.getAttribute('data-id');
    if (e.target.classList.contains('edit')) {
      nameInput.value = tr.children[0].textContent.trim();
      nameInput.focus();
      editId = id;
    }
    if (e.target.classList.contains('delete')) {
      if (!confirm('Διαγραφή;')) return;
      await deleteSubcategory(id);
      if (editId === id){ editId=null; nameInput.value=''; }
      await loadSubs(); await loadAsideMenus();
    }
  });
}

// --- Admin: Biography content editor ---
async function renderBiographyAdmin() {
  const content = document.getElementById('content');
  content.innerHTML = `<div class="card">
    <div class="headline"><h2>Διαχείριση Βιογραφίας</h2></div>

    <div class="admin-form">
      <div class="form-grid">
        <div class="form-row wide">
          <label>Υποκατηγορία</label>
          <select id="bioSubSel" class="control"></select>
        </div>
      </div>
    </div>

    <div class="form-grid">
      <div class="form-row wide">
        <label>Κείμενο</label>
        <textarea id="bioEditor" class="control" placeholder="Γράψε εδώ το κείμενο (HTML επιτρέπεται)"></textarea>
      </div>
      <div class="form-row wide" style="display:flex;justify-content:flex-end;">
        <button id="bioSaveBtn" class="button">Αποθήκευση</button>
      </div>
    </div>
  </div>`;

  const cats = await fetchCategories();
  const cat = cats.find(c => c.key === 'biography');
  const subSel = document.getElementById('bioSubSel');
  if (!cat) { subSel.innerHTML = `<option>Δεν υπάρχει κατηγορία Βιογραφίας</option>`; return; }
  const subs = await fetchSubcategories(cat._id);
  subSel.innerHTML = subs.length ? subs.map(s => `<option value="${s._id}">${s.name}</option>`).join('') : `<option value="" disabled selected>— καμία —</option>`;

  // If no subcategories, prompt for quick creation and focus editor once created
  if (!subs.length) {
    showQuickCreateSubModal(cat._id, async (created) => {
      if (created && created._id) {
        subSel.innerHTML = `<option value="${created._id}">${created.name}</option>`;
        subSel.value = created._id;
        const ev = new Event('change'); subSel.dispatchEvent(ev); if (typeof loadBio==='function') await loadBio();
      }
    });
  }

  const editor = document.getElementById('bioEditor');
  const saveBtn = document.getElementById('bioSaveBtn');
  function setBioEnabled(on){ if(editor) editor.disabled = !on; if(saveBtn) saveBtn.disabled = !on; }
  setBioEnabled(!!subSel.value);

  subSel.addEventListener('change', () => { setBioEnabled(!!subSel.value); });

  // Load current biography content for selected subcategory
  async function loadBio() {
    if (!subSel || !subSel.value) { editor.value = ''; return; }
    const doc = await getBiography(subSel.value);
    editor.value = (doc && doc.contentHtml) ? doc.contentHtml : '';
  }
  subSel.addEventListener('change', loadBio);
  await loadBio();

  // Persist biography content
  document.getElementById('bioSaveBtn').addEventListener('click', async () => {
    await saveBiography(subSel.value, editor.value);
    alert('Αποθηκεύτηκε.');
  });
}

// --- Admin: Paintings gallery + uploads ---
async function renderPaintingsAdmin() {
  const content = document.getElementById('content');
  content.innerHTML = `<div class="card">
    <div class="headline"><h2>Διαχείριση Πινάκων</h2></div>

    <div class="admin-form">
      <div class="form-grid">
        <div class="form-row wide">
          <label>Υποκατηγορία</label>
          <select id="paintSubSel" class="control"></select>
        </div>
        <div class="form-row wide">
          <label>Νέα εικόνα:</label>
          <input type="file" id="paintFiles" class="control" multiple accept="image/*"/>
        </div>
        <div class="form-row wide" id="paintDescRow" style="display:none">
          <label>Περιγραφή για κάθε εικόνα:</label>
          <div id="paintDescList" class="desc-list"></div>
        </div>
        <div class="form-row wide">
          <button id="paintUploadBtn" class="button">Μεταφόρτωση</button>
        </div>
      </div>
    </div>
    <hr>
    <div class="form-grid">
      <div class="form-row wide">
        <div class="gallery" id="paintGallery"></div>
      </div>
    </div>
  </div>`;

  const cats = await fetchCategories();
  const cat = cats.find(c => c.key === 'paintings');
  const subSel = document.getElementById('paintSubSel');
  if (!cat) { subSel.innerHTML = `<option>Δεν υπάρχει κατηγορία Πίνακες</option>`; return; }
  const subs = await fetchSubcategories(cat._id);
  subSel.innerHTML = subs.length ? subs.map(s => `<option value="${s._id}">${s.name}</option>`).join('') : `<option value="" disabled selected>— καμία —</option>`;

  // If no subcategories, prompt quick creation so uploads can proceed
  if (!subs.length) {
    showQuickCreateSubModal(cat._id, async (created) => {
      if (created && created._id) {
        subSel.innerHTML = `<option value="${created._id}">${created.name}</option>`;
        subSel.value = created._id;
        const ev = new Event('change'); subSel.dispatchEvent(ev); if (typeof loadGallery==='function') await loadGallery(); await buildLoadMore();
      }
    });
  }

  const gal = document.getElementById('paintGallery');
  const filesEl = document.getElementById('paintFiles');
  const uploadBtn = document.getElementById('paintUploadBtn');
  const descList = document.getElementById('paintDescList');
  const descRow = document.getElementById('paintDescRow');

  // Render one description input per selected file (optional)
  function renderDescInputs(files){
    if (descRow) descRow.style.display = (files && files.length) ? '' : 'none';
    if(!files || !files.length){ descList.innerHTML = ''; return; }
    const rows = [];
    for(let i=0;i<files.length;i++){
      const f = files[i];
      rows.push(`<div class="desc-row"><label class="desc-label">${f.name}</label><textarea class="control paint-desc" data-idx="${i}" placeholder="Περιγραφή (προαιρετικό)"></textarea></div>`);
    }
    descList.innerHTML = rows.join('');
  }
  if (filesEl) filesEl.addEventListener('change', ()=>{ renderDescInputs(filesEl.files); });

  // Enable/disable controls depending on subcategory presence
  function setPaintEnabled(on){ if(filesEl) filesEl.disabled = !on; if(uploadBtn) uploadBtn.disabled = !on; }
  setPaintEnabled(!!subSel.value);
  subSel.addEventListener('change', () => { setPaintEnabled(!!subSel.value); });

  // Load initial gallery for selected subcategory
  async function loadGallery(){ 
    if (!subSel || !subSel.value) { gal.innerHTML = '<p>Δεν υπάρχουν υποκατηγορίες.</p>'; return; }
    const first = await listPaintings(subSel.value);
    const items = asList(first);
    gal.innerHTML = items.length ? items.map(i => `
      <figure data-id="${i._id}">
        <button class="danger del" title="Διαγραφή">Διαγραφή</button>
        <div class="media">
          <img src="${i.dataUrl}" alt="${i.description||i.title||''}" />
        </div>
        <figcaption title="${i.description||i.title||''}">
          ${i.description||i.title||''}
          <button class="danger del" style="float:right;margin-left:.5rem;">Διαγραφή</button>
        </figcaption>
      </figure>`).join('') : '<p>Δεν υπάρχουν εικόνες.</p>';
    // track current page for incremental loading
    gal.dataset.page = String(first.page ?? 0);
    gal.dataset.limit = "12";
    await buildLoadMore();
  }
  subSel.addEventListener('change', ()=>{ setPaintEnabled(!!subSel.value); loadGallery(); });
  if (subSel.value) await loadGallery(); await buildLoadMore();

  // Upload files with optional per-file descriptions
  const _uploadBtnEl = document.getElementById('paintUploadBtn');
  if (_uploadBtnEl) _uploadBtnEl.addEventListener('click', async () => { if (typeof isLoggedIn==='function' && !isLoggedIn()) { alert('Απαιτείται σύνδεση.'); return; } if (!subSel.value) return alert('Δημιούργησε υποκατηγορία πρώτα.');
    const files = document.getElementById('paintFiles').files;
    if (!files || !files.length) return alert('Επίλεξε εικόνες.');
    const descEls = Array.from(document.querySelectorAll('.paint-desc'));
    const descriptions = descEls.map(el => el.value || '');
    await uploadPaintings(subSel.value, files, descriptions);
    document.getElementById('paintFiles').value = '';
    const _descListEl = document.getElementById('paintDescList'); if (_descListEl) _descListEl.innerHTML = '';
    const _descRowEl = document.getElementById('paintDescRow'); if (_descRowEl) _descRowEl.style.display = 'none';
    await loadGallery(); await buildLoadMore();
  });

  // Delegate delete actions inside the gallery
  if (gal) gal.addEventListener('click', async (e) => {
    const fig = e.target.closest('figure[data-id]');
    if (!fig) return;
    if (e.target.classList.contains('del')) {
      if (!confirm('Διαγραφή εικόνας;')) return;
      await deletePainting(fig.getAttribute('data-id'));
      await loadGallery(); await buildLoadMore();
    }
  });
  
  // Build "Load more" control for gallery if server indicates more pages
  async function buildLoadMore(){
    const gal = document.getElementById('paintGallery');
    if (!gal || !subSel || !subSel.value) return;
    // remove previous control if present
    const oldWrap = document.getElementById('paintLoadMoreWrap');
    if (oldWrap && oldWrap.parentElement) oldWrap.parentElement.removeChild(oldWrap);
    // determine current page/limit
    let pg = parseInt(gal.dataset.page || '0', 10);
    const L = parseInt(gal.dataset.limit || '12', 10);
    // ask server if more pages are available
    const probe = await listPaintings(subSel.value, pg, L);
    if (!probe || !probe.hasMore) return;
    // create control
    const wrap = document.createElement('div');
    wrap.id = 'paintLoadMoreWrap';
    wrap.className = 'gallery-loadmore';
    wrap.style.marginTop = '12px';
    const more = document.createElement('button');
    more.className = 'button admin-button';
    more.textContent = 'Εμφάνιση περισσότερων';
    wrap.appendChild(more);
    // append under the gallery container
    const host = gal.parentElement && gal.parentElement.parentElement ? gal.parentElement.parentElement : gal.parentElement || gal;
    host.appendChild(wrap);
    more.addEventListener('click', async () => {
      const nxt = await listPaintings(subSel.value, pg + 1, L);
      const extra = asList(nxt);
      gal.insertAdjacentHTML('beforeend', extra.map(i => `
        <figure data-id="${i._id}">
          <button class="danger del" title="Διαγραφή">Διαγραφή</button>
          <div class="media">
            <img src="${i.dataUrl}" alt="${i.description||i.title||''}" />
          </div>
          <figcaption title="${i.description||i.title||''}">
            ${i.description||i.title||''}
            <button class="danger del" style="float:right;margin-left:.5rem;">Διαγραφή</button>
          </figcaption>
        </figure>`).join(''));
      // advance page and remove control if there's no more data
      pg = nxt.page ?? (pg + 1);
      gal.dataset.page = String(pg);
      if (!nxt.hasMore) {
        wrap.remove();
      }
    });
  }

}

// --- Admin: Exhibitions CRUD table ---
async function renderExhibitionsAdmin() {
  const content = document.getElementById('content');
  content.innerHTML = `<div class="card">
    <div class="headline"><h2>Διαχείριση Εκθέσεων</h2></div>

    <div class="admin-form">
      <div class="form-grid">
        <div class="form-row wide">
          <label>Υποκατηγορία</label>
          <select id="exhSubSel" class="control"></select>
        </div>
        <div class="form-row wide">
          <label>Τίτλος</label>
          <input id="exhTitle" class="control" placeholder="Τίτλος" />
        </div>
        <div class="form-row wide">
          <label>Ημερομηνία</label>
          <input id="exhDate" class="control" placeholder="π.χ. 2024 ή 05/2024" />
        </div>
        <div class="form-row wide">
          <label>Τοποθεσία</label>
          <input id="exhLocation" class="control" placeholder="Τοποθεσία" />
        </div>
        <div class="form-row wide">
          <button id="exhSaveBtn" class="button">Αποθήκευση</button>
          <button id="exhCancelBtn" class="secondary" style="display:none">Άκυρο</button>
        </div>
      </div>
    </div>

    
    <hr class="soft-divider" />
    <div class="form-grid">
      <div class="form-row wide">
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Τίτλος</th>
                <th>Ημερομηνία</th>
                <th>Τοποθεσία</th>
                <th style="width:220px">Ενέργειες</th>
              </tr>
            </thead>
            <tbody id="exhTableBody">
              <tr><td colspan="4">Φόρτωση...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>`;

  const cats = await fetchCategories();
  const cat = cats.find(c => c.key === 'exhibitions');
  const subSel = document.getElementById('exhSubSel');
  if (!cat) { subSel.innerHTML = `<option>Δεν υπάρχει κατηγορία Εκθέσεις</option>`; return; }
  const subs = await fetchSubcategories(cat._id);
  subSel.innerHTML = subs.length ? subs.map(s => `<option value="${s._id}">${s.name}</option>`).join('') : `<option value="" disabled selected>— καμία —</option>`;

  // If empty, prompt quick creation and reload table
  if (!subs.length) {
    showQuickCreateSubModal(cat._id, async (created) => {
      if (created && created._id) {
        subSel.innerHTML = `<option value="${created._id}">${created.name}</option>`;
        subSel.value = created._id;
        const ev = new Event('change'); subSel.dispatchEvent(ev); if (typeof loadExh==='function') await loadExh();
      }
    });
  }

  const tbody = document.getElementById('exhTableBody');
  const titleEl = document.getElementById('exhTitle');
  const dateEl = document.getElementById('exhDate');
  const locEl = document.getElementById('exhLocation');
  const saveBtn = document.getElementById('exhSaveBtn');
  const cancelBtn = document.getElementById('exhCancelBtn');
  let editId = null;

  // Enable/disable inputs based on subcategory presence
  function setExhEnabled(on){ if(titleEl) titleEl.disabled=!on; if(dateEl) dateEl.disabled=!on; if(locEl) locEl.disabled=!on; if(saveBtn) saveBtn.disabled=!on; }
  setExhEnabled(!!subSel.value);

  // Fetch and render exhibitions table
  async function loadExh(){ if (!subSel || !subSel.value) { tbody.innerHTML = `<tr><td colspan="5">Δεν υπάρχουν υποκατηγορίες.</td></tr>`; return; }
    const subId = subSel.value;
    const exResp = await fetchExhibitions(subId);
    const list = asList(exResp);
    if (!list.length) { tbody.innerHTML = `<tr><td colspan="4">Δεν υπάρχουν εκθέσεις σε αυτή την κατηγορία.</td></tr>`; return; }
    tbody.innerHTML = list.map(e => `
      <tr data-id="${e._id}">
        <td>${e.title||''}</td>
        <td>${e.date||''}</td>
        <td>${e.location||''}</td>
        <td class="actions-cell">
          <button class="edit">Επεξεργασία</button>
          <span class="spacer"></span>
          <button class="danger delete">Διαγραφή</button>
        </td>
      </tr>
    `).join('');
    // "Load more" control for paged data
    (function(){
      let pg = (exResp.page ?? 0);
      const L = 12;
      const table = tbody.closest('table');
      const host = table ? table.parentElement : tbody.parentElement;
      const wrap = document.createElement('div');
      wrap.className = 'gallery-loadmore';
      wrap.style.marginTop = '12px';
      if (exResp && exResp.hasMore) {
        const more = document.createElement('button');
        more.className = 'button admin-button';
        more.textContent = 'Φορτώστε περισσότερα';
        wrap.appendChild(more);
        host.appendChild(wrap);
        more.addEventListener('click', async () => {
          const nx = await fetchExhibitions(subId, pg + 1, L);
          const extra = asList(nx);
          tbody.insertAdjacentHTML('beforeend', extra.map(e => `
            <tr data-id="${e._id}">
              <td>${e.title||''}</td>
              <td>${e.date||''}</td>
              <td>${e.location||''}</td>
              <td class="actions-cell">
                <button class="edit">Επεξεργασία</button>
                <span class="spacer"></span>
                <button class="danger delete">Διαγραφή</button>
              </td>
            </tr>`).join(''));
          pg = nx.page ?? (pg + 1);
          if (!nx.hasMore) wrap.remove();
        });
      }
    })();

  }
  subSel.addEventListener('change', () => { setExhEnabled(!!subSel.value); });
  subSel.addEventListener('change', loadExh);
  await loadExh();

  // Reset form to pristine state
  function clearForm(){ editId=null; titleEl.value=''; dateEl.value=''; locEl.value=''; saveBtn.textContent='Αποθήκευση'; cancelBtn.style.display='none'; }

  // Create/update row
  saveBtn.addEventListener('click', async () => {
    const payload = { title: titleEl.value.trim(), date: dateEl.value.trim(), location: locEl.value.trim(), subcategory: subSel.value };
    if (!payload.title) return alert('Ο τίτλος είναι υποχρεωτικός.');
    if (editId) await updateExhibition(editId, payload); else await addExhibition(payload);
    clearForm(); await loadExh(); await loadAsideMenus();
  });
  cancelBtn.addEventListener('click', clearForm);

  // Inline edit/delete actions
  tbody.addEventListener('click', async (e) => {
    const tr = e.target.closest('tr[data-id]'); if (!tr) return;
    const id = tr.getAttribute('data-id');
    if (e.target.classList.contains('edit')) {
      const tds = tr.querySelectorAll('td');
      titleEl.value = tds[0].textContent;
      dateEl.value = tds[1].textContent;
      locEl.value = tds[2].textContent;
      editId = id; saveBtn.textContent = 'Αποθήκευση'; cancelBtn.style.display='';
    }
    if (e.target.classList.contains('delete')) {
      if (!confirm('Διαγραφή έκθεσης;')) return;
      await deleteExhibition(id);
      if (editId === id) clearForm();
      await loadExh(); await loadAsideMenus();
    }
  });
}

// --- Admin: Links CRUD table ---
async function renderLinksAdmin() {
  const content = document.getElementById('content');
  content.innerHTML = `<div class="card">
    <div class="headline"><h2>Διαχείριση Συνδέσμων</h2></div>

    <div class="admin-form">
      <div class="form-grid">
        <div class="form-row wide">
          <label>Υποκατηγορία</label>
          <select id="linkSubSel" class="control"></select>
        </div>
        <div class="form-row wide">
          <label>Τίτλος</label>
          <input id="linkTitle" class="control" placeholder="Τίτλος (προαιρετικό)" />
        </div>
        <div class="form-row wide">
          <label>URL</label>
          <input id="linkUrl" class="control" placeholder="https://..." />
        </div>
        <div class="form-row wide">
          <button id="linkSaveBtn" class="button">Αποθήκευση</button>
          <button id="linkCancelBtn" class="secondary" style="display:none">Άκυρο</button>
        </div>
      </div>
    </div>

    
    <hr class="soft-divider" />
    <div class="form-grid">
      <div class="form-row wide">
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Τίτλος</th>
                <th>URL</th>
                <th style="width:220px">Ενέργειες</th>
              </tr>
            </thead>
            <tbody id="linkTableBody">
              <tr><td colspan="3">Φόρτωση...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>`;

  const cats = await fetchCategories();
  const cat = cats.find(c => c.key === 'links');
  const subSel = document.getElementById('linkSubSel');
  if (!cat) { subSel.innerHTML = `<option>Δεν υπάρχει κατηγορία Συνδέσμων</option>`; return; }
  const subs = await fetchSubcategories(cat._id);
  subSel.innerHTML = subs.length ? subs.map(s => `<option value="${s._id}">${s.name}</option>`).join('') : `<option value="" disabled selected>— καμία —</option>`;

  // If empty, prompt quick creation and reload table
  if (!subs.length) {
    showQuickCreateSubModal(cat._id, async (created) => {
      if (created && created._id) {
        subSel.innerHTML = `<option value="${created._id}">${created.name}</option>`;
        subSel.value = created._id;
        const ev = new Event('change'); subSel.dispatchEvent(ev); if (typeof loadList==='function') await loadList();
      }
    });
  }

  const tbody = document.getElementById('linkTableBody');
  const titleEl = document.getElementById('linkTitle');
  const urlEl = document.getElementById('linkUrl');
  const saveBtn = document.getElementById('linkSaveBtn');
  const cancelBtn = document.getElementById('linkCancelBtn');
  let editId = null;

  // Enable/disable inputs based on subcategory presence
  function setLinkEnabled(on){ if(titleEl) titleEl.disabled=!on; if(urlEl) urlEl.disabled=!on; if(saveBtn) saveBtn.disabled=!on; }
  setLinkEnabled(!!subSel.value);

  // Fetch and render links for selected subcategory
  async function loadList(){ if (!subSel || !subSel.value) { tbody.innerHTML = `<tr><td colspan="3">Δεν υπάρχουν υποκατηγορίες.</td></tr>`; return; }
    const subId = subSel.value;
    const lnResp = await fetchLinks(subId);
    const list = asList(lnResp);
    if (!list.length){ tbody.innerHTML = `<tr><td colspan="3">Δεν υπάρχουν σύνδεσμοι σε αυτή την κατηγορία.</td></tr>`; return; }
    tbody.innerHTML = list.map(l => `
      <tr data-id="${l._id}">
        <td>${l.title || ''}</td>
        <td><a href="${l.url}" target="_blank" rel="noopener">${l.url}</a></td>
        <td class="actions-cell">
          <button class="edit">Επεξεργασία</button>
          <span class="spacer"></span>
          <button class="danger delete">Διαγραφή</button>
        </td>
      </tr>
    `).join('');
    // "Load more" control for paged data
    (function(){
      let pg = (lnResp.page ?? 0);
      const L = 12;
      const table = tbody.closest('table');
      const host = table ? table.parentElement : tbody.parentElement;
      const wrap = document.createElement('div');
      wrap.style.marginTop = '12px';
      if (lnResp && lnResp.hasMore) {
        const more = document.createElement('button');
        more.className = 'button admin-button';
        more.textContent = 'Φορτώστε περισσότερα';
        wrap.appendChild(more);
        host.appendChild(wrap);
        more.addEventListener('click', async () => {
          const nx = await fetchLinks(subId, pg + 1, L);
          const extra = asList(nx);
          tbody.insertAdjacentHTML('beforeend', extra.map(l => `
            <tr data-id="${l._id}">
              <td>${l.title || ''}</td>
              <td><a href="${l.url}" target="_blank" rel="noopener">${l.url}</a></td>
              <td class="actions-cell">
                <button class="edit">Επεξεργασία</button>
                <span class="spacer"></span>
                <button class="danger delete">Διαγραφή</button>
              </td>
            </tr>`).join(''));
          pg = nx.page ?? (pg + 1);
          if (!nx.hasMore) wrap.remove();
        });
      }
    })();

  }
  subSel.addEventListener('change', () => { setLinkEnabled(!!subSel.value); });
  subSel.addEventListener('change', loadList);
  await loadList();

  // Reset form to pristine state
  function clearForm(){ editId=null; titleEl.value=''; urlEl.value=''; saveBtn.textContent='Αποθήκευση'; cancelBtn.style.display='none'; }

  // Create/update row
  saveBtn.addEventListener('click', async () => {
    const payload = { title: titleEl.value.trim(), url: urlEl.value.trim(), subcategory: subSel.value };
    if (!payload.url) return alert('Το URL είναι υποχρεωτικό.');
    if (editId) await updateLink(editId, payload); else await addLink(payload);
    clearForm(); await loadList(); await loadAsideMenus();
  });
  cancelBtn.addEventListener('click', clearForm);

  // Inline edit/delete actions
  tbody.addEventListener('click', async (e) => {
    const tr = e.target.closest('tr[data-id]'); if (!tr) return;
    const id = tr.getAttribute('data-id');
    if (e.target.classList.contains('edit')) {
      const tds = tr.querySelectorAll('td');
      titleEl.value = tds[0].textContent.trim();
      urlEl.value = tds[1].innerText.trim();
      editId = id; saveBtn.textContent = 'Αποθήκευση'; cancelBtn.style.display='';
    }
    if (e.target.classList.contains('delete')) {
      if (!confirm('Διαγραφή συνδέσμου;')) return;
      await deleteLink(id);
      if (editId === id) clearForm();
      await loadList(); await loadAsideMenus();
    }
  });
}

/*#__activeSidebarDelegation__*/
document.addEventListener('click', (e) => {
  const a = e.target.closest('#bioList a, #paintList a, #exhList a, #linkList a');
  if (!a) return;
  document.querySelectorAll('#bioList a, #paintList a, #exhList a, #linkList a').forEach(x=>x.classList.remove('active'));
  a.classList.add('active');
});


// ===== Auth-aware UI init patch (await isLoggedIn) =====
// Initializes auth state on DOMContentLoaded, toggles UI, and wires a hard reload on logout.
(function attachAuthAwareInit(){
  if (window.__ELGRECO_AUTH_INIT__) return;
  window.__ELGRECO_AUTH_INIT__ = true;

  document.addEventListener('DOMContentLoaded', () => {
    initAuthUI().catch(console.error);
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.onclick = async () => {
        try { await logout(); } catch {}
        window.location.reload();
      };
    }
  });

  async function initAuthUI() {
    document.documentElement.classList.add('auth-loading');
    const loggedIn = await isLoggedIn();

    const loginFormContainer = document.getElementById('loginFormContainer');
    const loggedInContainer  = document.getElementById('loggedInContainer');
    const managementMenu     = document.getElementById('managementMenu');

    if (loggedIn) {
      loginFormContainer?.classList.add('hidden');
      loggedInContainer?.classList.remove('hidden');
      managementMenu?.classList.add('visible');
    } else {
      loginFormContainer?.classList.remove('hidden');
      loggedInContainer?.classList.add('hidden');
      managementMenu?.classList.remove('visible');
    }
    document.documentElement.classList.remove('auth-loading');
  }
})();
