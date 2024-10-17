export const clone_object = (obj) => {
	if (Array.isArray(obj)) return obj.map(clone_object)
	if (obj === null) return null
	if (typeof obj !== 'object') return obj
	return Object.fromEntries(Object.entries(obj).map(([key,value]) => [ key, clone_object(value) ]));
}
export const unique_list_strings = (list, getId = item => item) => Object.values(Object.fromEntries(list.map(item=>[getId(item),item])));
const reduce_get_path_object = (obj, step) => obj ? obj[step] : undefined
export const get_path_object = (object, path) => path.reduce(reduce_get_path_object, object)
export const normalise_function = functOrReturn => (typeof functOrReturn === 'function') ? functOrReturn : () => functOrReturn
const reduce_deep_merge_object = (base, override) => {
	if (!((base && typeof base === 'object') && !Array.isArray(base)
	&& (override && typeof override === 'object') && !Array.isArray(override)))
		return override;
	const allKeys = unique_list_strings(Object.keys(base).concat(Object.keys(override)));
	return Object.fromEntries(allKeys.map(key => [
		key, key in override ? deep_merge_object(base[key], override[key]) : base[key]
	]));
}
export const deep_merge_object = (base, ...overrides) => overrides.reduce(reduce_deep_merge_object, base)
export const wait_time = delay => (delay ? new Promise(resolve => setTimeout(resolve, delay)) : Promise.resolve())

export class PathReferenceError extends ReferenceError {}
export class ContextReferenceError extends ReferenceError {}
export class ActionTypeError extends TypeError {}
export class UndefinedActionError extends ReferenceError {}
export class MaxIterationsError extends Error {}

class ExtensibleFunction extends Function {
	constructor(f) {
		return Object.setPrototypeOf(f, new.target.prototype);
	}
}
export default class S extends ExtensibleFunction {
	static return      = Symbol('Super Small State Machine Return')
	static changes     = Symbol('Super Small State Machine Changes')
	static path        = Symbol('Super Small State Machine Path')
	static strict      = Symbol('Super Small State Machine Strict')
	static strictTypes = Symbol('Super Small State Machine Strict Types')
	static kw = {
		IF: 'if',
		TN: 'then',
		EL: 'else',
		SW: 'switch',
		CS: 'case',
		DF: 'default',
		IT: 'initial',
		RS: 'result',
		PL: 'parallel',
	}
	static keywords = S.kw
	static runConfig = {
		iterations: 10000,
		result: true,
		until: result => S.return in result,
		strictContext: false,
		inputModifier: a => a,
		outputModifier: a => a,
		async: false,
		// Special settings for async
		delay: 0,
		allow: 1000,
		wait: 0,
	}

	// Types:
	static nodeTypes = {
		UN: 'undefined',
		EM: 'empty',
		DR: 'directive',
		RT: 'return',
		AC: 'action',
		SQ: 'sequence',
		CD: 'conditional',
		SC: 'switch-conditional',
		SM: 'state-machine',
		CH: 'changes'
	}
	static types = S.nodeTypes
	static isNode(object, objectType = typeof object) {
		if (object === S.return)
			return S.types.RT

		const additionalNode = this.#additionalNodetypesList.reduce((last, current) => {
			if (current.isNode && current.isNode(object, objectType, last))
				return current.name
			return last
		}, false)
		if (additionalNode)
			return additionalNode
		
		switch (objectType) {
			case 'undefined':
				return S.types.UN
			case 'number':
			case 'string':
			case 'symbol':
				return S.types.DR
			case 'function':
				return S.types.AC
			case 'object': {
				if (!object)
					return S.types.EM
				if (S.kw.IF in object)
					return S.types.CD
				if (S.kw.SW in object)
					return S.types.SC
				if (S.kw.IT in object)
					return S.types.SM
				if (S.path in object)
					return S.types.DR
				if (S.return in object)
					return S.types.RT
				return S.types.CH
			}
		}
		return false
	}
	static #additionalNodetypes = {}
	static #additionalNodetypesList = []
	static addNode(name, { execute = null, isNode = null, advance = null }) {
		const index = this.#additionalNodetypesList.findIndex(node => node.name === name)
		if (index !== -1 || (name in this.#additionalNodetypes))
			throw new Error()
		const val = { name, execute, isNode, advance }
		this.#additionalNodetypes[name] = val
		this.#additionalNodetypesList.push(val)
	}
	static removeNode(name) {
		const index = this.#additionalNodetypesList.findIndex(node => node.name === name)
		if (index === -1) throw new Error()
		delete this.#additionalNodetypes[name]
		this.#additionalNodetypesList.splice(index, 1)
	}
	static isStateMachine(object) {
		return S.isNode(object) === S.types.SM
	}
	// TODO: make parallel a plugin
	static isParallel(object) {
		return S.isNode(object) === S.types.SQ && (S.kw.PL in object)
	}
	static parallel(...list) {
		list[S.kw.PL] = true
		return list
	}
	static actionName(process = null, path = []) {
		const method = get_path_object(process, path)
		return method && method.name
	}
	static lastOf(process = null, path = [], condition = () => true) {
		const item = get_path_object(process, path)
		if (condition(item, path, process)) return path
		if (path.length === 0) return null
		return S.lastOf(process, path.slice(0,-1), condition)
	}
	static lastNode(process = null, path = [], ...nodeTypes) {
		const flatNodeTypes = nodeTypes.flat(Infinity)
		return S.lastOf(process, path, i => flatNodeTypes.includes(S.isNode(i)))
	}
	static lastSequence(process = null, path = []) {
		return S.lastNode(process, path, S.types.SQ)
	}
	static lastStateMachine(process = null, path = []) {
		return S.lastNode(process, path, S.types.SM)
	}
	static nextPath(state = {}, process = null, path = state[S.path] || []) {
		if (path.length === 0) return null
		const parPath = S.lastNode(process, path.slice(0,-1), this.#additionalNodetypesList.filter(({ advance }) => advance).map(({ name }) => name))
		if (!parPath) return null
		const parActs = get_path_object(process, parPath)
		const parType = S.isNode(parActs)
		const result = this.#additionalNodetypes[parType].advance(state, process, parPath, path)
		if (result !== undefined)
			return result
		return S.nextPath(state, process, parPath)
	}
	static advance(state = {}, process = null, output = null) {
		const path = state[S.path] || []
		let currentState = state
		const nodeType = S.isNode(output)
		switch (nodeType) {
			case S.types.CH:
				currentState = S.applyChanges(state, output)
			case S.types.UN: // Set and forget action
			case S.types.EM: // No-op action
				// Increment path unless handling a directive or return
				const nextPath = S.nextPath(state, process, path)
				return nextPath ? {
					...currentState,
					[S.path]: nextPath
				} : {
					...currentState,
					[S.return]: true,
				}
			case S.types.SQ: // Arrays are absolute paths when used as output
				return {
					...state,
					[S.path]: output
				}
			case S.types.RT:
				return {
					...state,
					[S.return]: true,
					[S.path]: path,
					...(output === S.return ? {} : { [S.kw.RS]: output[S.return] })
				}
			case S.types.DR: {
				const outputType = typeof output
				if (outputType === 'object') {
					return S.advance(state, process, output[S.path])
				} else {
					const lastOf = outputType === 'number' ? S.lastSequence(process, path.slice(0,-1)) : S.lastStateMachine(process, path.slice(0,-1))
					if (!lastOf)
						throw new PathReferenceError(`A relative directive has been provided as a ${outputType} (${output}), but no ${outputType === 'number' ? 'sequence' : 'state machine'} exists that this ${outputType} could be ${outputType === 'number' ? 'an index': 'a state'} of from path [ ${path.join(', ')} ].`)
					return {
						...state,
						[S.path]: [...lastOf, output]
					}
				}
			}
			default:
				if (S.#additionalNodetypes[nodeType] && S.#additionalNodetypes[nodeType].advance)
					return S.#additionalNodetypes[nodeType].advance(state, process, output)
				throw new ActionTypeError(`Unknwown output or action type: ${typeof output}${S.isNode(output) ? `, nodeType: ${S.isNode(output)}` : ''} at [ ${path.join(', ')} ]`)
		}
	}
	static execute(state = {}, process = null) {
		const path = state[S.path] || []
		// console.log(path)
		const node = get_path_object(process, path)
		const nodeType = S.isNode(node)
		switch (nodeType) {
			case S.types.UN:
				throw new UndefinedActionError(`There is nothing to execute at path [ ${path.join(', ')} ]`)
			case S.types.AC:
				return node(state)
			case S.types.CD:
				if (normalise_function(node[S.kw.IF])(state))
					return S.kw.TN in node
						? [ ...path, S.kw.TN ] : null
				return S.kw.EL in node
					? [ ...path, S.kw.EL ]
					: null
			case S.types.SC:
				const key = normalise_function(node[S.kw.SW])(state)
				const fallbackKey = (key in node[S.kw.CS]) ? key : S.kw.DF
				return (fallbackKey in node[S.kw.CS])
					? [ ...path, S.kw.CS, fallbackKey ]
					: null
			case S.types.SM:
				return [ ...path, S.kw.IT ]
			default:
				if (S.#additionalNodetypes[nodeType] && S.#additionalNodetypes[nodeType].execute)
					return S.#additionalNodetypes[nodeType].execute(state, process, node)
				return node
		}
	}
	static applyChanges(state = {}, changes = {}) {
		if (state[S.strict]) {
			if (Object.entries(changes).some(([name]) => !(name in state)))
				throw new ContextReferenceError(`Only properties that exist on the initial context may be updated.\nYou changed [ ${Object.keys(changes).filter(property => !(property in state)).join(', ')} ], which ${Object.keys(changes).filter(property => !(property in state)).length === 1 ? 'is' : 'are'} not in: [ ${Object.keys(state).join(', ')} ].\nPath: [ ${state[S.path].join(' / ')} ]`)
			if (strict === strictTypes) {
				if (Object.entries(changes).some(([name,value]) => typeof value !== typeof state[name]))
					throw new ContextTypeError()//`Only properties that exist on the initial context may be updated.\nYou changed [ ${Object.keys(changes).filter(property => !(property in state)).join(', ')} ], which ${Object.keys(changes).filter(property => !(property in state)).length === 1 ? 'is' : 'are'} not in: [ ${Object.keys(state).join(', ')} ].\nPath: [ ${state[S.path].join(' / ')} ]`)
			}
		}
		const allChanges = deep_merge_object(state[S.changes] || {}, changes)
		return {
			...deep_merge_object(state, allChanges),
			[S.path]: state[S.path],
			[S.changes]: allChanges
		}
	}

	static traverse(iterator = a => a, post = b => b) {
		const iterate = (process, path = []) => {
			const item = get_path_object(process, path)
			const itemType = S.isNode(item)
			switch (itemType) {
				case S.types.SQ:
					const ret = item.map((_,i) => iterate(process, [...path,i]))
					return S.isParallel(item) ? S.parallel(...ret) : ret
				case S.types.CD:
					return post({
						...item,
						[S.kw.IF]: item[S.kw.IF],
						...(S.kw.TN in item ? { [S.kw.TN]: iterate(process, [...path,S.kw.TN]) } : {}),
						...(S.kw.EL in item ? { [S.kw.EL]: iterate(process, [...path,S.kw.EL]) } : {})
					}, path, process)
				case S.types.SC:
					return post({
						...item,
						[S.kw.SW]: item[S.kw.SW],
						[S.kw.CS]: Object.fromEntries(Object.keys(item[S.kw.CS]).map(key => [ key, iterate(process, [...path,S.kw.CS,key]) ])),
					}, path, process)
				case S.types.SM:
					return post({
						...item,
						...Object.fromEntries(Object.keys(item).map(key => [ key, iterate(process, [...path,key]) ]))
					}, path, process)
				default:
					return iterator(item, path, process)
			}
		}
		return iterate
	}

	static exec(state = {}, process = {}, runConfig = S.runConfig, ...input) {
		const { until, result, iterations, inputModifier, outputModifier, strictContext } = deep_merge_object(S.runConfig, runConfig)
		const modifiedInput = inputModifier(...input) || {}
		let r = 0, currentState = S.applyChanges({ ...state, [S.path]: modifiedInput[S.path] || [], [S.strict]: strictContext }, modifiedInput)
		while (r < iterations) {
			if (until(currentState)) break;
			if (++r > iterations)
				throw new MaxIterationsError(`Maximim iterations of ${iterations} reached at path [ ${currentState[S.path].join(', ')} ]`)
			currentState = S.advance(currentState, process, S.execute(currentState, process))
		}
		return outputModifier(result ? currentState[S.kw.RS] : currentState)
	}
	static async execAsync(state = {}, process = {}, runConfig = S.runConfig, ...input) {
		const { delay, allow, wait, until, result, iterations, inputModifier, outputModifier, strictContext } = deep_merge_object(S.runConfig, runConfig)
		const modifiedInput = (await inputModifier(...input)) || {}
		if (delay) await wait_time(delay)
		let r = 0, startTime = Date.now(), currentState = S.applyChanges({ ...state, [S.path]: modifiedInput[S.path] || [], [S.strict]: strictContext }, modifiedInput)
		while (r < iterations) {
			if (until(currentState)) break;
			if (++r >= iterations)
				throw new MaxIterationsError(`Maximim iterations of ${iterations} reached at path [ ${currentState[S.path].join(', ')} ]`)
			const method = get_path_object(process, currentState[S.path])
			if (S.isParallel(method)) {
				const newChanges = await Promise.all(method.map(parallel => new S(state, parallel, {
					...runConfig,
					result: false, async: true,
					inputModifier: ({ [S.path]:_path, [S.changes]: _changes,  ...pureState }) => pureState,
					outputModifier: ({ [S.changes]: changes }) => changes,
				})(currentState)))
				currentState = S.advance(currentState, process, deep_merge_object(currentState[S.changes] || {}, ...newChanges))
			}
			else currentState = S.advance(currentState, process, await S.execute(currentState, process))
			if (allow > 0 && r % 10 === 0) {
				const nowTime = Date.now()
				if (nowTime - startTime >= allow) {
					await wait_time(wait)
					startTime = Date.now()
				}
			}
		}
		return outputModifier(result ? currentState[S.kw.RS] : currentState)
	}
	static run(state = {}, process = {}, runConfig = S.runConfig, ...input) {
		const { async: isAsync } = deep_merge_object(S.runConfig, runConfig)
		if (isAsync) return S.execAsync(state, process, runConfig, ...input)
		return S.exec(state, process, runConfig, ...input)
	}

	#initialState = { [S.kw.RS]: null }
	process = null
	#runConfig = S.runConfig
	constructor(state = {}, process = null, runConfig = S.runConfig) {
		super((...argumentsList) => (runConfig.runMethod || this.run).apply(this, argumentsList))
		this.#runConfig = deep_merge_object(this.#runConfig, runConfig)
		this.#initialState = deep_merge_object(this.#initialState, state)
		this.process = process
	}
	run(...input) {
		return S.run(this.#initialState, this.process, this.#runConfig, ...input)
	}
	get runConfig() {
		return clone_object(this.#runConfig)
	}
	get initialState() {
		return clone_object(this.#initialState)
	}
	actionName(path = []) {
		return S.actionName(this.process, path)
	}
	plugin(transformer = {}) {
		let transformed = {state:this.#initialState,process:this.process,runConfig: this.#runConfig}
		if (typeof transformer === 'function') {
			transformed = {
				...transformed,
				...transformer({ ...transformed }),
			}
		} else if (typeof transformer === 'object') {
			transformed = {
				...transformed,
				...((typeof transformer.state === 'function') ? {
					state: transformer.state(transformed)
				} : (transformer.state ? deep_merge_object(transformed.state, transformer.state) : {})),
				...((typeof transformer.process === 'function') ? {
					process: transformer.process(transformed)
				} : {}),
				...((typeof transformer.runConfig === 'function') ? {
					runConfig: transformer.runConfig(transformed)
				} : {}),
			}
		} else throw new Error()
		return new S(transformed.state, transformed.process, transformed.runConfig)
	}

	// These are effectively runConfig "setters"
	config(runConfig) {
		return new S(this.#initialState, this.process, deep_merge_object(this.#runConfig, runConfig))
	}
	get unstrict() {
		return new S(this.#initialState, this.process, deep_merge_object(this.#runConfig, { strictContext: false }))
	}
	get strict() {
		return new S(this.#initialState, this.process, deep_merge_object(this.#runConfig, { strictContext: true }))
	}
	get strictTypes() {
		return new S(this.#initialState, this.process, deep_merge_object(this.#runConfig, { strictContext: S.strictTypes }))
	}
	get async() {
		return new S(this.#initialState, this.process, deep_merge_object(this.#runConfig, { async: true }))
	}
	get sync() {
		return new S(this.#initialState, this.process, deep_merge_object(this.#runConfig, { async: false }))
	}
	get step() {
		return new S(this.#initialState, this.process, deep_merge_object(this.#runConfig, { iterations: 1, result: false }))
	}
	until(until) {
		return new S(this.#initialState, this.process, deep_merge_object(this.#runConfig, { until }))
	}
	input(inputModifier) {
		return new S(this.#initialState, this.process, deep_merge_object(this.#runConfig, { inputModifier }))
	}
	output(outputModifier) {
		return new S(this.#initialState, this.process, deep_merge_object(this.#runConfig, { outputModifier }))
	}
}
S.addNode(S.nodeTypes.SQ, {
	advance: (_state, process, parPath, path) => {
		const parActs = get_path_object(process, parPath)
		const childItem = path[parPath.length]
		if (childItem+1 < parActs.length)
			return [ ...parPath, childItem+1 ]
	},
	isNode: (object, objectType) => {
		if (objectType !== 'object') return;
		return Array.isArray(object)
	},
	execute: (state, _process, node) => {
		const path = state[S.path] || []
		return node.length ? [ ...path, 0 ] : null
	}
})

export const StateMachine = S
export const SuperSmallStateMachine = S