import S from "./index.js"

console.group('Tests')
const tests = [
    {
        description: '7 bang is 5040',
        initial: {
            input: 7
        },
        expected: 5040,
        defaults: {
            result: 1,
            input: 1,
        },
        sequence: [
            ({ result, input }) => ({ result: result * input }),
            ({ input }) => ({ input: input-1 }),
            {
                if: ({ input }) => input > 1,
                then: 0
            }
        ],
    },
    {
        description: '12th fibbonacci number is 144',
        expected: 144,
        initial: {
            input: 12,
        },
        defaults: {
            input: 1,
            result: 0,
            result2: 0,
        },
        sequence: {
            initial: 'testStart',
            testStart: [
                {
                    if: ({ result }) => result === 0,
                    then: () => ({ result: 1 })
                },
                'fibb'
            ],
            fibb: [
                ({ result, result2 }) => ({
                    result2: result,
                    result: result + result2
                }),
                'testEnd',
            ],
            testEnd: [
                ({ input }) => ({ input: input-1 }),
                {
                    if: ({ input }) => input > 1,
                    then: 'fibb',
                    else: S.return,
                }
            ]
        }
    },
    {
        description: 'Uses second machine as action',
        initial: {
            input: 10
        },
        expected: '3628800_362880_40320_5040_720_120_24_6_2',
        defaults: {
            input: 1,
            realInput: 1,
            result: 1,
            stack: [],
        },
        sequence: {
            initial: [
                ({ input }) => ({ realInput: input }),
                'testEnd'
            ],
            testEnd: {
                if: ({ realInput }) => realInput <= 1,
                then: ({ stack }) => ({ [S.return]: stack.join('_') }),
                else: 'nextBatch'
            },
            nextBatch: [
                (new S({
                    result: 1,
                    input: 1,
                },[
                    ({ result, input }) => ({ result: result * input }),
                    ({ input }) => ({ input: input-1 }),
                    {
                        if: ({ input }) => input > 1,
                        then: 0
                    }
                ]))
                .input(({ realInput }) => ({ input: realInput, result: 1 }))
                .output((result) => ({ result })),
                ({ realInput }) => ({ realInput: realInput - 1}),
                ({ stack,result }) => ({ stack: [...stack,result]}),
                'testEnd'
            ]
        }
    }
]
let failed = []
tests.forEach(test => {
    const testMachine = new S(test.defaults, test.sequence)
    const result = testMachine(test.initial)
    if (result === test.expected) {
        console.log(`Passed: ${test.description}`)
    } else {
        console.log(`Failed: ${test.description}. Got ${result}, expected ${test.expected}`)
        failed.push({...test, result})
    }
})
if (failed.length) {
    console.error(`${failed.length} tests failed:`)
    failed.forEach(test => {
        console.log(`Failed: ${test.description}. Got ${test.result}, expected ${test.expected}`)
    })
}
const log = (...a) => () => console.log(...a)

const simple = new S({},[
    log('a'),
    log('b'),
    log('c'),
    log('d'),
])

// if (name === 'asStep') {
//     let state = clone_object(initialState)
//     return () => {
//         if (S.return in state)
//             return state
//         state = S.executeAdvance(state, process, state[S.path] || [])
//         return state
//     }
// }

const exec = new S({
    steps: 0
}, {
    initial: {
        if: ({steps}) => steps < 4,
        then: 'main'
    },
    main: [
        simple.asStep,
        console.log,
        ({ steps }) => ({ steps: steps+1 }),
        'initial'
    ]
})

console.log(exec())


console.groupEnd()




// TODO: add real tests and specs
/*
const multipyRByN = ({ result, n }) => ({ result: result * n })
const NMinusOne = ({ n }) => ({ n: n-1 })
const repeatOrStop = ({ n }) => n <= 1 ? 3 : 0 
const returnR = ({ result }) => ({ [SmallStateMachine.return]: result })
const randomLog = () => console.log('hello')
const input = {
    n: 7
}
const result = (new SmallStateMachine({
    result: 1,
    n: 1
}, [
    {
        initial: 'multipyRByN',
        multipyRByN: [
            multipyRByN,
            'NMinusOne',
        ],
        NMinusOne: [
            NMinusOne,
            {
                switch: ({ n }) => n,
                case: {
                    0: [1],
                    1: () => [1],
                    default: () => [0,'multipyRByN']
                }
            },
        ],
    },
    // repeatOrStop,
    // {
    //     if: ({ n }) => (n <= 1),
    //     then: 2,
    //     else: 0
    // },
    // [randomLog,[randomLog,[randomLog]],returnR]
]))(input)
console.log({input,result})
*/