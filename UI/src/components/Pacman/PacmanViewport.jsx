import { useEffect, useRef, useState } from 'react'

const MAZE_TEMPLATE = [
  '111111111111111',
  '100000100000001',
  '101110101011101',
  '100000000000001',
  '101011111110101',
  '100010000010001',
  '111010111010111',
  '000000101000000',
  '111010101010111',
  '100010000010001',
  '101111101111101',
  '100000000000001',
  '111111111111111',
]

const PACMAN_SPEED = 5.2
const GHOST_SPEED = 3.5
const DIRECTIONS = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
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

const wrap = (value, max) => {
  if (value < 0) return value + max
  if (value >= max) return value - max
  return value
}

const cloneMaze = () => MAZE_TEMPLATE.map((row) => row.split('').map((cell) => (cell === '1' ? 1 : 2)))

const tileAt = (maze, x, y) => {
  if (y < 0 || y >= maze.length) return 1
  const wrappedX = wrap(x, maze[0].length)
  return maze[y][wrappedX]
}

const canMove = (maze, x, y, dir) => {
  const tx = Math.round(x + dir.x * 0.52)
  const ty = Math.round(y + dir.y * 0.52)
  return tileAt(maze, tx, ty) !== 1
}

const chooseGhostDirection = (maze, ghost) => {
  const options = Object.entries(DIRECTIONS)
    .filter(([name, dir]) => {
      if (
        (name === 'left' && ghost.dir === 'right') ||
        (name === 'right' && ghost.dir === 'left') ||
        (name === 'up' && ghost.dir === 'down') ||
        (name === 'down' && ghost.dir === 'up')
      ) {
        return false
      }
      return canMove(maze, ghost.x, ghost.y, dir)
    })
    .map(([name]) => name)

  if (options.length === 0) {
    return ghost.dir
  }

  return options[Math.floor(Math.random() * options.length)]
}

const resetActors = (state) => {
  state.pacman.x = 7
  state.pacman.y = 9
  state.pacman.dir = 'left'
  state.pacman.nextDir = 'left'
  state.pacman.mouth = 0

  state.ghosts = [
    { x: 7, y: 5, dir: 'right', color: '#ff4e96' },
    { x: 6, y: 6, dir: 'left', color: '#62f2ff' },
    { x: 8, y: 6, dir: 'up', color: '#ffad4a' },
  ]
}

export default function PacmanViewport() {
  const canvasRef = useRef(null)
  const directionRef = useRef('left')
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    const state = {
      maze: cloneMaze(),
      pacman: { x: 7, y: 9, dir: 'left', nextDir: 'left', mouth: 0 },
      ghosts: [],
      width: MAZE_TEMPLATE[0].length,
      height: MAZE_TEMPLATE.length,
      pixelWidth: 1,
      pixelHeight: 1,
      tileW: 1,
      tileH: 1,
      unit: 1,
      timeSinceTurn: 0,
      deathFreeze: 0,
    }

    resetActors(state)

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

    const tryEatPellet = () => {
      const tx = Math.round(state.pacman.x)
      const ty = Math.round(state.pacman.y)
      if (tileAt(state.maze, tx, ty) === 2) {
        state.maze[ty][wrap(tx, state.width)] = 0
        setScore((prev) => prev + 10)
      }

      const hasPellets = state.maze.some((row) => row.includes(2))
      if (!hasPellets) {
        state.maze = cloneMaze()
        resetActors(state)
      }
    }

    const drawMaze = () => {
      ctx.fillStyle = 'rgba(2, 8, 18, 0.96)'
      ctx.fillRect(0, 0, state.pixelWidth, state.pixelHeight)

      for (let y = 0; y < state.height; y += 1) {
        for (let x = 0; x < state.width; x += 1) {
          const cell = state.maze[y][x]
          const px = x * state.tileW
          const py = y * state.tileH
          const pad = Math.max(1.5, state.unit * 0.12)

          if (cell === 1) {
            ctx.fillStyle = 'rgba(71, 235, 255, 0.24)'
            ctx.fillRect(px + pad, py + pad, state.tileW - pad * 2, state.tileH - pad * 2)
            ctx.strokeStyle = 'rgba(117, 248, 255, 0.68)'
            ctx.strokeRect(px + pad, py + pad, state.tileW - pad * 2, state.tileH - pad * 2)
          } else if (cell === 2) {
            ctx.fillStyle = '#ffe17f'
            ctx.beginPath()
            ctx.arc(px + state.tileW / 2, py + state.tileH / 2, Math.max(2.4, state.unit * 0.1), 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }
    }

    const drawPacman = () => {
      const px = state.pacman.x * state.tileW + state.tileW / 2
      const py = state.pacman.y * state.tileH + state.tileH / 2
      const mouthOpen = (Math.sin(state.pacman.mouth) + 1) * 0.22
      let baseAngle = 0
      if (state.pacman.dir === 'right') baseAngle = 0
      if (state.pacman.dir === 'left') baseAngle = Math.PI
      if (state.pacman.dir === 'up') baseAngle = -Math.PI / 2
      if (state.pacman.dir === 'down') baseAngle = Math.PI / 2

      ctx.fillStyle = '#ffda4f'
      ctx.beginPath()
      ctx.moveTo(px, py)
      ctx.arc(px, py, state.unit * 0.43, baseAngle + mouthOpen, baseAngle + (Math.PI * 2 - mouthOpen))
      ctx.closePath()
      ctx.fill()
    }

    const drawGhost = (ghost) => {
      const x = ghost.x * state.tileW + state.tileW / 2
      const y = ghost.y * state.tileH + state.tileH / 2
      const r = state.unit * 0.4

      ctx.fillStyle = ghost.color
      ctx.beginPath()
      ctx.arc(x, y - r * 0.12, r, Math.PI, 0)
      ctx.lineTo(x + r, y + r * 0.9)
      for (let i = 0; i < 3; i += 1) {
        ctx.lineTo(x + r - ((i + 0.5) * 2 * r) / 3, y + r * 0.62 + (i % 2 === 0 ? 4 : -4))
      }
      ctx.lineTo(x - r, y + r * 0.9)
      ctx.closePath()
      ctx.fill()

      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(x - r * 0.3, y - r * 0.1, r * 0.22, 0, Math.PI * 2)
      ctx.arc(x + r * 0.3, y - r * 0.1, r * 0.22, 0, Math.PI * 2)
      ctx.fill()
    }

    const onKeyDown = (event) => {
      const dir = DIR_KEYS[event.code]
      if (dir) {
        directionRef.current = dir
      }
    }

    let frameId = 0
    let last = performance.now()

    const loop = (now) => {
      const dt = Math.min(0.04, (now - last) / 1000)
      last = now

      if (state.deathFreeze > 0) {
        state.deathFreeze -= dt
      } else {
        state.pacman.nextDir = directionRef.current
        const next = DIRECTIONS[state.pacman.nextDir]

        const closeToCenter = Math.abs(state.pacman.x - Math.round(state.pacman.x)) < 0.08 && Math.abs(state.pacman.y - Math.round(state.pacman.y)) < 0.08

        if (closeToCenter && canMove(state.maze, state.pacman.x, state.pacman.y, next)) {
          state.pacman.dir = state.pacman.nextDir
        }

        const moveDir = DIRECTIONS[state.pacman.dir]
        if (canMove(state.maze, state.pacman.x, state.pacman.y, moveDir)) {
          state.pacman.x = wrap(state.pacman.x + moveDir.x * PACMAN_SPEED * dt, state.width)
          state.pacman.y = wrap(state.pacman.y + moveDir.y * PACMAN_SPEED * dt, state.height)
          state.pacman.mouth += dt * 18
        }

        state.timeSinceTurn += dt
        state.ghosts.forEach((ghost) => {
          const dir = DIRECTIONS[ghost.dir]
          const nearCenter = Math.abs(ghost.x - Math.round(ghost.x)) < 0.08 && Math.abs(ghost.y - Math.round(ghost.y)) < 0.08

          if (nearCenter && state.timeSinceTurn > 0.11) {
            ghost.dir = chooseGhostDirection(state.maze, ghost)
          }

          const moveDir = DIRECTIONS[ghost.dir]
          if (canMove(state.maze, ghost.x, ghost.y, moveDir)) {
            ghost.x = wrap(ghost.x + moveDir.x * GHOST_SPEED * dt, state.width)
            ghost.y = wrap(ghost.y + moveDir.y * GHOST_SPEED * dt, state.height)
          } else {
            ghost.dir = chooseGhostDirection(state.maze, ghost)
          }
        })

        if (state.timeSinceTurn > 0.11) {
          state.timeSinceTurn = 0
        }

        tryEatPellet()

        for (const ghost of state.ghosts) {
          const dx = ghost.x - state.pacman.x
          const dy = ghost.y - state.pacman.y
          if (Math.hypot(dx, dy) < 0.55) {
            state.deathFreeze = 0.8
            setLives((prev) => Math.max(0, prev - 1))
            resetActors(state)
            break
          }
        }
      }

      drawMaze()
      drawPacman()
      state.ghosts.forEach(drawGhost)

      frameId = window.requestAnimationFrame(loop)
    }

    resize()
    frameId = window.requestAnimationFrame(loop)
    window.addEventListener('resize', resize)
    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return (
    <div className="pacman-center-wrap">
      <canvas ref={canvasRef} className="pacman-canvas" />
      <div className="pacman-overlay">
        <span>Score {String(score).padStart(5, '0')}</span>
        <span>Lives {lives}</span>
        <span>WASD / Arrows</span>
      </div>
    </div>
  )
}
