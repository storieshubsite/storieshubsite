
// Frontend renderer for index.html
const STORAGE_KEY = 'storieshub_stories';

function getStories() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch(e){ return []; }
}

function storyCard(story){
  const date = new Date(story.date).toLocaleDateString();
  const tags = (story.tags||[]).map(t=>`<span class="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">${t}</span>`).join(' ');
  const snippet = story.content.length > 160 ? story.content.slice(0,160)+'…' : story.content;
  return `<article class="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition flex flex-col">
    <h3 class="font-semibold text-xl mb-1">${story.title}</h3>
    <div class="text-sm text-gray-500 mb-3">By ${story.author} • ${date} • ${story.category}</div>
    <p class="text-gray-700 mb-4">${snippet}</p>
    <div class="mt-auto flex flex-wrap gap-2">${tags}</div>
  </article>`;
}

function renderStories(filter=''){
  const grid = document.getElementById('storiesGrid');
  const empty = document.getElementById('emptyState');
  if(!grid) return;
  let list = getStories().sort((a,b)=> new Date(b.date)-new Date(a.date));
  if(filter) {
    const f = filter.toLowerCase();
    list = list.filter(s => (s.title+s.author+s.category+(s.tags||[]).join(',')+s.content).toLowerCase().includes(f));
  }
  grid.innerHTML = list.map(storyCard).join('');
  if(list.length===0){ empty.classList.remove('hidden'); } else { empty.classList.add('hidden'); }
}

window.addEventListener('load', ()=>{
  const search = document.getElementById('searchInput');
  if(search){
    search.addEventListener('input', e => renderStories(e.target.value));
  }
  renderStories();
});

// Update list if changed from Admin in another tab
window.addEventListener('stories-updated', ()=> renderStories(document.getElementById('searchInput')?.value || ''));
