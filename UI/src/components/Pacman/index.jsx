import { createContext, useContext, useMemo, useState } from 'react'
import PacmanViewport from './PacmanViewport'

const GHOST_PERSONALITIES = ['blinky', 'pinky', 'inky', 'clyde']
const DEFAULT_GHOST_VISIBILITY = {
  blinky: true,
  pinky: true,
  inky: true,
  clyde: true,
}

const PacmanHudContext = createContext(null)

function usePacmanHud() {
  const value = useContext(PacmanHudContext)
  if (!value) {
    throw new Error('usePacmanHud must be used within PacmanProvider')
  }
  return value
}

function Provider({ children }) {
  const [showDebugPaths, setShowDebugPaths] = useState(false)
  const [ghostVisibility, setGhostVisibility] = useState(DEFAULT_GHOST_VISIBILITY)

  const contextValue = useMemo(
    () => ({ showDebugPaths, setShowDebugPaths, ghostVisibility, setGhostVisibility }),
    [showDebugPaths, ghostVisibility],
  )

  return <PacmanHudContext.Provider value={contextValue}>{children}</PacmanHudContext.Provider>
}

function TopPanel() {
  return (
    <>
      <span>MODE: PAC-MAN</span>
      <span>MAZE NODE // ARCADE FEED</span>
      <span>STATUS: RUNNING</span>
    </>
  )
}

function LeftPanel() {
  return (
    <>
      <h2>Controls</h2>
      <p>Move: Arrow Keys / WASD</p>
      <p>Objective: Clear all pellets</p>
      <p>Avoid ghosts and survive</p>

      <div className="hud-status-stack">
        <div><span>Maze</span><strong>Loaded</strong></div>
        <div><span>Pellets</span><strong>Active</strong></div>
        <div><span>Ghost AI</span><strong>Roaming</strong></div>
      </div>
    </>
  )
}

function CenterPanel() {
  const { showDebugPaths, ghostVisibility } = usePacmanHud()

  return (
    <>
      <PacmanViewport showDebugPaths={showDebugPaths} ghostVisibility={ghostVisibility} />
    </>
  )
}

function RightPanel() {
  const { showDebugPaths, setShowDebugPaths, ghostVisibility, setGhostVisibility } = usePacmanHud()

  return (
    <>
      <h2>Debug Controls</h2>
      <div className="pacman-side-debug-controls">
        <button type="button" className="hud-button pacman-debug-button" onClick={() => setShowDebugPaths((prev) => !prev)}>
          Debug Paths: {showDebugPaths ? 'On' : 'Off'}
        </button>

        <div className="pacman-ghost-toggles pacman-ghost-toggles-panel">
          {GHOST_PERSONALITIES.map((name) => {
            const isOn = ghostVisibility[name] !== false
            return (
              <button
                key={name}
                type="button"
                className={`hud-button pacman-ghost-toggle ${isOn ? '' : 'is-off'}`}
                onClick={() =>
                  setGhostVisibility((prev) => ({
                    ...prev,
                    [name]: !isOn,
                  }))
                }
              >
                {name}: {isOn ? 'On' : 'Off'}
              </button>
            )
          })}
        </div>
      </div>

      <h2>Telemetry</h2>
      <p>Ghost AI: Route Locked</p>
      <p>Pellet Field: Dense</p>
      <p>Warp Tunnels: Enabled</p>
    </>
  )
}

function BottomPanel({ onBackToMenu }) {
  return (
    <>
      <div className="hud-wave" aria-hidden="true" />
      <div className="hud-bottom-row">
        <button type="button" className="hud-button" onClick={onBackToMenu}>Exit To Menu</button>
        <button type="button" className="hud-button">Boost</button>
        <button type="button" className="hud-button">Pulse</button>
        <button type="button" className="hud-button">Map</button>
      </div>
    </>
  )
}

const PacmanPanels = {
  Provider,
  TopPanel,
  LeftPanel,
  CenterPanel,
  RightPanel,
  BottomPanel,
}

export default PacmanPanels
