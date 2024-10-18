import { _changes, _path, _return, _strict, _strictTypes, ArraySequence, Keywords, NodeType, NodeTypes, Output, Parallel, PartialPick, Path, RunConfig, Sequence, State, StateMachineClass, TransformerContext } from "./types";

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
export class ContextTypeError extends TypeError {}
export class ActionTypeError extends TypeError {}
export class UndefinedActionError extends ReferenceError {}
export class MaxIterationsError extends Error {}

export default class S extends StateMachineClass {
	static return      = _return
	static changes     = _changes
	static path        = _path
	static strict      = _strict
	static strictTypes = _strictTypes
	static kw = Keywords
	static keywords = S.kw
	static runConfig: RunConfig = {
		iterations: 10000,
		result: true,
		until: result => S.return in result,
		strictContext: false,
		runMethod: null,
		inputModifier: a => a as State,
		outputModifier: a => a,
		async: false,
		// Special settings for async
		delay: 0,
		allow: 1000,
		wait: 0,
	}

	// Types:
	static nodeTypes = NodeTypes
	static types = S.nodeTypes
	static isNode(object: unknown, objectType: (typeof object) = typeof object): false | NodeType['name'] {
		if (object === S.return)
			return S.types.RT

		const additionalNode = this.#additionalNodetypesList.reduce((last: false | NodeType['name'], current: NodeType): false | NodeType['name']  => {
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
				// TODO: is this required?
				if (!(object instanceof Object))
					return false
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
	static #additionalNodetypes: Record<NodeType['name'], NodeType> = {}
	static #additionalNodetypesList: Array<NodeType> = []
	static addNode(name: NodeType['name'], { execute = null, isNode = null, advance = null, nextPath = null, advance2 = null }: Partial<Pick<NodeType, 'execute' | 'nextPath' | 'isNode' | 'advance'| 'advance2'>>): void {
		const index = this.#additionalNodetypesList.findIndex(node => node.name === name)
		if (index !== -1 || (name in this.#additionalNodetypes))
			throw new Error()
		const val: NodeType = { name, execute, isNode, advance, nextPath, advance2 }
		this.#additionalNodetypes[name] = val
		this.#additionalNodetypesList.push(val)
	}
	static removeNode(name: NodeType['name']): void {
		const index = this.#additionalNodetypesList.findIndex(node => node.name === name)
		if (index === -1) throw new Error()
		delete this.#additionalNodetypes[name]
		this.#additionalNodetypesList.splice(index, 1)
	}
	static isStateMachine(object: unknown): boolean {
		return S.isNode(object) === S.types.SM
	}
	// TODO: make parallel a plugin
	static isParallel(object: unknown): boolean {
		return S.isNode(object) === S.types.SQ && (S.kw.PL in (object as object))
	}
	static parallel(...list: Array<Sequence>): Parallel {
		list[S.kw.PL] = true
		return list as Parallel
	}
	static actionName(process: Sequence = null, path: Path = []): string | undefined {
		const method = get_path_object(process, path)
		return method && method.name
	}
	static lastOf(process: Sequence = null, path: Path = [], condition: ((item: Sequence, path: Path, process: Sequence) => boolean) = () => true): Path | null {
		const item = get_path_object(process, path)
		if (condition(item, path, process)) return path
		if (path.length === 0) return null
		return S.lastOf(process, path.slice(0,-1), condition)
	}
	static lastNode(process: Sequence = null, path: Path = [], ...nodeTypes: Array<NodeType['name'] | Array<NodeType['name']>>): Path | null {
		// TODO: check this is actually working
		const flatNodeTypes = nodeTypes.flat(Infinity) as Array<NodeType['name'] | false>
		return S.lastOf(process, path, i => flatNodeTypes.includes(S.isNode(i)))
	}
	static lastSequence(process: Sequence = null, path: Path = []): Path | null {
		return S.lastNode(process, path, S.types.SQ)
	}
	static lastStateMachine(process: Sequence = null, path: Path = []): Path | null {
		return S.lastNode(process, path, S.types.SM)
	}
	static nextPath(state: State = {}, process: Sequence = null, path: Path = state[_path] || []): Path | null {
		if (path.length === 0) return null
		const parPath = S.lastNode(process, path.slice(0,-1), this.#additionalNodetypesList.filter(({ advance }) => advance).map(({ name }) => name))
		if (!parPath) return null
		const parActs = get_path_object(process, parPath)
		const parType = S.isNode(parActs)
		if (!(parType && (parType in this.#additionalNodetypes) && this.#additionalNodetypes[parType] && this.#additionalNodetypes[parType].advance)) return null
		const result = this.#additionalNodetypes[parType].advance(state, process, parPath, path)
		if (result !== undefined)
			return result
		return S.nextPath(state, process, parPath)
	}
	static advance(state: State = {}, process: Sequence = null, output: Output = null): State {
		const path = state[_path] || []
		let currentState = state
		const nodeType = S.isNode(output)
		switch (nodeType) {
			case S.types.CH:
				currentState = S.applyChanges(state, output as Partial<State>)
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
					...(!output || output === _return ? {} : { [S.kw.RS]: output[_return] })
				}
			case S.types.DR: {
				const outputType = typeof output
				if (outputType === 'object' && output) {
					return S.advance(state, process, output[S.path])
				} else {
					const lastOf = outputType === 'number' ? S.lastSequence(process, path.slice(0,-1)) : S.lastStateMachine(process, path.slice(0,-1))
					if (!lastOf)
						throw new PathReferenceError(`A relative directive has been provided as a ${outputType} (${String(output)}), but no ${outputType === 'number' ? 'sequence' : 'state machine'} exists that this ${outputType} could be ${outputType === 'number' ? 'an index': 'a state'} of from path [ ${path.join(', ')} ].`)
					return {
						...state,
						[S.path]: [...lastOf, output]
					}
				}
			}
			default:
				if (nodeType && S.#additionalNodetypes[nodeType] && S.#additionalNodetypes[nodeType].advance2)
					return S.#additionalNodetypes[nodeType].advance2(state, process, output)
				throw new ActionTypeError(`Unknwown output or action type: ${typeof output}${S.isNode(output) ? `, nodeType: ${String(S.isNode(output))}` : ''} at [ ${path.join(', ')} ]`)
		}
	}
	static execute(state: State = {}, process: Sequence = null): Output {
		const path = state[_path] || []
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
				if (nodeType && S.#additionalNodetypes[nodeType] && S.#additionalNodetypes[nodeType].execute)
					return S.#additionalNodetypes[nodeType].execute(state, process, node)
				return node
		}
	}
	static applyChanges(state: State = {}, changes: Partial<State> = {}): State {
		if (state[_strict]) {
			if (Object.entries(changes).some(([name]) => !(name in state)))
				throw new ContextReferenceError(`Only properties that exist on the initial context may be updated.\nYou changed [ ${Object.keys(changes).filter(property => !(property in state)).join(', ')} ], which ${Object.keys(changes).filter(property => !(property in state)).length === 1 ? 'is' : 'are'} not in: [ ${Object.keys(state).join(', ')} ].\nPath: [ ${state[_path]?.join(' / ')} ]`)
			if (state[_strict] === _strictTypes) {
				if (Object.entries(changes).some(([name,value]) => typeof value !== typeof state[name]))
					throw new ContextTypeError()//`Only properties that exist on the initial context may be updated.\nYou changed [ ${Object.keys(changes).filter(property => !(property in state)).join(', ')} ], which ${Object.keys(changes).filter(property => !(property in state)).length === 1 ? 'is' : 'are'} not in: [ ${Object.keys(state).join(', ')} ].\nPath: [ ${state[S.path].join(' / ')} ]`)
			}
		}
		const allChanges = deep_merge_object(state[_changes] || {}, changes)
		return {
			...deep_merge_object(state, allChanges),
			[S.path]: state[_path],
			[S.changes]: allChanges
		}
	}

	static traverse(iterator: ((item: Sequence, path: Path, process: Sequence) => Sequence) = a => a, post: ((item: Sequence, path: Path, process: Sequence) => Sequence) = b => b): ((process: Sequence, path?: Path) => Sequence) {
		const iterate = (process: Sequence, path: Path = []): Sequence => {
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

	static exec(state: State = {}, process: Sequence = null, runConfig: Partial<RunConfig> = S.runConfig, ...input: Array<unknown>) {
		const { until, result, iterations, inputModifier, outputModifier, strictContext } = deep_merge_object(S.runConfig, runConfig)
		const modifiedInput = inputModifier(...input) || {}
		let r = 0, currentState = S.applyChanges({ ...state, [S.path]: modifiedInput[S.path] || [], [S.strict]: strictContext }, modifiedInput)
		while (r < iterations) {
			if (until(currentState)) break;
			if (++r > iterations)
				throw new MaxIterationsError(`Maximim iterations of ${iterations} reached at path [ ${currentState[_path]?.join(', ')} ]`)
			currentState = S.advance(currentState, process, S.execute(currentState, process))
		}
		return outputModifier(result ? currentState[S.kw.RS] : currentState)
	}
	static async execAsync(state: State = {}, process: Sequence = null, runConfig: Partial<RunConfig> = S.runConfig, ...input: Array<unknown>) {
		const { delay, allow, wait, until, result, iterations, inputModifier, outputModifier, strictContext } = deep_merge_object(S.runConfig, runConfig)
		const modifiedInput = (await inputModifier(...input)) || {}
		if (delay) await wait_time(delay)
		let r = 0, startTime = Date.now(), currentState = S.applyChanges({ ...state, [S.path]: modifiedInput[S.path] || [], [S.strict]: strictContext }, modifiedInput)
		while (r < iterations) {
			if (until(currentState)) break;
			if (++r >= iterations)
				throw new MaxIterationsError(`Maximim iterations of ${iterations} reached at path [ ${currentState[_path]?.join(', ')} ]`)
			const method = get_path_object(process, currentState[_path])
			if (S.isParallel(method)) {
				const newChanges = await Promise.all(method.map(parallel => new S(state, parallel, {
					...runConfig,
					result: false, async: true,
					inputModifier: (state) => {
						const { [_path]:__path, [_changes]: __changes,  ...pureState } = (state as State)
						return pureState as State
					},
					outputModifier: (state) => (state as State)[_changes],
				})(currentState)))
				currentState = S.advance(currentState, process, deep_merge_object(currentState[_changes] || {}, ...newChanges))
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
	static run(state: State = {}, process: Sequence = null, runConfig: Partial<RunConfig> = S.runConfig, ...input: Array<unknown>) {
		const { async: isAsync } = deep_merge_object(S.runConfig, runConfig)
		if (isAsync) return S.execAsync(state, process, runConfig, ...input)
		return S.exec(state, process, runConfig, ...input)
	}

	protected _initialState = { [S.kw.RS]: null }
	process: Sequence = null
	protected _runConfig = S.runConfig
	constructor(state: State = {}, process: Sequence = null, runConfig: Partial<RunConfig> = S.runConfig) {
		super((...argumentsList: Array<unknown>) => (runConfig.runMethod || this.run).apply(this, argumentsList))
		this._runConfig = deep_merge_object(this._runConfig, runConfig)
		this._initialState = deep_merge_object(this._initialState, state)
		this.process = process
	}
	run(...input: Array<unknown>) {
		return S.run(this._initialState, this.process, this._runConfig, ...input)
	}
	get runConfig(): RunConfig {
		return clone_object(this._runConfig)
	}
	get initialState(): State {
		return clone_object(this._initialState)
	}
	actionName(path: Path = []): string | undefined {
		return S.actionName(this.process, path)
	}

	plugin(transformer: ((current: TransformerContext) => Partial<TransformerContext>) | {
		state?: (current: TransformerContext) => State,
		process?: (current: TransformerContext) => Sequence,
		runConfig?: (current: TransformerContext) => RunConfig,
	} = {}): S {
		let transformed: TransformerContext = {state:this._initialState,process:this.process,runConfig: this._runConfig}
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
	config(runConfig: Partial<RunConfig>): S {
		return new S(this._initialState, this.process, deep_merge_object(this._runConfig, runConfig))
	}
	get unstrict(): S {
		return new S(this._initialState, this.process, deep_merge_object(this._runConfig, { strictContext: false }))
	}
	get strict(): S {
		return new S(this._initialState, this.process, deep_merge_object(this._runConfig, { strictContext: true }))
	}
	get strictTypes(): S {
		return new S(this._initialState, this.process, deep_merge_object(this._runConfig, { strictContext: S.strictTypes }))
	}
	get async(): S {
		return new S(this._initialState, this.process, deep_merge_object(this._runConfig, { async: true }))
	}
	get sync(): S {
		return new S(this._initialState, this.process, deep_merge_object(this._runConfig, { async: false }))
	}
	get step(): S {
		return new S(this._initialState, this.process, deep_merge_object(this._runConfig, { iterations: 1, result: false }))
	}
	until(until: RunConfig['until']): S {
		return new S(this._initialState, this.process, deep_merge_object(this._runConfig, { until }))
	}
	input(inputModifier: RunConfig['inputModifier']): S {
		return new S(this._initialState, this.process, deep_merge_object(this._runConfig, { inputModifier }))
	}
	output(outputModifier: RunConfig['outputModifier']): S {
		return new S(this._initialState, this.process, deep_merge_object(this._runConfig, { outputModifier }))
	}
}
S.addNode(S.nodeTypes.SQ, {
	advance: (_state, process, parPath, path) => {
		const parActs = get_path_object(process, parPath)
		const childItem = path[parPath.length] as number
		if (childItem+1 < parActs.length)
			return [ ...parPath, childItem+1 ]
	},
	isNode: (object, objectType) => {
		if (objectType !== 'object') return;
		return Array.isArray(object)
	},
	execute: (state, _process, node) => {
		const path = state[_path] || []
		return (node as ArraySequence).length ? [ ...path, 0 ] : null
	}
})

export const StateMachine = S
export const SuperSmallStateMachine = S