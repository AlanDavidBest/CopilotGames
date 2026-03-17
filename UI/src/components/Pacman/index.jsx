import PacmanViewport from './PacmanViewport'

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

function CenterPanel({ onBackToMenu }) {
  return (
    <>
      <PacmanViewport />
      <div className="hud-actions">
        <button type="button" className="hud-button" onClick={onBackToMenu}>
          Exit To Menu
        </button>
      </div>
    </>
  )
}

function RightPanel() {
  return (
    <>
      <h2>Telemetry</h2>
      <div className="hud-grid-box" aria-hidden="true">
        <div className="hud-grid-shape" />
      </div>
      <p>Ghosts: 3</p>
      <p>Pellet Field: Dense</p>
      <p>Warp Tunnels: Enabled</p>
    </>
  )
}

function BottomPanel() {
  return (
    <>
      <div className="hud-wave" aria-hidden="true" />
      <div className="hud-bottom-row">
        <button type="button" className="hud-button">Boost</button>
        <button type="button" className="hud-button">Pulse</button>
        <button type="button" className="hud-button">Map</button>
      </div>
    </>
  )
}

const PacmanPanels = {
  TopPanel,
  LeftPanel,
  CenterPanel,
  RightPanel,
  BottomPanel,
}

export default PacmanPanels
