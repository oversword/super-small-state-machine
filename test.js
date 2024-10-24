import pluginDescribed, { a, c, t } from "./plugin-described.js"
import pluginEvents, { emit } from "./plugin-events.js"
import S from "./index.ts"
import { parallel } from "./default-nodes.ts"
// import S from "./plugin-described.js"

// import S from "@oversword/super-small-state-machine"
	
const testSymbol = Symbol('Test Symbol')
//*
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
					// Can use symbol as relative path
					{
						description: 'Can use symbol as relative path',
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
								testSymbol
							],
							[testSymbol]: [
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
					// Can return symbol as relative path
					{
						description: 'Can return symbol as relative path',
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
								() => testSymbol
							],
							[testSymbol]: [
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
								(new S([
									({ result, input }) => ({ result: result * input }),
									({ input }) => ({ input: input-1 }),
									{
										if: ({ input }) => input > 1,
										then: 0
									}
								]).defaults({
									result: 1,
									input: 1,
								}))
								.input(({ realInput }) => ({ input: realInput, result: 1 }))
								.output(({result}) => ({ result })),
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
								(new S([
									({ counter }) => ({ counter: counter + 1 }),
									({ result, counter }) => ({ result: result * counter }),
									{
										if: ({ input, counter }) => counter < input,
										then: 0
									}
								]).defaults({
									result: 1,
									input: 1,
									counter: 0,
								})).step.input(({ subState, subPath }) => ({
									...subState,
									[S.path]: subPath
								})).output(({ [S.path]: subPath, [S.return]: subDone = false, ...subState }) => ({
									subPath, subState, subDone
								})),
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
			{
				description: '12th fibonacci number is 144 (described)',
				expected: 144,
				config: {
					transitions: {
						exitOrLoop: {
							if: ({ input }) => input > 1,
							then: 'fib',
							else: S.return,
						}
					},
					actions: {
						startAtOne: () => ({ result: 1 }),
						decrementCounter: ({ input }) => ({ input: input-1 }),
						fibonacci: ({ result, result2 }) => ({
							result2: result,
							result: result + result2
						}),
						startingPosition: {
							if: c('startAtZero'),
							then: a('startAtOne')
						}
					},
					conditions: {
						startAtZero: ({ result }) => result === 0
					}
				},
				initial: {
					input: 12,
				},
				defaults: {
					input: 1,
					result: 0,
					result2: 0,
				},
				plugins: [pluginDescribed],
				sequence: {
					initial: 'testStart',
					testStart: [
						a('startingPosition'),
						'fib'
					],
					fib: [
						a('fibonacci'),
						'testEnd',
					],
					testEnd: [
						a('decrementCounter'),
						t('exitOrLoop')
					]
				}
			},
		]
	}
]
/*/
let tests = []
//*/

// Duplicate tests making every action async
const wait_time = delay => (delay ? new Promise(resolve => setTimeout(resolve, delay)) : Promise.resolve())

const makeAsync = method => async (...a) => {
	await wait_time(20)
	return method(...a)
}

const asyncPlugin = ({
	process, runConfig
}) => {

	const traverse = S.traverse((node) => {
		if (typeof node === 'function')
			return makeAsync(node)
		return node
	}, obj => {
		if (testSymbol in obj && typeof obj[testSymbol] === 'function') {
			return {
				...obj,
				[testSymbol]: makeAsync(obj[testSymbol])
			}
		}
		return obj
	})
	

	return {
		process: traverse({
			nodes: runConfig.nodes,
			process
		}),
		runConfig
	}
	// return {
	// 	...test,
	// 	sequence: newSeq,
	// 	async: true,
	// }
}

const makeTestAsync = (test) => {
	if ('tests' in test) {
		return {
			...test,
			tests: test.tests.map(makeTestAsync),
		}
	} else {
		return {
			...test,
			plugins: [...(test.plugins||[]), asyncPlugin],
			async: true,
		}
	}
}

tests = tests.concat([{description: 'Async', tests:tests.map(makeTestAsync).concat([
//*
	// Parallel
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
			parallel({
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
			parallel({
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

//*/
	// Events
	{
		description: 'Fibonacci numbers (events)',
		expected: '144_233_233_377',
		initial: {input:12},
		defaults:{
				events: {
					nextNumber: {},
					getResult: {},
					kill: {},
				},
			input: 1,
			result: 0,
			result2: 0,
		},
		sequence: {
			initial: 'testStart',
			testStart: [
				{
					if: ({ result }) => result === 0,
					then: () => ({ result: 1 }),
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
					else: 'waitForEvents',
				}
			],
			waitForEvents: {
				on: {
					nextNumber: [
						({ input }) => ({ input: input+1 }),
						'fibb'
					],
					getResult: emit(({ result }) => ({ name: 'result', data: result })),
					kill: S.return,
				}
			}
		},
		async: true,
		plugins: [pluginEvents],
		action: async (instance) => {
			let results = []
			instance.subscribe((event) => {
				 if (event.name === 'result') {
					 results.push(event.data)
				 }
			});
			instance.send('getResult')
			instance.send('nextNumber')
			instance.send('getResult')
			instance.send('getResult')
			instance.send('nextNumber')
			instance.send('getResult')
			instance.send('kill')
			await instance
			return results.join('_')
		}
	},
	{
		description: 'Fibonacci numbers (events + described)',
		expected: '144_233_233_377',
		initial: {input:12},
		defaults:{
				actions:{
					startAtOne: () => ({ result: 1 }),
					fibb: ({ result, result2 }) => ({
						result2: result,
						result: result + result2
					}),
					decrementCounter: ({ input }) => ({ input: input-1 }),
					fibonacci: [
						a('fibb'),
					],
				},
				conditions: {
					startAtZero: ({ result }) => result === 0,
					moreRepetitions: ({ input }) => input > 1
				},
				events: {
					nextNumber: {},
					getResult: {},
					kill: {},
				},
			input: 1,
			result: 0,
			result2: 0,
		},
		sequence: {
			initial: 'testStart',
			testStart: [
				{
					if: c('startAtZero'),
					then: a('startAtOne'),
				},
				'fibb'
			],
			fibb: [
				a('fibonacci'),
				'testEnd',
			],
			testEnd: [
			a('decrementCounter'),
				{
					if: c('moreRepetitions'),
					then: 'fibb',
					else: 'waitForEvents',
				}
			],
			waitForEvents: {
				on: {
					nextNumber: [
						({ input }) => ({ input: input+1 }),
						'fibb'
					],
					getResult: emit(({ result }) => ({ name: 'result', data: result })),
					kill: S.return,
				}
			}
		},
		async: true,
		plugins: [pluginDescribed, pluginEvents],
		action: async (instance) => {
			let results = []
			instance.subscribe((event) => {
				 if (event.name === 'result') {
					 results.push(event.data)
				 }
			});
			instance.send('getResult')
			instance.send('nextNumber')
			instance.send('getResult')
			instance.send('getResult')
			instance.send('nextNumber')
			instance.send('getResult')
			instance.send('kill')
			await instance
			return results.join('_')
		}
	},
//*/
])}])

// Testing Framework
const runTest = async (test) => {
	let result;
	try {
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
		if ('method' in test) {
			result = await test.method(test.initial)
		} else {
			let testMachine = new S(test.sequence, { iterations: 1000 }).defaults({
				...(test.config || {}),
				...test.defaults
			})
			if (test.async)
				testMachine = testMachine.async
			if (test.plugins)
				testMachine = test.plugins.reduce((last, current) => last.plugin(current), testMachine)
			const instance = testMachine(test.initial)
			if (test.action)
				result = await test.action(instance)
			else result = await instance
		}
	} catch (error) {
		// throw error
		result = error
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

const parallelTests = (runTest, tests) => Promise.all(tests.map(runTest))
const sequentialTests = (runTest, tests) => tests.reduce(async (last, test) => [...(await last), await runTest(test)], Promise.resolve([]))

// Run Tests
console.group('Tests')
const results = await parallelTests(runTest, tests) 
// const results = await sequentialTests(runTest, tests)


results.forEach(printResult)
const failed = results.filter(filterFailures)

if (failed.length) {
	console.group('FAILED')
	failed.forEach(printFailure)
	console.groupEnd()
}

console.groupEnd()


const complexInput = new S([
	({ a, b }) => ({ [S.return]: a * b })
])
.defaults({
	a: 0, b: 0, result: 0
})
.input((a, b) => ({ a, b }))

console.log(30 === complexInput(5,6))