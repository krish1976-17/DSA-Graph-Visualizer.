'use strict';
const $ = id => document.getElementById(id);
const { adjacency, traverse, stats } = GraphAlgorithms;
const STORAGE = 'network-lab-v2';
let nodes = [], edges = [], frames = [], cursor = 0, timer = null, history = [];
const escapeHtml = text => String(text).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const label = id => nodes.find(node => node.id === id)?.name ?? String(id);
const example = type => {
  if (type === 'cycle') return { nodes: ['A', 'B', 'C', 'D', 'E', 'F'].map((name, id) => ({ id, name })), edges: [[0,1],[1,2],[2,3],[3,0],[2,4],[4,5],[5,1]] };
  const graph = { nodes: ['CEO', 'HR', 'Tech', 'Ana', 'Ben', 'Ravi', 'Sara'].map((name, id) => ({ id, name })), edges: [[0,1],[0,2],[1,3],[1,4],[2,5],[2,6]] };
  if (type === 'disconnected') graph.edges = [[0,1],[1,3],[1,4],[2,5]];
  return graph;
};
function validateGraph(value) {
  if (!value || !Array.isArray(value.nodes) || !Array.isArray(value.edges) || value.nodes.length < 1 || value.nodes.length > 18) throw new Error('Use a graph with 1–18 nodes.');
  const ids = new Set(), names = new Set();
  const cleanNodes = value.nodes.map(node => {
    if (!node || !Number.isSafeInteger(node.id) || node.id < 0 || node.id > 1000000 || typeof node.name !== 'string') throw new Error('Each node needs a valid numeric ID and a name.');
    const name = node.name.trim();
    if (!name || name.length > 24 || ids.has(node.id) || names.has(name.toLowerCase())) throw new Error('Node IDs and names must be unique; names need 1–24 characters.');
    ids.add(node.id); names.add(name.toLowerCase());
    return { id: node.id, name };
  });
  if (value.edges.length > 153) throw new Error('Too many connections.');
  const pairs = new Set();
  const cleanEdges = value.edges.map(edge => {
    if (!Array.isArray(edge) || edge.length !== 2 || !ids.has(edge[0]) || !ids.has(edge[1]) || edge[0] === edge[1]) throw new Error('Connections must join two existing, different nodes.');
    const key = [...edge].sort((a,b) => a-b).join(':');
    if (pairs.has(key)) throw new Error('Duplicate connection found.');
    pairs.add(key); return [...edge];
  });
  return { nodes: cleanNodes, edges: cleanEdges };
}
function snapshot() { return { nodes: nodes.map(node => ({ ...node })), edges: edges.map(edge => [...edge]) }; }
function save() {
  try { localStorage.setItem(STORAGE, JSON.stringify(snapshot())); $('saveStatus').textContent = '✓ Saved on this device'; }
  catch { $('saveStatus').textContent = 'Saving unavailable · export to keep your graph'; }
}
function pause() { clearTimeout(timer); timer = null; }
function fillSelects() {
  for (const id of ['start','from','to','deleteNode']) {
    const select = $(id), old = select.value;
    select.replaceChildren(...nodes.map(node => new Option(node.name, node.id)));
    if (nodes.some(node => String(node.id) === old)) select.value = old;
  }
  if ($('from').value === $('to').value && nodes.length > 1) $('to').selectedIndex = 1;
  $('deleteEdge').replaceChildren(...edges.map(([a,b], index) => new Option(`${label(a)} ↔ ${label(b)}`, index)));
  $('removeNode').disabled = nodes.length <= 1;
  $('removeEdge').disabled = !edges.length;
  $('deleteEdge').disabled = !edges.length;
}
function reset() { pause(); frames = traverse(adjacency(nodes, edges), Number($('start').value), $('algorithm').value); cursor = 0; render(); }
function edit(change, message) {
  history.push(snapshot()); if (history.length > 30) history.shift();
  pause(); change(); fillSelects(); reset(); save(); $('feedback').textContent = message;
}
function positions() {
  if (nodes.length === 7 && nodes.every((node, index) => node.id === index)) return [[400,65],[210,225],[590,225],[110,385],[300,385],[500,385],[690,385]];
  return nodes.map((node, index) => { const angle = -Math.PI/2 + 2*Math.PI*index/nodes.length; return [400+315*Math.cos(angle),235+175*Math.sin(angle)]; });
}
function draw(frame) {
  const points = new Map(nodes.map((node,index) => [node.id, positions()[index]]));
  const visited = new Set(frame.order), seen = new Set(frame.discovered);
  const tree = new Set(frame.tree.map(edge => [...edge].sort((a,b)=>a-b).join(':')));
  let svg = '<svg viewBox="0 0 800 490" role="group" aria-label="Graph. Select a node to change the start.">';
  for (const [a,b] of edges) {
    const [x,y] = points.get(a), [u,v] = points.get(b), active = tree.has([a,b].sort((a,b)=>a-b).join(':'));
    svg += `<line class="edge ${active ? 'edge-active' : ''}" x1="${x}" y1="${y}" x2="${u}" y2="${v}"/>`;
  }
  for (const node of nodes) {
    const [x,y] = points.get(node.id), state = node.id === frame.current ? 'active' : visited.has(node.id) ? 'seen' : seen.has(node.id) ? 'queued' : 'idle';
    const name = escapeHtml(node.name), initials = escapeHtml(node.name.split(/\s+/).map(word=>word[0]).slice(0,2).join('').toUpperCase());
    const short = escapeHtml(node.name.length > 13 ? node.name.slice(0,12)+'…' : node.name);
    svg += `<g class="node ${state}" tabindex="0" role="button" data-id="${node.id}" aria-label="Start from ${name}" aria-pressed="${node.id === Number($('start').value)}"><title>${name}</title>`;
    if (node.id === Number($('start').value)) svg += `<circle class="start-ring" cx="${x}" cy="${y}" r="37"/>`;
    svg += `<circle class="node-circle" cx="${x}" cy="${y}" r="28"/><text class="initials" x="${x}" y="${y+6}" text-anchor="middle">${initials}</text><text class="node-label" x="${x}" y="${y+54}" text-anchor="middle">${short}</text>`;
    if ($('algorithm').value === 'bfs' && frame.distance[node.id] !== undefined) svg += `<circle class="distance-circle" cx="${x+24}" cy="${y-22}" r="11"/><text class="distance-text" x="${x+24}" y="${y-18}" text-anchor="middle">${frame.distance[node.id]}</text>`;
    svg += '</g>';
  }
  $('graph').innerHTML = svg + '</svg>';
}
function note(frame) {
  const name = label(frame.subject), bfs = $('algorithm').value === 'bfs';
  switch (frame.action) {
    case 'ready': return `Start from ${name}. Press Start or Next to explore.`;
    case 'discover': return bfs ? `Discover ${name}: mark it seen and add it to the back of the queue. Its shortest distance from the start is ${frame.distance[frame.subject]}.` : `Discover ${name}: mark it seen before entering this branch.`;
    case 'visit': return bfs ? `Visit ${name}: remove it from the front of the queue, then inspect its neighbors.` : `Visit ${name}: push its call onto the stack and explore unseen neighbors.`;
    case 'return': return `Finish ${name}: pop its call from the stack.${frame.current === null ? ' The stack is now empty.' : ` Return to ${label(frame.current)}.`}`;
    default: return `Traversal complete. Reached ${frame.order.length} of ${nodes.length} nodes.${frame.order.length < nodes.length ? ' Other nodes belong to disconnected groups.' : ' Every node is reachable.'}`;
  }
}
function render() {
  const frame = frames[cursor], bfs = $('algorithm').value === 'bfs', network = stats(adjacency(nodes,edges), Number($('start').value));
  draw(frame);
  $('networkCount').textContent = `${nodes.length} nodes · ${edges.length} connections`;
  $('visitedCount').innerHTML = `${frame.order.length}<span>/ ${nodes.length}</span>`;
  $('status').textContent = note(frame);
  $('order').innerHTML = frame.order.length ? frame.order.map((id,index)=>`<li><span class="number">${String(index+1).padStart(2,'0')}</span>${escapeHtml(label(id))}</li>`).join('') : '<li class="placeholder">Your journey starts here.</li>';
  $('frontier').innerHTML = frame.frontier.length ? frame.frontier.map(id=>`<span class="chip">${escapeHtml(label(id))}</span>`).join('') : '<span class="placeholder">Empty</span>';
  $('frontierTitle').innerHTML = bfs ? 'Queue <span>front → back</span>' : 'Call stack <span>bottom → top</span>';
  $('frontierHint').textContent = bfs ? 'First in, first out. Discoveries join the back; visits leave the front.' : 'Last in, first out. Watch each return pop a call from the top.';
  $('explanation').textContent = bfs ? 'Explore nearby nodes first, one layer at a time.' : 'Follow a branch deeply, then backtrack.';
  $('lesson').textContent = bfs ? 'BFS finds shortest paths by edge count in an unweighted graph. Distance badges show how many connections separate each node from the start.' : 'DFS is useful for exploring connectivity and forms the basis of many cycle and ordering algorithms. Its depth does not necessarily give the shortest path.';
  $('distanceHint').textContent = bfs ? 'Small badges on nodes show shortest distance in edges.' : 'Green lines show the DFS discovery tree.';
  $('groups').textContent = network.groups;
  $('reachable').textContent = `${network.reachable} / ${nodes.length}`;
  $('play').textContent = timer ? 'Ⅱ Pause' : frame.done ? '↻ Replay' : cursor ? '▶ Resume' : '▶ Start';
  $('step').disabled = frame.done; $('back').disabled = cursor === 0; $('undo').disabled = !history.length;
  $('timeline').max = frames.length - 1; $('timeline').value = cursor;
  $('progressText').textContent = `${cursor} / ${frames.length-1} steps`;
}
function move(amount) { pause(); cursor = Math.max(0, Math.min(frames.length-1, cursor+amount)); render(); }
function tick() {
  if (cursor < frames.length-1) cursor++;
  if (!frames[cursor].done) timer = setTimeout(tick, Number($('speed').value)); else timer = null;
  render();
}
function play() { if (timer) { pause(); render(); return; } if (frames[cursor].done) cursor = 0; tick(); }
$('play').addEventListener('click', play);
$('step').addEventListener('click', ()=>move(1));
$('back').addEventListener('click', ()=>move(-1));
$('reset').addEventListener('click', reset);
$('algorithm').addEventListener('change', reset);
$('start').addEventListener('change', reset);
$('timeline').addEventListener('input', ()=>{ pause(); cursor = Number($('timeline').value); render(); });
$('speed').addEventListener('input', ()=>{ $('speedLabel').textContent = (Number($('speed').value)/1000).toFixed(1)+' s'; });
$('loadPreset').addEventListener('click', ()=>edit(()=>{ ({nodes,edges} = example($('preset').value)); }, 'Example loaded. Undo restores your previous graph.'));
$('addForm').addEventListener('submit', event=>{
  event.preventDefault(); const name = $('name').value.trim();
  if (!name || name.length > 24) { $('feedback').textContent = 'Enter a name with 1–24 characters.'; return; }
  if (nodes.length >= 18) { $('feedback').textContent = 'Maximum 18 nodes. Remove one to add another.'; return; }
  if (nodes.some(node=>node.name.toLowerCase() === name.toLowerCase())) { $('feedback').textContent = 'That name already exists.'; return; }
  edit(()=>nodes.push({ id: Math.max(...nodes.map(node=>node.id))+1, name }), `${name} added. Connect it to another node.`); $('name').value = '';
});
$('edgeForm').addEventListener('submit', event=>{
  event.preventDefault(); const a = Number($('from').value), b = Number($('to').value);
  if (a === b) { $('feedback').textContent = 'Choose two different nodes.'; return; }
  if (edges.some(([x,y])=>(x===a&&y===b)||(x===b&&y===a))) { $('feedback').textContent = 'These nodes are already connected.'; return; }
  edit(()=>edges.push([a,b]), `${label(a)} and ${label(b)} connected.`);
});
$('removeNode').addEventListener('click', ()=>{
  if (nodes.length <= 1) return;
  const id = Number($('deleteNode').value), name = label(id);
  edit(()=>{ nodes = nodes.filter(node=>node.id!==id); edges = edges.filter(edge=>!edge.includes(id)); }, `${name} and its connections removed. Undo is available.`);
});
$('removeEdge').addEventListener('click', ()=>{ if (edges.length) edit(()=>edges.splice(Number($('deleteEdge').value),1), 'Connection removed.'); });
$('undo').addEventListener('click', ()=>{ if (!history.length) return; pause(); ({ nodes,edges } = history.pop()); fillSelects(); reset(); save(); $('feedback').textContent = 'Previous graph restored.'; });
function selectNode(event) {
  const node = event.target.closest('[data-id]'); if (!node) return;
  const id = node.dataset.id; $('start').value = id; reset();
  if (event.type === 'keydown') $('graph').querySelector(`[data-id="${id}"]`).focus();
}
$('graph').addEventListener('click', selectNode);
$('graph').addEventListener('keydown', event=>{ if (event.key==='Enter'||event.key===' ') { event.preventDefault(); event.stopPropagation(); selectNode(event); } });
document.addEventListener('keydown', event=>{
  if (event.target.closest('input,select,textarea,button,summary,a,[role="button"]') || event.ctrlKey || event.altKey || event.metaKey) return;
  if (event.code==='Space') { event.preventDefault(); play(); }
  if (event.key==='ArrowRight') { event.preventDefault(); move(1); }
  if (event.key==='ArrowLeft') { event.preventDefault(); move(-1); }
});
$('export').addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify({ version: 1, ...snapshot() },null,2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = 'network-lab-graph.json'; link.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
});
$('import').addEventListener('click', ()=>$('file').click());
$('file').addEventListener('change', async ()=>{
  const file = $('file').files[0]; if (!file) return;
  try {
    if (file.size > 100000) throw new Error('Use a JSON file smaller than 100 KB.');
    const graph = validateGraph(JSON.parse(await file.text()));
    edit(()=>{ ({nodes,edges} = graph); }, 'Graph imported. Undo restores the previous network.');
  } catch (error) { $('feedback').textContent = `Import failed: ${error.message}`; }
  $('file').value = '';
});
function theme(dark) { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; $('theme').textContent = dark ? 'Light theme' : 'Dark theme'; $('theme').setAttribute('aria-pressed', String(dark)); }
$('theme').addEventListener('click', ()=>{ const dark = document.documentElement.dataset.theme !== 'dark'; theme(dark); try { localStorage.setItem('network-lab-theme', dark ? 'dark' : 'light'); } catch {} });
({nodes,edges} = example('organization'));
try { const saved = localStorage.getItem(STORAGE); if (saved) ({nodes,edges} = validateGraph(JSON.parse(saved))); theme(localStorage.getItem('network-lab-theme') === 'dark'); }
catch { $('feedback').textContent = 'Saved graph could not be loaded. The example is ready.'; }
fillSelects(); reset(); save();
