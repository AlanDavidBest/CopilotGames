import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'

const LogicGameContext = createContext(null)

const GATE_OPTIONS = ['AND', 'OR', 'XOR', 'NAND', 'NOR', 'NOT']

const PUZZLES = [
  {
    id: 'xor-split',
    title: 'Signal Split',
    briefing: 'Build a circuit that turns on only when the two inputs disagree.',
    inputLabels: ['A', 'B'],
    cases: [
      { inputs: { A: 0, B: 0 }, target: 0 },
      { inputs: { A: 0, B: 1 }, target: 1 },
      { inputs: { A: 1, B: 0 }, target: 1 },
      { inputs: { A: 1, B: 1 }, target: 0 },
    ],
    recommendedGates: 1,
  },
  {
    id: 'lockout',
    title: 'Lockout Latch',
    briefing: 'Only allow output when A is on and B is off.',
    inputLabels: ['A', 'B'],
    cases: [
      { inputs: { A: 0, B: 0 }, target: 0 },
      { inputs: { A: 0, B: 1 }, target: 0 },
      { inputs: { A: 1, B: 0 }, target: 1 },
      { inputs: { A: 1, B: 1 }, target: 0 },
    ],
    recommendedGates: 2,
  },
  {
    id: 'failsafe',
    title: 'Failsafe Override',
    briefing: 'Output should be on unless both safety lines are already on.',
    inputLabels: ['A', 'B'],
    cases: [
      { inputs: { A: 0, B: 0 }, target: 1 },
      { inputs: { A: 0, B: 1 }, target: 1 },
      { inputs: { A: 1, B: 0 }, target: 1 },
      { inputs: { A: 1, B: 1 }, target: 0 },
    ],
    recommendedGates: 1,
  },
  {
    id: 'two-factor',
    title: 'Two-Factor Enable',
    briefing: 'The channel opens when exactly one of A/B is true and C is enabled.',
    inputLabels: ['A', 'B', 'C'],
    cases: [
      { inputs: { A: 0, B: 0, C: 0 }, target: 0 },
      { inputs: { A: 0, B: 1, C: 1 }, target: 1 },
      { inputs: { A: 1, B: 0, C: 1 }, target: 1 },
      { inputs: { A: 1, B: 1, C: 1 }, target: 0 },
      { inputs: { A: 1, B: 0, C: 0 }, target: 0 },
    ],
    recommendedGates: 2,
  },
  {
    id: 'odd-parity',
    title: 'Odd Parity Check',
    briefing: 'Output is on when an odd number of inputs are on.',
    inputLabels: ['A', 'B', 'C'],
    cases: [
      { inputs: { A: 0, B: 0, C: 0 }, target: 0 },
      { inputs: { A: 0, B: 0, C: 1 }, target: 1 },
      { inputs: { A: 0, B: 1, C: 0 }, target: 1 },
      { inputs: { A: 0, B: 1, C: 1 }, target: 0 },
      { inputs: { A: 1, B: 0, C: 0 }, target: 1 },
      { inputs: { A: 1, B: 0, C: 1 }, target: 0 },
      { inputs: { A: 1, B: 1, C: 0 }, target: 0 },
      { inputs: { A: 1, B: 1, C: 1 }, target: 1 },
    ],
    recommendedGates: 2,
  },
  {
    id: 'alarm-suppress',
    title: 'Alarm Suppression',
    briefing: 'Trigger output when A or B is high, but always block when C is high.',
    inputLabels: ['A', 'B', 'C'],
    cases: [
      { inputs: { A: 0, B: 0, C: 0 }, target: 0 },
      { inputs: { A: 0, B: 1, C: 0 }, target: 1 },
      { inputs: { A: 1, B: 0, C: 0 }, target: 1 },
      { inputs: { A: 1, B: 1, C: 0 }, target: 1 },
      { inputs: { A: 0, B: 0, C: 1 }, target: 0 },
      { inputs: { A: 0, B: 1, C: 1 }, target: 0 },
      { inputs: { A: 1, B: 0, C: 1 }, target: 0 },
      { inputs: { A: 1, B: 1, C: 1 }, target: 0 },
    ],
    recommendedGates: 3,
  },
  {
    id: 'redundant-line',
    title: 'Redundant Line Vote',
    briefing: 'Output is on only if C is on and either A or B agrees to route power.',
    inputLabels: ['A', 'B', 'C'],
    cases: [
      { inputs: { A: 0, B: 0, C: 0 }, target: 0 },
      { inputs: { A: 0, B: 1, C: 0 }, target: 0 },
      { inputs: { A: 1, B: 0, C: 0 }, target: 0 },
      { inputs: { A: 1, B: 1, C: 0 }, target: 0 },
      { inputs: { A: 0, B: 0, C: 1 }, target: 0 },
      { inputs: { A: 0, B: 1, C: 1 }, target: 1 },
      { inputs: { A: 1, B: 0, C: 1 }, target: 1 },
      { inputs: { A: 1, B: 1, C: 1 }, target: 1 },
    ],
    recommendedGates: 2,
  },
  {
    id: 'guarded-mismatch',
    title: 'Guarded Mismatch',
    briefing: 'Output is high only when A and B disagree while C stays low.',
    inputLabels: ['A', 'B', 'C'],
    cases: [
      { inputs: { A: 0, B: 0, C: 0 }, target: 0 },
      { inputs: { A: 0, B: 1, C: 0 }, target: 1 },
      { inputs: { A: 1, B: 0, C: 0 }, target: 1 },
      { inputs: { A: 1, B: 1, C: 0 }, target: 0 },
      { inputs: { A: 0, B: 0, C: 1 }, target: 0 },
      { inputs: { A: 0, B: 1, C: 1 }, target: 0 },
      { inputs: { A: 1, B: 0, C: 1 }, target: 0 },
      { inputs: { A: 1, B: 1, C: 1 }, target: 0 },
    ],
    recommendedGates: 2,
  },
]

const DEFAULT_CIRCUIT = [
  { gate: 'AND', inA: 'A', inB: 'B' },
  { gate: 'OR', inA: 'A', inB: 'B' },
  { gate: 'NOT', inA: 'G1', inB: 'A' },
]

function evaluateGate(gate, left, right) {
  switch (gate) {
    case 'AND':
      return left && right ? 1 : 0
    case 'OR':
      return left || right ? 1 : 0
    case 'XOR':
      return left !== right ? 1 : 0
    case 'NAND':
      return left && right ? 0 : 1
    case 'NOR':
      return left || right ? 0 : 1
    case 'NOT':
      return left ? 0 : 1
    default:
      return 0
  }
}

function getInitialOutputSource() {
  return 'G1'
}

function evaluateCircuit(circuit, outputSource, inputValues) {
  const values = { ...inputValues }

  circuit.forEach((slot, index) => {
    const left = values[slot.inA] ?? 0
    const right = slot.gate === 'NOT' ? 0 : values[slot.inB] ?? 0
    values[`G${index + 1}`] = evaluateGate(slot.gate, left, right)
  })

  return {
    values,
    output: values[outputSource] ?? 0,
  }
}

function buildAvailableSources(inputLabels, slotIndex) {
  const inputSources = inputLabels.map((label) => ({ value: label, label }))
  const gateSources = Array.from({ length: slotIndex }, (_, index) => ({
    value: `G${index + 1}`,
    label: `Gate ${index + 1}`,
  }))

  return [...inputSources, ...gateSources]
}

export function LogicGameProvider({ children }) {
  const [puzzleIndex, setPuzzleIndex] = useState(0)
  const [circuit, setCircuit] = useState(DEFAULT_CIRCUIT)
  const [outputSource, setOutputSource] = useState(getInitialOutputSource)

  const puzzle = PUZZLES[puzzleIndex]

  const rowResults = useMemo(() => {
    return puzzle.cases.map((testCase) => {
      const result = evaluateCircuit(circuit, outputSource, testCase.inputs)
      return {
        ...testCase,
        output: result.output,
        gateValues: [result.values.G1 ?? 0, result.values.G2 ?? 0, result.values.G3 ?? 0],
        passed: result.output === testCase.target,
      }
    })
  }, [circuit, outputSource, puzzle])

  const solved = rowResults.every((row) => row.passed)
  const allSolved = solved && puzzleIndex === PUZZLES.length - 1
  const solvedRef = useRef(solved)

  useEffect(() => {
    solvedRef.current = solved
  }, [solved])

  const gateUsage = useMemo(() => {
    return circuit.reduce((count, slot) => {
      if (slot.gate === 'NOT') {
        return count + 1
      }

      if (slot.inA || slot.inB) {
        return count + 1
      }

      return count
    }, 0)
  }, [circuit])

  const updateSlot = (slotIndex, field, value) => {
    setCircuit((prev) => prev.map((slot, index) => {
      if (index !== slotIndex) {
        return slot
      }

      const nextSlot = { ...slot, [field]: value }
      if (field === 'gate' && value === 'NOT') {
        nextSlot.inB = nextSlot.inA
      }
      return nextSlot
    }))
  }

  const solveCurrentPuzzle = () => {
    const sourceValues = puzzle.inputLabels
    const slotSources = [
      sourceValues,
      [...sourceValues, 'G1'],
      [...sourceValues, 'G1', 'G2'],
    ]
    const finalSources = [...sourceValues, 'G1', 'G2', 'G3']

    for (const gate1 of GATE_OPTIONS) {
      for (const inA1 of slotSources[0]) {
        const inB1Options = gate1 === 'NOT' ? [inA1] : slotSources[0]
        for (const inB1 of inB1Options) {
          const slot1 = { gate: gate1, inA: inA1, inB: inB1 }

          for (const gate2 of GATE_OPTIONS) {
            for (const inA2 of slotSources[1]) {
              const inB2Options = gate2 === 'NOT' ? [inA2] : slotSources[1]
              for (const inB2 of inB2Options) {
                const slot2 = { gate: gate2, inA: inA2, inB: inB2 }

                for (const gate3 of GATE_OPTIONS) {
                  for (const inA3 of slotSources[2]) {
                    const inB3Options = gate3 === 'NOT' ? [inA3] : slotSources[2]
                    for (const inB3 of inB3Options) {
                      const slot3 = { gate: gate3, inA: inA3, inB: inB3 }
                      const candidateCircuit = [slot1, slot2, slot3]

                      for (const candidateOutput of finalSources) {
                        const matches = puzzle.cases.every((testCase) => {
                          const result = evaluateCircuit(candidateCircuit, candidateOutput, testCase.inputs)
                          return result.output === testCase.target
                        })

                        if (matches) {
                          setCircuit(candidateCircuit)
                          setOutputSource(candidateOutput)
                          return
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  const resetPuzzle = () => {
    setCircuit(DEFAULT_CIRCUIT)
    setOutputSource(getInitialOutputSource())
  }

  const nextPuzzle = () => {
    if (!solvedRef.current) {
      return
    }

    setPuzzleIndex((prev) => {
      const nextIndex = (prev + 1) % PUZZLES.length
      return nextIndex
    })
    setCircuit(DEFAULT_CIRCUIT)
    setOutputSource(getInitialOutputSource())
  }

  const value = {
    gateOptions: GATE_OPTIONS,
    puzzle,
    puzzleIndex,
    puzzleCount: PUZZLES.length,
    circuit,
    outputSource,
    rowResults,
    solved,
    allSolved,
    gateUsage,
    recommendedGates: puzzle.recommendedGates,
    buildAvailableSources: (slotIndex) => buildAvailableSources(puzzle.inputLabels, slotIndex),
    finalOutputSources: [
      ...puzzle.inputLabels.map((label) => ({ value: label, label })),
      { value: 'G1', label: 'Gate 1' },
      { value: 'G2', label: 'Gate 2' },
      { value: 'G3', label: 'Gate 3' },
    ],
    updateSlot,
    setOutputSource,
    resetPuzzle,
    nextPuzzle,
    solveCurrentPuzzle,
  }

  return <LogicGameContext.Provider value={value}>{children}</LogicGameContext.Provider>
}

export function useLogicGame() {
  const context = useContext(LogicGameContext)

  if (!context) {
    throw new Error('useLogicGame must be used inside LogicGameProvider')
  }

  return context
}