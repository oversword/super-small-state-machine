export const clone_object = (obj) => {
	if (Array.isArray(obj)) return obj.map(clone_object)
	if (obj === null) return null
	if (typeof obj !== 'object') return obj
	return Object.fromEntries(Object.entries(obj).map(([key,value]) => [ key, clone_object(value) ]));
}
export const unique_list_strings = (list, getId = item => item) => Object.values(Object.fromEntries(list.map(item=>[getId(item),item])));
const reduce_get_path_object = (obj, step) => obj ? obj[step] : undefined
export const get_path_object = (object, path = []) => (path.reduce(reduce_get_path_object, object))
export const set_path_object = (object, path = [], value = undefined) => {
	if (path.length === 0 || typeof object !== 'object' || !object) return value
	if (Array.isArray(object)) return [ ...object.slice(0,path[0]), set_path_object(object[path[0]], path.slice(1), value), ...object.slice(1+path[0]) ]
	return { ...object, [path[0]]: set_path_object(object[path[0]], path.slice(1), value), }
}
export const update_path_object = (object, path = [], transformer = original => original) => set_path_object(object, path, transformer(get_path_object(object, path), path, object))
const map_list_path_object = ([ key, value ]) => list_path_object(value).map(path => [ key, ...path ])
export const list_path_object = object => typeof object !== 'object' || !object ? [[]] : [[]].concat(...Object.entries(object).map(map_list_path_object))
export const normalise_function = (functOrReturn) => (typeof functOrReturn === 'function') ? functOrReturn : () => functOrReturn
const reduce_deep_merge_object = (base, override) => {
	if (!((base && typeof base === 'object') && !Array.isArray(base) && (override && typeof override === 'object') && !Array.isArray(override)))
		return override;
	const allKeys = unique_list_strings(Object.keys(base).concat(Object.keys(override)));
	return Object.fromEntries(allKeys.map(key => [
		key, key in override ? deep_merge_object(base[key], override[key]) : base[key]
	]));
}
export const deep_merge_object = (base, ...overrides) => overrides.reduce(reduce_deep_merge_object, base)
export const get_closest_path = (object, path = [], condition = () => true) => {
	const item = get_path_object(object, path)
	if (condition(item, path, object)) return path
	if (path.length === 0) return null
	return get_closest_path(object, path.slice(0,-1), condition)
}
export const wait_time = delay => (delay ? new Promise(resolve => setTimeout(resolve, delay)) : Promise.resolve())
export class SuperSmallStateMachineError extends Error {
	instance; state; data; path;
	constructor(message, { instance, state, data, path } = {}) {
		super(message)
		Object.assign(this, { instance, state, data, path })
	}
}
export class SuperSmallStateMachineReferenceError extends SuperSmallStateMachineError {}
export class SuperSmallStateMachineTypeError extends SuperSmallStateMachineError {}
export class StateReferenceError extends SuperSmallStateMachineReferenceError {}
export class StateTypeError extends SuperSmallStateMachineTypeError {}
export class NodeTypeError extends SuperSmallStateMachineTypeError {}
export class UndefinedNodeError extends SuperSmallStateMachineReferenceError {}
export class MaxIterationsError extends SuperSmallStateMachineError {}
export class PathReferenceError extends SuperSmallStateMachineReferenceError {}
export const NodeTypes = {
	UN: 'undefined',
	EM: 'empty',
	RT: 'return',
	FN: 'function',
	SQ: 'sequence',
	CD: 'condition',
	SW: 'switch',
	WH: 'while',
	MC: 'machine',
	CH: 'changes',
	DR: 'directive',
	AD: 'absolute-directive',
	MD: 'machine-directive',
	SD: 'sequence-directive',
}
export const KeyWords = {
	IF: 'if',
	TN: 'then',
	EL: 'else',
	SW: 'switch',
	CS: 'case',
	DF: 'default',
	IT: 'initial',
	WH: 'while',
	DO: 'do',
}
export class NodeDefinitions extends Map {
	constructor(...nodes) { super(nodes.flat(Infinity).map(node => [node.name,node])) }
	typeof(object, objectType = typeof object, isAction = false) {
		const foundType = [...this.values()].findLast(current => current.typeof && current.typeof(object, objectType, isAction))
		return foundType ? foundType.name : false
	}
}
export class NodeDefinition {
	static name = Symbol('Unnamed node')
	static typeof = null;
	static execute = null;
	static proceed = null;
	static perform = null;
	static traverse = null;
}
export const N = NodeDefinition
const exitFindNext = function (action, state) {
	const path = S._proceed(this, state)
	return path ? { ...state, [S.Path]: path } : { ...state, [S.Return]: undefined }
}
export class ChangesNode extends NodeDefinition {
	static name = NodeTypes.CH
	static typeof(object, objectType) { return Boolean(object && objectType === 'object') }
	static perform(action, state) { return exitFindNext.call(this, action, S._changes(this, state, action)) }
}
export class SequenceNode extends NodeDefinition {
	static name = NodeTypes.SQ
	static proceed(parPath, state, path) {
		const parActs = get_path_object(this.process, parPath)
		const childItem = path[parPath.length]
		if (parActs && childItem+1 < parActs.length) return [ ...parPath, childItem+1 ]
	}
	static typeof(object, objectType, isAction) { return ((!isAction) && objectType === 'object' && Array.isArray(object)) }
	static execute(node, state) { return node.length ? [ ...state[S.Path], 0 ] : null }
	static traverse(item, path, iterate, post) { return item.map((_,i) => iterate([...path,i])) }
}
export class FunctionNode extends NodeDefinition {
	static name = NodeTypes.FN
	static typeof(object, objectType, isAction) { return (!isAction) && objectType === 'function' }
	static execute(node, state) { return node(state) }
}
export class UndefinedNode extends NodeDefinition {
	static name = NodeTypes.UN
	static typeof(object, objectType) { return objectType === 'undefined' }
	static execute(node, state) { throw new UndefinedNodeError(`There is nothing to execute at path [ ${state[S.Path].map(key => key.toString()).join(', ')} ]`, { instance: this, state, path: state[S.Path], data: { node } }) }
	static perform = exitFindNext
}
export class EmptyNode extends NodeDefinition {
	static name = NodeTypes.EM
	static typeof(object, objectType) { return object === null }
	static perform = exitFindNext
}
export class ConditionNode extends NodeDefinition {
	static name = NodeTypes.CD
	static typeof(object, objectType, isAction) { return Boolean((!isAction) && object && objectType === 'object' && (KeyWords.IF in object)) }
	static execute(node, state) {
		if (normalise_function(node[KeyWords.IF])(state))
		return KeyWords.TN in node ? [ ...state[S.Path], KeyWords.TN ] : null
		return KeyWords.EL in node ? [ ...state[S.Path], KeyWords.EL ] : null
	}
	static traverse(item, path, iterate, post) { return post({
		...item,
		...(KeyWords.TN in item ? { [KeyWords.TN]: iterate([...path,KeyWords.TN]) } : {}),
		...(KeyWords.EL in item ? { [KeyWords.EL]: iterate([...path,KeyWords.EL]) } : {})
	}, path) }
}
export class SwitchNode extends NodeDefinition {
	static name = NodeTypes.SW
	static typeof(object, objectType, isAction) { return Boolean((!isAction) && object && objectType === 'object' && (KeyWords.SW in object)) }
	static execute(node, state) {
		const key = normalise_function(node[KeyWords.SW])(state)
		const fallbackKey = (key in node[KeyWords.CS]) ? key : KeyWords.DF
		return (fallbackKey in node[KeyWords.CS]) ? [ ...state[S.Path], KeyWords.CS, fallbackKey ] : null
	}
	static traverse(item, path, iterate, post) { return post({
		...item,
		[KeyWords.CS]: Object.fromEntries(Object.keys(item[KeyWords.CS]).map(key => [ key, iterate([...path,KeyWords.CS,key]) ])),
	}, path) }
}
export class WhileNode extends NodeDefinition {
	static name = NodeTypes.WH
	static typeof(object, objectType, isAction) { return Boolean((!isAction) && object && objectType === 'object' && (KeyWords.WH in object)) }
	static execute(node, state) {
		if (normalise_function(node[KeyWords.WH])(state))
			return KeyWords.DO in node ? [ ...state[S.Path], KeyWords.DO ] : null
		return null
	}
	static proceed(parPath) { return parPath }
	static traverse(item, path, iterate, post) { return post({
		...item,
		...(KeyWords.DO in item ? { [KeyWords.DO]: iterate([...path,KeyWords.DO]) } : {}),
	}, path) }
}
export class MachineNode extends NodeDefinition {
	static name = NodeTypes.MC
	static typeof(object, objectType, isAction) { return Boolean((!isAction) && object && objectType === 'object' && (KeyWords.IT in object)) }
	static execute(node, state) { return [ ...state[S.Path], KeyWords.IT ] }
	static traverse(item, path, iterate, post) { return post({
		...item,
		...Object.fromEntries(Object.keys(item).map(key => [ key, iterate([...path,key]) ]))
	}, path) }
}
export class DirectiveNode extends NodeDefinition {
	static name = NodeTypes.DR
	static typeof(object, objectType, isAction) { return Boolean(object && objectType === 'object' && (S.Path in object)) }
	static perform(action, state) { return S._perform(this, state, action[S.Path]) }
}
export class SequenceDirectiveNode extends DirectiveNode {
	static name = NodeTypes.SD
	static typeof(object, objectType, isAction) { return objectType === 'number' }
	static perform(action, state) {
		const lastOf = S._closest(this, state[S.Path].slice(0,-1), NodeTypes.SQ)
		if (!lastOf) throw new PathReferenceError(`A relative directive has been provided as a number (${String(action)}), but no sequence exists that this number could be an index of from path [ ${state[S.Path].map(key => key.toString()).join(', ')} ].`, { instance: this, state, path: state[S.Path], data: { action } })
		return { ...state, [S.Path]: [...lastOf, action] }
	}
}
export class MachineDirectiveNode extends DirectiveNode {
	static name = NodeTypes.MD
	static typeof(object, objectType, isAction) { return objectType === 'string' || objectType === 'symbol' }
	static perform(action, state) {
		const lastOf = S._closest(this, state[S.Path].slice(0,-1), NodeTypes.MC)
		if (!lastOf) throw new PathReferenceError(`A relative directive has been provided as a ${typeof action} (${String(action)}), but no state machine exists that this ${typeof action} could be a state of from path [ ${state[S.Path].map(key => key.toString()).join(', ')} ].`, { instance: this, state, path: state[S.Path], data: { action } })
		return { ...state, [S.Path]: [...lastOf, action] }
	}
}
export class AbsoluteDirectiveNode extends DirectiveNode {
	static name = NodeTypes.AD
	static typeof(object, objectType, isAction) { return isAction && Array.isArray(object) }
	static perform(action, state) { return { ...state, [S.Path]: action } }
}
export class ReturnNode extends NodeDefinition {
	static name = NodeTypes.RT
	static typeof(object, objectType) { return object === S.Return || Boolean(object && objectType === 'object' && (S.Return in object)) }
	static perform(action, state) { return {
		...state,
		[S.Return]: !action || action === S.Return ? undefined : action[S.Return],
	} }
}
export const nodes = [ ChangesNode, SequenceNode, FunctionNode, UndefinedNode, EmptyNode, ConditionNode, SwitchNode, WhileNode, MachineNode, DirectiveNode, AbsoluteDirectiveNode, MachineDirectiveNode, SequenceDirectiveNode, ReturnNode, ]
export class ExtensibleFunction extends Function { constructor(f) { super(); return Object.setPrototypeOf(f, new.target.prototype); }; }
export class SuperSmallStateMachineCore extends ExtensibleFunction {
		static Return      = Symbol('Super Small State Machine Return')
		static Changes     = Symbol('Super Small State Machine Changes')
		static Path        = Symbol('Super Small State Machine Path')
		static StrictTypes = Symbol('Super Small State Machine Strict Types')
	static keyWords    = KeyWords
	static kw          = KeyWords
	static nodeTypes   = NodeTypes
	static types       = NodeTypes
	static config = {
		defaults: {},
		input: (state = {}) => state,
		output:  state => state[S.Return],
		strict: false,
		iterations: 10000,
		until: state => S.Return in state,
		pause: () => false,
		async: false,
		override: null,
		nodes: new NodeDefinitions(...nodes),
		adapt: [],
		before: [],
		after: [],
	}
	static _closest (instance, path = [], ...nodeTypes) {
		const flatNodeTypes = nodeTypes.flat(Infinity)
		return get_closest_path(instance.process, path, i => {
			const nodeType = instance.config.nodes.typeof(i)
			return Boolean(nodeType && flatNodeTypes.includes(nodeType))
		})
	}
	static _changes (instance, state = {}, changes = {}) {
		if (instance.config.strict) {
			if (Object.entries(changes).some(([name]) => !(name in state)))
				throw new StateReferenceError(`Only properties that exist on the initial context may be updated.\nYou changed [ ${Object.keys(changes).filter(property => !(property in state)).map(key => key.toString()).join(', ')} ], which ${Object.keys(changes).filter(property => !(property in state)).length === 1 ? 'is' : 'are'} not in: [ ${Object.keys(state).map(key => key.toString()).join(', ')} ].\nPath: [ ${state[S.Path].map(key => key.toString()).join(' / ')} ]`, { instance, state, path: state[S.Path], data: { changes } })
			if (instance.config.strict === this.StrictTypes) {
				if (Object.entries(changes).some(([name,value]) => typeof value !== typeof state[name])) {
					const errs = Object.entries(changes).filter(([name,value]) => typeof value !== typeof state[name])
					throw new StateTypeError(`Properties must have the same type as their initial value. ${errs.map(([name,value]) => `${typeof value} given for '${name}', should be ${typeof state[name]}`).join('. ')}.`, { instance, state, path: state[S.Path], data: { changes } })
				}
			}
		}
		const allChanges = deep_merge_object(state[S.Changes] || {}, changes)
		return {
			...deep_merge_object(state, allChanges),
			[S.Path]: state[S.Path],
			[S.Changes]: allChanges
		}
	}
	static _proceed (instance, state = {}, path = state[S.Path] || []) {
		if (path.length === 0) return null
		const parPath = this._closest(instance, path.slice(0,-1), [...instance.config.nodes.values()].filter(({ proceed }) => proceed).map(({ name }) => name))
		if (!parPath) return null
		const parActs = get_path_object(instance.process, parPath)
		const parType = instance.config.nodes.typeof(parActs)
		const nodeDefinition = parType && instance.config.nodes.get(parType)
		if (!(nodeDefinition && nodeDefinition.proceed)) return null
		const proceedResult = nodeDefinition.proceed.call(instance, parPath, state, path)
		if (proceedResult !== undefined) return proceedResult
		return this._proceed(instance, state, parPath)
	}
	static _perform (instance, state = {}, action = null) {
		const path = state[S.Path] || []
		const nodeType = instance.config.nodes.typeof(action, typeof action, true)
		const nodeDefinition = nodeType && instance.config.nodes.get(nodeType)
		if (nodeDefinition && nodeDefinition.perform)
			return nodeDefinition.perform.call(instance, action, state)
		throw new NodeTypeError(`Unknown action or action type: ${typeof action}${nodeType ? `, nodeType: ${String(nodeType)}` : ''} at [ ${path.map(key => key.toString()).join(', ')} ]`, { instance, state, path, data: { action } })
	}
	static _execute (instance, state = {}, path = state[S.Path] || []) {
		const node = get_path_object(instance.process, path)
		const nodeType = instance.config.nodes.typeof(node)
		const nodeDefinition = nodeType && instance.config.nodes.get(nodeType)
		if (nodeDefinition && nodeDefinition.execute)
			return nodeDefinition.execute.call(instance, node, state)
		return node
	}
	static _traverse(instance, iterator = a => a, post = b => b) {
		const boundPost = post.bind(instance)
		const iterate = (path = []) => {
			const item = get_path_object(instance.process, path)
			const nodeType = instance.config.nodes.typeof(item)
			const nodeDefinition = nodeType && instance.config.nodes.get(nodeType)
			if (nodeDefinition && nodeDefinition.traverse)
				return nodeDefinition.traverse.call(instance, item, path, iterate, boundPost)
			return iterator.call(instance, item, path)
		}
		return iterate()
	}
	static _run (instance, ...input) {
		if (instance.config.async) return this._runAsync(instance, ...input)
		return this._runSync(instance, ...input)
	}
	static _runSync (instance, ...input) {
		const { until, iterations, input: adaptInput, output: adaptOutput, before, after, defaults } = { ...this.config, ...instance.config }
		const modifiedInput = adaptInput.apply(instance, input) || {}
		let r = 0, currentState = before.reduce((prev, modifier) => modifier.call(instance, prev), this._changes(instance, {
			[S.Changes]: {},
			...defaults,
			[S.Path]: modifiedInput[S.Path] || [],
		}, modifiedInput))
		while (r < iterations) {
			if (until(currentState)) break;
			if (++r >= iterations)
				throw new MaxIterationsError(`Maximim iterations of ${iterations} reached at path [ ${currentState[S.Path].map(key => key.toString()).join(', ')} ]`, { instance, state: currentState, path: currentState[S.Path], data: { iterations } })
			currentState = this._perform(instance, currentState, this._execute(instance, currentState))
		}
		return adaptOutput.call(instance, after.reduce((prev, modifier) => modifier.call(instance, prev), currentState))
	}
	static async _runAsync (instance, ...input) {
		const { pause, until, iterations, input: adaptInput, output: adaptOutput, before, after, defaults } = { ...this.config, ...instance.config }
		const modifiedInput = (await adaptInput.apply(instance, input)) || {}
		let r = 0, currentState = before.reduce((prev, modifier) => modifier.call(instance, prev), this._changes(instance, {
			[S.Changes]: {},
			...defaults,
			[S.Path]: modifiedInput[S.Path] || [],
		}, modifiedInput))
		while (r < iterations) {
			const pauseExecution = pause.call(instance, currentState, r)
			if (pauseExecution) await pauseExecution;
			if (until(currentState)) break;
			if (++r >= iterations)
				throw new MaxIterationsError(`Maximim iterations of ${iterations} reached at path [ ${currentState[S.Path].map(key => key.toString()).join(', ')} ]`, { instance, state: currentState, path: currentState[S.Path], data: { iterations } })
			currentState = this._perform(instance, currentState, await this._execute(instance, currentState))
		}
		return adaptOutput.call(instance, after.reduce((prev, modifier) => modifier.call(instance, prev), currentState))
	}
}
export class SuperSmallStateMachineChain extends SuperSmallStateMachineCore {
	static closest(path, ...nodeTypes) { return instance => this._closest(instance, path, ...nodeTypes) }
	static changes(state, changes)     { return instance => this._changes(instance, state, changes) }
	static proceed(state, path)        { return instance => this._proceed(instance, state, path) }
	static perform(state, action)      { return instance => this._perform(instance, state, action) }
	static execute(state, path)        { return instance => this._execute(instance, state, path) }
	static traverse(iterator, post)    { return instance => this._traverse(instance, iterator, post) }
	static run(...input)               { return instance => this._run(instance, ...input) }
	static runSync(...input)           { return instance => this._runSync(instance, ...input) }
	static runAsync(...input)          { return instance => this._runAsync(instance, ...input) }
	static do(process = null)                    { return instance => ({ process: instance.config.adapt.reduce((prev, modifier) => modifier.call(instance, prev), process), config: instance.config }) }
	static defaults(defaults = S.config.defaults){ return instance => ({ process: instance.process, config: { ...instance.config, defaults }, }) }
	static input(input = S.config.input)         { return instance => ({ process: instance.process, config: { ...instance.config, input }, }) }
	static output(output = S.config.output)      { return instance => ({ process: instance.process, config: { ...instance.config, output }, }) }
	static unstrict                               (instance) { return ({ process: instance.process, config: { ...instance.config, strict: false }, }) }
	static strict                                 (instance) { return ({ process: instance.process, config: { ...instance.config, strict: true }, }) }
	static strictTypes                            (instance) { return ({ process: instance.process, config: { ...instance.config, strict: S.StrictTypes }, }) }
	static for(iterations = S.config.iterations) { return instance => ({ process: instance.process, config: { ...instance.config, iterations }, }) }
	static until(until = S.config.until)         { return instance => ({ process: instance.process, config: { ...instance.config, until }, }) }
	static forever                                (instance) { return ({ process: instance.process, config: { ...instance.config, iterations: Infinity }, }) }
	static sync                                   (instance) { return ({ process: instance.process, config: { ...instance.config, async: false }, }) }
	static async                                  (instance) { return ({ process: instance.process, config: { ...instance.config, async: true }, }) }
	static pause(pause = S.config.pause)         { return instance => ({ process: instance.process, config: { ...instance.config, pause }, }) }
	static override(override = S.config.override){ return instance => ({ process: instance.process, config: { ...instance.config, override } }) }
	static addNode(...nodes)                     { return instance => ({ process: instance.process, config: { ...instance.config, nodes: new NodeDefinitions(...instance.config.nodes.values(),...nodes) }, }) }
	static adapt(...adapters)                    { return instance => ({ process: adapters.reduce((prev, adapter) => adapter.call(instance, prev), instance.process), config: { ...instance.config, adapt: [ ...instance.config.adapt, ...adapters ] }, }) }
	static before(...adapters)                   { return instance => ({ process: instance.process, config: { ...instance.config, before: [ ...instance.config.before, ...adapters ] }, }) }
	static after(...adapters)                    { return instance => ({ process: instance.process, config: { ...instance.config, after: [ ...instance.config.after, ...adapters ] }, }) }
	static with(...adapters) {
		const flatAdapters = adapters.flat(Infinity)
		return instance => {
			const adapted = flatAdapters.reduce((prev, adapter) => adapter.call(instance, prev), instance)
			return adapted instanceof S ? adapted : new S(adapted.process, adapted.config)
		}
	}
}
export default class S extends SuperSmallStateMachineChain {
	process = null
	#config = S.config
	get config() { return { ...this.#config } }
	constructor(process = null, config = S.config) {
		super((...input) => (config.override || this.run).apply(this, input))
		this.#config = { ...this.#config, ...config }
		this.process = process
	}
	closest(path, ...nodeTypes) { return S._closest(this, path, ...nodeTypes) }
	changes(state, changes) { return S._changes(this, state, changes) }
	proceed(state, path)    { return S._proceed(this, state, path) }
	perform(state, action)  { return S._perform(this, state, action) }
	execute(state, path)    { return S._execute(this, state, path) }
	traverse(iterator, post){ return S._traverse(this, iterator, post) }
	run     (...input)      { return S._run(this, ...input) }
	runSync (...input)      { return S._runSync(this, ...input) }
	runAsync(...input)      { return S._runAsync(this, ...input) }
	do(process)             { return this.with(S.do(process)) }
	defaults(defaults)      { return this.with(S.defaults(defaults)) }
	input(input)            { return this.with(S.input(input)) }
	output(output)          { return this.with(S.output(output)) }
	get unstrict()          { return this.with(S.unstrict) }
	get strict()            { return this.with(S.strict) }
	get strictTypes()       { return this.with(S.strictTypes) }
	for(iterations)         { return this.with(S.for(iterations)) }
	until(until)            { return this.with(S.until(until)) }
	get forever()           { return this.with(S.forever) }
	get sync()              { return this.with(S.sync) }
	get async()             { return this.with(S.async) }
	pause(pause)            { return this.with(S.pause(pause)) }
	override(override)      { return this.with(S.override(override)) }
	addNode(...nodes)       { return this.with(S.addNode(...nodes)) }
	adapt(...adapters)      { return this.with(S.adapt(...adapters)) }
	before(...adapters)     { return this.with(S.before(...adapters)) }
	after(...adapters)      { return this.with(S.after(...adapters)) }
	with(...transformers)   { return S.with(...transformers)(this) }
}
export const StateMachine = S
export const SuperSmallStateMachine = S
