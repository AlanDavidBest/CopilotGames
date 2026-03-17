import VampireViewport from './VampireViewport'

function TopPanel() {
  return (
    <>
      <span>MODE: VAMPIRE</span>
      <span>NIGHT SWARM // SURVIVAL FEED</span>
      <span>STATUS: HUNT ACTIVE</span>
    </>
  )
}

function LeftPanel() {
  return (
    <>
      <h2>Controls</h2>
      <p>Move: Mouse Position</p>
      <p>Aim: Cursor Direction</p>
      <p>Fire: Automatic Pulse Shot</p>

      <div className="hud-status-stack">
        <div><span>Aura</span><strong>Charged</strong></div>
        <div><span>Swarm</span><strong>Approaching</strong></div>
        <div><span>Night</span><strong>Deep</strong></div>
      </div>
    </>
  )
}

function CenterPanel({ onBackToMenu }) {
  return (
    <>
      <VampireViewport />
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
      <p>Wave Type: Swarm</p>
      <p>Curse Level: Rising</p>
      <p>Drop Rate: Normal</p>
    </>
  )
}

function BottomPanel() {
  return (
    <>
      <div className="hud-wave" aria-hidden="true" />
      <div className="hud-bottom-row">
        <button type="button" className="hud-button">Dash</button>
        <button type="button" className="hud-button">Nova</button>
        <button type="button" className="hud-button">Relics</button>
      </div>
    </>
  )
}

const VampirePanels = {
  TopPanel,
  LeftPanel,
  CenterPanel,
  RightPanel,
  BottomPanel,
}

export default VampirePanels
