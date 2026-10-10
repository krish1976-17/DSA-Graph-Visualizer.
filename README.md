# Organization Network Analysis — Graph Traversal Visualizer

A browser-based DSA project built with HTML, CSS, and JavaScript.
No packages, API keys, database, or build step are required.

## Run it with VS Code

1. Extract the ZIP file.
2. In VS Code, choose File > Open Folder and select organization-network-visualizer.
3. Open index.html from that folder in your web browser (double-click it in File Explorer).
4. Edit the files in VS Code, save, and refresh your browser to see your changes.

Keep index.html, style.css, and app.js together in the same folder.
If you already use a local preview/server extension in VS Code, you can also serve this folder with it.

## Files

- index.html: page structure, controls, and accessible labels.
- style.css: colors, layout, responsive styles, and node presentation.
- app.js: graph data, BFS and DFS, animation, editing controls, and network analysis.
- README.md: setup instructions and an explanation of the project.

For easier reading in VS Code, use Format Document on the HTML, CSS, and JavaScript files.

## Try the example

1. Keep CEO as the starting node.
2. Choose Breadth-first search (BFS).
3. Press Start to animate, or Step to advance one step at a time.
4. Use Pause, Reset traversal, and the Step duration slider as needed.
5. Switch to Depth-first search (DFS) to compare the visiting order.

BFS order from CEO:
CEO -> HR -> Tech -> Ana -> Ben -> Ravi -> Sara

DFS order from CEO:
CEO -> HR -> Ana -> Ben -> Tech -> Ravi -> Sara

The example is an undirected graph: a connection means "works with", rather than a directed reporting relationship.
Neighbors are considered in connection insertion order.

## Edit the network

- Enter a unique person or department name and press +.
- Select two different nodes and press Add connection.
- Click a node, or use Start from, to change the starting point.
- Restore example returns to the original seven-node network.

Adding a node initially creates a disconnected group. Connect it to an existing node to make it reachable.
The interface supports up to 18 nodes and names of up to 24 characters.
Duplicate names, duplicate connections, and connections from a node to itself are rejected.
Changes live in browser memory and reset when the page is refreshed. This version does not save networks or include node/edge deletion.

## How the DSA works

- adjacency(): converts the nodes and edges into a Map of neighbor arrays (an adjacency list).
- traversal(): creates the animation snapshots for BFS or DFS.
- BFS uses an array queue and a moving head index. It marks nodes discovered when they enter the queue, preventing duplicate visits in cycles.
- DFS uses recursion and a visited Set. The displayed call stack represents the active recursive path.
- networkStats(): counts connected components and the nodes reachable from the selected starting point.
- step(), tick(), togglePlay(), and pause(): control traversal playback.
- render() and draw(): update the panels and the SVG graph.

The underlying BFS and DFS traversals take O(V + E) time and O(V) extra traversal space, where V is the number of nodes and E the number of edges. This educational visualizer additionally copies snapshots to enable playback; snapshot storage and copying can take O(V^2) space/time. Rendering costs are separate from the graph algorithm.

The last animation step clears the active node and queue/stack and reports completion.
A traversal explores only the connected component containing its starting node.

## Optional browser-agent integration

app.js contains optional WebMCP tool registration at the end. It is feature-detected and is skipped automatically in browsers that do not support it. The visualizer works without this integration.

## Quick manual checks

- Confirm the two example visit orders above.
- Add Finance: connected groups should increase to 2 and CEO should still reach 7 of 8 nodes.
- Connect CEO and Finance: connected groups should return to 1 and CEO should reach all 8 nodes.
- Add a connection between Ana and Sara to create a cycle; every node should still be visited only once.
- Pause playback and use Step to advance manually.
