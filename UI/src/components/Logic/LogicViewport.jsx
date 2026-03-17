import { useLogicGame } from './LogicStore'

const GATE_DESCRIPTIONS = {
  NOT: 'NOT flips a single input. Input B is ignored.',
  AND: 'AND outputs 1 only when both inputs are 1.',
  OR: 'OR outputs 1 when either input is 1.',
  NOR: 'NOR outputs 1 only when both inputs are 0.',
  NAND: 'NAND outputs 0 only when both inputs are 1.',
  XOR: 'XOR outputs 1 when the two inputs differ.',
}

function BitPill({ value, label }) {
  return (
    <div className={`logic-bit-pill logic-bit-pill-${value ? 'on' : 'off'}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export default function LogicViewport() {
  const {
    gateOptions,
    circuit,
    solved,
    allSolved,
    buildAvailableSources,
    updateSlot,
    resetPuzzle,
    nextPuzzle,
    solveCurrentPuzzle,
  } = useLogicGame()
  const canAdvance = solved

  return (
    <div className="logic-center-wrap">
      <section className="logic-workbench">
        <div className="logic-column logic-column-gates">
          <h3>Gate Rack</h3>
          <p>Configure each gate and route signals forward through the circuit.</p>
          <div className="logic-gate-stack">
            {circuit.map((slot, index) => {
              const availableSources = buildAvailableSources(index)
              const showSecondInput = slot.gate !== 'NOT'
              const gateDescription = GATE_DESCRIPTIONS[slot.gate]
              return (
                <article key={`gate-${index + 1}`} className="logic-gate-card">
                  <div className="logic-gate-card-head">
                    <strong>Gate {index + 1}</strong>
                    <span>Output: G{index + 1}</span>
                  </div>

                  <div className="logic-gate-row" role="group" aria-label={`Gate ${index + 1} configuration`}>
                    <label className="logic-gate-inline-group">
                      <span>Input A</span>
                      <select value={slot.inA} onChange={(event) => updateSlot(index, 'inA', event.target.value)}>
                        {availableSources.map((source) => (
                          <option key={`${source.value}-a`} value={source.value}>{source.label}</option>
                        ))}
                      </select>
                    </label>

                    <label className="logic-gate-inline-group logic-gate-inline-group-type">
                      <span>Gate</span>
                      <select
                        value={slot.gate}
                        title={gateDescription}
                        aria-label={`Gate ${index + 1} type. ${gateDescription}`}
                        onChange={(event) => updateSlot(index, 'gate', event.target.value)}
                      >
                        {gateOptions.map((gate) => (
                          <option key={gate} value={gate}>{gate}</option>
                        ))}
                      </select>
                    </label>

                    {showSecondInput ? (
                      <label className="logic-gate-inline-group">
                        <span>Input B</span>
                        <select value={slot.inB} onChange={(event) => updateSlot(index, 'inB', event.target.value)}>
                          {availableSources.map((source) => (
                            <option key={`${source.value}-b`} value={source.value}>{source.label}</option>
                          ))}
                        </select>
                      </label>
                    ) : <div className="logic-gate-inline-group logic-gate-inline-placeholder" aria-hidden="true" />}
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <div className="logic-action-row logic-action-row-bottom">
        <button type="button" className="hud-button" onClick={resetPuzzle}>Reset Circuit</button>
        <button type="button" className="hud-button" onClick={solveCurrentPuzzle}>Solve Puzzle</button>
        <button type="button" className="hud-button" onClick={nextPuzzle} disabled={!canAdvance}>
          {allSolved ? 'Loop Puzzles' : 'Next Puzzle'}
        </button>
      </div>
    </div>
  )
}