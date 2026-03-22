function TopPanel() {
  return (
    <>
      <span>SYS: ACTIVE</span>
      <span>ROADLIGHT / COMBAT FEED</span>
      <span>LATENCY: 04ms</span>
    </>
  )
}

function LeftPanel() {
  return (
    <>
      <h2>Mission Feed</h2>
      <div className="hud-status-stack">
        <div><span>Earth.N35</span><strong>Completed</strong></div>
        <div><span>EEUU.054</span><strong>Completed</strong></div>
        <div><span>Spain.809</span><strong>Completed</strong></div>
        <div><span>Tokyo.945</span><strong>Completed</strong></div>
      </div>

      <div className="hud-bars" aria-hidden="true">
        <span style={{ '--bar-h': '48%' }} />
        <span style={{ '--bar-h': '74%' }} />
        <span style={{ '--bar-h': '62%' }} />
        <span style={{ '--bar-h': '88%' }} />
      </div>
    </>
  )
}

function CenterPanel() {
  return (
    <>
      <div className="hud-core" aria-hidden="true">
        <div className="ring ring-a" />
        <div className="ring ring-b" />
        <div className="ring ring-c" />
        <div className="ring ring-d" />
        <div className="ring-center" />
        <div className="ring-sweep" />
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
      <p>Distance: 000.00 km</p>
      <p>Pulse: 053</p>
      <p>Shield: 97%</p>
    </>
  )
}

function BottomPanel({ onBackToMenu }) {
  return (
    <>
      <div className="hud-wave" aria-hidden="true" />
      <div className="hud-bottom-row">
        <button type="button" className="hud-button" onClick={onBackToMenu}>Exit To Menu</button>
        <button type="button" className="hud-button">Map</button>
        <button type="button" className="hud-button">Inventory</button>
        <button type="button" className="hud-button">Comms</button>
      </div>
    </>
  )
}

const ScaffoldPanels = {
  TopPanel,
  LeftPanel,
  CenterPanel,
  RightPanel,
  BottomPanel,
}

export default ScaffoldPanels
