import SpaceInvadersViewport from './SpaceInvadersViewport'

function TopPanel() {
  return (
    <>
      <span>MODE: SPACE INVADERS</span>
      <span>ORBITAL DEFENSE // WAVE FEED</span>
      <span>THREAT: ESCALATING</span>
    </>
  )
}

function LeftPanel() {
  return (
    <>
      <h2>Controls</h2>
      <p>Move: Left / Right or A / D</p>
      <p>Fire: Space</p>
      <p>Clear all invaders before breach</p>

      <div className="hud-status-stack">
        <div><span>Cannons</span><strong>Armed</strong></div>
        <div><span>Shields</span><strong>Partial</strong></div>
        <div><span>Wave Sync</span><strong>Live</strong></div>
      </div>
    </>
  )
}

function CenterPanel({ onBackToMenu }) {
  return (
    <>
      <SpaceInvadersViewport />
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
      <p>Wave Pattern: Sweep</p>
      <p>Enemy Fire: Active</p>
      <p>Hull Alert: Green</p>
    </>
  )
}

function BottomPanel() {
  return (
    <>
      <div className="hud-wave" aria-hidden="true" />
      <div className="hud-bottom-row">
        <button type="button" className="hud-button">Overcharge</button>
        <button type="button" className="hud-button">Barrier</button>
        <button type="button" className="hud-button">Radar</button>
      </div>
    </>
  )
}

const SpaceInvadersPanels = {
  TopPanel,
  LeftPanel,
  CenterPanel,
  RightPanel,
  BottomPanel,
}

export default SpaceInvadersPanels
