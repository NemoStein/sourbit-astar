export class DirectedGraph {
  constructor () {
    this.nodes = 0

    /** @type {Map<number, Map<number, number>>} */
    this.connections = new Map()

    /** @type {boolean[]} */
    this.disabled = []
  }

  add () {
    const node = ++this.nodes
    this.connections.set(node, new Map())

    return node
  }

  /**
   * @param {number} node
   */
  remove (node) {
    this.connections.delete(node)

    for (const connections of this.connections.values()) {
      connections.delete(node)
    }
  }

  /**
   * @param {number} a
   * @param {number} b
   * @param {number} weight
   */
  connect (a, b, weight) {
    this.connections.get(a)?.set(b, weight)
  }

  /**
   * @param {number} a
   * @param {number} b
   */
  disconnect (a, b) {
    this.connections.get(a)?.delete(b)
  }

  /**
   * @param {number} a
   * @param {number} b
   */
  split (a, b) {
    const cost = this.connections.get(a)?.get(b)
    if (cost == null) {
      throw new Error(`Nodes "${a}" and "${b}" aren't connected`)
    }

    const node = this.add()
    this.disconnect(a, b)
    this.connect(a, node, cost / 2)
    this.connect(node, b, cost / 2)

    return node
  }

  /**
   * @param {number} node
   */
  enable (node) {
    this.disabled[node] = false
  }

  /**
   * @param {number} node
   */
  disable (node) {
    this.disabled[node] = true
  }

  /**
   * @param {number} origin
   * @param {number} target
   */
  find (origin, target) {
    // Start Open list
    const open = [origin]

    /** @type {boolean[]} */
    const closed = []

    /** @type {number[]} */
    const costs = []

    /** @type {number[]} */
    const paths = []

    costs[origin] = 0

    // Core Loop
    // -> While open list is not empty
    let foundPath = false
    while (open.length > 0) {
      // Find smallest F (total cost) in open list
      let node = 0
      let cost = Infinity
      let openIndex = 0
      for (let i = 0; i < open.length; ++i) {
        const nodeIndex = open[i]
        const nodeCost = costs[nodeIndex]

        if (cost > nodeCost) {
          node = nodeIndex
          cost = nodeCost
          openIndex = i
        }
      }

      // Is it the target? Terminate search
      if (node === target) {
        foundPath = true
        break
      }

      // Remove node from open list
      const last = open[open.length - 1]
      open[openIndex] = last
      open.length--

      // Close node
      closed[node] = true

      // -> For each neighbor
      /** @type {Map<number, number>} */
      const connections = (this.connections.get(node))
      for (const [neighbor, cost] of connections) {
        // If neighbor is closed -> Skip
        if (closed[neighbor]) {
          continue
        }

        // If neighbor is a block -> Skip
        if (this.disabled[neighbor]) {
          continue
        }

        // Calculate G (travel cost)
        const travelCost = cost + costs[node]

        // If neighbor is in open list and new G is lower -> Update path
        let isOpen = false
        for (const openNode of open) {
          if (openNode === neighbor) {
            if (costs[neighbor] > travelCost) {
              costs[neighbor] = travelCost
              paths[neighbor] = node
            }
            isOpen = true
            break
          }
        }

        // If neighbor is not in open list
        if (!isOpen) {
          // Add neighbor to open list
          open.push(neighbor)
          paths[neighbor] = node

          // Calculate neighbor G
          costs[neighbor] = travelCost
        }
      }
    }

    // Backtrack
    if (foundPath) {
      const path = []
      let node = target
      while (paths[node] != null) {
        path.push(node)
        node = paths[node]
      }
      path.push(node)
      return path.reverse()
    }

    return []
  }

  /**
   * @param {number} width
   * @param {number} height
   * @param {number[]} costs
   */
  createGrid (width, height, costs) {
    if (costs.length !== width * height) {
      throw new Error('Size of "costs" doesn\'t match "width" and "height".')
    }

    /** @type {number[]} */
    const nodes = []

    for (let y = 0; y < height; ++y) {
      for (let x = 0; x < width; ++x) {
        const index = x + y * width
        const node = this.add()
        nodes[index] = node

        if (x - 1 >= 0) {
          const neighbor = (x - 1) + y * width
          this.connect(node, nodes[neighbor], costs[neighbor])
          this.connect(nodes[neighbor], node, costs[index])
        }

        if (y - 1 >= 0) {
          const neighbor = x + (y - 1) * width
          this.connect(node, nodes[neighbor], costs[neighbor])
          this.connect(nodes[neighbor], node, costs[index])
        }
      }
    }

    return nodes
  }
}
