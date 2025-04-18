export const clone_object = (obj) => {
	if (Array.isArray(obj)) return obj.map(clone_object)
	if (obj === null) return null
	if (typeof obj !== 'object') return obj
	return { ...obj, ...Object.fromEntries(Object.entries(obj).concat(Symbols in obj ? obj[Symbols].map(key => [key,obj[key]]) : []).map(([key,value]) => [ key, clone_object(value) ])) }
}
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
export const normalise_function = (functOrReturn) => ((functOrReturn instanceof Function) || (typeof functOrReturn === 'function')) ? functOrReturn : () => functOrReturn
const reduce_deep_merge_object = (base, override) => {
if (!((base && typeof base === 'object') && !Array.isArray(base) && (override && typeof override === 'object') && !Array.isArray(override)))
	return override
const allKeys = [ ...new Set(Object.keys(base).concat(Symbols in base ? base[Symbols] : [], Object.keys(override), Symbols in override ? override[Symbols] : [])) ]
return { ...base, ...override, ...Object.fromEntries(allKeys.map(key => [ key, key in override ? deep_merge_object(base[key], override[key]) : base[key] ])) }
}
export const deep_merge_object = (base, ...overrides) => overrides.reduce(reduce_deep_merge_object, base)
export const shallow_merge_object = (...objects) => Object.assign({}, ...objects)
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
export const noop = () => {}
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
export const Stack       = Symbol('SSSM Stack')
export const Symbols     = Symbol('SSSM Symbols')
export const Trace       = Symbol('SSSM Trace')
export const StrictTypes = Symbol('SSSM Strict Types')
export class Nodes extends Map {
	constructor(...nodes) { super(nodes.flat(Infinity).map(node => [node.type,node])) }
	typeof(object, objectType = typeof object, isAction = false) {
		if (object instanceof Node) return object.constructor.type
		const foundType = [...this.values()].findLast(current => current.typeof(object, objectType, isAction))
		return foundType ? foundType.type : false
	}
	get keywords() { return [...this.values()].flatMap(({ keywords }) => keywords) }
}
export class Node {
	static type = Symbol('SSSM Unnamed')
	static typeof = () => false
	static keywords = []
	static execute = ident
	static proceed (node, state) {
		const stack = state[Stack] || [{path:[],origin:Return,point:0}]
		if (stack[0].point === 0 || (Return in state)) {
			if (stack.length === 1) return { ...state, [Return]: state[Return], [Stack]: [] }
			const { [Return]: interruptReturn, ...cleanState } = state
			return { ...cleanState, [Stack]: stack.slice(1), [stack[0].origin]: interruptReturn }
		}
		return S._proceed(this, { ...state, [Stack]: [{ ...stack[0], point: stack[0].point-1 }, ...stack.slice(1)] }, get_path_object(this.process, stack[0].path.slice(0,stack[0].point-1)))
	}
	static perform(action, state) { return state }
	static traverse = ident
	value = undefined
	constructor(node) { this.value = node }
}
export const ErrorN = Symbol('SSSM Error')
export class ErrorNode extends Node {
	static type = ErrorN
	static typeof = (object, objectType) => (objectType === 'object' && object instanceof Error) || (objectType === 'function' && (object === Error || object.prototype instanceof Error))
	static perform(action, state) {
		if (typeof action === 'function') throw new action()
		throw action
	}
}
export const Changes = Symbol('SSSM Changes')
export class ChangesNode extends Node {
	static type = Changes
	static typeof(object, objectType) { return Boolean(object && objectType === 'object') }
	static perform(action, state) { return S._changes(this, state, action) }
}
export const Sequence = Symbol('SSSM Sequence')
export class SequenceNode extends Node {
	static type = Sequence
	static proceed(node, state) {
		const index = state[Stack][0].path[state[Stack][0].point]
		if (node && (typeof index === 'number') && (index+1 < node.length))
			return { ...state, [Stack]: [{ ...state[Stack][0], path: [...state[Stack][0].path.slice(0,state[Stack][0].point), index+1], point: state[Stack][0].point + 1 }, ...state[Stack].slice(1)] }
		return Node.proceed.call(this, node, state)
	}
	static typeof(object, objectType, isAction) { return ((!isAction) && objectType === 'object' && Array.isArray(object)) }
	static execute(node, state) { return node.length ? [ ...state[Stack][0].path.slice(0,state[Stack][0].point), 0 ] : null }
	static traverse(node, path, iterate) { return node.map((_,i) => iterate([...path,i])) }
}
export const FunctionN = Symbol('SSSM Function')
export class FunctionNode extends Node {
	static type = FunctionN
	static typeof(object, objectType, isAction) { return (!isAction) && objectType === 'function' }
	static execute(node, state) { return node(state) }
}
export const Undefined = Symbol('SSSM Undefined')
export class UndefinedNode extends Node {
	static type = Undefined
	static typeof(object, objectType) { return objectType === 'undefined' }
	static execute(node, state) { throw new NodeReferenceError(`There is nothing to execute at path [ ${state[Stack][0].path.slice(0,state[Stack][0].point).map(key => key.toString()).join(', ')} ]`, { instance: this, state, data: { node } }) }
}
export const Empty = Symbol('SSSM Empty')
export class EmptyNode extends Node {
	static type = Empty
	static typeof(object, objectType) { return object === null }
}
export const Condition = Symbol('SSSM Condition')
export class ConditionNode extends Node {
	static type = Condition
	static typeof(object, objectType, isAction) { return Boolean((!isAction) && object && objectType === 'object' && ('if' in object)) }
	static keywords = ['if','then','else']
	static execute(node, state) {
		if (normalise_function(node.if)(state))
		return 'then' in node ? [ ...state[Stack][0].path.slice(0,state[Stack][0].point), 'then' ] : null
		return 'else' in node ? [ ...state[Stack][0].path.slice(0,state[Stack][0].point), 'else' ] : null
	}
	static traverse(node, path, iterate) { return {
		...node,
		...('then' in node ? { then: iterate([...path,'then']) } : {}),
		...('else' in node ? { else: iterate([...path,'else']) } : {}),
		...(Symbols in node ? Object.fromEntries(node[Symbols].map(key => [key, iterate([...path,key])])) : {}),
	} }
}
export const Switch = Symbol('SSSM Switch')
export class SwitchNode extends Node {
	static type = Switch
	static typeof(object, objectType, isAction) { return Boolean((!isAction) && object && objectType === 'object' && ('switch' in object)) }
	static keywords = ['switch','case','default']
	static execute(node, state) {
		const key = normalise_function(node.switch)(state)
		const fallbackKey = (key in node.case) ? key : 'default'
		return (fallbackKey in node.case) ? [ ...state[Stack][0].path.slice(0,state[Stack][0].point), 'case', fallbackKey ] : null
	}
	static traverse(node, path, iterate) { return { ...node, case: Object.fromEntries(Object.keys(node.case).map(key => [ key, iterate([...path,'case',key]) ])), ...(Symbols in node ? Object.fromEntries(node[Symbols].map(key => [key, iterate([...path,key])])) : {}) } }
}
export const While = Symbol('SSSM While')
export class WhileNode extends Node {
	static type = While
	static typeof(object, objectType, isAction) { return Boolean((!isAction) && object && objectType === 'object' && ('while' in object)) }
	static keywords = ['while','do']
	static execute(node, state) {
			if (!(('do' in node) && normalise_function(node.while)(state))) return null
			return [ ...state[Stack][0].path.slice(0,state[Stack][0].point), 'do' ]
	}
	static proceed(node, state) { return { ...state, [Stack]: [ { ...state[Stack][0], path: state[Stack][0].path.slice(0,state[Stack][0].point) }, ...state[Stack].slice(1) ] } }
	static traverse(node, path, iterate) { return { ...node, ...('do' in node ? { do: iterate([ ...path, 'do' ]) } : {}), ...(Symbols in node ? Object.fromEntries(node[Symbols].map(key => [key, iterate([...path,key])])) : {}), } }
}
export const Machine = Symbol('SSSM Machine')
export class MachineNode extends Node {
	static type = Machine
	static typeof(object, objectType, isAction) { return Boolean((!isAction) && object && objectType === 'object' && ('initial' in object)) }
	static keywords = ['initial']
	static execute(node, state) { return [ ...state[Stack][0].path.slice(0,state[Stack][0].point), 'initial' ] }
	static traverse(node, path, iterate) { return { ...node, ...Object.fromEntries(Object.keys(node).concat(Symbols in node ? node[Symbols]: []).map(key => [ key, iterate([...path,key]) ])) } }
}
export const Goto = Symbol('SSSM Goto')
export class GotoNode extends Node {
	static type = Goto
	static typeof(object, objectType, isAction) { return Boolean(object && objectType === 'object' && (Goto in object)) }
	static perform(action, state) { return S._perform(this, state, action[Goto]) }
	static proceed(node, state) { return state }
}
export const SequenceGoto = Symbol('SSSM Sequence Goto')
export class SequenceGotoNode extends GotoNode {
	static type = SequenceGoto
	static typeof(object, objectType, isAction) { return objectType === 'number' }
	static perform(action, state) {
		const lastOf = S._closest(this, state[Stack][0].path.slice(0,state[Stack][0].point-1), SequenceNode.type)
		if (!lastOf) throw new PathReferenceError(`A relative goto has been provided as a number (${String(action)}), but no sequence exists that this number could be an index of from path [ ${state[Stack][0].path.slice(0,state[Stack][0].point).map(key => key.toString()).join(', ')} ].`, { instance: this, state, data: { action } })
		return { ...state, [Stack]: [ { ...state[Stack][0], path: [...lastOf, action], point: lastOf.length + 1 }, ...state[Stack].slice(1) ] }
	}
}
export const MachineGoto = Symbol('SSSM Machine Goto')
export class MachineGotoNode extends GotoNode {
	static type = MachineGoto
	static typeof(object, objectType, isAction) { return objectType === 'string' }
	static perform(action, state) {
		const lastOf = S._closest(this, state[Stack][0].path.slice(0,state[Stack][0].point-1), MachineNode.type)
		if (!lastOf) throw new PathReferenceError(`A relative goto has been provided as a string (${String(action)}), but no state machine exists that this string could be a state of. From path [ ${state[Stack][0].path.slice(0,state[Stack][0].point).map(key => key.toString()).join(', ')} ].`, { instance: this, state, data: { action } })
		return { ...state, [Stack]: [ { ...state[Stack][0], path: [...lastOf, action], point: lastOf.length + 1 }, ...state[Stack].slice(1) ] }
	}
}
export const InterruptGoto = Symbol('SSSM Interrupt Goto')
export class InterruptGotoNode extends GotoNode {
	static type = InterruptGoto
	static typeof(object, objectType, isAction) { return objectType === 'symbol' }
	static perform(action, state) {
		const lastOf = get_closest_path(this.process, state[Stack][state[Stack].length-1].path.slice(0,state[Stack][state[Stack].length-1].point-1), parentNode => Boolean(parentNode && (typeof parentNode === 'object') && (action in parentNode)))
		if (!lastOf) return { ...state, [Return]: action }
		return { ...state, [Stack]: [ { origin: action, path: [...lastOf, action], point: lastOf.length + 1 }, ...state[Stack] ] }
	}
	static proceed(node, state) {
		const { [Stack]: stack, [Return]: interruptReturn, ...proceedPrevious } = S._proceed(this, { ...state, [Stack]: state[Stack].slice(1) }, undefined)
		return { ...proceedPrevious, [Stack]: [ state[Stack][0], ...stack ] }
	}
}
export const AbsoluteGoto = Symbol('SSSM Absolute Goto')
export class AbsoluteGotoNode extends GotoNode {
	static type = AbsoluteGoto
	static typeof(object, objectType, isAction) { return isAction && Array.isArray(object) }
	static perform(action, state) { return { ...state, [Stack]: [ { ...state[Stack][0], path: action, point: action.length }, ...state[Stack].slice(1) ] } }
}
export const Return = Symbol('SSSM Return')
export class ReturnNode extends GotoNode {
	static type = Return
	static typeof(object, objectType) { return object === Return || Boolean(object && objectType === 'object' && (Return in object)) }
	static perform(action, state) { return { ...state, [Return]: !action || action === Return ? undefined : action[Return], } }
	static proceed = Node.proceed
}
export const Continue = Symbol('SSSM Continue')
export class ContinueNode extends GotoNode {
	static type = Continue
	static typeof(object, objectType) { return object === Continue }
	static perform(action, state) {
		const lastOf = S._closest(this, state[Stack][0].path.slice(0,state[Stack][0].point-1), WhileNode.type)
		if (!lastOf) throw new PathReferenceError(`A Continue has been used, but no While exists that this Continue could refer to. From path [ ${state[Stack][0].path.slice(0,state[Stack][0].point).map(key => key.toString()).join(', ')} ].`, { instance: this, state, data: { action } })
		return { ...state, [Stack]: [ { ...state[Stack][0], path: lastOf, point: lastOf.length }, ...state[Stack].slice(1) ] }
	}
}
export const Break = Symbol('SSSM Break')
export class BreakNode extends GotoNode {
	static type = Break
	static typeof(object, objectType, isAction) { return object === Break }
	static proceed (node, state) {
		const lastOf = S._closest(this, state[Stack][0].path.slice(0,state[Stack][0].point-1), WhileNode.type)
		if (!lastOf) throw new PathReferenceError(`A Break has been used, but no While exists that this Break could refer to. From path [ ${state[Stack][0].path.slice(0,state[Stack][0].point).map(key => key.toString()).join(', ')} ].`, { instance: this, state, data: { node } })
		return S._proceed(this, { ...state, [Stack]: [{ ...state[Stack][0], point: lastOf.length-1 }, ...state[Stack].slice(1)] }, get_path_object(this.process, lastOf.slice(0,-1)))
	}
	static perform = Node.perform
}
export class ExtensibleFunction extends Function {
	constructor(f) { super(); return Object.setPrototypeOf(f, new.target.prototype) }
}
export class SuperSmallStateMachineCore extends ExtensibleFunction {
	static config = {
		defaults: {},
		input: (state = {}) => state,
		output:  state => state[Return],
		strict: false,
		iterations: 10000,
		until: state => Return in state,
		trace: false,
		deep: false,
		override: null,
		nodes: new Nodes(ChangesNode, SequenceNode, FunctionNode, ConditionNode, SwitchNode, WhileNode, MachineNode, GotoNode, InterruptGotoNode, AbsoluteGotoNode, MachineGotoNode, SequenceGotoNode, ErrorNode, UndefinedNode, EmptyNode, ContinueNode, BreakNode, ReturnNode),
		adapt: [],
		before: [],
		after: [],
	}
	static _closest (instance, path = [], ...nodeTypes) {
		const flatTypes = nodeTypes.flat(Infinity)
		return get_closest_path(instance.process, path, node => {
			const nodeType = instance.config.nodes.typeof(node)
			return Boolean(nodeType && flatTypes.includes(nodeType))
		})
	}
	static _changes (instance, state = {}, changes = {}) {
		if (instance.config.strict && Object.entries(changes).some(([property]) => !(property in state)))
			throw new StateReferenceError(`Only properties that exist on the initial context may be updated.\nYou changed [ ${Object.keys(changes).filter(property => !(property in state)).map(key => key.toString()).join(', ')} ], which ${Object.keys(changes).filter(property => !(property in state)).length === 1 ? 'is' : 'are'} not in: [ ${Object.keys(state).map(key => key.toString()).join(', ')} ].\nPath: [ ${state[Stack][0].path.slice(0,state[Stack][0].point).map(key => key.toString()).join(' / ')} ]`, { instance, state, data: { changes } })
		if (instance.config.strict === StrictTypes && Object.entries(changes).some(([property,value]) => typeof value !== typeof state[property]))
			throw new StateTypeError(`Properties must have the same type as their initial value. ${Object.entries(changes).filter(([property,value]) => typeof value !== typeof state[property]).map(([property,value]) => `${typeof value} given for '${property}', should be ${typeof state[property]}`).join('. ')}.`, { instance, state, data: { changes } })
		const merge = instance.config.deep ? deep_merge_object : shallow_merge_object
		const allChanges = merge(state[Changes] || {}, changes)
		return { ...merge(state, allChanges), [Changes]: allChanges }
	}
	static _proceed (instance, state = {}, node = undefined) {
		const nodeType = instance.config.nodes.typeof(node, typeof node, state[Stack][0].point === state[Stack][0].path.length)
		if (!nodeType) throw new NodeTypeError(`Unknown action type: ${typeof node}${nodeType ? `, nodeType: ${String(nodeType)}` : ''}`, { instance, state, data: { node } })
		return instance.config.nodes.get(nodeType).proceed.call(instance, node instanceof Node ? node.value : node, state)
	}
	static _perform (instance, state = {}, action = undefined) {
		const nodeType = instance.config.nodes.typeof(action, typeof action, true)
		if (!nodeType) throw new NodeTypeError(`Unknown action type: ${typeof action}${nodeType ? `, nodeType: ${String(nodeType)}` : ''}.`, { instance, state, data: { action } })
		return instance.config.nodes.get(nodeType).perform.call(instance, action instanceof Node ? action.value : action, state)
	}
	static _execute (instance, state = {}, node = get_path_object(instance.process, state[Stack][0].path.slice(0,state[Stack][0].point))) {
		const nodeType = instance.config.nodes.typeof(node)
		if (!nodeType) throw new NodeTypeError(`Unknown node type: ${typeof node}${nodeType ? `, nodeType: ${String(nodeType)}` : ''}.`, { instance, state, data: { node } })
		return instance.config.nodes.get(nodeType).execute.call(instance, node instanceof Node ? node.value : node, state)
	}
	static _traverse(instance, iterator = ident) {
		const iterate = (path = []) => {
			const node = get_path_object(instance.process, path)
			const nodeType = instance.config.nodes.typeof(node)
			if (!nodeType) throw new NodeTypeError(`Unknown node type: ${typeof node}${nodeType ? `, nodeType: ${String(nodeType)}` : ''} at [ ${path.map(key => key.toString()).join(', ')} ]`, { instance, data: { node } })
			return iterator.call(instance, instance.config.nodes.get(nodeType).traverse.call(instance, node instanceof Node ? node.value : node, path, iterate), path, instance.process, nodeType)
		}
		return iterate()
	}
	static _run (instance, ...input) {
		const { until, iterations, input: adaptInput, output: adaptOutput, before, after, defaults, trace } = { ...this.config, ...instance.config }
		const modifiedInput = adaptInput.apply(instance, input) || {}
		let r = 0, currentState = { ...before.reduce((prev, modifier) => modifier.call(instance, prev), this._changes(instance, {
			[Changes]: {},
			...defaults,
			[Stack]: modifiedInput[Stack] || [{path:[],origin:Return,point:0}], [Trace]: modifiedInput[Trace] || [],
			...(Return in modifiedInput ? {[Return]: modifiedInput[Return]} : {})
		}, modifiedInput)), [Changes]: modifiedInput[Changes] || {} }
		while (r < iterations) {
				if (until.call(instance, currentState, r)) break
			if (++r >= iterations) throw new MaxIterationsError(`Maximum iterations of ${iterations} reached at path [ ${currentState[Stack][0].path.slice(0,currentState[Stack][0].point).map(key => key.toString()).join(', ')} ]`, { instance, state: currentState, data: { iterations } })
			if (trace) currentState = { ...currentState, [Trace]: [ ...currentState[Trace], currentState[Stack] ] }
			const action = this._execute(instance, currentState)
			currentState = this._perform(instance, currentState, action)
			currentState = this._proceed(instance, currentState, action)
		}
		return adaptOutput.call(instance, after.reduce((prev, modifier) => modifier.call(instance, prev), currentState))
	}
}
export class SuperSmallStateMachineChain extends SuperSmallStateMachineCore {
	static closest(path, ...nodeTypes) { return instance => this._closest(instance, path, ...nodeTypes) }
	static changes(state, changes)     { return instance => this._changes(instance, state, changes) }
	static proceed(state, node)        { return instance => this._proceed(instance, state, node) }
	static perform(state, action)      { return instance => this._perform(instance, state, action) }
	static execute(state, node)        { return instance => this._execute(instance, state, node) }
	static traverse(iterator)          { return instance => this._traverse(instance, iterator) }
	static run(...input)               { return instance => this._run(instance, ...input) }
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
	static strictTypes                            (instance) { return ({ process: instance.process, config: { ...instance.config, strict: StrictTypes }, }) }
	static for(iterations = S.config.iterations) { return instance => ({ process: instance.process, config: { ...instance.config, iterations }, }) }
	static until(until = S.config.until)         { return instance => ({ process: instance.process, config: { ...instance.config, until }, }) }
	static forever                                (instance) { return ({ process: instance.process, config: { ...instance.config, iterations: Infinity }, }) }
	static override(override = S.config.override){ return instance => ({ process: instance.process, config: { ...instance.config, override } }) }
	static addNode(...nodes)                     { return instance => ({ process: instance.process, config: { ...instance.config, nodes: new Nodes(...instance.config.nodes.values(),...nodes) }, }) }
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
	proceed(state, node)    { return S._proceed(this, state, node) }
	perform(state, action)  { return S._perform(this, state, action) }
	execute(state, node)    { return S._execute(this, state, node) }
	traverse(iterator)      { return S._traverse(this, iterator) }
	run     (...input)      { return S._run(this, ...input) }
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
	override(override)      { return this.with(S.override(override)) }
	addNode(...nodes)       { return this.with(S.addNode(...nodes)) }
	adapt(...adapters)      { return this.with(S.adapt(...adapters)) }
	before(...adapters)     { return this.with(S.before(...adapters)) }
	after(...adapters)      { return this.with(S.after(...adapters)) }
	with(...transformers)   { return S.with(...transformers)(this) }
}
export const StateMachine = S
export const SuperSmallStateMachine = S
export const NodeDefinition = Node
export const NodeDefinitions = Nodes
