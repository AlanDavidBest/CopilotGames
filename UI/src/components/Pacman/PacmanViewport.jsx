import { useEffect, useRef, useState } from 'react'

const MAZE_TEMPLATE = [
  '############################',
  '#o...........##...........o#',
  '#.####.#####.##.#####.####.#',
  '#.####.#####.##.#####.####.#',
  '#..........................#',
  '#.####.##.########.##.####.#',
  '#......##....##....##......#',
  '######.#####.##.#####.######',
  '     #.#####.##.#####.#     ',
  '     #.##..........##.#     ',
  '######.##.###--###.##.######',
  '...... ...#      #... ......',
  '######.##.#      #.##.######',
  '     #.##.########.##.#     ',
  '     #.##..........##.#     ',
  '######.##.########.##.######',
  '#............##............#',
  '#.####.#####.##.#####.####.#',
  '#o..##................##..o#',
  '###.##.##.########.##.##.###',
  '#......##....##....##......#',
  '#.##########.##.##########.#',
  '#..........................#',
  '############################',
]

const PACMAN_START = { x: 14, y: 18 }
const GHOST_STARTS = [
  { x: 13, y: 11, dir: 'up', color: '#ff4e96', releaseDelay: 0 },
  { x: 14, y: 11, dir: 'up', color: '#62f2ff', releaseDelay: 1.2 },
  { x: 12, y: 11, dir: 'right', color: '#ffad4a', releaseDelay: 2.4 },
  { x: 15, y: 11, dir: 'left', color: '#ff5f5f', releaseDelay: 3.6 },
]

const GHOST_PERSONALITIES = ['blinky', 'pinky', 'inky', 'clyde']
const DEFAULT_GHOST_VISIBILITY = {
  blinky: true,
  pinky: true,
  inky: true,
  clyde: true,
}

const PACMAN_SPEED = 5.4
const GHOST_SPEED = 4.4
const FRIGHTENED_GHOST_SPEED = GHOST_SPEED / 2
const FRIGHTENED_DURATION = 7
const DEATH_FREEZE = 0.8
const GHOST_EXIT_ROW = 9
const GHOST_DOOR_COLUMNS = [13, 14]

const GHOST_ROUTES = {
  blinky: [
    { x: 6, y: 9 },
    { x: 6, y: 4 },
    { x: 1, y: 4 },
    { x: 1, y: 1 },
    { x: 12, y: 1 },
    { x: 12, y: 4 },
    { x: 15, y: 4 },
    { x: 15, y: 1 },
    { x: 21, y: 1 },
    { x: 21, y: 4 },
    { x: 26, y: 4 },
    { x: 21, y: 4 },
    { x: 21, y: 9 },
    { x: 21, y: 4 },
    { x: 18, y: 4 },
    { x: 18, y: 6 },
    { x: 15, y: 6 },
    { x: 15, y: 9 },
    { x: 17, y: 9 },
    { x: 15, y: 9 },
    { x: 15, y: 6 },
    { x: 18, y: 6 },
    { x: 18, y: 4 },
    { x: 6, y: 4 },
    { x: 6, y: 9 },
  ],
  pinky: [
    { x: 21, y: 9 },
    { x: 26, y: 16 },
    { x: 26, y: 22 },
    { x: 21, y: 22 },
    { x: 21, y: 20 },
    { x: 17, y: 20 },
    { x: 15, y: 18 },
    { x: 21, y: 16 },
    { x: 24, y: 18 },
    { x: 24, y: 22 },
  ],
  inky: [
    { x: 6, y: 16 },
    { x: 6, y: 22 },
    { x: 1, y: 22 },
    { x: 1, y: 16 },
    { x: 6, y: 20 },
    { x: 10, y: 20 },
    { x: 13, y: 22 },
    { x: 17, y: 22 },
    { x: 21, y: 22 },
    { x: 21, y: 16 },
    { x: 17, y: 20 },
    { x: 6, y: 22 },
  ],
  clyde: [
    { x: 6, y: 9 },
    { x: 9, y: 14 },
    { x: 9, y: 20 },
    { x: 12, y: 20 },
    { x: 15, y: 20 },
    { x: 18, y: 20 },
    { x: 18, y: 16 },
    { x: 13, y: 18 },
    { x: 10, y: 18 },
    { x: 6, y: 16 },
    { x: 1, y: 16 },
    { x: 6, y: 14 },
    { x: 13, y: 20 },
  ],
}

const GHOST_EXIT_PATHS = {
  blinky: [
    { x: 13, y: 10 },
    { x: 13, y: 9 },
    { x: 10, y: 9 },
    { x: 6, y: 9 },
  ],
  pinky: [
    { x: 14, y: 10 },
    { x: 14, y: 9 },
    { x: 17, y: 9 },
    { x: 21, y: 9 },
  ],
  inky: [
    { x: 13, y: 11 },
    { x: 13, y: 10 },
    { x: 13, y: 9 },
    { x: 9, y: 9 },
    { x: 6, y: 9 },
  ],
  clyde: [
    { x: 14, y: 11 },
    { x: 14, y: 10 },
    { x: 14, y: 9 },
    { x: 18, y: 9 },
    { x: 21, y: 9 },
  ],
}

const DIRECTIONS = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
}

const OPPOSITE_DIRECTION = {
  left: 'right',
  right: 'left',
  up: 'down',
  down: 'up',
}

const DIR_KEYS = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
  KeyA: 'left',
  KeyD: 'right',
  KeyW: 'up',
  KeyS: 'down',
}

const DIRECTION_ORDER = ['up', 'left', 'down', 'right']

const wrap = (value, max) => {
  if (value < 0) return value + max
  if (value >= max) return value - max
  return value
}

const cloneMaze = () => MAZE_TEMPLATE.map((row) => row.split(''))

const tileAt = (maze, x, y) => {
  if (y < 0 || y >= maze.length) return '#'
  return maze[y][wrap(x, maze[0].length)]
}

const isWalkableTile = (tile, actorType) => {
  if (tile === '#') return false
  if (tile === '-') return actorType === 'ghost'
  return true
}

const canMoveFromTile = (maze, tileX, tileY, dirName, actorType) => {
  if (!dirName) return false
  const dir = DIRECTIONS[dirName]
  const nextX = wrap(tileX + dir.x, maze[0].length)
  const nextY = tileY + dir.y
  return isWalkableTile(tileAt(maze, nextX, nextY), actorType)
}

const cloneNode = (node) => ({ x: node.x, y: node.y, ...(node.dir ? { dir: node.dir } : {}) })

const makeCyclicNodes = (nodes) => {
  if (!nodes || nodes.length === 0) {
    return []
  }

  const cloned = nodes.map(cloneNode)
  const first = cloned[0]
  const last = cloned[cloned.length - 1]
  if (first.x !== last.x || first.y !== last.y) {
    cloned.push(cloneNode(first))
  }
  return cloned
}

const createPacman = () => ({
  tileX: PACMAN_START.x,
  tileY: PACMAN_START.y,
  dir: 'left',
  nextDir: 'left',
  progress: 0,
  mouth: 0,
})

const createGhosts = () =>
  GHOST_STARTS.map((ghost, index) => {
    const personality = GHOST_PERSONALITIES[index]
    const route = makeCyclicNodes(GHOST_ROUTES[personality])

    return {
      personality,
      tileX: ghost.x,
      tileY: ghost.y,
      dir: ghost.dir,
      progress: 0,
      color: ghost.color,
      homeX: ghost.x,
      homeY: ghost.y,
      releaseTimer: ghost.releaseDelay,
      mode: index === 0 ? 'exiting' : 'pen',
      exitPath: GHOST_EXIT_PATHS[personality],
      exitPathIndex: 0,
      route,
      routeIndex: route.length > 0 ? index % route.length : 0,
    }
  })

const resetActors = (state) => {
  state.pacman = createPacman()
  state.ghosts = createGhosts()
  state.frightenedTimer = 0
  state.ghostCombo = 0

  state.ghosts.forEach((ghost) => {
    ghost.route = withRouteDirections(state.maze, ghost.route, 'ghost', false)
  })
}

const getActorPosition = (actor, width) => {
  if (!actor.dir || actor.progress <= 0) {
    return { x: actor.tileX, y: actor.tileY }
  }

  const dir = DIRECTIONS[actor.dir]
  return {
    x: wrap(actor.tileX + dir.x * actor.progress, width),
    y: actor.tileY + dir.y * actor.progress,
  }
}

const getGhostOptions = (maze, ghost) => {
  return Object.keys(DIRECTIONS).filter((name) => canMoveFromTile(maze, ghost.tileX, ghost.tileY, name, 'ghost'))
}

const findPathTiles = (maze, startX, startY, targetX, targetY, actorType) => {
  const width = maze[0].length
  const normalizedStartX = wrap(startX, width)
  const normalizedTargetX = wrap(targetX, width)
  const startKey = `${normalizedStartX},${startY}`
  const targetKey = `${normalizedTargetX},${targetY}`

  if (!isWalkableTile(tileAt(maze, normalizedStartX, startY), actorType)) {
    return null
  }
  if (!isWalkableTile(tileAt(maze, normalizedTargetX, targetY), actorType)) {
    return null
  }

  if (startKey === targetKey) {
    return [{ x: normalizedStartX, y: startY }]
  }

  const queue = [{ x: normalizedStartX, y: startY }]
  const visited = new Set([startKey])
  const previous = new Map()

  while (queue.length > 0) {
    const current = queue.shift()
    const currentKey = `${current.x},${current.y}`

    if (currentKey === targetKey) {
      const path = []
      let walker = currentKey
      while (walker) {
        const [x, y] = walker.split(',').map(Number)
        path.push({ x, y })
        walker = previous.get(walker)
      }
      path.reverse()
      return path
    }

    DIRECTION_ORDER.forEach((dirName) => {
      const dir = DIRECTIONS[dirName]
      const nextX = wrap(current.x + dir.x, width)
      const nextY = current.y + dir.y
      if (!isWalkableTile(tileAt(maze, nextX, nextY), actorType)) {
        return
      }

      const nextKey = `${nextX},${nextY}`
      if (visited.has(nextKey)) {
        return
      }

      visited.add(nextKey)
      previous.set(nextKey, currentKey)
      queue.push({ x: nextX, y: nextY })
    })
  }

  return null
}

const findPathDirection = (maze, startX, startY, targetX, targetY, actorType) => {
  const width = maze[0].length
  const path = findPathTiles(maze, startX, startY, targetX, targetY, actorType)
  if (!path || path.length < 2) {
    return null
  }

  const from = path[0]
  const to = path[1]
  if (to.x === wrap(from.x - 1, width) && to.y === from.y) return 'left'
  if (to.x === wrap(from.x + 1, width) && to.y === from.y) return 'right'
  if (to.x === from.x && to.y === from.y - 1) return 'up'
  if (to.x === from.x && to.y === from.y + 1) return 'down'
  return null
}

const buildMazeConstrainedPolylines = (maze, nodes, actorType, closed = false) => {
  if (!nodes || nodes.length < 2) {
    return []
  }

  const width = maze[0].length
  const segmentCount = closed ? nodes.length : nodes.length - 1
  const polylines = []

  for (let i = 0; i < segmentCount; i += 1) {
    const from = nodes[i]
    const to = nodes[(i + 1) % nodes.length]
    const segment = findPathTiles(
      maze,
      wrap(Math.round(from.x), width),
      Math.round(from.y),
      wrap(Math.round(to.x), width),
      Math.round(to.y),
      actorType,
    )
    if (!segment || segment.length < 2) {
      continue
    }

    const lastPolyline = polylines[polylines.length - 1]
    if (!lastPolyline) {
      polylines.push(segment)
      continue
    }

    const tail = lastPolyline[lastPolyline.length - 1]
    const head = segment[0]
    if (tail.x === head.x && tail.y === head.y) {
      lastPolyline.push(...segment.slice(1))
    } else {
      polylines.push(segment)
    }
  }

  return polylines
}

const withRouteDirections = (maze, nodes, actorType, closed = false) => {
  if (!nodes || nodes.length === 0) {
    return []
  }

  const width = maze[0].length
  const decorated = nodes.map((node) => ({ x: node.x, y: node.y, dir: node.dir ?? null }))
  const segmentCount = closed ? decorated.length : decorated.length - 1

  for (let i = 0; i < segmentCount; i += 1) {
    const from = decorated[i]
    const to = decorated[(i + 1) % decorated.length]
    const dir = findPathDirection(
      maze,
      wrap(Math.round(from.x), width),
      Math.round(from.y),
      wrap(Math.round(to.x), width),
      Math.round(to.y),
      actorType,
    )
    if (dir) {
      from.dir = dir
    }
  }

  const first = decorated[0]
  const last = decorated[decorated.length - 1]
  if (first && last && first.x === last.x && first.y === last.y && !last.dir) {
    last.dir = first.dir ?? null
  }

  return decorated
}

const updateGhostRouteTarget = (ghost) => {
  if (!ghost.route || ghost.route.length === 0) {
    return { x: ghost.tileX, y: ghost.tileY }
  }
  let target = ghost.route[ghost.routeIndex % ghost.route.length]
  if (ghost.tileX === target.x && ghost.tileY === target.y) {
    ghost.routeIndex = (ghost.routeIndex + 1) % ghost.route.length
    target = ghost.route[ghost.routeIndex]
  }
  return target
}

const updateGhostExitTarget = (ghost) => {
  if (!ghost.exitPath || ghost.exitPath.length === 0) {
    return null
  }

  const lastIndex = ghost.exitPath.length - 1
  const clampedIndex = Math.max(0, Math.min(ghost.exitPathIndex, lastIndex))
  ghost.exitPathIndex = clampedIndex

  let target = ghost.exitPath[clampedIndex]
  if (ghost.tileX === target.x && ghost.tileY === target.y) {
    if (clampedIndex >= lastIndex) {
      // Final exit waypoint reached: hand off to main cyclic route.
      return null
    }

    ghost.exitPathIndex = clampedIndex + 1
    target = ghost.exitPath[ghost.exitPathIndex]
  }

  return target
}

const getGhostTargetDirection = (state, ghost, nodes, indexKey, advanceTarget) => {
  if (!nodes || nodes.length === 0) {
    return null
  }

  for (let attempts = 0; attempts < nodes.length; attempts += 1) {
    const target = advanceTarget(ghost)
    const targetX = wrap(Math.round(target.x), state.width)
    const targetY = Math.round(target.y)
    const direction = findPathDirection(state.maze, ghost.tileX, ghost.tileY, targetX, targetY, 'ghost')
    if (direction) {
      return direction
    }

    // Skip invalid or disconnected waypoints instead of drifting off-route.
    ghost[indexKey] = (ghost[indexKey] + 1) % nodes.length
  }

  return null
}

const getRouteAxisDirection = (state, ghost) => {
  if (!ghost.route || ghost.route.length === 0) {
    return null
  }

  const target = updateGhostRouteTarget(ghost)
  if (!target) {
    return null
  }

  const targetX = wrap(Math.round(target.x), state.width)
  const targetY = Math.round(target.y)
  const fromX = ghost.tileX
  const fromY = ghost.tileY

  if (fromX === targetX) {
    if (fromY < targetY) return 'down'
    if (fromY > targetY) return 'up'
    return null
  }

  if (fromY === targetY) {
    const rightDist = (targetX - fromX + state.width) % state.width
    const leftDist = (fromX - targetX + state.width) % state.width
    if (rightDist === leftDist) {
      return ghost.dir === 'left' ? 'left' : 'right'
    }
    return rightDist < leftDist ? 'right' : 'left'
  }

  return null
}

const chooseGhostDirection = (state, ghost) => {
  if (ghost.mode === 'pen') {
    return null
  }

  let options = getGhostOptions(state.maze, ghost)
  if (options.length === 0) {
    return ghost.dir
  }

  if (ghost.mode === 'exiting') {
    const target = updateGhostExitTarget(ghost)
    if (!target) {
      ghost.mode = 'chase'
      ghost.routeIndex = 0
      const axisDir = getRouteAxisDirection(state, ghost)
      if (axisDir && options.includes(axisDir)) {
        return axisDir
      }
    } else {
      const pathDir = findPathDirection(
        state.maze,
        ghost.tileX,
        ghost.tileY,
        wrap(Math.round(target.x), state.width),
        Math.round(target.y),
        'ghost',
      )
      if (pathDir && options.includes(pathDir)) {
        return pathDir
      }
    }
  }

  if (ghost.mode === 'chase') {
    const axisDir = getRouteAxisDirection(state, ghost)
    if (axisDir && options.includes(axisDir)) {
      return axisDir
    }
  }

  let pathDir = null
  if (ghost.mode === 'chase') {
    pathDir = getGhostTargetDirection(state, ghost, ghost.route, 'routeIndex', updateGhostRouteTarget)
  }

  if (pathDir && options.includes(pathDir)) {
    return pathDir
  }

  const nonReverse = options.filter((name) => name !== OPPOSITE_DIRECTION[ghost.dir])
  const fallback = nonReverse.length > 0 ? nonReverse : options
  return fallback[0]
}

const moveActor = (state, actor, speed, dt, actorType, chooseDir) => {
  let remainingDistance = speed * dt

  while (remainingDistance > 0) {
    if (actor.progress === 0) {
      const nextDir = chooseDir()
      if (!nextDir || !canMoveFromTile(state.maze, actor.tileX, actor.tileY, nextDir, actorType)) {
        actor.progress = 0
        return false
      }
      actor.dir = nextDir
    }

    const step = Math.min(remainingDistance, 1 - actor.progress)
    actor.progress += step
    remainingDistance -= step

    if (actor.progress >= 0.999999) {
      const dir = DIRECTIONS[actor.dir]
      actor.tileX = wrap(actor.tileX + dir.x, state.width)
      actor.tileY += dir.y
      actor.progress = 0
    }
  }

  return true
}

export default function PacmanViewport({ showDebugPaths = false, ghostVisibility = DEFAULT_GHOST_VISIBILITY }) {
  const canvasRef = useRef(null)
  const directionRef = useRef('left')
  const debugPathsRef = useRef(false)
  const ghostVisibilityRef = useRef(DEFAULT_GHOST_VISIBILITY)
  const audioRef = useRef({
    ctx: null,
    master: null,
    unlocked: false,
  })
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)

  useEffect(() => {
    debugPathsRef.current = showDebugPaths
  }, [showDebugPaths])

  useEffect(() => {
    ghostVisibilityRef.current = ghostVisibility
  }, [ghostVisibility])

  useEffect(() => {
    const ensureAudio = () => {
      if (audioRef.current.ctx) {
        return audioRef.current.ctx
      }

      const AudioCtor = window.AudioContext || window.webkitAudioContext
      if (!AudioCtor) {
        return null
      }

      const ctx = new AudioCtor()
      const master = ctx.createGain()
      master.gain.value = 0.34
      master.connect(ctx.destination)
      audioRef.current.ctx = ctx
      audioRef.current.master = master
      return ctx
    }

    const unlockAudio = () => {
      const ctx = ensureAudio()
      if (!ctx) {
        return
      }
      if (ctx.state === 'suspended') {
        void ctx.resume()
      }
      audioRef.current.unlocked = true
    }

    const playTone = ({
      type = 'square',
      freq = 440,
      endFreq = null,
      duration = 0.08,
      delay = 0,
      volume = 0.2,
      attack = 0.003,
      release = 0.04,
    }) => {
      const ctx = ensureAudio()
      const master = audioRef.current.master
      if (!ctx || !master || !audioRef.current.unlocked) {
        return
      }

      const start = ctx.currentTime + delay
      const end = start + duration
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = type
      osc.frequency.setValueAtTime(freq, start)
      if (endFreq != null) {
        osc.frequency.linearRampToValueAtTime(endFreq, end)
      }

      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), start + attack)
      gain.gain.exponentialRampToValueAtTime(0.0001, Math.max(start + attack + 0.001, end - release))
      gain.gain.exponentialRampToValueAtTime(0.0001, end)

      osc.connect(gain)
      gain.connect(master)
      osc.start(start)
      osc.stop(end + 0.02)
    }

    const playGulp = () => {
      const ctx = ensureAudio()
      const master = audioRef.current.master
      if (!ctx || !master || !audioRef.current.unlocked) {
        return
      }

      const now = ctx.currentTime
      const bodyOsc = ctx.createOscillator()
      const textureOsc = ctx.createOscillator()
      const bodyGain = ctx.createGain()
      const textureGain = ctx.createGain()
      const throatFilter = ctx.createBiquadFilter()
      const rumbleFilter = ctx.createBiquadFilter()

      bodyOsc.type = 'triangle'
      bodyOsc.frequency.setValueAtTime(170, now)
      bodyOsc.frequency.exponentialRampToValueAtTime(112, now + 0.09)

      textureOsc.type = 'sine'
      textureOsc.frequency.setValueAtTime(95, now)
      textureOsc.frequency.exponentialRampToValueAtTime(72, now + 0.1)

      throatFilter.type = 'bandpass'
      throatFilter.frequency.setValueAtTime(430, now)
      throatFilter.frequency.exponentialRampToValueAtTime(290, now + 0.1)
      throatFilter.Q.setValueAtTime(1.1, now)

      rumbleFilter.type = 'lowpass'
      rumbleFilter.frequency.setValueAtTime(230, now)
      rumbleFilter.frequency.exponentialRampToValueAtTime(150, now + 0.1)
      rumbleFilter.Q.setValueAtTime(0.55, now)

      // Smooth gulp envelope: soft attack, broad body, natural tail.
      bodyGain.gain.setValueAtTime(0.0001, now)
      bodyGain.gain.exponentialRampToValueAtTime(0.17, now + 0.02)
      bodyGain.gain.exponentialRampToValueAtTime(0.09, now + 0.06)
      bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.005)

      textureGain.gain.setValueAtTime(0.0001, now)
      textureGain.gain.exponentialRampToValueAtTime(0.095, now + 0.018)
      textureGain.gain.exponentialRampToValueAtTime(0.045, now + 0.055)
      textureGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.105)

      bodyOsc.connect(throatFilter)
      throatFilter.connect(bodyGain)
      bodyGain.connect(master)

      textureOsc.connect(rumbleFilter)
      rumbleFilter.connect(textureGain)
      textureGain.connect(master)

      bodyOsc.start(now)
      textureOsc.start(now + 0.004)
      bodyOsc.stop(now + 0.13)
      textureOsc.stop(now + 0.12)
    }

    const playSfx = (name) => {
      switch (name) {
        case 'pellet':
          playGulp()
          break
        case 'power':
          playTone({ type: 'triangle', freq: 370, endFreq: 520, duration: 0.09, volume: 0.14, release: 0.05 })
          playTone({ type: 'triangle', freq: 520, endFreq: 380, duration: 0.08, delay: 0.08, volume: 0.11, release: 0.04 })
          break
        case 'ghost-eaten':
          playTone({ type: 'sawtooth', freq: 780, endFreq: 430, duration: 0.12, volume: 0.13, release: 0.05 })
          playTone({ type: 'square', freq: 460, endFreq: 300, duration: 0.09, delay: 0.05, volume: 0.1, release: 0.04 })
          break
        case 'death':
          // Short descending musical run with crescendo (louder toward the end).
          ;[740, 698, 659, 587, 523, 466, 415, 370].forEach((note, index) => {
            const delay = index * 0.055
            const volume = 0.05 + index * 0.013
            playTone({ type: 'triangle', freq: note, endFreq: note * 0.96, duration: 0.09, delay, volume, release: 0.045 })
            playTone({ type: 'sawtooth', freq: note * 0.5, endFreq: note * 0.46, duration: 0.08, delay: delay + 0.008, volume: volume * 0.45, release: 0.04 })
          })
          break
        case 'level-clear':
          playTone({ type: 'square', freq: 520, duration: 0.07, volume: 0.1 })
          playTone({ type: 'square', freq: 660, duration: 0.07, delay: 0.08, volume: 0.1 })
          playTone({ type: 'square', freq: 880, duration: 0.1, delay: 0.16, volume: 0.11 })
          break
        default:
          break
      }
    }

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const isGhostEnabled = (ghost) => ghostVisibilityRef.current[ghost.personality] !== false

    const state = {
      maze: cloneMaze(),
      pacman: createPacman(),
      ghosts: createGhosts(),
      width: MAZE_TEMPLATE[0].length,
      height: MAZE_TEMPLATE.length,
      pixelWidth: 1,
      pixelHeight: 1,
      tileW: 1,
      tileH: 1,
      unit: 1,
      frightenedTimer: 0,
      ghostCombo: 0,
      blinkTimer: 0,
      deathFreeze: 0,
    }

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      state.pixelWidth = Math.max(1, canvas.clientWidth)
      state.pixelHeight = Math.max(1, canvas.clientHeight)
      state.tileW = state.pixelWidth / state.width
      state.tileH = state.pixelHeight / state.height
      state.unit = Math.min(state.tileW, state.tileH)

      canvas.width = Math.floor(state.pixelWidth * dpr)
      canvas.height = Math.floor(state.pixelHeight * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const resetLevel = () => {
      state.maze = cloneMaze()
      resetActors(state)
      directionRef.current = 'left'
    }

    const eatCurrentTile = () => {
      const pacmanPos = getActorPosition(state.pacman, state.width)
      const tx = wrap(Math.round(pacmanPos.x), state.width)
      const ty = Math.round(pacmanPos.y)
      const tile = tileAt(state.maze, tx, ty)
      if (tile === '.') {
        state.maze[ty][tx] = ' '
        setScore((prev) => prev + 10)
        playSfx('pellet')
      } else if (tile === 'o') {
        state.maze[ty][tx] = ' '
        state.frightenedTimer = FRIGHTENED_DURATION
        state.ghostCombo = 0
        state.ghosts.forEach((ghost) => {
          if (!isGhostEnabled(ghost)) {
            return
          }
          if (ghost.mode !== 'pen') {
            ghost.dir = OPPOSITE_DIRECTION[ghost.dir]
            ghost.progress = 0
          }
        })
        setScore((prev) => prev + 50)
        playSfx('power')
      }

      const hasConsumables = state.maze.some((row) => row.some((cell) => cell === '.' || cell === 'o'))
      if (!hasConsumables) {
        playSfx('level-clear')
        resetLevel()
      }
    }

    const movePacman = (dt) => {
      state.pacman.nextDir = directionRef.current
      const moved = moveActor(state, state.pacman, PACMAN_SPEED, dt, 'pacman', () => {
        if (state.pacman.progress === 0) {
          if (canMoveFromTile(state.maze, state.pacman.tileX, state.pacman.tileY, state.pacman.nextDir, 'pacman')) {
            return state.pacman.nextDir
          }
          if (canMoveFromTile(state.maze, state.pacman.tileX, state.pacman.tileY, state.pacman.dir, 'pacman')) {
            return state.pacman.dir
          }
          return null
        }
        return state.pacman.dir
      })

      if (moved) {
        state.pacman.mouth += dt * 18
      }
    }

    const moveGhost = (ghost, dt) => {
      if (ghost.mode === 'pen') {
        ghost.releaseTimer = Math.max(0, ghost.releaseTimer - dt)
        if (ghost.releaseTimer === 0) {
          ghost.mode = 'exiting'
          ghost.exitPathIndex = 0
        }
      }

      if (ghost.mode === 'pen') {
        return
      }

      const frightened = state.frightenedTimer > 0 && ghost.mode !== 'pen'
      const speed = frightened ? FRIGHTENED_GHOST_SPEED : GHOST_SPEED

      moveActor(state, ghost, speed, dt, 'ghost', () => chooseGhostDirection(state, ghost))
    }

    const drawMaze = () => {
      const BACKGROUND = 'rgba(2, 8, 18, 0.98)'
      ctx.fillStyle = BACKGROUND
      ctx.fillRect(0, 0, state.pixelWidth, state.pixelHeight)

      // --- Tube-style wall rendering ---
      const tw = state.tileW
      const th = state.tileH
      const GH = state.height
      const GW = state.width
      const WALL_BODY = '#0b1445'
      const WALL_EDGE = 'rgba(97, 190, 255, 0.93)'

      const hasWall = (x, y) => x >= 0 && x < GW && y >= 0 && y < GH && state.maze[y][x] === '#'

      // Fill all wall tiles so the interior is continuous.
      ctx.fillStyle = WALL_BODY
      for (let y = 0; y < GH; y += 1) {
        for (let x = 0; x < GW; x += 1) {
          if (hasWall(x, y)) ctx.fillRect(x * tw, y * th, tw, th)
        }
      }

      // Build oriented perimeter edges for exposed wall faces only.
      const edges = []
      const pushEdge = (sx, sy, ex, ey) => edges.push({ sx, sy, ex, ey })
      for (let y = 0; y < GH; y += 1) {
        for (let x = 0; x < GW; x += 1) {
          if (!hasWall(x, y)) continue
          if (!hasWall(x, y - 1)) pushEdge(x, y, x + 1, y)
          if (!hasWall(x + 1, y)) pushEdge(x + 1, y, x + 1, y + 1)
          if (!hasWall(x, y + 1)) pushEdge(x + 1, y + 1, x, y + 1)
          if (!hasWall(x - 1, y)) pushEdge(x, y + 1, x, y)
        }
      }

      const keyFor = (x, y) => `${x},${y}`
      const startMap = new Map()
      for (let i = 0; i < edges.length; i += 1) {
        const edge = edges[i]
        const key = keyFor(edge.sx, edge.sy)
        const list = startMap.get(key)
        if (list) list.push(i)
        else startMap.set(key, [i])
      }

      const visited = new Set()
      const edgeLW = Math.max(1.5, state.unit * 0.10)
      const cornerR = Math.min(tw, th) * 0.26
      ctx.strokeStyle = WALL_EDGE
      ctx.lineWidth = edgeLW
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      const strokeRoundedLoop = (points) => {
        if (points.length < 2) return

        const pixelPoints = points.map((p) => ({ x: p.x * tw, y: p.y * th }))
        // Remove duplicated last point if loop already explicitly closed.
        if (
          pixelPoints.length > 1
          && pixelPoints[0].x === pixelPoints[pixelPoints.length - 1].x
          && pixelPoints[0].y === pixelPoints[pixelPoints.length - 1].y
        ) {
          pixelPoints.pop()
        }

        if (pixelPoints.length < 2) return
        if (pixelPoints.length < 3) {
          ctx.beginPath()
          ctx.moveTo(pixelPoints[0].x, pixelPoints[0].y)
          ctx.lineTo(pixelPoints[1].x, pixelPoints[1].y)
          ctx.stroke()
          return
        }

        const n = pixelPoints.length
        ctx.beginPath()
        for (let i = 0; i < n; i += 1) {
          const prev = pixelPoints[(i - 1 + n) % n]
          const curr = pixelPoints[i]
          const next = pixelPoints[(i + 1) % n]

          const inDx = prev.x - curr.x
          const inDy = prev.y - curr.y
          const outDx = next.x - curr.x
          const outDy = next.y - curr.y
          const inLen = Math.hypot(inDx, inDy)
          const outLen = Math.hypot(outDx, outDy)

          if (inLen < 0.001 || outLen < 0.001) continue

          const r = Math.min(cornerR, inLen * 0.5, outLen * 0.5)
          const startX = curr.x + (inDx / inLen) * r
          const startY = curr.y + (inDy / inLen) * r
          const endX = curr.x + (outDx / outLen) * r
          const endY = curr.y + (outDy / outLen) * r

          if (i === 0) ctx.moveTo(startX, startY)
          else ctx.lineTo(startX, startY)

          ctx.arcTo(curr.x, curr.y, endX, endY, r)
        }
        ctx.closePath()
        ctx.stroke()
      }

      for (let i = 0; i < edges.length; i += 1) {
        if (visited.has(i)) continue

        const loopPoints = []
        let currentIndex = i
        while (!visited.has(currentIndex)) {
          visited.add(currentIndex)
          const edge = edges[currentIndex]
          if (loopPoints.length === 0) loopPoints.push({ x: edge.sx, y: edge.sy })
          loopPoints.push({ x: edge.ex, y: edge.ey })

          const nextList = startMap.get(keyFor(edge.ex, edge.ey)) || []
          const nextIndex = nextList.find((candidate) => !visited.has(candidate))
          if (nextIndex == null) break
          currentIndex = nextIndex
        }

        if (loopPoints.length < 2) continue
        strokeRoundedLoop(loopPoints)
      }
      // --- End tube wall rendering ---

      // Draw dots, power pellets, and ghost door
      for (let y = 0; y < state.height; y += 1) {
        for (let x = 0; x < state.width; x += 1) {
          const cell = state.maze[y][x]
          const px = x * state.tileW
          const py = y * state.tileH

          if (cell === '.') {
            ctx.fillStyle = '#ffe17f'
            ctx.beginPath()
            ctx.arc(px + state.tileW / 2, py + state.tileH / 2, Math.max(1.8, state.unit * 0.08), 0, Math.PI * 2)
            ctx.fill()
          } else if (cell === 'o') {
            const blinkOn = Math.floor(state.blinkTimer * 6) % 2 === 0
            if (blinkOn) {
              ctx.fillStyle = '#fff3bf'
              ctx.beginPath()
              ctx.arc(px + state.tileW / 2, py + state.tileH / 2, Math.max(3.8, state.unit * 0.16), 0, Math.PI * 2)
              ctx.fill()
            }
          } else if (cell === '-') {
            ctx.strokeStyle = 'rgba(255, 192, 240, 0.55)'
            ctx.lineWidth = Math.max(1.2, state.unit * 0.06)
            ctx.beginPath()
            ctx.moveTo(px + state.tileW * 0.15, py + state.tileH / 2)
            ctx.lineTo(px + state.tileW * 0.85, py + state.tileH / 2)
            ctx.stroke()
          }
        }
      }
    }

    const drawPacman = () => {
      const pacmanPos = getActorPosition(state.pacman, state.width)
      const px = pacmanPos.x * state.tileW + state.tileW / 2
      const py = pacmanPos.y * state.tileH + state.tileH / 2
      const mouthOpen = (Math.sin(state.pacman.mouth) + 1) * 0.22
      let baseAngle = 0

      if (state.pacman.dir === 'left') baseAngle = Math.PI
      if (state.pacman.dir === 'up') baseAngle = -Math.PI / 2
      if (state.pacman.dir === 'down') baseAngle = Math.PI / 2

      ctx.fillStyle = '#ffda4f'
      ctx.beginPath()
      ctx.moveTo(px, py)
      ctx.arc(px, py, state.unit * 0.42, baseAngle + mouthOpen, baseAngle + (Math.PI * 2 - mouthOpen))
      ctx.closePath()
      ctx.fill()
    }

    const drawGhost = (ghost) => {
      const ghostPos = getActorPosition(ghost, state.width)
      const x = ghostPos.x * state.tileW + state.tileW / 2
      const y = ghostPos.y * state.tileH + state.tileH / 2
      const r = state.unit * 0.38
      const frightened = state.frightenedTimer > 0 && ghost.mode !== 'pen'
      const flashing = state.frightenedTimer < 2 && Math.floor(state.blinkTimer * 8) % 2 === 0
      const ghostColor = frightened ? (flashing ? '#f5f5f5' : '#2f66ff') : ghost.color

      ctx.fillStyle = ghostColor
      ctx.beginPath()
      ctx.arc(x, y - r * 0.1, r, Math.PI, 0)
      ctx.lineTo(x + r, y + r * 0.85)
      for (let i = 0; i < 4; i += 1) {
        const offset = x + r - ((i + 0.5) * 2 * r) / 4
        ctx.lineTo(offset, y + r * 0.58 + (i % 2 === 0 ? r * 0.18 : -r * 0.18))
      }
      ctx.lineTo(x - r, y + r * 0.85)
      ctx.closePath()
      ctx.fill()

      ctx.fillStyle = frightened ? '#f4f8ff' : '#ffffff'
      ctx.beginPath()
      ctx.arc(x - r * 0.28, y - r * 0.08, r * 0.2, 0, Math.PI * 2)
      ctx.arc(x + r * 0.28, y - r * 0.08, r * 0.2, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = frightened ? '#1637a3' : '#18344c'
      ctx.beginPath()
      ctx.arc(x - r * 0.28, y - r * 0.08, r * 0.09, 0, Math.PI * 2)
      ctx.arc(x + r * 0.28, y - r * 0.08, r * 0.09, 0, Math.PI * 2)
      ctx.fill()
    }

    const drawDirectionMarker = (node, color) => {
      if (!node?.dir || !DIRECTIONS[node.dir]) {
        return
      }

      const dir = DIRECTIONS[node.dir]
      const cx = node.x * state.tileW + state.tileW / 2
      const cy = node.y * state.tileH + state.tileH / 2
      const shaft = Math.max(4, state.unit * 0.24)
      const head = Math.max(2.2, state.unit * 0.11)

      const fromX = cx - dir.x * shaft * 0.45
      const fromY = cy - dir.y * shaft * 0.45
      const tipX = cx + dir.x * shaft * 0.55
      const tipY = cy + dir.y * shaft * 0.55

      ctx.save()
      ctx.strokeStyle = color
      ctx.fillStyle = color
      ctx.globalAlpha = 0.9
      ctx.lineWidth = Math.max(1, state.unit * 0.045)
      ctx.beginPath()
      ctx.moveTo(fromX, fromY)
      ctx.lineTo(tipX, tipY)
      ctx.stroke()

      const perpX = -dir.y
      const perpY = dir.x
      ctx.beginPath()
      ctx.moveTo(tipX, tipY)
      ctx.lineTo(tipX - dir.x * head * 1.2 + perpX * head * 0.9, tipY - dir.y * head * 1.2 + perpY * head * 0.9)
      ctx.lineTo(tipX - dir.x * head * 1.2 - perpX * head * 0.9, tipY - dir.y * head * 1.2 - perpY * head * 0.9)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }

    const drawNodeNumber = (node, index, color, duplicateRank = 0, duplicateCount = 1) => {
      const cx = node.x * state.tileW + state.tileW / 2
      const cy = node.y * state.tileH + state.tileH / 2
      const fontSize = Math.max(10, state.unit * 0.32)
      const badgeRadius = Math.max(6.5, state.unit * 0.2)
      const offsetRadius = duplicateCount > 1 ? Math.max(8, state.unit * 0.28) : 0
      const angle = duplicateCount > 1 ? (Math.PI * 2 * duplicateRank) / duplicateCount : 0
      const lx = cx + Math.cos(angle) * offsetRadius
      const ly = cy + Math.sin(angle) * offsetRadius

      ctx.save()
      ctx.font = `bold ${fontSize}px monospace`
      ctx.globalAlpha = 0.98
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.shadowColor = 'rgba(0, 0, 0, 0.95)'
      ctx.shadowBlur = 2
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0

      // Draw a high-contrast badge behind each index to keep labels readable.
      ctx.fillStyle = 'rgba(4, 14, 24, 0.95)'
      ctx.strokeStyle = color
      ctx.lineWidth = Math.max(1, state.unit * 0.05)
      ctx.beginPath()
      ctx.arc(lx, ly, badgeRadius, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = '#f7fdff'
      ctx.fillText(String(index), lx, ly)
      ctx.restore()
    }

    const drawDebugGhostPaths = () => {
      state.ghosts.forEach((ghost) => {
        if (!isGhostEnabled(ghost)) {
          return
        }

        const routeNodes = ghost.route ?? []
        const routePolylines = buildMazeConstrainedPolylines(state.maze, routeNodes, 'ghost', true)
        if (routePolylines.length > 0) {
          ctx.strokeStyle = ghost.color
          ctx.lineWidth = Math.max(1.2, state.unit * 0.06)
          routePolylines.forEach((polyline) => {
            if (polyline.length < 2) {
              return
            }
            ctx.beginPath()
            polyline.forEach((node, index) => {
              const nx = node.x * state.tileW + state.tileW / 2
              const ny = node.y * state.tileH + state.tileH / 2
              if (index === 0) {
                ctx.moveTo(nx, ny)
              } else {
                ctx.lineTo(nx, ny)
              }
            })
            ctx.stroke()
          })
        }

        routeNodes.forEach((node, index) => {
          drawDirectionMarker(node, ghost.color)
        })

        const exitPolylines = buildMazeConstrainedPolylines(state.maze, ghost.exitPath ?? [], 'ghost', false)
        if (exitPolylines.length > 0) {
          ctx.save()
          ctx.setLineDash([6, 5])
          ctx.strokeStyle = ghost.color
          ctx.globalAlpha = 0.45
          ctx.lineWidth = Math.max(1, state.unit * 0.05)
          exitPolylines.forEach((polyline) => {
            if (polyline.length < 2) {
              return
            }
            ctx.beginPath()
            polyline.forEach((node, index) => {
              const nx = node.x * state.tileW + state.tileW / 2
              const ny = node.y * state.tileH + state.tileH / 2
              if (index === 0) {
                ctx.moveTo(nx, ny)
              } else {
                ctx.lineTo(nx, ny)
              }
            })
            ctx.stroke()
          })
          ctx.restore()
        }

        const activeRoute = ghost.mode === 'exiting' ? ghost.exitPath : ghost.route
        const activeIndex = ghost.mode === 'exiting' ? ghost.exitPathIndex : ghost.routeIndex
        if (activeRoute && activeRoute.length > 0) {
          const target = activeRoute[activeIndex % activeRoute.length]
          const tx = target.x * state.tileW + state.tileW / 2
          const ty = target.y * state.tileH + state.tileH / 2
          ctx.fillStyle = ghost.color
          ctx.beginPath()
          ctx.arc(tx, ty, Math.max(2.4, state.unit * 0.11), 0, Math.PI * 2)
          ctx.fill()

          // Draw current target indicator label
          const fontSize = Math.max(9, state.unit * 0.28)
          ctx.save()
          ctx.font = `bold ${fontSize}px monospace`
          ctx.fillStyle = ghost.color
          ctx.globalAlpha = 0.92
          ctx.textAlign = 'left'
          ctx.textBaseline = 'top'
          ctx.shadowColor = 'rgba(0, 0, 0, 0.85)'
          ctx.shadowBlur = 2
          ctx.shadowOffsetX = 0
          ctx.shadowOffsetY = 0
          ctx.fillText(`[${activeIndex}]`, tx + Math.max(3, state.unit * 0.15), ty + Math.max(3, state.unit * 0.15))
          ctx.restore()
        }
      })

      // Draw all node numbers last, on top of everything, for all enabled ghosts
      state.ghosts.forEach((ghost) => {
        if (!isGhostEnabled(ghost)) {
          return
        }
        const routeNodes = ghost.route ?? []
        const coordinateUsage = new Map()

        routeNodes.forEach((node) => {
          const key = `${node.x},${node.y}`
          coordinateUsage.set(key, (coordinateUsage.get(key) ?? 0) + 1)
        })

        const coordinateRank = new Map()
        // Explicitly draw every single node number using a direct loop
        for (let i = 0; i < routeNodes.length; i++) {
          const node = routeNodes[i]
          const key = `${node.x},${node.y}`
          const rank = coordinateRank.get(key) ?? 0
          coordinateRank.set(key, rank + 1)
          drawNodeNumber(node, i, ghost.color, rank, coordinateUsage.get(key) ?? 1)
        }
      })
    }

    const onKeyDown = (event) => {
      unlockAudio()
      const dir = DIR_KEYS[event.code]
      if (!dir) {
        return
      }
      event.preventDefault()
      directionRef.current = dir
    }

    let frameId = 0
    let last = performance.now()

    const loop = (now) => {
      const dt = Math.min(0.04, (now - last) / 1000)
      last = now
      state.blinkTimer += dt

      if (state.deathFreeze > 0) {
        state.deathFreeze = Math.max(0, state.deathFreeze - dt)
      } else {
        if (state.frightenedTimer > 0) {
          state.frightenedTimer = Math.max(0, state.frightenedTimer - dt)
        }

        movePacman(dt)
        state.ghosts.forEach((ghost) => {
          if (isGhostEnabled(ghost)) {
            moveGhost(ghost, dt)
          }
        })
        eatCurrentTile()

        const pacmanPos = getActorPosition(state.pacman, state.width)
        for (const ghost of state.ghosts) {
          if (!isGhostEnabled(ghost)) {
            continue
          }

          const ghostPos = getActorPosition(ghost, state.width)
          const dx = ghostPos.x - pacmanPos.x
          const dy = ghostPos.y - pacmanPos.y
          if (Math.hypot(dx, dy) >= 0.55) {
            continue
          }

          if (state.frightenedTimer > 0 && ghost.mode !== 'pen') {
            ghost.tileX = ghost.homeX
            ghost.tileY = ghost.homeY
            ghost.dir = 'up'
            ghost.progress = 0
            ghost.mode = 'pen'
            ghost.releaseTimer = 0.8
            ghost.exitPathIndex = 0
            ghost.routeIndex = (ghost.routeIndex + 2) % ghost.route.length
            state.ghostCombo += 1
            setScore((prev) => prev + 200 * state.ghostCombo)
            playSfx('ghost-eaten')
            continue
          }

          state.deathFreeze = DEATH_FREEZE
          playSfx('death')
          setLives((prev) => Math.max(0, prev - 1))
          resetActors(state)
          directionRef.current = 'left'
          break
        }
      }

      drawMaze()
      drawPacman()
      state.ghosts.forEach((ghost) => {
        if (isGhostEnabled(ghost)) {
          drawGhost(ghost)
        }
      })
      if (debugPathsRef.current) {
        drawDebugGhostPaths()
      }
      frameId = window.requestAnimationFrame(loop)
    }

    resize()
    resetActors(state)
    directionRef.current = 'left'
    frameId = window.requestAnimationFrame(loop)
    window.addEventListener('resize', resize)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('pointerdown', unlockAudio)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('pointerdown', unlockAudio)
    }
  }, [])

  return (
    <div className="pacman-center-wrap">
      <canvas ref={canvasRef} className="pacman-canvas" />
      <div className="pacman-overlay">
        <div className="pacman-overlay-left">
          <span>Score {String(score).padStart(5, '0')}</span>
          <span>Lives {lives}</span>
        </div>
        <div className="pacman-overlay-right">
          <div className="pacman-overlay-controls">
            <span>WASD / Arrows</span>
          </div>
        </div>
      </div>
    </div>
  )
}
