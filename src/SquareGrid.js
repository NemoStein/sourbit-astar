/** @enum {number} */
export const Corners = {
  NONE: 0,
  WALK: 1,
  CUT: 2,
  PHASE: 3
}

export class Grid {
  /**
   * @param {number} width
   * @param {number} height
   * @param {number[]} costs
   */
  constructor (width, height, costs) {
    if (costs.length !== width * height) {
      throw new Error('Size of "costs" doesn\'t match "width" and "height".')
    }

    this.width = width
    this.height = height

    /** @type {number[]} */
    this.depth = [...costs]
  }

  /**
   * @param {{x:number, y:number}} origin
   * @param {{x:number, y:number}} target
   * @param {Corners} corners
   */
  find (origin, target, corners = Corners.NONE) {
    // Get origin & target Nodes
    const originIndex = this.positionToIndex(origin.x, origin.y)
    const targetIndex = this.positionToIndex(target.x, target.y)

    // Start Open list
    const open = [originIndex]

    /** @type {boolean[]} */
    const closed = []

    /** @type {number[]} */
    const costs = []

    /** @type {number[]} */
    const heuristics = []

    /** @type {number[]} */
    const estimateCosts = []

    /** @type {number[]} */
    const paths = []

    costs[originIndex] = 0
    estimateCosts[originIndex] = 0

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
        const nodeCost = estimateCosts[nodeIndex]

        if (cost > nodeCost) {
          node = nodeIndex
          cost = nodeCost
          openIndex = i
        }
      }

      // Is it the target? Terminate search
      if (node === targetIndex) {
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
      const { x: nodeX, y: nodeY } = this.indexToPosition(node)
      for (let x = nodeX - 1; x <= nodeX + 1; ++x) {
        // Is x out-of-bounds?
        if (x < 0 || x >= this.width) {
          continue
        }

        for (let y = nodeY - 1; y <= nodeY + 1; ++y) {
          // Is y out-of-bounds?
          if (y < 0 || y >= this.height) {
            continue
          }

          // Ignore itself
          if (x === nodeX && y === nodeY) {
            continue
          }

          // If diagonals is not allowed -> Skip diagonal neighbor
          if (corners === Corners.NONE && x !== nodeX && y !== nodeY) {
            continue
          }

          const neighbor = this.positionToIndex(x, y)

          // If neighbor is closed -> Skip
          if (closed[neighbor]) {
            continue
          }

          // If neighbor is a block -> Skip
          if (this.depth[neighbor] === 0) {
            continue
          }

          // Check corners
          if (corners < Corners.PHASE) {
            const blockL = this.depth[this.positionToIndex(nodeX - 1, nodeY)] === 0
            const blockR = this.depth[this.positionToIndex(nodeX + 1, nodeY)] === 0
            const blockU = this.depth[this.positionToIndex(nodeX, nodeY - 1)] === 0
            const blockD = this.depth[this.positionToIndex(nodeX, nodeY + 1)] === 0
            const none = corners < Corners.CUT

            if ((
              (x < nodeX && blockL && (none || (y < nodeY && blockU) || (y > nodeY && blockD))) ||
              (x > nodeX && blockR && (none || (y < nodeY && blockU) || (y > nodeY && blockD))) ||
              (y < nodeY && blockU && (none || (x < nodeX && blockL) || (x > nodeX && blockR))) ||
              (y > nodeY && blockD && (none || (x < nodeX && blockL) || (x > nodeX && blockR)))
            )) {
              continue
            }
          }

          // Calculate G (travel cost)
          const travelCost = this.depth[neighbor] * (x !== nodeX && y !== nodeY ? 1.4 : 1) + costs[node]

          // If neighbor is in open list and new G is lower -> Update path
          let isOpen = false
          for (const openNode of open) {
            if (openNode === neighbor) {
              if (costs[neighbor] > travelCost) {
                costs[neighbor] = travelCost
                paths[neighbor] = node
                estimateCosts[neighbor] = heuristics[neighbor] + travelCost
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

            // Calculate neighbor H (Heuristic), G and F
            const heuristic = Math.abs(x - target.x) + Math.abs(y - target.y)
            heuristics[neighbor] = heuristic
            costs[neighbor] = travelCost
            estimateCosts[neighbor] = heuristic + travelCost
          }
        }
      }
    }

    // Backtrack
    if (foundPath) {
      const path = []
      let node = targetIndex
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
   * @private
   * @param {number} x
   * @param {number} y
   */
  positionToIndex (x, y) {
    return x + y * this.width
  }

  /**
   * @private
   * @param {number} i
   */
  indexToPosition (i) {
    return {
      x: i % this.width,
      y: Math.floor(i / this.width)
    }
  }
}
