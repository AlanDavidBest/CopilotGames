import LogicViewport from './LogicViewport'
import { LogicGameProvider, useLogicGame } from './LogicStore'

function BitPill({ value, label }) {
  return (
    <div className={`logic-bit-pill logic-bit-pill-${value ? 'on' : 'off'}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function TopPanel() {
  const { puzzle, puzzleIndex, puzzleCount, solved } = useLogicGame()

  return (
    <>
      <span>MODE: LOGIC</span>
      <span>{`PUZZLE ${puzzleIndex + 1}/${puzzleCount} // ${puzzle.title.toUpperCase()}`}</span>
      <span>{solved ? 'STATUS: CIRCUIT VERIFIED' : 'STATUS: ROUTING IN PROGRESS'}</span>
    </>
  )
}

function LeftPanel() {
  const { puzzle, recommendedGates, gateUsage } = useLogicGame()

  return (
    <>
      <h2>Mission</h2>
      <p>{puzzle.briefing}</p>

      <div className="logic-side-block">
        <strong>Inputs</strong>
        <div className="logic-source-list logic-source-list-inline">
          {puzzle.inputLabels.map((label) => (
            <div key={label} className="logic-source-chip">{label}</div>
          ))}
        </div>
      </div>

      <div className="logic-side-block">
        <strong>Suggested Gate Count</strong>
        <p>{recommendedGates}</p>
      </div>

      <div className="logic-side-block">
        <strong>Configured Stages</strong>
        <p>{gateUsage}</p>
      </div>

      <div className="logic-side-block">
        <strong>Rules</strong>
        <p>Route inputs into gates, then send one signal to OUT.</p>
      </div>
    </>
  )
}

function CenterPanel() {
  return <LogicViewport />
}

function RightPanel() {
  const { puzzle, outputSource, rowResults, solved, finalOutputSources, setOutputSource } = useLogicGame()
  const passedRows = rowResults.filter((row) => row.passed).length

  return (
    <>
      <h2>Output Bus</h2>

      <div className={`logic-solve-state ${solved ? 'logic-solve-state-on' : ''}`}>
        <strong>{solved ? 'Puzzle Solved' : 'Puzzle Not Solved'}</strong>
        <p>{solved ? 'All validation rows now pass.' : 'Keep adjusting gates until every row matches.'}</p>
      </div>

      <label className="logic-output-picker logic-side-block">
        Final Output Source
        <select value={outputSource} onChange={(event) => setOutputSource(event.target.value)}>
          {finalOutputSources.map((source) => (
            <option key={source.value} value={source.value}>{source.label}</option>
          ))}
        </select>
      </label>

      <div className="logic-truth-table logic-truth-table-side">
        <div className="logic-table-head logic-table-head-side">
          <h3>Validation Matrix</h3>
          <p>Every row must match.</p>
        </div>

        <div className="logic-table-grid logic-table-grid-side">
          {rowResults.map((row, rowIndex) => (
            <article key={`${puzzle.id}-${rowIndex}`} className={`logic-table-row logic-table-row-side ${row.passed ? 'logic-table-row-pass' : 'logic-table-row-fail'}`}>
              <div className="logic-row-line">
                {puzzle.inputLabels.map((label) => (
                  <BitPill key={`${rowIndex}-${label}`} label={label} value={row.inputs[label]} />
                ))}
                <BitPill label="Output" value={row.output} />
              </div>
            </article>
          ))}

          <article className={`logic-table-row logic-table-row-side logic-table-row-summary ${solved ? 'logic-table-row-pass' : 'logic-table-row-fail'}`}>
            <div className="logic-row-summary-copy">
              <strong>Validation Result</strong>
              <p>{passedRows}/{rowResults.length} rows passing ({solved ? 'Solved' : 'Not Solved'})</p>
            </div>
            <div className="logic-row-result">
              <BitPill label="OK" value={solved ? 1 : 0} />
            </div>
          </article>
        </div>
      </div>

    </>
  )
}

function BottomPanel({ onBackToMenu }) {
  return (
    <>
      <div className="hud-wave" aria-hidden="true" />
      <div className="hud-bottom-row">
        <button type="button" className="hud-button" onClick={onBackToMenu}>Exit To Menu</button>
        <button type="button" className="hud-button" disabled>Probe</button>
        <button type="button" className="hud-button" disabled>Analyzer</button>
      </div>
    </>
  )
}

const LogicPanels = {
  Provider: LogicGameProvider,
  TopPanel,
  LeftPanel,
  CenterPanel,
  RightPanel,
  BottomPanel,
}

export default LogicPanels