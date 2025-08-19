// Stories Hub — client-side app (ultra-premium theme)
const ADMIN_PASSWORD = 'admin123';
const STORAGE_KEY = 'stories_hub_ultra_v1';

const seedStories = [
  {id:101, title:"The Lantern on Maple Street", author:"Maya L.", category:"Short Stories", tags:["mystery","short"], content:"On a foggy autumn night a lantern flickered to life and the street remembered an old promise..."},
  {id:102, title:"Quiet River, Loud Thoughts", author:"Rahul S.", category:"Poems", tags:["poetry","contemplative"], content:"The river kept secrets and carried them gently past the houses where people still remembered how to listen."},
  {id:103, title:"The Baker's Secret", author:"Elena K.", category:"Articles", tags:["slice-of-life","humor"], content:"Every morning the bakery filled the street with cinnamon and tiny secrets. Today, the baker hid a note inside a loaf."},
  {id:104, title:"Paper Boats", author:"A.J.", category:"Kids' Tales", tags:["children","short"], content:"We launched paper boats down the gutter and watched them sail like brave little ships beneath the summer rain."},
  {id:105, title:"Midnight Letter", author:"S. Park", category:"Short Stories", tags:["romance","epistolary"], content:"I found a letter folded inside a library book addressed to a name I didn't know, and then I understood the town."},
  {id:106, title:"City of Echoes", author:"Nora V.", category:"Fantasy", tags:["urban","drama"], content:"Skyscrapers swallowed the sky, but not the echoes of those who once called it home."},
  {id:107, title:"Paper Wings", author:"Ivy C.", category:"Inspiration", tags:["memoir","inspiration"], content:"She folded wings out of old receipts and dared to fly to the top of the building."},
  {id:108, title:"The Last Orchard", author:"B. Alvarez", category:"Nature", tags:["nostalgia","nature"], content:"The orchard hummed with bees and summers that tasted like honey and days that never left."},
  {id:109, title:"A Small Loud Silence", author:"T. Young", category:"Experimental", tags:["experimental"], content:"Silences that shout are the ones we most often forget to hear."},
  {id:110, title:"The Clockmaker", author:"Jonas R.", category:"Fantasy", tags:["fantasy","short"], content:"He could fix time itself, but not the cracks in his own memory."}
];

function loadData(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(raw){ try{ return JSON.parse(raw); }catch(e){ console.error('Corrupt storage, resetting'); } }
  const data = {stories: seedStories.slice(), about: 'Stories Hub is a cozy place for readers and writers. Edit this section in admin mode.', terms: 'This is a demo site. No data leaves your browser unless you export it.', created: Date.now()};
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data;
}
function saveData(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(DATA)); }

let DATA = loadData();
let IS_ADMIN = localStorage.getItem('stories_hub_admin') === '1';

// Simple AI helpers
function suggestTitle(text){ const s = text.split(/[.\n]/).find(Boolean) || text.slice(0,50); return s.split(' ').slice(0,7).map(w=> w.charAt(0).toUpperCase()+w.slice(1)).join(' '); }
function suggestTags(text){ const words = text.toLowerCase().replace(/[^a-z\s]/g,' ').split(/\s+/).filter(w=>w.length>4); const freq={}; words.forEach(w=>freq[w]=(freq[w]||0)+1); return Object.keys(freq).sort((a,b)=>freq[b]-freq[a]).slice(0,4); }
function summarize(text,max=160){ if(text.length<=max) return text; return text.slice(0,max).trim() + '…'; }
function polish(text){ return text.split(/([.?!]\s+)/).map(s=> s.trim().length? s.charAt(0).toUpperCase()+s.slice(1) : s).join(' '); }

// DOM helpers
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

// Navigation
$$('[data-nav]').forEach(a=> a.addEventListener('click', e=>{ e.preventDefault(); showSection(a.getAttribute('data-nav')); }));
function showSection(id){
  document.querySelectorAll('.section').forEach(s=> s.classList.add('hidden'));
  const el = document.getElementById(id); if(el) el.classList.remove('hidden');
  $$('.nav a').forEach(a=> a.classList.remove('active'));
  const nav = document.querySelector(`.nav a[data-nav="${id}"]`); if(nav) nav.classList.add('active');
  if(id==='stories') renderStories();
  if(id==='home') renderFeatured();
  if(id==='about') renderAbout();
  if(id==='tags') renderAllTags();
}

// Render featured on home
function renderFeatured(){
  const container = $('#featured-cards'); container.innerHTML='';
  DATA.stories.slice(0,6).forEach(s=> container.appendChild(createCard(s)));
}

// Render grid of stories
function renderStories(){
  const container = $('#cards'); container.innerHTML='';
  const q = $('#searchInput').value.trim().toLowerCase();
  const cat = $('#filterCategory').value;
  const tag = $('#filterTag').value;
  const sort = $('#sortBy').value;
  let list = DATA.stories.slice();
  if(q) list = list.filter(s=> (s.title+s.author+(s.tags||[]).join(' ')+s.content).toLowerCase().includes(q));
  if(cat) list = list.filter(s=> (s.category||'').toLowerCase() === cat.toLowerCase());
  if(tag) list = list.filter(s=> (s.tags||[]).includes(tag));
  list = list.sort((a,b)=> sort==='new' ? b.id - a.id : a.id - b.id);
  list.forEach(s=> container.appendChild(createCard(s)));
  populateFilters();
}

// Create a story card element
function createCard(s){
  const article = document.createElement('article'); article.className='card';
  const tags = (s.tags||[]).map(t=> `<span class="tag">${t}</span>`).join(' ');
  article.innerHTML = `<div class="meta">${escapeHtml(s.author)} · ${escapeHtml(s.category||'')}</div>
    <h3>${escapeHtml(s.title)}</h3>
    <p class="snip">${escapeHtml(summarize(s.content,180))}</p>
    <div class="tags">${tags}</div>
    <button class="read" onclick="openModal(${s.id})">Read</button>`;
  if(IS_ADMIN){
    const adminControls = document.createElement('div'); adminControls.className='admin-controls';
    const edit = document.createElement('button'); edit.className='btn'; edit.textContent='Edit'; edit.onclick = ()=> openEditor(s.id);
    const del = document.createElement('button'); del.className='btn'; del.textContent='Delete'; del.onclick = ()=> { if(confirm('Delete story?')){ deleteStory(s.id); } };
    adminControls.appendChild(edit); adminControls.appendChild(del); article.appendChild(adminControls);
  }
  return article;
}

function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, m=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

// Modal
function openModal(id){
  const story = DATA.stories.find(x=> x.id===id); if(!story) return;
  $('#modal-body').innerHTML = `<h2>${escapeHtml(story.title)}</h2><p class="meta">${escapeHtml(story.author)} · ${escapeHtml((story.tags||[]).join(', '))}</p><div class="story-full">${escapeHtml(story.content)}</div>`;
  $('#modal').classList.remove('hidden'); $('#modal').setAttribute('aria-hidden','false');
}
function closeModal(){ $('#modal').classList.add('hidden'); $('#modal').setAttribute('aria-hidden','true'); $('#modal-body').innerHTML=''; }

// Editor (add/edit)
function openEditor(id){
  const isEdit = typeof id === 'number';
  const story = isEdit ? DATA.stories.find(s=> s.id===id) : {title:'', author:'', tags:[], category:'', content:''};
  $('#modal-body').innerHTML = `
    <h3>${isEdit?'Edit Story':'Add Story'}</h3>
    <label>Title<input id="e-title" value="${escapeAttr(story.title)}"></label>
    <label>Author<input id="e-author" value="${escapeAttr(story.author)}"></label>
    <label>Category<input id="e-cat" value="${escapeAttr(story.category||'')}"></label>
    <label>Tags<input id="e-tags" value="${escapeAttr((story.tags||[]).join(', '))}"></label>
    <label>Content<textarea id="e-content" rows=8>${escapeAttr(story.content)}</textarea></label>
    <div class="row actions" style="margin-top:12px">
      <button class="btn" id="ai-suggest">Suggest Title</button>
      <button class="btn" id="ai-tags">Suggest Tags</button>
      <button class="btn" id="ai-sum">Summarize</button>
      <button class="btn" id="ai-polish">Polish</button>
      <button class="btn btn-primary" id="save-btn">${isEdit?'Save':'Add'}</button>
      <button class="btn" onclick="closeModal()">Cancel</button>
    </div>`;
  $('#modal').classList.remove('hidden'); $('#modal').setAttribute('aria-hidden','false');

  $('#ai-suggest').onclick = ()=> { $('#e-title').value = suggestTitle($('#e-content').value); }
  $('#ai-tags').onclick = ()=> { $('#e-tags').value = suggestTags($('#e-content').value).join(', '); }
  $('#ai-sum').onclick = ()=> { $('#e-content').value = summarize($('#e-content').value, 240); }
  $('#ai-polish').onclick = ()=> { $('#e-content').value = polish($('#e-content').value); }

  $('#save-btn').onclick = ()=> {
    const payload = { title: $('#e-title').value.trim() || 'Untitled', author: $('#e-author').value.trim() || 'Anonymous', category: $('#e-cat').value.trim(), tags: $('#e-tags').value.split(',').map(t=>t.trim()).filter(Boolean), content: $('#e-content').value.trim() };
    if(isEdit){ DATA.stories = DATA.stories.map(s=> s.id===id ? {...s, ...payload} : s); } else { const nid = Math.max(0,...DATA.stories.map(s=>s.id)) + 1; DATA.stories.unshift({id:nid, ...payload}); }
    saveData(); renderStories(); renderFeatured(); populateFilters(); renderTags(); closeModal();
  };
}

function escapeAttr(s){ return (s||'').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

function deleteStory(id){ DATA.stories = DATA.stories.filter(s=> s.id!==id); saveData(); renderStories(); renderTags(); renderFeatured(); }

// ---- Pending submissions ----
if(!DATA.pending) DATA.pending = [];

function handleSubmit(e){ 
  e.preventDefault(); 
  const title=$('#s-title').value.trim(), 
        author=$('#s-author').value.trim(), 
        tags=$('#s-tags').value.split(',').map(t=>t.trim()).filter(Boolean), 
        content=$('#s-content').value.trim(), 
        category=$('#s-category').value.trim();

  if(!title||!content) return alert('Title and content required');

  const nid = Date.now();
  DATA.pending.unshift({id:nid, title, author, tags, content, category, date:nid}); 
  saveData(); 

  $('#submitForm').reset(); 
  showSection('home'); 
  alert('Submitted — pending admin approval'); 
}
function renderPending(){
  if(!IS_ADMIN) return;
  const container = $('#cards'); 
  container.innerHTML = '<h3>Pending Stories (Admin only)</h3>';

  if(!DATA.pending.length){
    container.innerHTML += '<p>No pending submissions</p>';
    return;
  }

  DATA.pending.forEach((s,i)=>{
    const div=document.createElement('div'); 
    div.className='card';
    div.innerHTML = `
      <h3>${escapeHtml(s.title)}</h3>
      <p class="snip">${escapeHtml(summarize(s.content,140))}</p>
      <button class="btn" onclick="approvePending(${i})">Approve</button>
      <button class="btn" onclick="rejectPending(${i})">Reject</button>
    `;
    container.appendChild(div);
  });
}

function approvePending(i){
  const s = DATA.pending.splice(i,1)[0];
  DATA.stories.unshift(s);
  saveData();
  renderStories();
}

function rejectPending(i){
  DATA.pending.splice(i,1);
  saveData();
  renderPending();
}
function showSection(id){
  document.querySelectorAll('.section').forEach(s=> s.classList.add('hidden'));
  const el = document.getElementById(id); if(el) el.classList.remove('hidden');
  $$('.nav a').forEach(a=> a.classList.remove('active'));
  const nav = document.querySelector(`.nav a[data-nav="${id}"]`); if(nav) nav.classList.add('active');

  if(id==='stories'){ 
    if(IS_ADMIN && DATA.pending.length) { renderPending(); } 
    else { renderStories(); } 
  }
  if(id==='home') renderFeatured();
  if(id==='about') renderAbout();
  if(id==='tags') renderAllTags();
}


// Filters & tags
function populateFilters(){ const cats = new Set(); DATA.stories.forEach(s=> s.category && cats.add(s.category)); const sel = $('#filterCategory'); sel.innerHTML = '<option value="">All topics</option>'; Array.from(cats).forEach(c=> { const o = document.createElement('option'); o.value=c; o.textContent=c; sel.appendChild(o); }); populateTagFilter(); }
function populateTagFilter(){ const sel = $('#filterTag'); const seen = new Set(); sel.innerHTML = '<option value="">All tags</option>'; DATA.stories.forEach(s=> (s.tags||[]).forEach(t=> seen.add(t))); Array.from(seen).sort().forEach(t=> { const o=document.createElement('option'); o.value=t; o.textContent=t; sel.appendChild(o); }); }
function renderTags(){ const container=$('#top-tags'); container.innerHTML=''; const counts={}; DATA.stories.forEach(s=> (s.tags||[]).forEach(t=> counts[t]=(counts[t]||0)+1)); Object.keys(counts).sort((a,b)=>counts[b]-counts[a]).slice(0,20).forEach(t=> { const b=document.createElement('button'); b.className='tag'; b.textContent=t; b.onclick=()=> { $('#filterTag').value=t; showSection('stories'); renderStories(); }; container.appendChild(b); }); }
function renderAllTags(){ const container = $('#all-tags'); container.innerHTML=''; const counts={}; DATA.stories.forEach(s=> (s.tags||[]).forEach(t=> counts[t]=(counts[t]||0)+1)); Object.keys(counts).sort().forEach(t=> { const span=document.createElement('span'); span.className='tag'; span.textContent=`${t} (${counts[t]})`; container.appendChild(span); }); }
function renderTopics(){ const container=$('#topics'); container.innerHTML=''; const counts={}; DATA.stories.forEach(s=> { const c = s.category || 'Uncategorized'; counts[c]=(counts[c]||0)+1; }); Object.keys(counts).sort().forEach(c=> { const div=document.createElement('div'); div.className='topic'; div.textContent=`${c} (${counts[c]})`; div.onclick=()=> { $('#filterCategory').value=c; showSection('stories'); renderStories(); }; container.appendChild(div); }); }
function renderTags(){ /* defined above */ }
function renderAbout(){ $('#about-content').textContent = DATA.about || ''; $('#terms-content').textContent = DATA.terms || ''; }

// admin login via logo click
$('#logo').addEventListener('click', ()=> {
  if(IS_ADMIN){ IS_ADMIN=false; localStorage.removeItem('stories_hub_admin'); updateAdminUI(); return alert('Admin mode disabled'); }
  const p = prompt('Enter admin password'); if(p===ADMIN_PASSWORD){ IS_ADMIN=true; localStorage.setItem('stories_hub_admin','1'); updateAdminUI(); alert('Admin mode enabled'); showSection('stories'); } else if(p!==null) alert('Wrong password');
});

function updateAdminUI(){ 
  if(IS_ADMIN){ 
    $('#fab').classList.remove('hidden'); 
    $$('.admin-only').forEach(el=> el.classList.remove('hidden')); 
  } else { 
    $('#fab').classList.add('hidden'); 
    $$('.admin-only').forEach(el=> el.classList.add('hidden')); 
  } 
  renderStories(); 
  renderFeatured(); 
  renderTags(); 
  renderTopics(); 
  populateFilters(); 
}

// edit About & Terms
function editAbout(){ const t = prompt('Edit About text', DATA.about || ''); if(t!==null){ DATA.about = t; saveData(); renderAbout(); } }
function editTerms(){ const t = prompt('Edit Terms text', DATA.terms || ''); if(t!==null){ DATA.terms = t; saveData(); renderAbout(); } }

const contactForm = document.getElementById('contactForm');

contactForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(contactForm);
  const action = contactForm.action;

  try {
    const response = await fetch(action, {
      method: 'POST',
      body: formData,
      headers: { 'Accept': 'application/json' }
    });

    if (response.ok) {
      alert('Message sent successfully!');
      contactForm.reset();
    } else {
      alert('Oops! There was a problem sending your message.');
    }
  } catch (err) {
    alert('Oops! There was a problem sending your message.');
  }
});

// Year
$('#year').textContent = new Date().getFullYear();

// Init on load
updateAdminUI();
renderFeatured();
renderStories();
renderTags();
renderTopics();
populateFilters();
renderAbout();
renderAllTags();
