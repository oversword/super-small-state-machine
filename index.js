export const clone_object = (obj) => {
	if (Array.isArray(obj)) return obj.map(clone_object)
	if (obj === null) return null
	if (typeof obj !== 'object') return obj
	return Object.fromEntries(Object.entries(obj).map(([key,value]) => [ key, clone_object(value) ]));
}
export const unique_list_strings = (list, getId = ident) => Object.values(Object.fromEntries(list.map(item=>[getId(item),item])));
const reduce_get_path_object = (obj, step) => obj ? obj[step] : undefined
export const get_path_object = (object, path = []) => (path.reduce(reduce_get_path_object, object))
export const set_path_object = (object, path = [], value = undefined) => {
	if (path.length === 0 || typeof object !== 'object' || !object) return value
	if (Array.isArray(object)) return [ ...object.slice(0,path[0]), set_path_object(object[path[0]], path.slice(1), value), ...object.slice(1+path[0]) ]
	return { ...object, [path[0]]: set_path_object(object[path[0]], path.slice(1), value), }
}
export const update_path_object = (object, path = [], transformer = ident) => set_path_object(object, path, transformer(get_path_object(object, path), path, object))
const map_list_path_object = ([ key, value ]) => list_path_object(value).map(path => [ key, ...path ])
export const list_path_object = object => typeof object !== 'object' || !object ? [[]] : [[]].concat(...Object.entries(object).map(map_list_path_object))
export const normalise_function = (functOrReturn) => (typeof functOrReturn === 'function') ? functOrReturn : () => functOrReturn
const reduce_deep_merge_object = (base, override) => {
	if (!((base && typeof base === 'object') && !Array.isArray(base) && (override && typeof override === 'object') && !Array.isArray(override)))
		return override;
	const allKeys = unique_list_strings(Object.keys(base).concat(Object.keys(override)));
	return Object.fromEntries(allKeys.map(key => [ key, key in override ? deep_merge_object(base[key], override[key]) : base[key] ]));
}
export const deep_merge_object = (base, ...overrides) => overrides.reduce(reduce_deep_merge_object, base)
export const shallow_merge_object = (...objects) => Object.fromEntries([].concat(...objects.map(object => Object.entries(object))))
export const get_closest_path = (object, path = [], condition = () => true) => {
const item = get_path_object(object, path)
if (condition(item, path, object)) return path
if (path.length === 0) return null
return get_closest_path(object, path.slice(0,-1), condition)
}
export const wait_time = delay => (delay ? new Promise(resolve => setTimeout(resolve, delay)) : Promise.resolve())
export const name = obj => obj.name
export const named = (name, obj) => {
	const type = typeof obj
	if (type === 'function') return ({ [name]: (...args) => obj(...args) })[name]
	if (type === 'object' && !Array.isArray(obj)) return { ...obj, name }
	const ret = type === 'object' ? [...obj] : obj
	ret.name = name
	return ret
}
export const ident = original => original
export const inc = (property, by = 1) => named(`${by === 1 ? 'increment ':''}${by === -1 ? 'decrement ':''}${property}${Math.sign(by) === 1 && by !== 1 ? ` plus ${by}`:''}${Math.sign(by) === -1 && by !== -1 ? ` minus ${Math.abs(by)}`:''}`, ({ [property]: i }) => ({ [property]: i + by }))
export const and = (...methods) => named(methods.map(name).join(' and '), (...args) => methods.every(method => method(...args)))
export const or = (...methods) => named(methods.map(name).join(' or '), (...args) => methods.some(method => method(...args)))
export const not = method => named(`not ${method.name}`, (...args) => !method(...args))
export const forIn = (list, index, ...methods) => named(`for ${index} in ${list}`, [ named(`reset ${index}`, () => ({ [index]: 0 })), { while: named(`${index} is within ${list}`, ({ [index]: i, [list]: l }) => i < l.length), do: [ methods, inc(index) ] } ])
export class SuperSmallStateMachineError extends Error {
	instance; state; data;
	constructor(message, { instance, state, data } = {}) {
		super(message)
		Object.assign(this, { instance, state, data })
	}
}
export class SuperSmallStateMachineReferenceError extends SuperSmallStateMachineError {}
export class SuperSmallStateMachineTypeError extends SuperSmallStateMachineError {}
export class StateReferenceError extends SuperSmallStateMachineReferenceError {}
export class StateTypeError extends SuperSmallStateMachineTypeError {}
export class NodeTypeError extends SuperSmallStateMachineTypeError {}
export class NodeReferenceError extends SuperSmallStateMachineReferenceError {}
export class MaxIterationsError extends SuperSmallStateMachineError {}
export class PathReferenceError extends SuperSmallStateMachineReferenceError {}
export const NodeTypes = {
	CD: 'condition', SW: 'switch', WH: 'while',
	MC: 'machine', SQ: 'sequence', FN: 'function',
	CH: 'changes', UN: 'undefined', EM: 'empty',
	DR: 'directive', RT: 'return', ID: 'interupt-directive', AD: 'absolute-directive', MD: 'machine-directive', SD: 'sequence-directive',
}
export const KeyWords = {
	IT: 'initial',
	IF: 'if', TN: 'then', EL: 'else',
	SW: 'switch', CS: 'case', DF: 'default',
	WH: 'while', DO: 'do',
}
export class NS extends Map {
	constructor(...nodes) { super(nodes.flat(Infinity).map(node => [node.type,node])) }
	typeof(object, objectType = typeof object, isAction = false) {
		const foundType = [...this.values()].findLast(current => current.typeof(object, objectType, isAction))
		return foundType ? foundType.type : false
	}
}
export class N {
	static type = Symbol('Unnamed node')
	static typeof = () => false;
	static execute = ident;
	static proceed (action, state) {
		const stack = state[S.Stack] || [[]]
		if (stack[0].length === 0) {
			if (stack.length === 1) return { ...state, [S.Return]: state[S.Return] }
			const { [S.Return]: interceptReturn, ...otherState } = state
			return { ...otherState, [S.Stack]: stack.slice(1) }
		}
		const parPath = stack[0].slice(0,-1)
		return S._proceed(this, { ...state, [S.Stack]: [parPath, ...stack.slice(1)] }, get_path_object(this.process, parPath), false, stack[0][parPath.length])
	};
	static perform(action, state) { return state }
	static traverse = ident;
}
export class Changes extends N {
	static type = NodeTypes.CH
	static typeof(object, objectType) { return Boolean(object && objectType === 'object') }
	static perform(action, state) { return S._changes(this, state, action) }
}
export class Sequence extends N {
	static type = NodeTypes.SQ
	static proceed(action, state, isAction, childItem) {
		if (action && childItem+1 < action.length) return { ...state, [S.Stack]: [[...state[S.Stack][0], childItem+1], ...state[S.Stack].slice(1)] }
		return N.proceed.call(this, action, state)
	}
	static typeof(object, objectType, isAction) { return ((!isAction) && objectType === 'object' && Array.isArray(object)) }
	static execute(node, state) { return node.length ? [ ...state[S.Stack][0], 0 ] : null }
	static traverse(node, path, iterate) { return node.map((_,i) => iterate([...path,i])) }
}
export class FunctionN extends N {
	static type = NodeTypes.FN
	static typeof(object, objectType, isAction) { return (!isAction) && objectType === 'function' }
	static execute(node, state) { return node(state) }
}
export class Undefined extends N {
	static type = NodeTypes.UN
	static typeof(object, objectType) { return objectType === 'undefined' }
	static execute(node, state) { throw new NodeReferenceError(`There is nothing to execute at path [ ${state[S.Stack][0].map(key => key.toString()).join(', ')} ]`, { instance: this, state, data: { node } }) }
}
export class Empty extends N {
	static type = NodeTypes.EM
	static typeof(object, objectType) { return object === null }
}
export class Condition extends N {
	static type = NodeTypes.CD
	static typeof(object, objectType, isAction) { return Boolean((!isAction) && object && objectType === 'object' && (KeyWords.IF in object)) }
	static execute(node, state) {
		if (normalise_function(node[KeyWords.IF])(state))
		return KeyWords.TN in node ? [ ...state[S.Stack][0], KeyWords.TN ] : null
		return KeyWords.EL in node ? [ ...state[S.Stack][0], KeyWords.EL ] : null
	}
	static traverse(node, path, iterate) { return {
		...node,
		...(KeyWords.TN in node ? { [KeyWords.TN]: iterate([...path,KeyWords.TN]) } : {}),
		...(KeyWords.EL in node ? { [KeyWords.EL]: iterate([...path,KeyWords.EL]) } : {})
	} }
}
export class Switch extends N {
	static type = NodeTypes.SW
	static typeof(object, objectType, isAction) { return Boolean((!isAction) && object && objectType === 'object' && (KeyWords.SW in object)) }
	static execute(node, state) {
		const key = normalise_function(node[KeyWords.SW])(state)
		const fallbackKey = (key in node[KeyWords.CS]) ? key : KeyWords.DF
		return (fallbackKey in node[KeyWords.CS]) ? [ ...state[S.Stack][0], KeyWords.CS, fallbackKey ] : null
	}
	static traverse(node, path, iterate) { return { ...node, [KeyWords.CS]: Object.fromEntries(Object.keys(node[KeyWords.CS]).map(key => [ key, iterate([...path,KeyWords.CS,key]) ])), } }
}
export class While extends N {
	static type = NodeTypes.WH
	static typeof(object, objectType, isAction) { return Boolean((!isAction) && object && objectType === 'object' && (KeyWords.WH in object)) }
	static execute(node, state) {
		if (!((KeyWords.DO in node) && normalise_function(node[KeyWords.WH])(state))) return null
		return [ ...state[S.Stack][0], KeyWords.DO ]
	}
	static proceed(action, state) { return state }
	static traverse(node, path, iterate) { return { ...node, ...(KeyWords.DO in node ? { [KeyWords.DO]: iterate([...path,KeyWords.DO]) } : {}), } }
}
export class Machine extends N {
	static type = NodeTypes.MC
	static typeof(object, objectType, isAction) { return Boolean((!isAction) && object && objectType === 'object' && (KeyWords.IT in object)) }
	static execute(node, state) { return [ ...state[S.Stack][0], KeyWords.IT ] }
	static traverse(node, path, iterate) { return { ...node, ...Object.fromEntries(Object.keys(node).map(key => [ key, iterate([...path,key]) ])) } }
}
export class Directive extends N {
	static type = NodeTypes.DR
	static typeof(object, objectType, isAction) { return Boolean(object && objectType === 'object' && (S.Goto in object)) }
	static perform(action, state) { return S._perform(this, state, action[S.Goto]) }
	static proceed(action, state) { return state }
}
export class SequenceDirective extends Directive {
	static type = NodeTypes.SD
	static typeof(object, objectType, isAction) { return objectType === 'number' }
	static perform(action, state) {
		const lastOf = S._closest(this, state[S.Stack][0].slice(0,-1), NodeTypes.SQ)
		if (!lastOf) throw new PathReferenceError(`A relative directive has been provided as a number (${String(action)}), but no sequence exists that this number could be an index of from path [ ${state[S.Stack][0].map(key => key.toString()).join(', ')} ].`, { instance: this, state, data: { action } })
		return { ...state, [S.Stack]: [ [...lastOf, action], ...state[S.Stack].slice(1) ] }
	}
}
export class MachineDirective extends Directive {
	static type = NodeTypes.MD
	static typeof(object, objectType, isAction) { return objectType === 'string' }
	static perform(action, state) {
		const lastOf = S._closest(this, state[S.Stack][0].slice(0,-1), NodeTypes.MC)
		if (!lastOf) throw new PathReferenceError(`A relative directive has been provided as a string (${String(action)}), but no state machine exists that this string could be a state of. From path [ ${state[S.Stack][0].map(key => key.toString()).join(', ')} ].`, { instance: this, state, data: { action } })
		return { ...state, [S.Stack]: [ [...lastOf, action], ...state[S.Stack].slice(1) ] }
	}
}
export class InteruptDirective extends Directive {
	static type = NodeTypes.ID
	static typeof(object, objectType, isAction) { return objectType === 'symbol' }
	static perform(action, state) {
		const lastOf = get_closest_path(this.process, state[S.Stack][0].slice(0,-1), i => this.config.nodes.typeof(i) === NodeTypes.MC && (action in i))
		if (!lastOf) return { ...state, [S.Return]: action }
		return { ...state, [S.Stack]: [ [...lastOf, action], ...state[S.Stack] ] }
	}
	static proceed(action, state) {
		const { [S.Stack]: stack, [S.Return]: interceptReturn, ...proceedPrevious } = S._proceed(this, { ...state, [S.Stack]: state[S.Stack].slice(1) }, undefined, true)
		return { ...proceedPrevious, [S.Stack]: [ state[S.Stack][0], ...stack ] }
	}
}
export class AbsoluteDirective extends Directive {
	static type = NodeTypes.AD
	static typeof(object, objectType, isAction) { return isAction && Array.isArray(object) }
	static perform(action, state) { return { ...state, [S.Stack]: [ action, ...state[S.Stack].slice(1) ] } }
}
export class Return extends Directive {
	static type = NodeTypes.RT
	static typeof(object, objectType) { return object === S.Return || Boolean(object && objectType === 'object' && (S.Return in object)) }
	static perform(action, state) { return { ...state, [S.Return]: !action || action === S.Return ? undefined : action[S.Return], } }
}
export class Interuptable extends Promise {
	#interuptor = () => {}
	#settled = false
	constructor(executorOrPromise, interuptor) {
		const settle = f => (...args) => {
			this.#settled = true
			f(...args)
		}
		if (typeof executorOrPromise === 'function') super((resolve, reject) => executorOrPromise(settle(resolve), settle(reject)))
		else super((resolve, reject) => { Promise.resolve(executorOrPromise).then(settle(resolve)).catch(settle(reject)) })
		this.#interuptor = interuptor
	}
	interupt(...interuptions) {
		if (this.#settled) throw new Error('A settled Interuptable cannot be interupted.')
		return this.#interuptor(...interuptions)
	}
}
export class ExtensibleFunction extends Function {
	constructor(f) { super(); return Object.setPrototypeOf(f, new.target.prototype); };
}
export class SuperSmallStateMachineCore extends ExtensibleFunction {
		static Return      = Symbol('Super Small State Machine Return')
		static Changes     = Symbol('Super Small State Machine Changes')
		static Goto        = Symbol('Super Small State Machine Goto')
		static Stack       = Symbol('Super Small State Machine Stack')
		static Trace       = Symbol('Super Small State Machine Trace')
		static StrictTypes = Symbol('Super Small State Machine Strict Types')
	static keyWords    = KeyWords
	static kw          = KeyWords
	static nodeTypes   = NodeTypes
	static types       = NodeTypes
	static nodes = [ Changes, Sequence, FunctionN, Undefined, Empty, Condition, Switch, While, Machine, Directive, InteruptDirective, AbsoluteDirective, MachineDirective, SequenceDirective, Return, ]
	static config = {
		defaults: {},
		input: (state = {}) => state,
		output:  state => state[S.Return],
		strict: false,
		iterations: 10000,
		until: state => S.Return in state,
		pause: () => false,
		async: false,
		trace: false,
		deep: false,
		override: null,
		nodes: new NS(...SuperSmallStateMachineCore.nodes),
		adapt: [],
		before: [],
		after: [],
	}
	static _closest (instance, path = [], ...nodeTypes) {
		const flatTypes = nodeTypes.flat(Infinity)
		return get_closest_path(instance.process, path, i => {
			const nodeType = instance.config.nodes.typeof(i)
			return Boolean(nodeType && flatTypes.includes(nodeType))
		})
	}
	static _changes (instance, state = {}, changes = {}) {
		if (instance.config.strict && Object.entries(changes).some(([property]) => !(property in state)))
			throw new StateReferenceError(`Only properties that exist on the initial context may be updated.\nYou changed [ ${Object.keys(changes).filter(property => !(property in state)).map(key => key.toString()).join(', ')} ], which ${Object.keys(changes).filter(property => !(property in state)).length === 1 ? 'is' : 'are'} not in: [ ${Object.keys(state).map(key => key.toString()).join(', ')} ].\nPath: [ ${state[S.Stack][0].map(key => key.toString()).join(' / ')} ]`, { instance, state, data: { changes } })
		if (instance.config.strict === this.StrictTypes && Object.entries(changes).some(([property,value]) => typeof value !== typeof state[property]))
			throw new StateTypeError(`Properties must have the same type as their initial value. ${Object.entries(changes).filter(([property,value]) => typeof value !== typeof state[property]).map(([property,value]) => `${typeof value} given for '${property}', should be ${typeof state[property]}`).join('. ')}.`, { instance, state, data: { changes } })
		const merge = instance.config.deep ? deep_merge_object : shallow_merge_object
		const allChanges = merge(state[S.Changes] || {}, changes)
		return {
			...state,
			...merge(state, allChanges),
			[S.Stack]: state[S.Stack],
			[S.Changes]: allChanges
		}
	}
	static _proceed (instance, state = {}, node = undefined, isAction = false, nodeIndex = undefined) {
		const nodeType = instance.config.nodes.typeof(node, typeof node, isAction)
		if (!nodeType) throw new NodeTypeError(`Unknown action type: ${typeof node}${nodeType ? `, nodeType: ${String(nodeType)}` : ''}`, { instance, state, data: { action: node } })
		return instance.config.nodes.get(nodeType).proceed.call(instance, node, state, isAction, nodeIndex)
	}
	static _perform (instance, state = {}, action = null) {
		const nodeType = instance.config.nodes.typeof(action, typeof action, true)
		if (!nodeType) throw new NodeTypeError(`Unknown action type: ${typeof action}${nodeType ? `, nodeType: ${String(nodeType)}` : ''}.`, { instance, state, data: { action } })
		return instance.config.nodes.get(nodeType).perform.call(instance, action, state)
	}
	static _execute (instance, state = {}, node = get_path_object(instance.process, state[S.Stack][0])) {
		const nodeType = instance.config.nodes.typeof(node)
		if (!nodeType) throw new NodeTypeError(`Unknown node type: ${typeof node}${nodeType ? `, nodeType: ${String(nodeType)}` : ''}.`, { instance, state, data: { node } })
		return instance.config.nodes.get(nodeType).execute.call(instance, node, state)
	}
	static _traverse(instance, iterator = ident) {
		const iterate = (path = []) => {
			const node = get_path_object(instance.process, path)
			const nodeType = instance.config.nodes.typeof(node)
			if (!nodeType) throw new NodeTypeError(`Unknown node type: ${typeof node}${nodeType ? `, nodeType: ${String(nodeType)}` : ''} at [ ${path.map(key => key.toString()).join(', ')} ]`, { instance, data: { node } })
			return iterator.call(instance, instance.config.nodes.get(nodeType).traverse.call(instance, node, path, iterate), path, instance.process, nodeType)
		}
		return iterate()
	}
	static _run (instance, ...input) {
		if (instance.config.async) return this._runAsync(instance, ...input)
		return this._runSync(instance, ...input)
	}
	static _runSync (instance, ...input) {
		const { until, iterations, input: adaptInput, output: adaptOutput, before, after, defaults, trace } = { ...this.config, ...instance.config }
		const modifiedInput = adaptInput.apply(instance, input) || {}
		let r = 0, currentState = { ...before.reduce((prev, modifier) => modifier.call(instance, prev), this._changes(instance, {
			[S.Changes]: {},
			...defaults,
			[S.Stack]: modifiedInput[S.Stack] || [[]], [S.Trace]: modifiedInput[S.Trace] || [],
			...(S.Return in modifiedInput ? {[S.Return]: modifiedInput[S.Return]} : {})
		}, modifiedInput)), [S.Changes]: {} }
		while (r < iterations) {
			if (until.call(instance, currentState, r)) break;
			if (++r >= iterations) throw new MaxIterationsError(`Maximum iterations of ${iterations} reached at path [ ${currentState[S.Stack][0].map(key => key.toString()).join(', ')} ]`, { instance, state: currentState, data: { iterations } })
			if (trace) currentState = { ...currentState, [S.Trace]: [ ...currentState[S.Trace], currentState[S.Stack] ] }
			const action = this._execute(instance, currentState)
			currentState = this._perform(instance, currentState, action)
			currentState = this._proceed(instance, currentState, action, true)
		}
		return adaptOutput.call(instance, after.reduce((prev, modifier) => modifier.call(instance, prev), currentState))
	}
	static _runAsync (instance, ...input) {
	let interuptionStack = []
	return new Interuptable((async () => {
		const { pause, until, iterations, input: adaptInput, output: adaptOutput, before, after, defaults, trace } = { ...this.config, ...instance.config }
		const modifiedInput = (await adaptInput.apply(instance, input)) || {}
		let r = 0, currentState = { ...before.reduce((prev, modifier) => modifier.call(instance, prev), this._changes(instance, {
			[S.Changes]: {},
			...defaults,
			[S.Stack]: modifiedInput[S.Stack] || [[]], [S.Trace]: modifiedInput[S.Trace] || [],
			...(S.Return in modifiedInput ? {[S.Return]: modifiedInput[S.Return]} : {})
		}, modifiedInput)), [S.Changes]: {} }
		while (r < iterations) {
			const pauseExecution = pause.call(instance, currentState, r)
			if (pauseExecution) await pauseExecution;
			if (until.call(instance, currentState, r)) break;
			if (++r >= iterations) throw new MaxIterationsError(`Maximum iterations of ${iterations} reached at path [ ${currentState[S.Stack][0].map(key => key.toString()).join(', ')} ]`, { instance, state: currentState, data: { iterations } })
			if (trace) currentState = { ...currentState, [S.Trace]: [ ...currentState[S.Trace], currentState[S.Stack] ] }
			if (interuptionStack.length) currentState = await this._perform(instance, currentState, interuptionStack.shift())
			else {
				const action = await this._execute(instance, currentState)
				currentState = await this._perform(instance, currentState, action)
				currentState = await this._proceed(instance, currentState, action, true)
			}
		}
		return adaptOutput.call(instance, after.reduce((prev, modifier) => modifier.call(instance, prev), currentState))
	})(), (...interuptions) => {
			if (interuptions.length === 1 && instance.config.nodes.typeof(interuptions[0]) === NodeTypes.ID)
				interuptionStack.push(interuptions[0])
			else {
				const interuption = Symbol("System Interuption")
				instance.process[interuption] = interuptions
				interuptionStack.push(interuption)
			}
		})
	}
}
export class SuperSmallStateMachineChain extends SuperSmallStateMachineCore {
	static closest(path, ...nodeTypes) { return instance => this._closest(instance, path, ...nodeTypes) }
	static changes(state, changes)     { return instance => this._changes(instance, state, changes) }
	static proceed(state, action)      { return instance => this._proceed(instance, state, action) }
	static perform(state, action)      { return instance => this._perform(instance, state, action) }
	static execute(state, node)        { return instance => this._execute(instance, state, node) }
	static traverse(iterator)          { return instance => this._traverse(instance, iterator) }
	static run(...input)               { return instance => this._run(instance, ...input) }
	static runSync(...input)           { return instance => this._runSync(instance, ...input) }
	static runAsync(...input)          { return instance => this._runAsync(instance, ...input) }
	static do(process = null)                    { return instance => ({ process: instance.config.adapt.reduce((prev, modifier) => modifier.call(instance, prev), process), config: instance.config }) }
	static defaults(defaults = S.config.defaults){ return instance => ({ process: instance.process, config: { ...instance.config, defaults }, }) }
	static input(input = S.config.input)         { return instance => ({ process: instance.process, config: { ...instance.config, input }, }) }
	static output(output = S.config.output)      { return instance => ({ process: instance.process, config: { ...instance.config, output }, }) }
	static untrace                                (instance) { return ({ process: instance.process, config: { ...instance.config, trace: false }, }) }
	static trace                                  (instance) { return ({ process: instance.process, config: { ...instance.config, trace: true }, }) }
	static shallow                                (instance) { return ({ process: instance.process, config: { ...instance.config, deep: false }, }) }
	static deep                                   (instance) { return ({ process: instance.process, config: { ...instance.config, deep: true }, }) }
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
	static addNode(...nodes)                     { return instance => ({ process: instance.process, config: { ...instance.config, nodes: new NS(...instance.config.nodes.values(),...nodes) }, }) }
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
	proceed(state, node, isAction)    { return S._proceed(this, state, node, isAction) }
	perform(state, action)  { return S._perform(this, state, action) }
	execute(state, node)    { return S._execute(this, state, node) }
	traverse(iterator)      { return S._traverse(this, iterator) }
	run     (...input)      { return S._run(this, ...input) }
	runSync (...input)      { return S._runSync(this, ...input) }
	runAsync(...input)      { return S._runAsync(this, ...input) }
	do(process)             { return this.with(S.do(process)) }
	defaults(defaults)      { return this.with(S.defaults(defaults)) }
	input(input)            { return this.with(S.input(input)) }
	output(output)          { return this.with(S.output(output)) }
	get untrace()           { return this.with(S.untrace) }
	get trace()             { return this.with(S.trace) }
	get shallow()           { return this.with(S.shallow) }
	get deep()              { return this.with(S.deep) }
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
export const NodeDefinition = N
export const NodeDefinitions = NS
