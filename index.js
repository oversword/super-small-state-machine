const clone_object = (obj) => {
	if (Array.isArray(obj)) return obj.map(clone_object)
	if (obj === null) return null
	if (typeof obj !== 'object') return obj
	return Object.fromEntries(Object.entries(obj).map(([key,value]) => [ key, clone_object(value) ]));
}
const unique_list_strings = (list, getId = item => item) => Object.values(Object.fromEntries(list.map(item=>[getId(item),item])));
const reduce_get_path_object = (obj, step) => obj ? obj[step] : undefined
const get_path_object = (object, path) => (path.reduce(reduce_get_path_object, object))
const normalise_function = (functOrReturn) => (typeof functOrReturn === 'function') ? functOrReturn : () => functOrReturn
const reduce_deep_merge_object = (base, override) => {
	if (!((base && typeof base === 'object') && !Array.isArray(base)
	&& (override && typeof override === 'object') && !Array.isArray(override)))
		return override;
	const allKeys = unique_list_strings(Object.keys(base).concat(Object.keys(override)));
	return Object.fromEntries(allKeys.map(key => [
		key, key in override ? deep_merge_object(base[key], override[key]) : base[key]
	]));
}
const deep_merge_object = (base, ...overrides) => overrides.reduce(reduce_deep_merge_object, base)
const wait_time = (delay) => (delay ? new Promise(resolve => setTimeout(resolve, delay)) : Promise.resolve())

class SuperSmallStateMachineError extends Error {
	instance; state; data; path;
	constructor(message, { instance, state, data, path } = {}) {
		super(message)
		Object.assign(this, { instance, state, data, path })
	}
}
class SuperSmallStateMachineReferenceError extends SuperSmallStateMachineError {}
class SuperSmallStateMachineTypeError extends SuperSmallStateMachineError {}

class ContextReferenceError extends SuperSmallStateMachineReferenceError {}
class ContextTypeError extends SuperSmallStateMachineTypeError {}
class NodeTypeError extends SuperSmallStateMachineTypeError {}
class UndefinedNodeError extends SuperSmallStateMachineReferenceError {}
class MaxIterationsError extends SuperSmallStateMachineError {}
class PathReferenceError extends SuperSmallStateMachineReferenceError {}

class NodeDefinition {
	name = Symbol('Unnamed node')
	isNode = null; execute = null; nextPath = null; advance = null; traverse = null;
	constructor(name, { execute = null, isNode = null, nextPath = null, advance = null, traverse = null }) {
		Object.assign(this, { name, execute, isNode, nextPath, advance, traverse })
	}
}
class NodeDefinitions extends Map  {
	constructor(...nodes) { super(nodes.flat(Infinity).map(node => [node.name,node])) }
	isNode(object, objectType = typeof object, isOutput = false) {
		const foundType = [...this.values()].findLast(current => current.isNode && current.isNode(object, objectType, isOutput))		
		return foundType ? foundType.name : false
	}
}
const N = NodeDefinition

const NodeTypes = {
	UN: 'undefined',
	EM: 'empty',
	DR: 'directive',
	RT: 'return',
	AC: 'action',
	SQ: 'sequence',
	CD: 'condition',
	SW: 'switch',
	MC: 'machine',
	CH: 'changes',
}
// TODO: merge into S._nextPath? or S._advance?
const exitFindNext = function (output, state) {
	const path = S._nextPath(this, state)
	return path ? {
		...state,
		[S.Path]: path
	} : {
		...state,
		[S.Return]: true,
	}
}

const nodes = [
	new N(NodeTypes.CH, {
		isNode: (object, objectType) => Boolean(object && objectType === 'object'),
		advance: function (output, state) { return exitFindNext.call(this, output, S._applyChanges(this, state, output)) },
	}),
	new N(NodeTypes.SQ, {
		nextPath: function (parPath, state, path) {
			const parActs = get_path_object(this.process, parPath)
			const childItem = path[parPath.length]
			if (parActs && childItem+1 < parActs.length)
				return [ ...parPath, childItem+1 ]
		},
		isNode: (object, objectType, isOutput) => ((!isOutput) && objectType === 'object' && Array.isArray(object)),
		execute: (node, state) => node.length ? [ ...state[S.Path], 0 ] : null,
		traverse: (item, path, iterate, post) => item.map((_,i) => iterate([...path,i])),
	}),
	new N(NodeTypes.AC, {
		isNode: (object, objectType, isOutput) => (!isOutput) && objectType === 'function',
		execute: (node, state) => node(state),
	}),
	new N(NodeTypes.UN, {
		isNode: (object, objectType) => objectType === 'undefined',
		execute: (node, state) => { throw new UndefinedNodeError(`There is nothing to execute at path [ ${state[S.Path].join(', ')} ]`) },
		advance: exitFindNext
	}),
	new N(NodeTypes.EM, {
		isNode: (object, objectType) => object === null,
		advance: exitFindNext
	}),
	new N(NodeTypes.CD, {
		isNode: (object, objectType, isOutput) => Boolean((!isOutput) && object && objectType === 'object' && (S.kw.IF in object)),
		execute: (node, state) => {
			if (normalise_function(node[S.kw.IF])(state))
				return S.kw.TN in node
					? [ ...state[S.Path], S.kw.TN ] : null
			return S.kw.EL in node
				? [ ...state[S.Path], S.kw.EL ]
				: null
		},
		traverse: (item, path, iterate, post) => post({
			...item,
			[S.kw.IF]: item[S.kw.IF],
			...(S.kw.TN in item ? { [S.kw.TN]: iterate([...path,S.kw.TN]) } : {}),
			...(S.kw.EL in item ? { [S.kw.EL]: iterate([...path,S.kw.EL]) } : {})
		}, path)
	}),
	new N(NodeTypes.SW, {
		isNode: (object, objectType, isOutput) => Boolean((!isOutput) && object && objectType === 'object' && (S.kw.SW in object)),
		execute: (node, state) => {
				const key = normalise_function(node[S.kw.SW])(state)
				const fallbackKey = (key in node[S.kw.CS]) ? key : S.kw.DF
				return (fallbackKey in node[S.kw.CS])
					? [ ...state[S.Path], S.kw.CS, fallbackKey ]
					: null
		},
		traverse: (item, path, iterate, post) => post({
			...item,
			[S.kw.SW]: item[S.kw.SW],
			[S.kw.CS]: Object.fromEntries(Object.keys(item[S.kw.CS]).map(key => [ key, iterate([...path,S.kw.CS,key]) ])),
		}, path)
	}),
	new N(NodeTypes.MC, {
		isNode: (object, objectType, isOutput) => {
			return Boolean((!isOutput) && object && objectType === 'object' && (S.kw.IT in object))
		},
		execute: (node, state) =>  [ ...state[S.Path], S.kw.IT ],
		traverse: (item, path, iterate, post) => post({
			...item,
			...Object.fromEntries(Object.keys(item).map(key => [ key, iterate([...path,key]) ]))
		}, path)
	}),
	// TODO: separate out directives. Absolute, relative, wrapped, sequence, machine
	new N(NodeTypes.DR, {
		isNode: (object, objectType, isOutput) => Boolean(
				objectType === 'number' || objectType === 'string' || objectType === 'symbol' ||
				(isOutput && Array.isArray(object)) ||
				(object && objectType === 'object' && (S.Path in object))),
		advance: function (output, state) {
			if (Array.isArray(output)) {
				return {
					...state,
					[S.Path]: output
				}
			}
			const outputType = typeof output
			if (outputType === 'object' && output) {
				return S._advance(this, state, output[S.Path])
			} else {
				const lastOf = S._lastNode(
					this,
					state[S.Path].slice(0,-1),
					outputType === 'number' ? NodeTypes.SQ : NodeTypes.MC
				)
				if (!lastOf)
					throw new PathReferenceError(`A relative directive has been provided as a ${outputType} (${String(output)}), but no ${outputType === 'number' ? 'sequence' : 'state machine'} exists that this ${outputType} could be ${outputType === 'number' ? 'an index': 'a state'} of from path [ ${state[S.Path].join(', ')} ].`)
				return {
					...state,
					[S.Path]: [...lastOf, output]
				}
			}
		},
	}),
	new N(NodeTypes.RT, {
		isNode: (object, objectType) => object === S.Return || Boolean(object && objectType === 'object' && (S.Return in object)),
		advance: (output, state) => ({
			...state,
			[S.Return]: true,
			[S.Path]: state[S.Path],
			...(!output || output === S.Return ? {} : { [S.kw.RS]: output[S.Return] })
		}),
	}),
]



class ExtensibleFunction extends Function {
	constructor(f) {
		super()
		return Object.setPrototypeOf(f, new.target.prototype);
	};
}
class S extends ExtensibleFunction {
	static Return      = Symbol('Super Small State Machine Return')
	static Changes     = Symbol('Super Small State Machine Changes')
	static Path        = Symbol('Super Small State Machine Path')
	static StrictTypes = Symbol('Super Small State Machine Strict Types')

	static keywords = {
		IF: 'if',
		TN: 'then',
		EL: 'else',
		SW: 'switch',
		CS: 'case',
		DF: 'default',
		IT: 'initial',
		RS: 'result',
	}
	static kw = S.keywords
	static nodeTypes = NodeTypes
	static types = S.nodeTypes

	static config = {
		defaults: { [S.kw.RS]: null },
		input: (a = {}) => a,
		result: a => a[S.kw.RS],
		strict: false,
		iterations: 10000,
		until: result => S.Return in result,
		async: false,
			// Special settings for async
			delay: 0,
			allow: 1000,
			wait: 0,
		override: null,
		nodes: new NodeDefinitions(nodes),
		adapt: [],
		adaptStart: [],
		adaptEnd: [],
	}
	
	// TODO: getNode instead of action name?
	// TODO: closest instead of lastOf & lastNode
	static _actionName (process, path = []) {
		const node = get_path_object(process, path)
		return node && node.name
	}
	static _lastOf (process, path = [], condition = () => true) {
		const item = get_path_object(process, path)
		if (condition(item, path, process)) return path
		if (path.length === 0) return null
		return S._lastOf(process, path.slice(0,-1), condition)
	}

	static _lastNode (instance, path = [], ...nodeTypes) {
		const flatNodeTypes = nodeTypes.flat(Infinity)
		return S._lastOf(instance.process, path, i => {
			const nodeType = instance.config.nodes.isNode(i)
			return Boolean(nodeType && flatNodeTypes.includes(nodeType))
		})
	}
	static _nextPath (instance, state = {}, path = state[S.Path] || []) {
		if (path.length === 0) return null
		const parPath = S._lastNode(instance, path.slice(0,-1), [...instance.config.nodes.values()].filter(({ nextPath }) => nextPath).map(({ name }) => name))
		if (!parPath) return null
		const parActs = get_path_object(instance.process, parPath)
		const parType = instance.config.nodes.isNode(parActs)
		const nodeDefinition = parType && instance.config.nodes.get(parType)
		if (!(nodeDefinition && nodeDefinition.nextPath)) return null
		const result = nodeDefinition.nextPath.call(instance, parPath, state, path)
		if (result !== undefined) return result
		return S._nextPath(instance, state, parPath)
	}
	static _traverse(instance, iterator = a => a, post = b => b) {
		const boundPost = post.bind(instance)
		const iterate = (path = []) => {
			const item = get_path_object(instance.process, path)
			const nodeType = instance.config.nodes.isNode(item)
			const nodeDefinition = nodeType && instance.config.nodes.get(nodeType)
			if (nodeDefinition && nodeDefinition.traverse)
				return nodeDefinition.traverse.call(instance, item, path, iterate, boundPost)
			return iterator.call(instance, item, path)
		}
		return iterate()
	}
	static _applyChanges (instance, state = {}, changes = {}) {
		if (instance.config.strict) {
			if (Object.entries(changes).some(([name]) => !(name in state)))
				throw new ContextReferenceError(`Only properties that exist on the initial context may be updated.\nYou changed [ ${Object.keys(changes).filter(property => !(property in state)).join(', ')} ], which ${Object.keys(changes).filter(property => !(property in state)).length === 1 ? 'is' : 'are'} not in: [ ${Object.keys(state).join(', ')} ].\nPath: [ ${state[S.Path]?.join(' / ')} ]`)
			if (instance.config.strict === S.StrictTypes) {
				if (Object.entries(changes).some(([name,value]) => typeof value !== typeof state[name])) {
					const errs = Object.entries(changes).filter(([name,value]) => typeof value !== typeof state[name])
					throw new ContextTypeError(`Properties must have the same type as their initial value. ${errs.map(([name,value]) => `${typeof value} given for '${name}', should be ${typeof state[name]}`).join('. ')}.`)
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
	static _advance (instance, state = {}, output = null) {
		const path = state[S.Path] || []
		const nodeType = instance.config.nodes.isNode(output, typeof output, true)
		const nodeDefinition = nodeType && instance.config.nodes.get(nodeType)
		if (nodeDefinition && nodeDefinition.advance)
			return nodeDefinition.advance.call(instance, output, state)
		throw new NodeTypeError(`Unknown output or action type: ${typeof output}${nodeType ? `, nodeType: ${String(nodeType)}` : ''} at [ ${path.join(', ')} ]`)
	}
	static _execute (instance, state = {}) {
		const path = state[S.Path] || []
		const node = get_path_object(instance.process, path)
		const nodeType = instance.config.nodes.isNode(node)
		const nodeDefinition = nodeType && instance.config.nodes.get(nodeType)
		if (nodeDefinition && nodeDefinition.execute)
			return nodeDefinition.execute.call(instance, node, state)
		return node
	}
	static async _runAsync (instance, ...input) { 
		const { delay, allow, wait, until, iterations, input: inputModifier, result: adaptResult, adaptStart, adaptEnd, strict, defaults } = { ...S.config, ...instance.config }
		const modifiedInput = (await inputModifier.apply(instance, input)) || {}
		if (delay) await wait_time(delay)
		let r = 0, startTime = Date.now(), currentState = adaptStart.reduce((prev, modifier) => modifier.call(instance, prev), S._applyChanges(instance, {
			[S.Changes]: {},
			...defaults,
			[S.Path]: modifiedInput[S.Path] || [],
		}, modifiedInput))
		while (r < iterations) {
			if (until(currentState)) break;
			if (++r >= iterations)
				throw new MaxIterationsError(`Maximim iterations of ${iterations} reached at path [ ${currentState[S.Path]?.join(', ')} ]`, { instance, state: currentState, data: { iterations } })
			currentState = S._advance(instance, currentState, await S._execute(instance, currentState))
			if (allow > 0 && r % 10 === 0) {
				const nowTime = Date.now()
				if (nowTime - startTime >= allow) {
					await wait_time(wait)
					startTime = Date.now()
				}
			}
		}
		return adaptResult.call(instance, adaptEnd.reduce((prev, modifier) => modifier.call(instance, prev), currentState))
	}
	static _runSync (instance, ...input) {
		const { until, iterations, input: inputModifier, result: adaptResult, adaptStart, adaptEnd, strict, defaults: state  } = { ...S.config, ...instance.config }
		const modifiedInput = inputModifier.apply(instance, input) || {}
		let r = 0, currentState = adaptStart.reduce((prev, modifier) => modifier.call(instance, prev), S._applyChanges(instance, {
			[S.Changes]: {},
			...state,
			[S.Path]: modifiedInput[S.Path] || [],
		}, modifiedInput))
		while (r < iterations) {
			if (until(currentState)) break;
			if (++r > iterations)
				throw new MaxIterationsError(`Maximim iterations of ${iterations} reached at path [ ${currentState[S.Path]?.join(', ')} ]`, { instance, state: currentState, data: { iterations } })
			currentState = S._advance(instance, currentState, S._execute(instance, currentState))
		}
		return adaptResult.call(instance, adaptEnd.reduce((prev, modifier) => modifier.call(instance, prev), currentState))
	}
	static _run (instance, ...input) {
		if (instance.config.async) return S._runAsync(instance, ...input)
		return S._runSync(instance, ...input)
	}
	
	// TODO: separate core, curry & instance
	
	
	// TODO: static arg-scoped lastOf & actionName ?
	static applyChanges(state, changes) { return instance => S._applyChanges(instance, state, changes) }
	static lastNode(path, ...nodeTypes) { return instance => S._lastNode(instance, path, ...nodeTypes) }
	static nextPath(state, path)   { return instance => S._nextPath(instance, state, path) }
	static traverse(iterator, post){ return instance => S._traverse(instance, iterator, post) }
	static advance(state, output)  { return instance => S._advance(instance, state, output) }
	static execute(state)          { return instance => S._execute(instance, state) }
	static runAsync(...input)      { return instance => S._runAsync(instance, ...input) }
	static runSync(...input)       { return instance => S._runSync(instance, ...input) }
	static run(...input)           { return instance => S._run(instance, ...input) }
	
	static do(process)             { return instance => ({ process: instance.config.adapt.reduce((prev, modifier) => modifier.call(instance, prev), process), config: instance.config }) }
	static defaults(defaults)      { return instance => ({ process: instance.process, config: { ...instance.config, defaults }, }) }

	static input(input)            { return instance => ({ process: instance.process, config: { ...instance.config, input }, }) }
	static result(result)          { return instance => ({ process: instance.process, config: { ...instance.config, result }, }) }

	static unstrict(instance)      { return ({ process: instance.process, config: { ...instance.config, strict: false }, }) }
	static strict(instance)        { return ({ process: instance.process, config: { ...instance.config, strict: true }, }) }
	static strictTypes(instance)   { return ({ process: instance.process, config: { ...instance.config, strict: S.StrictTypes }, }) }
	
	static for(iterations = 10000) { return instance => ({ process: instance.process, config: { ...instance.config, iterations }, }) }
	static until(until)            { return instance => ({ process: instance.process, config: { ...instance.config, until }, }) }
	static forever(instance)       { return ({ process: instance.process, config: { ...instance.config, iterations: Infinity }, }) }
	static step = S.with(S.for(1), S.result(a => a))

	static sync(instance)          { return ({ process: instance.process, config: { ...instance.config, async: false }, }) }
	static async(instance)         { return ({ process: instance.process, config: { ...instance.config, async: true }, }) }
		static delay(delay = 0)    { return instance => ({ process: instance.process, config: { ...instance.config, delay }, }) }
		static allow(allow = 1000) { return instance => ({ process: instance.process, config: { ...instance.config, allow }, }) }
		static wait(wait = 0)      { return instance => ({ process: instance.process, config: { ...instance.config, wait }, }) }

	static override(override)      { return instance => ({ process: instance.process, config: { ...instance.config, override } }) } 
	static addNode(...nodes)       { return instance => ({ process: instance.process, config: { ...instance.config, nodes: new NodeDefinitions(...instance.config.nodes.values(),...nodes) }, }) }
	static adapt(...adapters)      { return instance => ({ process: adapters.reduce((prev, adapter) => adapter.call(instance, prev), instance.process), config: { ...instance.config, adapt: [ ...instance.config.adapt, ...adapters ] }, }) }
	static adaptStart(...adapters) { return instance => ({ process: instance.process, config: { ...instance.config, adaptStart: [ ...instance.config.adaptStart, ...adapters ] }, }) }
	static adaptEnd(...adapters)   { return instance => ({ process: instance.process, config: { ...instance.config, adaptEnd: [ ...instance.config.adaptEnd, ...adapters ] }, }) }

	static with(...adapters) {
		const flatAdapters = adapters.flat(Infinity)
		return instance => {
			const result = flatAdapters.reduce((prev, adapter) => adapter.call(instance, prev), instance)
			return result instanceof S ? result : new S(result.process, result.config)
		}
	}
	
	process = null
	#config = S.config
	get config()   { return { ...this.#config } }

	constructor(process = null, config = S.config) {
		super((...input) => (config.override || this.run).apply(this, input))
		this.#config = {
			...this.#config,
			...config
		}
		this.process = process
	};

	isNode(object, objectType = typeof object, isOutput = false) { return this.#config.nodes.isNode(object, objectType, isOutput) }
	actionName(path)        { return S._actionName(this.process, path) }
	lastOf(path, condition) { return S._lastOf(this.process, path, condition) }

	lastNode(path, ...nodeTypes) { return S._lastNode(this, path, ...nodeTypes) }
	applyChanges(state, changes) { return S._applyChanges(this, state, changes) }
	nextPath(state, path)   { return S._nextPath(this, state, path) }
	advance(state, output)  { return S._advance(this, state, output) }
	execute(state)          { return S._execute(this, state) }
	traverse(iterator, post){ return S._traverse(this, iterator, post) }
	
	runSync (...input)      { return S._runSync(this, ...input) }
	runAsync(...input)      { return S._runAsync(this, ...input) }
	run     (...input)      { return S._run(this, ...input) }
	
	defaults(defaults)      { return this.with(S.defaults(defaults)) }
	do(process)             { return this.with(S.do(process)) }
	
	input(input)            { return this.with(S.input(input)) }
	result(result)          { return this.with(S.result(result)) }
	
	get unstrict()          { return this.with(S.unstrict) }
	get strict()            { return this.with(S.strict) }
	get strictTypes()       { return this.with(S.strictTypes) }
	
	for(iterations)         { return this.with(S.for(iterations)) }
	until(until)            { return this.with(S.until(until)) }
	get forever()           { return this.with(S.forever) }
	get step()              { return this.with(S.step) }
	
	get sync()              { return this.with(S.sync) }
	get async()             { return this.with(S.async) }
		delay(delay)        { return this.with(S.delay(delay)) }
		allow(allow)        { return this.with(S.allow(allow)) }
		wait(wait)          { return this.with(S.wait(wait)) }
	
	override(override)      { return this.with(S.override(override)) }
	addNode(...nodes)       { return this.with(S.addNode(...nodes)) }
	adapt(...adapters)      { return this.with(S.adapt(...adapters)) }
	adaptStart(...adapters) { return this.with(S.adaptStart(...adapters)) }
	adaptEnd(...adapters)   { return this.with(S.adaptEnd(...adapters)) }
	
	with(...transformers)   { return S.with(...transformers)(this) }
}

const StateMachine = S
const SuperSmallStateMachine = S
