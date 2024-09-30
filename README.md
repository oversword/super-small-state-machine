
## Basics
### Creating a Machine
```javascript
const machine = new S(defaultContext, executionProcess)
```
### Executing a machine
```javascript
const result = machine(initialContext[, runConfig])
```
### Input and Output
```javascript
const machine = new S(defaultContext, executionProcess)
const modifiedMachine = machine.input(trandformInput).output(transformOutput)
const result = modifiedMachine(initialContext)
```
### Stepwise Execution
```javascript
const machine = new S(defaultContext, executionProcess)
const secondContext = machine.step(firstContext)
const thirdContext  = machine.step(secondContext)
```

## Process Definition
### Actions
```javascript
const machine = new S(defaultContext, (context) => {
    return {
        update: 'value'
    }
})
```
### Sequences
```javascript
const machine = new S(defaultContext, [
    firstAction,
    secondAction,
    thirdAction,
])
```
### Conditionals
```javascript
const machine = new S(defaultContext, {
    if: ({ someProperty }) => someProperty === 'value',
    then: successAction,
    else: failAction,
})
```
```javascript
const machine = new S(defaultContext, {
    switch: ({ someProperty }) => someProperty,
    case: {
        firstValue: handleFirstValue,
        secondValue: handleSecondValue,
        default: fallbackHandler,
    }
})
```
### State Machines
```javascript
const machine = new S(defaultContext, {
    initial: 'firstStage',
    firstStage: [
        firstAction,
        'secondStage',
    ],
    secondStage: [
        secondAction
    ]
})
```
### Transitions
```javascript
const machine = new S(defaultContext, [
    firstAction,
    secondAction,
    thirdAction,
    {
        if: endCondition,
        then: S.return,
        else: 0
    }
])
```
```javascript
const machine = new S(defaultContext, {
    firstStage: [
        firstAction,
        'secondStage',
    ],
    secondStage: [
        secondAction,
        'continueOrExit',
    ],
    continueOrExit: {
        if: endCondition,
        then: S.return,
        else: 'firstStage'
    }
})
```
```javascript
const machine = new S(defaultContext, {
    firstStage: [
        firstAction,
        'secondStage',
    ],
    secondStage: [
        secondAction,
        'continueOrExit',
    ],
    continueOrExit: {
        if: endCondition,
        then: S.return,
        else: () => ['firstStage',0]
    }
})
```
### Nesting
```javascript
const childMachine = new S(childContext, childSequence)
const parentMachine = new S(parentContext, [
    firstAction,
    childMachine
        .input(({ parentProperty }) => ({ childProperty: parentProperty }))
        .output((resultValue) => ({ result: resultValue })),
])
```

