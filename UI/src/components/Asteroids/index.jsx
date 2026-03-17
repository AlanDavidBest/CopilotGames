import AsteroidsViewport from './AsteroidsViewport'

function TopPanel() {
  return (
    <>
      <span>MODE: ASTEROIDS</span>
      <span>SECTOR 7 // VECTOR FEED</span>
      <span>THREAT LEVEL: MID</span>
    </>
  )
}

function LeftPanel() {
  return (
    <>
      <h2>Flight Controls</h2>
      <p>Rotate: Left / Right or A / D</p>
      <p>Thrust: Up or W</p>
      <p>Fire: Space</p>

      <div className="hud-status-stack">
        <div><span>Hull</span><strong>Stable</strong></div>
        <div><span>Drive</span><strong>Online</strong></div>
        <div><span>Cannons</span><strong>Primed</strong></div>
      </div>
    </>
  )
}

function CenterPanel({ onBackToMenu }) {
  return (
    <>
      <AsteroidsViewport />
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
      <p>Sector: Delta-9</p>
      <p>Asteroids: Dense</p>
      <p>Signal: Locked</p>
    </>
  )
}

function BottomPanel() {
  return (
    <>
      <div className="hud-wave" aria-hidden="true" />
      <div className="hud-bottom-row">
        <button type="button" className="hud-button">Pulse</button>
        <button type="button" className="hud-button">Shield</button>
        <button type="button" className="hud-button">Scanner</button>
      </div>
    </>
  )
}

const AsteroidsPanels = {
  TopPanel,
  LeftPanel,
  CenterPanel,
  RightPanel,
  BottomPanel,
}

export default AsteroidsPanels
