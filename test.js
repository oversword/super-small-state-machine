import S from "./index.js"

let tests = [
    // # Requirements
    {
        description: 'Requirements',
        tests: [
            // ## Execution
            {
                description: 'Execution',
                tests: [
                    // Can execute function
                    {
                        description: 'Can execute function',
                        expected: 611,
                        initial: {
                            input: 8,
                        },
                        defaults: {
                            input: -5,
                        },
                        sequence: ({ input }) => ({ result: (input + 5) * 47 })
                    },
                    // Can execute array
                    {
                        description: 'Can execute array',
                        expected: 69,
                        initial: {
                            input: 6
                        },
                        defaults: {
                            input: 0,
                        },
                        sequence: [
                            ({ input }) => ({ result: input * 9 }),
                            ({ result }) => ({ result: result + 15 })
                        ]
                    },
                    // Can execute conditional
                    {
                        description: 'Can execute conditional (then)',
                        expected: 44,
                        initial: {
                            input: 25
                        },
                        defaults: {
                            input: 0,
                        },
                        sequence: {
                            if: ({ input }) => input === 25,
                            then: () => ({ result: 44 }),
                            else: () => ({ result: 55 }),
                        }
                    },
                    {
                        description: 'Can execute conditional (else)',
                        expected: 55,
                        initial: {
                            input: 8
                        },
                        defaults: {
                            input: 0,
                        },
                        sequence: {
                            if: ({ input }) => input === 25,
                            then: () => ({ result: 44 }),
                            else: () => ({ result: 55 }),
                        }
                    },
                    // Can execute switch conditional
                    {
                        description: 'Can execute switch conditional (specific case)',
                        expected: 2,
                        initial: {
                            mode: 'second'
                        },
                        defaults: {
                            mode: 'none'
                        },
                        sequence: {
                            switch: ({ mode }) => mode,
                            case: {
                                first: () => ({ result: 1 }),
                                second: () => ({ result: 2 }),
                                third: () => ({ result: 3 }),
                                default: () => ({ result: -1 }),
                            }
                        }
                    },
                    {
                        description: 'Can execute switch conditional (default)',
                        expected: -1,
                        initial: {
                            mode: 'blarg'
                        },
                        defaults: {
                            mode: 'none'
                        },
                        sequence: {
                            switch: ({ mode }) => mode,
                            case: {
                                first: () => ({ result: 1 }),
                                second: () => ({ result: 2 }),
                                third: () => ({ result: 3 }),
                                default: () => ({ result: -1 }),
                            }
                        }
                    },
                    // Can execute state machine
                    {
                        description: 'Can execute state machine',
                        expected: 2592,
                        initial: {
                            input: 32,
                        },
                        defaults: {
                            input: 0,
                        },
                        sequence: {
                            initial: [
                                ({ input }) => ({ result: input }),
                                'secondState'
                            ],
                            secondState: [
                                ({ result }) => ({ result: result * 3 }),
                                'thirdState'
                            ],
                            thirdState: [
                                {
                                    if: ({ result }) => result < 1000,
                                    then: 'secondState',
                                }
                            ]
                        }
                    },
                    // Can execute array as state machine
                    {
                        description: 'Can execute array as state machine',
                        expected: 103,
                        initial: {
                            input: 13,
                        },
                        defaults: {
                            result: 0,
                            input: 1,
                        },
                        sequence: [
                            ({ input }) => ({ result: input - 1 }),
                            ({ result, input }) => ({ result: result + input }),
                            ({ input }) => ({ input: input - 1 }),
                            {
                                if: ({ input }) => input > 0,
                                then: 1,
                            }
                        ]
                    },
                    // Can nest indefinitely
                    {
                        description: 'Can nest indefinitely',
                        expected: 37,
                        initial: {
                            input: 18,
                        },
                        defaults: {
                            input: 0,
                        },
                        sequence: {
                            if: ({ input }) => input < 4,
                            else: {
                                initial: [
                                    [
                                        ({ input }) => ({ result: input }),
                                        ({ input }) => ({ input: input - 1 }),
                                    ],
                                    ({ result, input }) => ({ result: result + input }),
                                    'machine'
                                ],
                                machine: [
                                    {
                                        initial: {
                                            if: ({ result }) => result % 2 === 0,
                                            then: 'halve',
                                            else: 'other'
                                        },
                                        halve: ({ input }) => ({ input: input / 2 }),
                                        other: {
                                            switch: ({ result }) => result % 3,
                                            case: {
                                                0: ({ result }) => ({ result: result + 7 }),
                                                1: ({ result }) => ({ result: result + 5 }),
                                                2: ({ result }) => ({ result: result + 3 }),
                                            }
                                        }
                                    },
                                    'afterMachine'
                                ],
                                afterMachine: 'somethingElse',
                                somethingElse: {
                                    initial: {
                                        switch: () => 'always',
                                        case: {
                                            always: [
                                                {
                                                    if:() => true,
                                                    then:{
                                                        initial:{
                                                            if:()=>true,
                                                            then:[{
                                                                switch:()=>'always',
                                                                case:{
                                                                    always:{
                                                                        if:()=>true,
                                                                        then:({ result }) => ({ result: result - 1 })
                                                                    }
                                                                }
                                                            }]
                                                        }
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                }
                            },
                            then: ({ input }) => ({ result: input }),
                        }
                    },
                ],
            },

            // ## Static Values
            {
                description: 'Static Values',
                tests: [
                    // Can use path object as absolute path
                    {
                        description: 'Can use path object as absolute path',
                        expected: 9,
                        initial: {
                            result: 5,
                        },
                        defaults: {
                            result: 0,
                        },
                        sequence: {
                            initial: { [S.path]: ['second',0] },
                            second: [
                                ({ result }) => ({ result: result + 4 })
                            ]
                        }
                    },
                    // Can use path object as relative path
                    {
                        description: 'Can use path object as relative path',
                        expected: 9,
                        initial: {
                            result: 5,
                        },
                        defaults: {
                            result: 0,
                        },
                        sequence: {
                            initial: { [S.path]: 'second' },
                            second: [
                                ({ result }) => ({ result: result + 4 })
                            ]
                        }
                    },
                    // Can use string as relative path
                    {
                        description: 'Can use string as relative path',
                        expected: 7,
                        initial: {
                            result: 0,
                        },
                        defaults: {
                            result: 9,
                        },
                        sequence: {
                            initial: [
                                ({ result }) => ({ result: result + 1 }),
                                'final'
                            ],
                            final: [
                                {
                                    if: ({ result }) => result < 7,
                                    then: 'initial'
                                }
                            ]
                        }
                    },
                    // Can use number as relative path
                    {
                        description: 'Can use number as relative path',
                        expected: 7,
                        initial: {
                            result: 0,
                        },
                        defaults: {
                            result: 9,
                        },
                        sequence:[
                            ({ result }) => ({ result: result + 1 }),
                            {
                                if: ({ result }) => result < 7,
                                then: 0
                            }
                        ]
                    },

                    // Can use return as directive
                    {
                        description: 'Can use return as directive',
                        expected: 0,
                        initial: {
                            result: 6,
                        },
                        defaults: {
                            result: -1,
                        },
                        sequence: [
                            ({ result }) => ({ result: result - 1 }),
                            {
                                if: ({ result }) => result <= 0,
                                then: S.return,
                                else: 0
                            }
                        ]
                    },
                    // Can use return object as directive
                    {
                        description: 'Can use return object as directive',
                        expected: 66,
                        initial: {
                            result: 6,
                        },
                        defaults: {
                            result: -1,
                        },
                        sequence: [
                            ({ result }) => ({ result: result - 1 }),
                            {
                                if: ({ result }) => result <= 0,
                                then: { [S.return]: 66 },
                                else: 0
                            }
                        ]
                    },

                    // Can use state change object as value
                    {
                        description: 'Can use state change object as value',
                        expected: 66,
                        initial: {
                            result: 99
                        },
                        defaults: {
                            result: 0,
                        },
                        sequence: { result: 66 }
                    },
                ]
            },

            // ## Dynamic Values
            {
                description: 'Dynamic Values',
                tests: [
                    // Can return array as absolute path
                    {
                        description: 'Can return array as absolute path',
                        expected: 9,
                        initial: {
                            result: 5,
                        },
                        defaults: {
                            result: 0,
                        },
                        sequence: {
                            initial: () => ['second',0],
                            second: [
                                ({ result }) => ({ result: result + 4 })
                            ]
                        }
                    },
                    // Can return path object as absolute path
                    {
                        description: 'Can return path object as absolute path',
                        expected: 9,
                        initial: {
                            result: 5,
                        },
                        defaults: {
                            result: 0,
                        },
                        sequence: {
                            initial: () => ({ [S.path]: ['second',0] }),
                            second: [
                                ({ result }) => ({ result: result + 4 })
                            ]
                        }
                    },
                    // Can return path object as relative path
                    {
                        description: 'Can return path object as relative path',
                        expected: 9,
                        initial: {
                            result: 5,
                        },
                        defaults: {
                            result: 0,
                        },
                        sequence: {
                            initial: () => ({ [S.path]: 'second' }),
                            second: [
                                ({ result }) => ({ result: result + 4 })
                            ]
                        }
                    },
                    // Can return string as relative path
                    {
                        description: 'Can return string as relative path',
                        expected: 7,
                        initial: {
                            result: 0,
                        },
                        defaults: {
                            result: 9,
                        },
                        sequence: {
                            initial: [
                                ({ result }) => ({ result: result + 1 }),
                                () => 'final'
                            ],
                            final: [
                                {
                                    if: ({ result }) => result < 7,
                                    then: () => 'initial'
                                }
                            ]
                        }
                    },
                    // Can return number as relative path
                    {
                        description: 'Can return number as relative path',
                        expected: 7,
                        initial: {
                            result: 0,
                        },
                        defaults: {
                            result: 9,
                        },
                        sequence:[
                            ({ result }) => ({ result: result + 1 }),
                            {
                                if: ({ result }) => result < 7,
                                then: () => 0
                            }
                        ]
                    },

                    // Can return return as directive
                    {
                        description: 'Can return return as directive',
                        expected: 0,
                        initial: {
                            result: 6,
                        },
                        defaults: {
                            result: -1,
                        },
                        sequence: [
                            ({ result }) => ({ result: result - 1 }),
                            {
                                if: ({ result }) => result <= 0,
                                then: () => S.return,
                                else: 0
                            }
                        ]
                    },
                    // Can return return object as directive
                    {
                        description: 'Can return return object as directive',
                        expected: 66,
                        initial: {
                            result: 6,
                        },
                        defaults: {
                            result: -1,
                        },
                        sequence: [
                            ({ result }) => ({ result: result - 1 }),
                            {
                                if: ({ result }) => result <= 0,
                                then: () => ({ [S.return]: 66 }),
                                else: 0
                            }
                        ]
                    },

                    // Can return object as state change
                    {
                        description: 'Can return object as state change',
                        expected: 66,
                        initial: {
                            result: 99
                        },
                        defaults: {
                            result: 0,
                        },
                        sequence: () => ({ result: 66 })
                    },
                ],
            },

            // ## Wrapping
            {
                description: 'Wrapping',
                tests: [
                    // Can use other machine as step
                    {
                        description: 'Can use other machine as step',
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
                    },
                    // Can use other machine step as own step
                    {
                        description: 'Can use other machine step as own step',
                        initial: {
                            input: 10,
                        },
                        expected: '1_2_6_24_120_720_5040_40320_362880_3628800',
                        defaults: {
                            input: 1,
                            resultList: [],
                            subState: {},
                            subPath: [],
                            subDone: false,
                        },
                        sequence: {
                            initial: [
                                ({ subState, input }) => ({ subState: { ...subState, input }}),
                                'cradle'
                            ],
                            cradle: [
                                (new S({
                                    result: 1,
                                    input: 1,
                                    counter: 0,
                                },[
                                    ({ counter }) => ({ counter: counter + 1 }),
                                    ({ result, counter }) => ({ result: result * counter }),
                                    {
                                        if: ({ input, counter }) => counter < input,
                                        then: 0
                                    }
                                ])).input(({ subState, subPath }) => ({
                                    ...subState,
                                    [S.path]: subPath
                                })).output(({ [S.path]: subPath, [S.return]: subDone = false, ...subState }) => ({
                                    subPath, subState, subDone
                                })).step,
                                'final'
                            ],
                            final: [
                                {
                                    if: ({ subState, resultList }) => subState.result !== resultList[resultList.length-1],
                                    then: ({ resultList, subState }) => ({ resultList: [...resultList, subState.result]})
                                },
                                {
                                    if: ({ subDone }) => subDone,
                                    then: ({ resultList }) => ({ [S.return]: resultList.join('_') }),
                                    else: 'cradle'
                                }
                            ]
                        }
                    },
                ]
            },
        ]
    },

    // # Examples
    {
        description: 'Examples',
        tests: [
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
                description: '12th fibonacci number is 144',
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
                        'fib'
                    ],
                    fib: [
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
                            then: 'fib',
                            else: S.return,
                        }
                    ]
                }
            },
        ]
    }
]

// Duplicate tests making every action async
const wait_time = delay => (delay ? new Promise(resolve => setTimeout(resolve, delay)) : Promise.resolve())

const makeAsync = method => async (...a) => {
    await wait_time(20)
    return method(...a)
}

const makeTestAsync = (test) => {
    if ('tests' in test) {
        return {
            ...test,
            tests: test.tests.map(makeTestAsync)
        }
    }
    const newSeq = S.traverse((node) => {
        if (typeof node === 'function')
            return makeAsync(node)
        return node
    })(test.sequence)

    return {
        ...test,
        sequence: newSeq,
        async: true,
    }
}

tests = tests.concat([{description: 'Async', tests:tests.map(makeTestAsync).concat([
    {
        description: 'Can perform parallel actions when using async.',
        async: true,
        expected: '9_7',
        defaults: {
            input: 0,
            result: []
        },
        initial: {
            input: 10 
        },
        sequence: [
            ({ input }) => ({ input: input - 1 }),
            S.parallel({
                if: ({ input }) => input > 5,
                then: [
                    ({ result, input }) => ({ result: [...result,input] }),
                    ({ input }) => ({ input: input - 1 }),
                ],
            },
            {
                if: ({ input }) => input > 5, 
                then: [
                    ({ result, input }) => ({ result: [...result,input] }),
                    ({ input }) => ({ input: input - 1 }),
                ],
            }),
            {
                if: ({ input }) => input > 0,
                then: 0,
            },
            ({ result }) => ({ [S.return]: result.join('_') })
        ],
    },
    {
        description: 'Cannot perform parallel actions when not using async.',
        expected: '9_8_6',
        defaults: {
            input: 0,
            result: []
        },
        initial: {
            input: 10 
        },
        sequence: [
            ({ input }) => ({ input: input - 1 }),
            S.parallel({
                if: ({ input }) => input > 5,
                then: [
                    ({ result, input }) => ({ result: [...result,input] }),
                    ({ input }) => ({ input: input - 1 }),
                ],
            },
            {
                if: ({ input }) => input > 5, 
                then: [
                    ({ result, input }) => ({ result: [...result,input] }),
                    ({ input }) => ({ input: input - 1 }),
                ],
            }),
            {
                if: ({ input }) => input > 0,
                then: 0,
            },
            ({ result }) => ({ [S.return]: result.join('_') })
        ],
    }
])}])

// Testing Framework
const runTest = async (test) => {
    if ('tests' in test) {
        const res = (await Promise.all(test.tests.map(childTest => ({
            ...childTest,
            path: (test.path || []).concat([test.description])
        })).map(runTest)))
        return {
            ...test,
            result: res
        }
    }
    let result;
    if ('method' in test) {
        result = await test.method(test.initial)
    } else {
        const testMachine = new S(test.defaults, test.sequence, { iterations: 1000 })
        const runner  = test.async ? testMachine.async : testMachine.sync
        result = await runner(test.initial)
    }
    if (result === test.expected) {
        return ({ ...test, success: true })
    } else {
        return ({...test, result })
    }
}

const printFailure = test => {
    if ('tests' in test) {
        console.group(test.description)
        test.result.filter(filterFailures).forEach(printFailure)
        console.groupEnd()
        return
    }
    console.log(`Failed: ${test.description}. Expected ${test.expected}, got ${test.result}`)
}

const printResult = test => {
    if ('tests' in test) {
        console.group(test.description)
        test.result.forEach(printResult)
        const failures = test.result.filter(filterFailures)
        if (failures.length)
            console.log(`Failed ${failures.length}/${test.tests.length}`)
        console.groupEnd()
        return;
    }
    if (test.success) {
        console.log(test.description)
    } else {
        console.log(`FAILED: ${test.description}. Got ${test.result}, expected ${test.expected}`)
    }
}

const filterFailures = test => {
    if ('tests' in test) {
        const sub = test.result.filter(filterFailures)
        return sub.length
    }
    return !test.success
}

// Run Tests
console.group('Tests')
const results = await Promise.all(tests.map(runTest))
results.forEach(printResult)
const failed = results.filter(filterFailures)

if (failed.length) {
    console.group('FAILED')
    failed.forEach(printFailure)
    console.groupEnd()
}

console.groupEnd()