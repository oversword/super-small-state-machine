export const clone_object = (obj) => {
	if (Array.isArray(obj)) return obj.map(clone_object)
	if (obj === null) return null
	if (typeof obj !== 'object') return obj
	return Object.fromEntries(Object.entries(obj).map(([key,value]) => [ key, clone_object(value) ]));
}
export const unique_list_strings = (list, getId = item => item) => Object.values(Object.fromEntries(list.map(item=>[getId(item),item])));
const reduce_get_path_object = (obj, step) => obj ? obj[step] : undefined
export const get_path_object = (object, path) => (path.reduce(reduce_get_path_object, object))
export const normalise_function = (functOrReturn) => (typeof functOrReturn === 'function') ? functOrReturn : () => functOrReturn
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
export const wait_time = (delay) => (delay ? new Promise(resolve => setTimeout(resolve, delay)) : Promise.resolve())

export class PathReferenceError extends ReferenceError {}
export class ContextReferenceError extends ReferenceError {}
export class ContextTypeError extends TypeError {}
export class NodeTypeError extends TypeError {}
export class UndefinedNodeError extends ReferenceError {}
export class MaxIterationsError extends Error {}

export class NodeDefinition {
	name = Symbol('Unnamed node')
	isNode = null
	execute = null
	nextPath = null
	advance = null
	traverse = null
	constructor(name, { execute = null, isNode = null, nextPath = null, advance = null, traverse = null }) {
		this.name = name
		this.execute = execute
		this.isNode = isNode
		this.nextPath = nextPath
		this.advance = advance
		this.traverse = traverse
	}
}
export class NodeDefinitions extends Map  {
	isNode(object, objectType = typeof object) {
		return [...this.values()].reduce((last, current) => {
			if (current.isNode && current.isNode(object, objectType, last))
				return current.name
			return last
		}, false)
	}
}
export const N = NodeDefinition

export const NodeTypes = {
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

const exitFindNext = (output, instance, state) => {
	const nextPath = S.nextPath(instance, state)
	return nextPath ? {
		...state,
		[S.path]: nextPath
	} : {
		...state,
		[S.return]: true,
	}
}
const contextChangesNode = new N(NodeTypes.CH, {
	isNode: (object, objectType) => Boolean(object && objectType === 'object'),
	advance: (output, instance, state) => exitFindNext(output, instance, S.applyChanges(state, output)),
})
const sequenceNode = new N(NodeTypes.SQ, {
	nextPath: (parPath, instance, state, path) => {
		const parActs = get_path_object(instance.process, parPath)
		const childItem = path[parPath.length]
		if (parActs && childItem+1 < parActs.length)
			return [ ...parPath, childItem+1 ]
	},
	isNode: (object, objectType) => (objectType === 'object' && Array.isArray(object)),
	execute: (node, instance, state) => node.length ? [ ...state[S.path], 0 ] : null,
	advance: (output, instance, state) => ({
		...state,
		[S.path]: output
	}),
	traverse: (item, path, instance, iterate, post) => item.map((_,i) => iterate(instance, [...path,i])),
})
const actionNode = new N(NodeTypes.AC, {
	isNode: (object, objectType) => objectType === 'function',
	execute: (node, instance, state) => node(state),
})
const undefinedNode = new N(NodeTypes.UN, {
	isNode: (object, objectType) => objectType === 'undefined',
	execute: (node, instance, state) => { throw new UndefinedNodeError(`There is nothing to execute at path [ ${state[S.path].join(', ')} ]`) },
	advance: exitFindNext
})
const emptyNode = new N(NodeTypes.EM, {
	isNode: (object, objectType) => object === null,
	advance: exitFindNext
})
const conditionNode = new N(NodeTypes.CD, {
	isNode: (object, objectType) => Boolean(object && objectType === 'object' && (S.kw.IF in object)),
	execute: (node, instance, state) => {
		if (normalise_function(node[S.kw.IF])(state))
			return S.kw.TN in node
				? [ ...state[S.path], S.kw.TN ] : null
		return S.kw.EL in node
			? [ ...state[S.path], S.kw.EL ]
			: null
	},
	traverse: (item, path, instance, iterate, post) => post({
		...item,
		[S.kw.IF]: item[S.kw.IF],
		...(S.kw.TN in item ? { [S.kw.TN]: iterate(instance, [...path,S.kw.TN]) } : {}),
		...(S.kw.EL in item ? { [S.kw.EL]: iterate(instance, [...path,S.kw.EL]) } : {})
	}, path, instance)
})
const switchNode = new N(NodeTypes.SW, {
	isNode: (object, objectType) =>
		Boolean(object && objectType === 'object' && (S.kw.SW in object)),
	execute: (node, instance, state) => {
			const key = normalise_function(node[S.kw.SW])(state)
			const fallbackKey = (key in node[S.kw.CS]) ? key : S.kw.DF
			return (fallbackKey in node[S.kw.CS])
				? [ ...state[S.path], S.kw.CS, fallbackKey ]
				: null
	},
	traverse: (item, path, instance, iterate, post) => post({
		...item,
		[S.kw.SW]: item[S.kw.SW],
		[S.kw.CS]: Object.fromEntries(Object.keys(item[S.kw.CS]).map(key => [ key, iterate(instance, [...path,S.kw.CS,key]) ])),
	}, path, instance)
})
const machineNode = new N(NodeTypes.MC, {
	isNode: (object, objectType) => Boolean(object && objectType === 'object' && (S.kw.IT in object)),
	execute: (node, instance, state) =>  [ ...state[S.path], S.kw.IT ],
	traverse: (item, path, instance, iterate, post) => post({
		...item,
		...Object.fromEntries(Object.keys(item).map(key => [ key, iterate(instance, [...path,key]) ]))
	}, path, instance)
})
const directiveNode = new N(NodeTypes.DR, {
	isNode: (object, objectType) => Boolean(
			objectType === 'number' || objectType === 'string' || objectType === 'symbol' ||
			(object && objectType === 'object' && (S.path in object))),
	advance: (output, instance, state) => {
		const outputType = typeof output
		if (outputType === 'object' && output) {
			return S.advance(instance, state, output[S.path])
		} else {
			const lastOf = S.lastNode(
				instance,
				state[S.path].slice(0,-1),
				outputType === 'number' ? NodeTypes.SQ : NodeTypes.MC
			)
			if (!lastOf)
				throw new PathReferenceError(`A relative directive has been provided as a ${outputType} (${String(output)}), but no ${outputType === 'number' ? 'sequence' : 'state machine'} exists that this ${outputType} could be ${outputType === 'number' ? 'an index': 'a state'} of from path [ ${state[S.path].join(', ')} ].`)
			return {
				...state,
				[S.path]: [...lastOf, output]
			}
		}
	},
})
const returnNode = new N(NodeTypes.RT, {
	isNode: (object, objectType) => object === S.return || Boolean(object && objectType === 'object' && (S.return in object)),
	advance: (output, instance, state) => ({
		...state,
		[S.return]: true,
		[S.path]: state[S.path],
		...(!output || output === S.return ? {} : { [S.kw.RS]: output[S.return] })
	}),
})

export const nodes = [
	contextChangesNode,
	sequenceNode,
	actionNode,
	undefinedNode,
	emptyNode,
	conditionNode,
	switchNode,
	machineNode,
	directiveNode,
	returnNode,
]

export class ExtensibleFunction extends Function {
	constructor(f) {
		super()
		return Object.setPrototypeOf(f, new.target.prototype);
	};
}
export default class S extends ExtensibleFunction {
	static return      = Symbol('Super Small State Machine Return')
	static changes     = Symbol('Super Small State Machine Changes')
	static path        = Symbol('Super Small State Machine Path')
	static strict      = Symbol('Super Small State Machine Strict')
	static strictTypes = Symbol('Super Small State Machine Strict Types')

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

	static config = {
		initialState: { [S.kw.RS]: null },
		iterations: 10000,
		until: result => S.return in result,
		strictContext: false,
		method: null,
		processModifiers: [],
		inputModifiers: [],
		outputModifiers: [],
		input: (a = {}) => a,
		output: a => a[S.kw.RS],
		async: false,
		nodes: new NodeDefinitions(nodes.map(node => [node.name,node])),
		// Special settings for async
		delay: 0,
		allow: 1000,
		wait: 0,
	}
	static applyChanges(state, changes = {}) {
		if (state[S.strict]) {
			if (Object.entries(changes).some(([name]) => !(name in state)))
				throw new ContextReferenceError(`Only properties that exist on the initial context may be updated.\nYou changed [ ${Object.keys(changes).filter(property => !(property in state)).join(', ')} ], which ${Object.keys(changes).filter(property => !(property in state)).length === 1 ? 'is' : 'are'} not in: [ ${Object.keys(state).join(', ')} ].\nPath: [ ${state[S.path]?.join(' / ')} ]`)
			if (state[S.strict] === S.strictTypes) {
				if (Object.entries(changes).some(([name,value]) => typeof value !== typeof state[name])) {
					const errs = Object.entries(changes).filter(([name,value]) => typeof value !== typeof state[name])
					throw new ContextTypeError(`Properties must have the same type as their initial value. ${errs.map(([name,value]) => `${typeof value} given for '${name}', should be ${typeof state[name]}`).join('. ')}.`)
				}
			}
		}
		const allChanges = deep_merge_object(state[S.changes] || {}, changes)
		return {
			...deep_merge_object(state, allChanges),
			[S.path]: state[S.path],
			[S.changes]: allChanges
		}
	}
	static actionName(process, path = []) {
		const method = get_path_object(process, path)
		return method && method.name
	}
	static lastOf(process, path = [], condition = () => true) {
		const item = get_path_object(process, path)
		if (condition(item, path, process)) return path
		if (path.length === 0) return null
		return S.lastOf(process, path.slice(0,-1), condition)
	}
	static lastNode(instance, path = [], ...nodeTypes) {
		const flatNodeTypes = nodeTypes.flat(Infinity)
		return S.lastOf(instance.process, path, i => {
			const nodeType = instance.nodes.isNode(i)
			return Boolean(nodeType && flatNodeTypes.includes(nodeType))
		})
	}
	static nextPath(instance, state = {}, path = state[S.path] || []) {
		if (path.length === 0) return null
		const parPath = S.lastNode(instance, path.slice(0,-1), [...instance.nodes.values()].filter(({ nextPath }) => nextPath).map(({ name }) => name))
		if (!parPath) return null
		const parActs = get_path_object(instance.process, parPath)
		const parType = instance.nodes.isNode(parActs)
		const nodeDefinition = parType && instance.nodes.get(parType)
		if (!(nodeDefinition && nodeDefinition.nextPath)) return null
		const result = nodeDefinition.nextPath(parPath, instance, state, path)
		if (result !== undefined) return result
		return S.nextPath(instance, state, parPath)
	}
	static advance(instance, state, output = null) {
		const path = state[S.path] || []
		const nodeType = instance.nodes.isNode(output)
		const nodeDefinition = nodeType && instance.nodes.get(nodeType)
		if (nodeDefinition && nodeDefinition.advance)
			return nodeDefinition.advance(output, instance, state)
		throw new NodeTypeError(`Unknown output or action type: ${typeof output}${nodeType ? `, nodeType: ${String(nodeType)}` : ''} at [ ${path.join(', ')} ]`)
	}
	static execute(instance, state = {}) {
		const path = state[S.path] || []
		const node = get_path_object(instance.process, path)
		const nodeType = instance.nodes.isNode(node)
		const nodeDefinition = nodeType && instance.nodes.get(nodeType)
		if (nodeDefinition && nodeDefinition.execute)
			return nodeDefinition.execute(node, instance, state)
		return node
	}
	static traverse(iterator = a => a, post = b => b) {
		const iterate = (instance, path = []) => {
			const item = get_path_object(instance.process, path)
			const nodeType = instance.nodes.isNode(item)
			const nodeDefinition = nodeType && instance.nodes.get(nodeType)
			if (nodeDefinition && nodeDefinition.traverse)
				return nodeDefinition.traverse(item, path, instance, iterate, post)
			return iterator(item, path, instance)
		}
		return iterate
	}
	static async execAsync(instance, ...input) {
		const { delay, allow, wait, until, iterations, input: inputModifier, output: outputModifier, inputModifiers, outputModifiers, strictContext, initialState: state } = { ...S.config, ...instance.config }
		const modifiedInput = (await inputModifier.apply(instance, input)) || {}
		if (delay) await wait_time(delay)
		let r = 0, startTime = Date.now(), currentState = inputModifiers.reduce((prev, modifier) => modifier.call(instance, prev), S.applyChanges({
			[S.changes]: {},
			...state,
			[S.path]: modifiedInput[S.path] || [],
			[S.strict]: strictContext
		}, modifiedInput))
		while (r < iterations) {
			if (until(currentState)) break;
			if (++r >= iterations)
				throw new MaxIterationsError(`Maximim iterations of ${iterations} reached at path [ ${currentState[S.path]?.join(', ')} ]`)
			currentState = S.advance(instance, currentState, await S.execute(instance, currentState))
			if (allow > 0 && r % 10 === 0) {
				const nowTime = Date.now()
				if (nowTime - startTime >= allow) {
					await wait_time(wait)
					startTime = Date.now()
				}
			}
		}
		return outputModifier.call(instance, outputModifiers.reduce((prev, modifier) => modifier.call(instance, prev), currentState))
	}
	static exec(instance, ...input) {
		const { until, iterations, input: inputModifier, output: outputModifier, inputModifiers, outputModifiers, strictContext, initialState: state  } = { ...S.config, ...instance.config }
		const modifiedInput = inputModifier.apply(instance, input) || {}
		let r = 0, currentState = inputModifiers.reduce((prev, modifier) => modifier.call(instance, prev), S.applyChanges({
			[S.changes]: {},
			...state,
			[S.path]: modifiedInput[S.path] || [],
			[S.strict]: strictContext
		}, modifiedInput))
		while (r < iterations) {
			if (until(currentState)) break;
			if (++r > iterations)
				throw new MaxIterationsError(`Maximim iterations of ${iterations} reached at path [ ${currentState[S.path]?.join(', ')} ]`)
			currentState = S.advance(instance, currentState, S.execute(instance, currentState))
		}
		return outputModifier.call(instance, outputModifiers.reduce((prev, modifier) => modifier.call(instance, prev), currentState))
	}
	static run(instance, ...input) {
		const { async: isAsync } = { ...S.config, ...instance.config }
		if (isAsync) return S.execAsync(instance, ...input)
		return S.exec(instance, ...input)
	}

	process = null
	#config = S.config
	get nodes() { return this.#config.nodes }
	get config() { return { ...this.#config } }
	get initialState() { return clone_object(this.#config.initialState) }
	constructor(process = null, config = S.config) {
		super((...input) => (config.method || this.run).apply(this, input))
		this.#config = {
			...S.config,
			...this.#config,
			...config
		}
		this.process = process
	};
	isNode(object, objectType) { return this.nodes.isNode(object, objectType) }
	applyChanges(state, changes) { return S.applyChanges(state, changes) }
	actionName(path) { return S.actionName(this.process, path) }
	
	lastOf(path, condition) { return S.lastOf(this.process, path, condition) }
	lastNode(path, ...nodeTypes) { return S.lastNode(this, path, ...nodeTypes) }
	nextPath(state, path = state[S.path] || []) { return S.nextPath(this, state, path) }
	advance(state, output) { return S.advance(this, state, output) }
	execute(state) { return S.execute(this, state) }
	
	exec(...input) { return S.exec(this, ...input) }
	execAsync(...input) { return S.execAsync(this, ...input) }
	run (...input) { return S.run(this, ...input) }
	do(process) { return new S(this.#config.processModifiers.reduce((prev, modifier) => modifier.call(this, prev), process), this.#config) }
	override(method) { return new S(this.process, { ...this.#config, method }) }
	
	get unstrict() { return new S(this.process, { ...this.#config, strictContext: false }) }
	get strict() { return new S(this.process, { ...this.#config, strictContext: true }) }
	get strictTypes() { return new S(this.process, { ...this.#config, strictContext: S.strictTypes }) }
	get forever(){ return new S(this.process, { ...this.#config, iterations: Infinity }) }
	get async() { return new S(this.process, { ...this.#config, async: true }) }
	get sync() { return new S(this.process, { ...this.#config, async: false }) }
	get step() { return new S(this.process, { ...this.#config, iterations: 1, outputModifier: a => a }) }
	defaults(initialState) { return new S(this.process, { ...this.#config, initialState }) }
	for(iterations = 10000) { return new S(this.process, { ...this.#config, iterations }) }
	delay(delay = 0) { return new S(this.process, { ...this.#config, delay }) }
	allow(allow = 1000) { return new S(this.process, { ...this.#config, allow }) }
	wait(wait = 0) { return new S(this.process, { ...this.#config, wait }) }
	until(until) { return new S(this.process, { ...this.#config, until }) }
	with(...transformers) { return transformers.reduce((prev, transformer) => transformer(prev), this) }
	adapt(adapter) { return new S(adapter.call(this, this.process), { ...this.#config, processModifiers: [...this.#config.processModifiers,adapter] }) }
	input(input) { return new S(this.process, { ...this.#config, input }) }
	output(output) { return new S(this.process, { ...this.#config, output }) }
	adaptInput(inputModifier) { return new S(this.process, { ...this.#config, inputModifiers: [ ...this.#config.inputModifiers, inputModifier ] }) }
	adaptOutput(outputModifier) { return new S(this.process, { ...this.#config, outputModifiers: [ ...this.#config.outputModifiers, outputModifier ] }) }
	addNode(...nodes) { return new S(this.process, { ...this.#config, nodes: new NodeDefinitions([...this.#config.nodes.values(), ...nodes].map(node => [node.name, node])) }) }
}

export const StateMachine = S
export const SuperSmallStateMachine = S