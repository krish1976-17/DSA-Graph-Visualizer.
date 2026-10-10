const assert = require('node:assert/strict');
const { adjacency, traverse, stats } = require('./algorithms.js');
const nodes = Array.from({length:7}, (_,id)=>({id}));
const map = adjacency(nodes,[[0,1],[0,2],[1,3],[1,4],[2,5],[2,6]]);
assert.deepEqual(traverse(map,0,'bfs').at(-1).order,[0,1,2,3,4,5,6]);
const dfs = traverse(map,0,'dfs');
assert.deepEqual(dfs.at(-1).order,[0,1,3,4,2,5,6]);
assert.equal(dfs.filter(frame=>frame.action==='return').length,7);
assert.deepEqual(dfs.at(-1).frontier,[]);
assert.deepEqual(traverse(map,0,'bfs').at(-1).distance,{0:0,1:1,2:1,3:2,4:2,5:2,6:2});
const cycle = adjacency(nodes,[[0,1],[1,2],[2,0],[3,4]]);
for(const mode of ['bfs','dfs']) assert.deepEqual(new Set(traverse(cycle,0,mode).at(-1).order),new Set([0,1,2]));
assert.deepEqual(stats(cycle,0),{groups:4,reachable:3});
assert.deepEqual(traverse(adjacency([{id:9}],[]),9,'bfs').at(-1).order,[9]);
console.log('Algorithm checks passed: BFS, DFS, backtracking, distances, cycles, disconnected and single-node graphs.');


