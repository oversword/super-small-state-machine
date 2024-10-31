import S from "./index.js"

const expectError = (method, errorType) => {
	const ret = {
		[method.name]: () => {
			try {
				const result = method()
				return false
			} catch (error) {
				if (typeof errorType === 'string')
					return error.message === errorType
				return (!errorType) || error instanceof errorType
			}
		}
	}
	return ret[method.name]
}
const expectErrorAsync = (method, errorType) => {
	const ret = {
		[method.name]: async () => {
			try {
				const result = await method()
				return false
			} catch (error) {
				if (typeof errorType === 'string')
					return error.message === errorType
				return (!errorType) || error instanceof errorType
			}
		}
	}
	return ret[method.name]
}

const matches = (object, match) => {
	if (typeof object !== 'object' || typeof match !== 'object')
		return object === match
	return Object.keys(match).every(key => matches(object[key], match[key]))
}

const methods = [
	function returnExitsWithResult () {
		const executable = new S(S.return)
		const result = executable({ result: 44 }) // 44
		return result === 44
	},
	function returnExitsWithValueResult () {
		const executable = new S({ [S.return]: 456 })
		const result = executable({ result: 44 }) // 456
		const endState = executable.output(state => state)({ result: 44 }) // { result: 465, [S.return]: true }
		return result === 456 && matches(endState, { result: 456, [S.return]: true })
	},
	function stringDirectiveRedirectStateMachine () {
		const executable = new S({
			initial: [
				{ result: 55 },
				'next'
			],
			next: { result: 66 }
		})
		const result = executable({ result: 44 }) // 66
		return result === 66
	},
	function  () {
		
	},
	function  () {
		
	},
	function  () {
		
	},
	function  () {
		
	},
	function  () {
		
	},
	expectError(function initialCannotBeUsedAsDirectStateChange () {
		const executable = new S({ initial: 'changed' })
		const result = executable({ initial: 'original' })
		return result !== undefined
	}),
	function initialCanBeUsedAsIndirectStateChange() {
		const executable = new S(() => ({ initial: 'changed' }))
			.output(state => state.initial)
		const result = executable({ initial: 'original' }) // 'changed'
		return result === 'changed'
	},
	function  () {
		const executable = new S([
			{ result: 'first' },
			3,
			{ result: 'skip' },
			{ result: 'second' },
		])
		const result = executable({ result: 'start' }) // 'second'
		return result === 'second'
	},
	function  () {
		
	},
	function  () {
		
	},
	function  () {
		
	},
	function  () {
		
	},
	function  () {
		
	},






	function defaults_setsInitialValues() {
		const executable = new S()
			.defaults({ result: 99 })
		return executable() === 99
	},
	function default_unstrict_canSetUnknownVariable() {
		const executable = new S(() => ({ unknownVariable: false}))
			.defaults({ knownVariable: true })
		return executable() === undefined // succeeds
	},
	expectError(function strict_cannotSetUnknownVariable() {
		const executable = new S(() => ({ unknownVariable: false}))
			.defaults({ knownVariable: true })
			.strict
		const result = executable()
		return result !== undefined // errors
	}),
	expectError(function strictTypes_cannotChangeVariableType() {
		const executable = new S(() => ({ knownVariable: 45 }))
			.defaults({ knownVariable: true })
			.strictTypes
		const result = executable()
		return result !== undefined // errors
	}),
	function unstrict_canSetUnknownVariable() {
		const executable = new S(() => ({ unknownVariable: false}))
			.defaults({ knownVariable: true })
			.strict
			.strictTypes
			.unstrict
		const result = executable()
		return result === undefined // succeeds
	},
	function default_sync_cannotExecutePromise() {
		const executable = new S(async () => ({ result: 45 }))
			.defaults({ result: 22 })
		const result = executable() // 22
		return result === 22
	},
	async function async_canExecutePromise () {
		const executable = new S(async () => ({ result: 45 }))
		.defaults({ result: 22 })
		.async
		const result = await executable() // 45
		return result === 45
	},
	function sync_cannotExecutePromise() {
		const executable = new S(async () => ({ result: 45 }))
		.async
		.sync
		.defaults({ result: 22 })
		const result = executable() // 22
		return result === 22
	},
	function step_allowsStepwiseExecution () {
		const executable = new S([{ result: 45 }, { result: 66 }])
			.defaults({ result: 22 })
			.step
		const result1 = executable() // { result: 22 }
		const result2 = executable(result1) // { result: 45 }
		const result3 = executable(result2) // { result: 66 }

		return matches(result1, { result: 22 }) &&
		       matches(result2, { result: 45 }) &&
					matches(result3, { result: 66 })
	},
	function  () {
		const executable = new S(({ a, b, c }) => ({ [S.return]: a * b * c }))
			.defaults({ a: 0, b: 0, c: 0 })
			.input((a, b, c) => ({ a, b, c }))
		const result = executable(1, 2, 3) // 6
		return result === 6
	},
	function  () {
		const executable = new S(({ myReturnValue }) => ({ myReturnValue: myReturnValue + 1}))
			.defaults({ myReturnvalue: 0 })
			.output(state => state.myReturnValue)
		const result = executable({ myReturnValue: 7 }) // returns 8
		return result === 8

	},
	function  () {
		
	},
	async function complexLogicOutsideOfMachine () {
		const waitForEvents = Symbol('Wait for events')

		const executable = new S({
			initial: [
				({ value }) => ({ value: value + 1 }),
				'waitForEvents'
			],
			waitForEvents: [
				{ event: null },
				{ [S.return]: waitForEvents },
				{ result: null },
				{
					switch: ({ event }) => event.type,
					case: {
						multiply: [
							({ value, event }) => ({ value: value * event.data }),
							'waitForEvents',
						],
						increment: [
							{ event: null },
							'initial'
						],
						exit: ({ value }) => ({ [S.return]: value }),
						default: 'waitForEvents'
					}
				}
			]
		}).output(state => state)

		const exec = async (initialState, yieldEvent) => {
			let currentState = initialState
			let runs = 0
			while (++runs < 100) {
				currentState = executable(currentState)
				if (currentState.result === waitForEvents) {
					currentState = S.advance(executable, currentState, { event: await yieldEvent() })
				} else break;
			}
			return { runs, result: currentState.result }
		}
		const currentState = { value: 0 }
		const eventStack = [
			{ type: 'increment' },
			{ type: 'multiply', data: 5 },
			{ type: 'increment' },
			{ type: 'exit' }
		]
		const yieldEvent = events => {
			let eventStack = [...events].reverse()
			return () => new Promise(resolve => {
				setTimeout(() => resolve(eventStack.pop()), 100)
			})
		}

		const result = await exec(currentState, yieldEvent(eventStack)) // { result: 11, runs: 5 }
		return matches(result, { result: 11, runs: 5 })
	},
]


methods.reduce(async (prev, method) => {
	await prev
	// console.group(method.name)


	const logs = []
	const capture_log = (...a) => {
		logs.push(a)
	}
	const orig_console = console.log
	console.log = capture_log
	let success
	try {
		success = await method()
	} catch (error) {
		success = error
	}
	console.log = orig_console
	// console.log(success)
	if (success instanceof Error){
		console.error('Errored:', method.name || 'undefined', success)
		logs.forEach(log => console.log(...log))
	}else if (success) {
		// console.log('Succeeded:', method.name || 'undefined')
	} else if (success === undefined){
		// console.log('None', method.name)
	}else {
		console.error('Failed: ', method.name || 'undefined')
		logs.forEach(log => console.log(...log))
	}
	// console.groupEnd()
}, Promise.resolve())

// succeeds