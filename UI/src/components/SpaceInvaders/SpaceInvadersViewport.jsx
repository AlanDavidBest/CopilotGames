import { useEffect, useRef, useState } from 'react'

const PLAYER_SPEED = 430
const PLAYER_BULLET_SPEED = 700
const ENEMY_BULLET_SPEED = 310

const randomRange = (min, max) => min + Math.random() * (max - min)

const createInvaders = () => {
  const invaders = []
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 10; col += 1) {
      invaders.push({
        row,
        col,
        alive: true,
      })
    }
  }
  return invaders
}

export default function SpaceInvadersViewport() {
  const canvasRef = useRef(null)
  const controlsRef = useRef({ left: false, right: false, fire: false })
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    const state = {
      width: 1,
      height: 1,
      player: { x: 0, y: 0, w: 44, h: 18 },
      playerBullets: [],
      enemyBullets: [],
      invaders: createInvaders(),
      invaderOffsetX: 0,
      invaderOffsetY: 0,
      invaderDir: 1,
      invaderSpeed: 30,
      invaderStepDown: 18,
      shootCooldown: 0,
      enemyFireCooldown: 0,
      beatPhase: 0,
      gameOver: false,
    }

    const resetPlayer = () => {
      state.player.x = state.width / 2
      state.player.y = state.height - 42
    }

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      state.width = Math.max(1, canvas.clientWidth)
      state.height = Math.max(1, canvas.clientHeight)
      canvas.width = Math.floor(state.width * dpr)
      canvas.height = Math.floor(state.height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      resetPlayer()
    }

    const getInvaderPosition = (invader) => {
      const baseX = 70 + invader.col * 54
      const baseY = 58 + invader.row * 40
      return {
        x: baseX + state.invaderOffsetX,
        y: baseY + state.invaderOffsetY,
        w: 34,
        h: 22,
      }
    }

    const firePlayerBullet = () => {
      if (state.shootCooldown > 0 || state.gameOver) return
      state.playerBullets.push({
        x: state.player.x,
        y: state.player.y - 12,
        vy: -PLAYER_BULLET_SPEED,
      })
      state.shootCooldown = 0.19
    }

    const enemyShoot = () => {
      const living = state.invaders.filter((inv) => inv.alive)
      if (living.length === 0) return

      const byColumn = new Map()
      living.forEach((inv) => {
        const current = byColumn.get(inv.col)
        if (!current || inv.row > current.row) {
          byColumn.set(inv.col, inv)
        }
      })

      const shooters = Array.from(byColumn.values())
      const shooter = shooters[Math.floor(Math.random() * shooters.length)]
      if (!shooter) return

      const pos = getInvaderPosition(shooter)
      state.enemyBullets.push({
        x: pos.x,
        y: pos.y + 12,
        vy: ENEMY_BULLET_SPEED,
      })
    }

    const onKeyDown = (event) => {
      if (event.code === 'ArrowLeft' || event.code === 'KeyA') controlsRef.current.left = true
      if (event.code === 'ArrowRight' || event.code === 'KeyD') controlsRef.current.right = true
      if (event.code === 'Space') {
        controlsRef.current.fire = true
        event.preventDefault()
      }
    }

    const onKeyUp = (event) => {
      if (event.code === 'ArrowLeft' || event.code === 'KeyA') controlsRef.current.left = false
      if (event.code === 'ArrowRight' || event.code === 'KeyD') controlsRef.current.right = false
      if (event.code === 'Space') controlsRef.current.fire = false
    }

    let frameId = 0
    let last = performance.now()

    const loop = (now) => {
      const dt = Math.min(0.033, (now - last) / 1000)
      last = now

      if (!state.gameOver) {
        if (controlsRef.current.left) state.player.x -= PLAYER_SPEED * dt
        if (controlsRef.current.right) state.player.x += PLAYER_SPEED * dt
        state.player.x = Math.max(24, Math.min(state.width - 24, state.player.x))

        if (controlsRef.current.fire) firePlayerBullet()

        if (state.shootCooldown > 0) state.shootCooldown -= dt
        if (state.enemyFireCooldown > 0) state.enemyFireCooldown -= dt

        state.playerBullets = state.playerBullets
          .map((bullet) => ({ ...bullet, y: bullet.y + bullet.vy * dt }))
          .filter((bullet) => bullet.y > -12)

        state.enemyBullets = state.enemyBullets
          .map((bullet) => ({ ...bullet, y: bullet.y + bullet.vy * dt }))
          .filter((bullet) => bullet.y < state.height + 12)

        state.invaderOffsetX += state.invaderDir * state.invaderSpeed * dt

        const livingInvaders = state.invaders.filter((inv) => inv.alive)
        let minX = Infinity
        let maxX = -Infinity
        let maxY = -Infinity

        livingInvaders.forEach((inv) => {
          const pos = getInvaderPosition(inv)
          minX = Math.min(minX, pos.x - 17)
          maxX = Math.max(maxX, pos.x + 17)
          maxY = Math.max(maxY, pos.y + 12)
        })

        if (minX < 18 || maxX > state.width - 18) {
          state.invaderDir *= -1
          state.invaderOffsetY += state.invaderStepDown
          state.invaderSpeed = Math.min(130, state.invaderSpeed + 6)
        }

        if (state.enemyFireCooldown <= 0) {
          enemyShoot()
          state.enemyFireCooldown = randomRange(0.35, 0.9)
        }

        state.playerBullets = state.playerBullets.filter((bullet) => {
          for (const inv of state.invaders) {
            if (!inv.alive) continue
            const pos = getInvaderPosition(inv)
            if (
              bullet.x > pos.x - pos.w / 2 &&
              bullet.x < pos.x + pos.w / 2 &&
              bullet.y > pos.y - pos.h / 2 &&
              bullet.y < pos.y + pos.h / 2
            ) {
              inv.alive = false
              setScore((prev) => prev + 20 + (4 - inv.row) * 5)
              return false
            }
          }
          return true
        })

        state.enemyBullets = state.enemyBullets.filter((bullet) => {
          const hitPlayer =
            bullet.x > state.player.x - state.player.w / 2 &&
            bullet.x < state.player.x + state.player.w / 2 &&
            bullet.y > state.player.y - state.player.h / 2 &&
            bullet.y < state.player.y + state.player.h / 2

          if (hitPlayer) {
            setLives((prev) => {
              const next = Math.max(0, prev - 1)
              if (next === 0) state.gameOver = true
              return next
            })
            resetPlayer()
            return false
          }

          return true
        })

        const remaining = state.invaders.filter((inv) => inv.alive)
        if (remaining.length === 0) {
          state.invaders = createInvaders()
          state.invaderOffsetX = 0
          state.invaderOffsetY = 0
          state.invaderDir = 1
          state.invaderSpeed = Math.min(145, state.invaderSpeed + 12)
          state.playerBullets = []
          state.enemyBullets = []
        }

        if (maxY > state.player.y - 22) {
          state.gameOver = true
        }
      }

      state.beatPhase += dt * 6

      ctx.clearRect(0, 0, state.width, state.height)
      ctx.fillStyle = 'rgba(2, 10, 18, 0.95)'
      ctx.fillRect(0, 0, state.width, state.height)

      // Background scan grid.
      ctx.strokeStyle = 'rgba(85, 230, 255, 0.09)'
      ctx.lineWidth = 1
      for (let x = 0; x <= state.width; x += 24) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, state.height)
        ctx.stroke()
      }
      for (let y = 0; y <= state.height; y += 24) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(state.width, y)
        ctx.stroke()
      }

      // Draw invaders.
      state.invaders.forEach((inv) => {
        if (!inv.alive) return
        const pos = getInvaderPosition(inv)
        const pulse = Math.sin(state.beatPhase + inv.col * 0.6) * 2
        const bodyW = pos.w
        const bodyH = pos.h + pulse

        ctx.fillStyle = 'rgba(111, 250, 255, 0.95)'
        ctx.fillRect(pos.x - bodyW * 0.4, pos.y - bodyH * 0.35, bodyW * 0.8, bodyH * 0.5)
        ctx.fillRect(pos.x - bodyW * 0.5, pos.y, bodyW * 0.18, bodyH * 0.36)
        ctx.fillRect(pos.x + bodyW * 0.32, pos.y, bodyW * 0.18, bodyH * 0.36)
        ctx.fillRect(pos.x - bodyW * 0.14, pos.y + bodyH * 0.08, bodyW * 0.28, bodyH * 0.32)
      })

      // Player ship.
      ctx.fillStyle = state.gameOver ? 'rgba(255, 112, 112, 0.9)' : 'rgba(134, 255, 151, 0.95)'
      ctx.beginPath()
      ctx.moveTo(state.player.x, state.player.y - state.player.h / 2)
      ctx.lineTo(state.player.x + state.player.w / 2, state.player.y + state.player.h / 2)
      ctx.lineTo(state.player.x - state.player.w / 2, state.player.y + state.player.h / 2)
      ctx.closePath()
      ctx.fill()

      // Bullets.
      ctx.fillStyle = '#ffe48d'
      state.playerBullets.forEach((bullet) => {
        ctx.fillRect(bullet.x - 2, bullet.y - 8, 4, 10)
      })

      ctx.fillStyle = '#ff8fb7'
      state.enemyBullets.forEach((bullet) => {
        ctx.fillRect(bullet.x - 1.8, bullet.y - 6, 3.6, 8)
      })

      if (state.gameOver) {
        ctx.fillStyle = 'rgba(255, 164, 164, 0.95)'
        ctx.font = 'bold 26px Chakra Petch, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('GAME OVER', state.width / 2, state.height / 2)
      }

      frameId = window.requestAnimationFrame(loop)
    }

    resize()
    frameId = window.requestAnimationFrame(loop)
    window.addEventListener('resize', resize)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  return (
    <div className="spaceinvaders-center-wrap">
      <canvas ref={canvasRef} className="spaceinvaders-canvas" />
      <div className="spaceinvaders-overlay">
        <span>Score {String(score).padStart(5, '0')}</span>
        <span>Lives {lives}</span>
        <span>Move + Space</span>
      </div>
    </div>
  )
}
