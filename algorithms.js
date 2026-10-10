/* Pure graph algorithms, shared by the page and the verification suite. */
(function (root) {
  'use strict';
  function adjacency(nodes, edges) {
    const map = new Map(nodes.map(node => [node.id, []]));
    for (const [a, b] of edges) {
      map.get(a).push(b);
      map.get(b).push(a);
    }
    return map;
  }
  function traverse(map, start, algorithm) {
    const frames = [], seen = new Set(), order = [], tree = [], distance = {};
    const record = (current, frontier, action, subject = current) => {
      frames.push({ current, frontier: [...frontier], action, subject,
        order: [...order], discovered: [...seen], tree: tree.map(edge => [...edge]),
        distance: { ...distance }, done: action === 'complete' });
    };
    record(null, [], 'ready', start);
    if (!map.has(start)) return frames;
    seen.add(start);
    distance[start] = 0;
    if (algorithm === 'bfs') {
      const queue = [start];
      let head = 0;
      record(null, queue, 'discover', start);
      while (head < queue.length) {
        const current = queue[head++];
        order.push(current);
        record(current, queue.slice(head), 'visit');
        for (const neighbor of map.get(current)) {
          if (seen.has(neighbor)) continue;
          seen.add(neighbor);
          distance[neighbor] = distance[current] + 1;
          tree.push([current, neighbor]);
          queue.push(neighbor);
          record(current, queue.slice(head), 'discover', neighbor);
        }
      }
    } else {
      const stack = [];
      function visit(current) {
        stack.push(current);
        order.push(current);
        record(current, stack, 'visit');
        for (const neighbor of map.get(current)) {
          if (seen.has(neighbor)) continue;
          seen.add(neighbor);
          distance[neighbor] = distance[current] + 1;
          tree.push([current, neighbor]);
          record(current, stack, 'discover', neighbor);
          visit(neighbor);
        }
        stack.pop();
        record(stack.at(-1) ?? null, stack, 'return', current);
      }
      record(null, [], 'discover', start);
      visit(start);
    }
    record(null, [], 'complete');
    return frames;
  }
  function stats(map, start) {
    const seen = new Set();
    let groups = 0, reachable = 0;
    for (const id of map.keys()) {
      if (seen.has(id)) continue;
      groups++;
      const queue = [id];
      seen.add(id);
      for (let i = 0; i < queue.length; i++) {
        for (const next of map.get(queue[i])) {
          if (!seen.has(next)) { seen.add(next); queue.push(next); }
        }
      }
      if (queue.includes(start)) reachable = queue.length;
    }
    return { groups, reachable };
  }
  const api = { adjacency, traverse, stats };
  if (typeof module !== 'undefined') module.exports = api;
  root.GraphAlgorithms = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
