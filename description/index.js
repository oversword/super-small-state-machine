import D, { E, JS } from './d.js'
import S, { clone_object, unique_list_strings } from '../index.js'
import * as testModule from '../index.js'
import describedPlugin, { a, c, t } from '../plugin/described.js'
import eventsPlugin, { emit } from '../plugin/events.js'
import parallelPlugin, { parallel } from '../plugin/parallel.js'

const symbols = {
	'S.Path': S.Path,
	'S.Changes': S.Changes,
	'S.Return': S.Return,
	'S.StrictTypes': S.StrictTypes,
}

const description = D('Super Small State Machine',
D('Language',
	'A process is made of nodes',
	'Nodes are executables or actions',
	'Actions are performed on the state',
	'It then proceeds to the next node',
),
D('Library Methods',
	D('clone_object (obj)',
		JS("export const clone_object = (obj) => {"),
		D('Is exported', E.exports('clone_object', testModule, './index.js')),
		D('Deep clones objects.', E.equals(() => {
			const obj = {a:{b:3},c:5}
			const clone = clone_object(obj)
			return clone !== obj
				&& JSON.stringify(clone) === JSON.stringify(obj)
				&& clone.a !== obj.a
				&& clone.c === obj.c
		}, true)),
		D('Can clone arrays',
			E.equals(() => {
				const obj = [{a:{b:3},c:5},2,3,{d:6}]
				const clone = clone_object(obj)
				return clone !== obj
					&& clone[0] !== obj[0]
					&& clone[1] === obj[1]
					&& clone[3] !== obj[3]
					&& JSON.stringify(clone) === JSON.stringify(obj)
			}, true),
			JS("if (Array.isArray(obj)) return obj.map(clone_object)")
		),
		D('Returns null if given null',
			E.equals(() => {
				return clone_object(null)
			}, null),
			JS("if (obj === null) return null")
		),
		D('Returns input if not object',
			E.equals(() => {
				return clone_object('hello')
			}, 'hello'),
			JS("if (typeof obj !== 'object') return obj")
		),
		D('Deep clones properties of an object',
			E.equals(() => {
				const obj = {a:{b:3}}
				const clone = clone_object(obj)
				return clone !== obj
					&& JSON.stringify(clone) === JSON.stringify(obj)
					&& clone.a !== obj.a
					&& clone.a.b === obj.a.b
			}, true),
			JS("return Object.fromEntries(Object.entries(obj).map(([key,value]) => [ key, clone_object(value) ]));")
		),
		JS("}")
	),
	D('unique_list_strings (list, getId)',
		D('Takes a list of strings and returns a list containing the unique strings only',
			E.equals(() => {
				return unique_list_strings(['a','a','b','c','d','c','a','b'])
			}, ['a','b','c','d'])
		),
		D('Takes a transformer function that can extract a string identifier from objects',
			E.equals(() => {
				const objA = {
					id: 'a',
					val: 1,
				}
				const objB = {
					id: 'b',
					val: 2,
				}
				return unique_list_strings([ objA, objA, objB, objA, objB, objB ],
					obj => obj.id
				)
			}, [{ id: 'a', val: 1, }, { id: 'b', val: 2, }]),
			D('Always preserves objects without copyng them',
				E.is(() => {
					const objA = {
						id: 'a',
						val: 1,
					}
					const objB = {
						id: 'b',
						val: 2,
					}
					const result = unique_list_strings([ objA, objA, objB, objA, objB, objB ],
						obj => obj.id
					)
					return result[0] === objA && result[1] === objB
				}, true)
			),
		),
		JS("export const unique_list_strings = (list, getId = item => item) => Object.values(Object.fromEntries(list.map(item=>[getId(item),item])));")
	),
	D('reduce_get_path_object (obj, step)',
		E.notExports('reduce_get_path_object', testModule, './index.js'),
		JS("const reduce_get_path_object = (obj, step) => obj ? obj[step] : undefined")
	),
	D('get_path_object (object, path)',
		E.exports('get_path_object', testModule, './index.js'),
		JS("export const get_path_object = (object, path) => (path.reduce(reduce_get_path_object, object))")
	),
	D('normalise_function (functOrReturn)',
		E.exports('normalise_function', testModule, './index.js'),
		JS("export const normalise_function = (functOrReturn) => (typeof functOrReturn === 'function') ? functOrReturn : () => functOrReturn")
	),
	D('reduce_deep_merge_object (base, override)',
		E.notExports('reduce_deep_merge_object', testModule, './index.js'),
		JS("const reduce_deep_merge_object = (base, override) => {"),
		D('',
			JS("if (!((base && typeof base === 'object') && !Array.isArray(base) && (override && typeof override === 'object') && !Array.isArray(override))) return override;")
		),
		D('',
			JS("const allKeys = unique_list_strings(Object.keys(base).concat(Object.keys(override)));")
		),
		D('',
			JS("return Object.fromEntries(allKeys.map(key => [ key, key in override ? deep_merge_object(base[key], override[key]) : base[key] ]));")
		),
		JS("}")
	),
	D('deep_merge_object (base, ...overrides)',
		E.exports('deep_merge_object', testModule, './index.js'),
		JS("export const deep_merge_object = (base, ...overrides) => overrides.reduce(reduce_deep_merge_object, base)")
	),
	D('get_closest_object (object, path = [], condition = () => true)',
		E.exports('get_closest_object', testModule, './index.js'),
		JS("export const get_closest_object = (object, path = [], condition = () => true) => {"),
		D('',
			JS("const item = get_path_object(object, path)")
		),
		D('',
			JS("if (condition(item, path, object)) return path")
		),
		D('',
			JS("if (path.length === 0) return null")
		),
		D('',
			JS("return get_closest_object(object, path.slice(0,-1), condition)")
		),
		JS('}')
	),
	D('wait_time (delay)',
		E.exports('wait_time', testModule, './index.js'),
		JS("export const wait_time = delay => (delay ? new Promise(resolve => setTimeout(resolve, delay)) : Promise.resolve())")
	),
),
D('Errors',
	D('SuperSmallStateMachineError',
		E.exports('SuperSmallStateMachineError', testModule, './index.js'),
		JS("export class SuperSmallStateMachineError extends Error {"),
		D('',
			JS("instance; state; data; path;")
		),
		D('',
			JS("constructor(message, { instance, state, data, path } = {}) {"),
			D('',
				JS("super(message)"),
			),
			D('',
				JS("Object.assign(this, { instance, state, data, path })")
			),
			JS("}")
		),
		JS("}")
	),
	D('SuperSmallStateMachineReferenceError',
		E.exports('SuperSmallStateMachineReferenceError', testModule, './index.js'),
		JS("export class SuperSmallStateMachineReferenceError extends SuperSmallStateMachineError {}")
	),
	D('SuperSmallStateMachineTypeError',
		E.exports('SuperSmallStateMachineTypeError', testModule, './index.js'),
		JS("export class SuperSmallStateMachineTypeError extends SuperSmallStateMachineError {}")
	),
	D('ContextReferenceError',
		E.exports('ContextReferenceError', testModule, './index.js'),
		JS("export class ContextReferenceError extends SuperSmallStateMachineReferenceError {}")
	),
	D('ContextTypeError',
		E.exports('ContextTypeError', testModule, './index.js'),
		JS("export class ContextTypeError extends SuperSmallStateMachineTypeError {}")
	),
	D('NodeTypeError',
		E.exports('NodeTypeError', testModule, './index.js'),
		JS("export class NodeTypeError extends SuperSmallStateMachineTypeError {}")
	),
	D('UndefinedNodeError',
		E.exports('UndefinedNodeError', testModule, './index.js'),
		JS("export class UndefinedNodeError extends SuperSmallStateMachineReferenceError {}")
	),
	D('MaxIterationsError',
		E.exports('MaxIterationsError', testModule, './index.js'),
		JS("export class MaxIterationsError extends SuperSmallStateMachineError {}")
	),
	D('PathReferenceError',
		E.exports('PathReferenceError', testModule, './index.js'),
		JS("export class PathReferenceError extends SuperSmallStateMachineReferenceError {}")
	),
),
D('Node Types',
	E.exports('NodeTypes', testModule, './index.js'),
	JS("export const NodeTypes = {"),
	D('',
		JS("UN: 'undefined',")
	),
	D('',
		JS("EM: 'empty',")
	),
	D('',
		JS("RT: 'return',")
	),
	D('',
		JS("FN: 'function',")
	),
	D('',
		JS("SQ: 'sequence',")
	),
	D('',
		JS("CD: 'condition',")
	),
	D('',
		JS("SW: 'switch',")
	),
	D('',
		JS("MC: 'machine',")
	),
	D('',
		JS("CH: 'changes',")
	),
	D('',
		JS("DR: 'directive',")
	),
	D('',
		JS("AD: 'absolute-directive',")
	),
	D('',
		JS("MD: 'machine-directive',")
	),
	D('',
		JS("SD: 'sequence-directive',")
	),
	JS("}")
),
D('Key Words',
	E.exports('KeyWords', testModule, './index.js'),
	JS("export const KeyWords = {"),
	D('',
		JS("IF: 'if',")
	),
	D('',
		JS("TN: 'then',")
	),
	D('',
		JS("EL: 'else',")
	),
	D('',
		JS("SW: 'switch',")
	),
	D('',
		JS("CS: 'case',")
	),
	D('',
		JS("DF: 'default',")
	),
	D('',
		JS("IT: 'initial',")
	),
	D('',
		JS("RS: 'result',")
	),
	JS("}")
),
D('Node Definitions',
	E.exports('NodeDefinitions', testModule, './index.js'),
	JS("export class NodeDefinitions extends Map {"),
	D('',
		JS("constructor(...nodes) { super(nodes.flat(Infinity).map(node => [node.name,node])) }")
	),
	D('',
		JS("typeof(object, objectType = typeof object, isOutput = false) {"),
		D('',
			JS("const foundType = [...this.values()].findLast(current => current.typeof && current.typeof(object, objectType, isOutput))")
		),
		D('',
			JS("return foundType ? foundType.name : false")
		),
		JS("}")
	),
	JS("}")
),
D('Node Definition',
	E.exports('NodeDefinition', testModule, './index.js'),
	JS("export class NodeDefinition {"),
	D('',
		JS("static name = Symbol('Unnamed node')"),
	),
	D('',
		JS("static typeof = null;"),
	),
	D('',
		JS("static execute = null;"),
	),
	D('',
		JS("static proceed = null;"),
	),
	D('',
		JS("static perform = null;"),
	),
	D('',
		JS("static traverse = null;"),
	),
	JS("}"),
	JS("export const N = NodeDefinition")
),
D('exitFindNext (action, state)',
	'TODO: merge into S._proceed? or S._perform?',
	JS("const exitFindNext = function (action, state) {"),
	D('',
		JS("const path = S._proceed(this, state)"),
	),
	D('',
		JS("return path ? { ...state, [S.Path]: path } : { ...state, [S.Return]: true }"),
	),
	JS("}")
),

D('Default Nodes',
	D('Changes Node',
		'Updates the state by deep-merging the values. Arrays will not be deep merged.',
		E.is(() => {
			const instance = new S({ result: 'overridden' })
			return instance({ result: 'start' })
		}, 'overridden'),

		E.equals(() => {
			const instance = new S({ result: { newValue: true } })
			return instance({ result: { existingValue: true } })
		}, {
			existingValue: true,
			newValue: true
		}),
		E.exports('ChangesNode', testModule, './index.js'),
		JS("export class ChangesNode extends NodeDefinition {"),
		D('',
			JS("static name = NodeTypes.CH")
		),
		D('',
			JS("static typeof(object, objectType) { return Boolean(object && objectType === 'object') }")
		),
		D('',
			JS("static perform(action, state) { return exitFindNext.call(this, action, S._changes(this, state, action)) }")
		),
		JS("}")
	),
	D('Sequence Node',
		'Sequences are lists of nodes and executables, they will visit each node in order and exit when done.',
		E.is(() => {
			const instance = new S([
				({ result }) => ({ result: result + ' addition1' }),
				({ result }) => ({ result: result + ' addition2' }),
			])
			return instance({ result: 'start' })
		}, 'start addition1 addition2'),
		E.exports('SequenceNode', testModule, './index.js'),
		JS("export class SequenceNode extends NodeDefinition {"),
		D('',
			JS("static name = NodeTypes.SQ")
		),
		D('',
			JS("static proceed(parPath, state, path) {"),
			D('',
				JS("const parActs = get_path_object(this.process, parPath)"),
			),
			D('',
				JS("const childItem = path[parPath.length]"),
			),
			D('',
				JS("if (parActs && childItem+1 < parActs.length) return [ ...parPath, childItem+1 ]"),
			),
			JS("}")
		),
		D('',
			JS("static typeof(object, objectType, isOutput) { return ((!isOutput) && objectType === 'object' && Array.isArray(object)) }")
		),
		D('',
			JS("static execute(node, state) { return node.length ? [ ...state[S.Path], 0 ] : null }")
		),
		D('',
			JS("static traverse(item, path, iterate, post) { return item.map((_,i) => iterate([...path,i])) }")
		),
		JS("}")
	),
	D('Function Node',
		'The only argument to the function will be the state.',
		'You can return any of the previously mentioned action types from a function, or return nothing at all for a set-and-forget action.',
		E.is(() => {
			const instance = new S(({ result }) => ({ result: result + ' addition' }))
			return instance({ result: 'start' })
		}, 'start addition'),
		E.is(() => {
			const instance = new S([
				{ result: 'first' },
				() => 4,
				{ result: 'skipped' },
				S.Return,
				{ result: 'second' },
			])
			return instance({ result: 'start' })
		}, 'second'),
		E.is(() => {
			const instance = new S(() => ({ [S.Return]: 'changed' }))
			return instance({ result: 'start' })
		}, 'changed'),
		E.is(() => {
			const instance = new S(() => {
				// Arbitrary code
			})
			return instance({ result: 'start' })
		}, 'start'),
		E.exports('FunctionNode', testModule, './index.js'),
		JS("export class FunctionNode extends NodeDefinition {"),
		D('',
			JS("static name = NodeTypes.FN")
		),
		D('',
			JS("static typeof(object, objectType, isOutput) { return (!isOutput) && objectType === 'function' }")
		),
		D('',
			JS("static execute(node, state) { return node(state) }")
		),
		JS("}")
	),
	D('Undefined Node',
		E.exports('UndefinedNode', testModule, './index.js'),
		JS("export class UndefinedNode extends NodeDefinition {"),
		D('',
			JS("static name = NodeTypes.UN")
		),
		D('',
			JS("static typeof(object, objectType) { return objectType === 'undefined' }")
		),
		D('',
			JS("static execute(node, state) { throw new UndefinedNodeError(`There is nothing to execute at path [ ${state[S.Path].map(key => key.toString()).join(', ')} ]`, { instance: this, state, path: state[S.Path], data: { node } }) }")
		),
		D('',
			JS("static perform = exitFindNext")
		),
		JS("}")
	),
	D('Empty Node',
		E.exports('EmptyNode', testModule, './index.js'),
		JS("export class EmptyNode extends NodeDefinition {"),
		D('',
			JS("static name = NodeTypes.EM")
		),
		D('',
			JS("static typeof(object, objectType) { return object === null }")
		),
		D('',
			JS("static perform = exitFindNext")
		),
		JS("}")
	),
	D('Condition Node',
		E.is(() => {
			const instance = new S({
				if: ({ result }) => result === 'start',
				then: { result: 'truthy' },
				else: { result: 'falsey' },
			})
			return instance({ result: 'start' })
		}, 'truthy'),
		E.is(() => {
			const instance = new S({
				if: ({ result }) => result === 'start',
				then: { result: 'truthy' },
				else: { result: 'falsey' },
			})
			return instance({ result: 'other' })
		}, 'falsey'),
		E.exports('ConditionNode', testModule, './index.js'),
		JS("export class ConditionNode extends NodeDefinition {"),
		D('',
			JS("static name = NodeTypes.CD")
		),
		D('',
			JS("static typeof(object, objectType, isOutput) { return Boolean((!isOutput) && object && objectType === 'object' && (KeyWords.IF in object)) }")
		),
		D('',
			JS("static execute(node, state) {"),
				JS("if (normalise_function(node[KeyWords.IF])(state))"),
				JS("return KeyWords.TN in node ? [ ...state[S.Path], KeyWords.TN ] : null"),
				JS("return KeyWords.EL in node ? [ ...state[S.Path], KeyWords.EL ] : null"),
			JS("}")
		),
		D('',
			JS("static traverse(item, path, iterate, post) { return post({"),
				JS("...item,"),
				JS("[KeyWords.IF]: item[KeyWords.IF],"),
				JS("...(KeyWords.TN in item ? { [KeyWords.TN]: iterate([...path,KeyWords.TN]) } : {}),"),
				JS("...(KeyWords.EL in item ? { [KeyWords.EL]: iterate([...path,KeyWords.EL]) } : {})"),
			JS("}, path) }")
		),
		JS("}")
	),
	D('Switch Node',
		E.equals(() => {
			const instance = new S({
				switch: ({ result }) => result,
				case: {
					start: { result: 'first' },
					two: { result: 'second' },
					default: { result: 'none' },
				}
			})
			const result1 = instance({ result: 'start' })
			const result2 = instance({ result: 'two' })
			const result3 = instance({ result: 'other' })
			return { result1, result2, result3 }
		}, {
			result1: 'first',
			result2: 'second',
			result3: 'none'
		}),
		E.exports('SwitchNode', testModule, './index.js'),
		JS("export class SwitchNode extends NodeDefinition {"),
		D('',
			JS("static name = NodeTypes.SW")
		),
		D('',
			JS("static typeof(object, objectType, isOutput) { return Boolean((!isOutput) && object && objectType === 'object' && (KeyWords.SW in object)) }")
		),
		D('',
			JS("static execute(node, state) {"),
				JS("const key = normalise_function(node[KeyWords.SW])(state)"),
				JS("const fallbackKey = key in node[KeyWords.CS] ? key : KeyWords.DF"),
				JS("return fallbackKey in node[KeyWords.CS] ? [ ...state[S.Path], KeyWords.CS, fallbackKey ] : null"),
			JS("}")
		),
		D('',
			JS("static traverse(item, path, iterate, post) { return post({"),
				JS("...item,"),
				JS("[KeyWords.SW]: item[KeyWords.SW],"),
				JS("[KeyWords.CS]: Object.fromEntries(Object.keys(item[KeyWords.CS]).map(key => [ key, iterate([...path,KeyWords.CS,key]) ])),"),
			JS("}, path) }"),
		),
		JS("}"),
	),
	D('Machine Node',
		E.is(() => {
			const instance = new S({
				initial: [
					() => ({ result: 'first' }),
					'next',
				],
				next: { result: 'second' }
			})
			return instance({ result: 'start' })
		}, 'second'),
		E.exports('MachineNode', testModule, './index.js'),
		JS("export class MachineNode extends NodeDefinition {"),
		D('',
			JS("static name = NodeTypes.MC")
		),
		D('',
			JS("static typeof(object, objectType, isOutput) { return Boolean((!isOutput) && object && objectType === 'object' && (KeyWords.IT in object)) }")
		),
		D('',
			JS("static execute(node, state) { return [ ...state[S.Path], KeyWords.IT ] }")
		),
		D('',
			JS("static traverse(item, path, iterate, post) { return post({"),
				JS("...item,"),
				JS("...Object.fromEntries(Object.keys(item).map(key => [ key, iterate([...path,key]) ]))"),
			JS("}, path) }")
		),
		JS("}")
	),
	D('Directive Node',
		'Transitioning is also possible by using and object with the `S.Path` key set to a relative or absolute path. This is not recommended as it is almost never required, it should be considered system-only.',
		E.is(() => {
			const instance = new S({
				initial: [
					{ result: 'first' },
					{ [S.Path]: 'next' }
				],
				next: { result: 'second' }
			})
			return instance({ result: 'start' })
		}, 'second'),
		'It is not possible to send any other information in this object, such as a state change.',
		E.is(() => {
			const instance = new S({
				initial: [
					{ result: 'first' },
					{ [S.Path]: 'next', result: 'ignored' }
				],
				next: S.Return
			})
			return instance({ result: 'start' })
		}, 'first'),
		E.exports('DirectiveNode', testModule, './index.js'),
		JS("export class DirectiveNode extends NodeDefinition {"),
		D('',
			JS("static name = NodeTypes.DR")
		),
		D('',
			JS("static typeof(object, objectType, isOutput) { return Boolean(object && objectType === 'object' && (S.Path in object)) }")
		),
		D('',
			JS("static perform(action, state) { return S._perform(this, state, action[S.Path]) }")
		),
		JS("}")
	),
	D('Sequence Directive Node',
		'Numbers indicate a goto for a sequence. It is not recommended to use this as it may be unclear, but it must be possible, and should be considered system-only.',
		E.is(() => {
			const instance = new S([
				{ result: 'first' },
				4,
				{ result: 'skip' },
				S.Return,
				{ result: 'second' },
			])
			return instance({ result: 'start' })
		}, 'second'),
		'Slightly less not recommended is transitioning in a sequence conditonally. If you\'re making an incredibly basic state machine this is acceptable.',
		E.is(() => {
			const instance = new S([
				{
					if: ({ result }) => result === 'start',
					then: 3,
					else: 1,
				},
				{ result: 'skip' },
				S.Return,
				{ result: 'second' },
			])
			return instance({ result: 'start' })
		}, 'second'),
		E.exports('SequenceDirectiveNode', testModule, './index.js'),
		JS("export class SequenceDirectiveNode extends DirectiveNode {"),
		D('',
			JS("static name = NodeTypes.SD")
		),
		D('',
			JS("static typeof(object, objectType, isOutput) { return objectType === 'number' }")
		),
		D('',
			JS("static perform(action, state) {"),
			D('',
				JS("const lastOf = S._closest(this, state[S.Path].slice(0,-1), NodeTypes.SQ)")
			),
			D('',
				JS("if (!lastOf) throw new PathReferenceError(`A relative directive has been provided as a number (${String(action)}), but no sequence exists that this number could be an index of from path [ ${state[S.Path].map(key => key.toString()).join(', ')} ].`, { instance: this, state, path: state[S.Path], data: { action } })")
			),
			D('',
				JS("return { ...state, [S.Path]: [...lastOf, action] }")
			),
			JS("}")
		),
		JS("}"),
	),
	D('Machine Directive Node',
		'Directives are effectively `goto` commands, or `transitions` if you prefer.',
		'Directives are the natural way of proceeding in state machines, using the name of a neighboring state as a string you can direct flow through a state machine.',
		E.is(() => {
			const instance = new S({
				initial: [
					{ result: 'first' },
					'next'
				],
				next: { result: 'second' }
			})
			return instance({ result: 'start' })
		}, 'second'),
		'You can also use symbols as state names.',
		E.is(() => {
			const myState = Symbol('MyState')
			const instance = new S({
				initial: [
					{ result: 'first' },
					myState
				],
				[myState]: { result: 'second' }
			})
			return instance({ result: 'start' })
		}, 'second'),
		E.exports('MachineDirectiveNode', testModule, './index.js'),
		JS("export class MachineDirectiveNode extends DirectiveNode {"),
		D('',
			JS("static name = NodeTypes.MD")
		),
		D('',
			JS("static typeof(object, objectType, isOutput) { return objectType === 'string' || objectType === 'symbol' }")
		),
		D('',
			JS("static perform(action, state) {"),
			D('',
				JS("const lastOf = S._closest(this, state[S.Path].slice(0,-1), NodeTypes.MC)")
			),
			D('',
				JS("if (!lastOf) throw new PathReferenceError(`A relative directive has been provided as a ${typeof action} (${String(action)}), but no state machine exists that this ${typeof action} could be a state of from path [ ${state[S.Path].map(key => key.toString()).join(', ')} ].`, { instance: this, state, path: state[S.Path], data: { action } })")
			),
			D('',
				JS("return { ...state, [S.Path]: [...lastOf, action] }")
			),
			JS("}"),
		),
		JS("}"),
	),
	D('Absolute Directive Node',
		'Arrays can be used to perform absolute redirects. This is not recommended as it may make your transition logic unclear.',
		'Arrays cannot be used on their own, because they would be interpreted as sequences. For this reason they must be contained in an object with the `S.Path` symbol as a ky, with the array as the value, or returned by an action.',
		E.is(() => {
			const instance = new S({
				initial: [
					{ result: 'first' },
					{ [S.Path]: ['next',1] }
				],
				next: [
					{ result: 'skipped' },
					S.Return,
				]
			})
			return instance({ result: 'start' })
		}, 'first'),
		E.is(() => {
			const instance = new S({
				initial: [
					{ result: 'first' },
					() => ['next',1]
				],
				next: [
					{ result: 'skipped' },
					S.Return,
				]
			})
			return instance({ result: 'start' })
		}, 'first'),
		E.is(() => {
			const instance = new S({
				initial: [
					{ result: 'first' },
					['next',1]
				],
				next: [
					{ result: 'not skipped' },
					S.Return,
				]
			})
			return instance({ result: 'start' })
		}, 'not skipped'),
		E.exports('AbsoluteDirectiveNode', testModule, './index.js'),
		JS("export class AbsoluteDirectiveNode extends DirectiveNode {"),
		D('',
			JS("static name = NodeTypes.AD")
		),
		D('',
			JS("static typeof(object, objectType, isOutput) { return isOutput && Array.isArray(object) }")
		),
		D('',
			JS("static perform(action, state) { return { ...state, [S.Path]: action } }")
		),
		JS("}")
	),
	D('Return Node',
		'Causes the entire process to terminate immediately and return, setting `S.Return` to `true` on the state.',
		'If the symbol is used on its own, the it will simply return whatever value is in the "result".',
		'It is reccomended you use the result variable for this purpose.',
		E.is(() => {
			const instance = new S(S.Return)
			return instance({ result: 'start' })
		}, 'start'),
		'Using the return symbol as the key to an object will override the result variable with that value before returning.',
		E.todo(() => {
			const instance = new S({ [S.Return]: 456 })
			const result = instance({ result: 44 }) // 456
			const endState = instance.result(state => state)({ result: 44 }) // { result: 465, [S.Return]: true }
		}),
		E.exports('ReturnNode', testModule, './index.js'),
		JS("export class ReturnNode extends NodeDefinition {"),
		D('',
			JS("static name = NodeTypes.RT")
		),
		D('',
			JS("static typeof(object, objectType) { return object === S.Return || Boolean(object && objectType === 'object' && (S.Return in object)) }")
		),
		D('',
			JS("static perform(action, state) { return {"),
			D('',
				JS("...state,")
			),
			D('',
				JS("[S.Return]: true,")
			),
			D('',
				JS("[S.Path]: state[S.Path],")
			),
			D('',
				JS("...(!action || action === S.Return ? {} : { [KeyWords.RS]: action[S.Return] })")
			),
			JS("} }")
		),
		JS("}")
	),

	D('',
		JS("export const nodes = [ ChangesNode, SequenceNode, FunctionNode, UndefinedNode, EmptyNode, ConditionNode, SwitchNode, MachineNode, DirectiveNode, AbsoluteDirectiveNode, MachineDirectiveNode, SequenceDirectiveNode, ReturnNode, ]")
	),
),

D('Extensible Function',
	JS("export class ExtensibleFunction extends Function { constructor(f) { super(); return Object.setPrototypeOf(f, new.target.prototype); }; }")
),

D('Core',
	JS("export class SuperSmallStateMachineCore extends ExtensibleFunction {"),
	D('Symbols',
		D('Return',
			'Use for intentionally exiting the entire process, can be used in an object to override the result value before returning',
			E.success(() => {
				return { [S.Return]: "value" }
			}),
			JS("static Return      = Symbol('Super Small State Machine Return')"),
		),
		D('Changes',
			'Returned in the state. Should not be passed in.',
			E.success(() => {
				return { [S.Changes]: {} }
			}),
			JS("static Changes     = Symbol('Super Small State Machine Changes')"),
		),
		D('Path',
			'Returned in the state to indicate the next action path, or passed in with the state to direct the machine. This can also be used as a node on its own to change the executing path.',
			E.success(() => {
				return { [S.Path]: [] }
			}),
			JS("static Path        = Symbol('Super Small State Machine Path')"),
		),
		D('StrictTypes',
			'Possible value of `config.strict`, used to indicate strict types as well as values.',
			JS("static StrictTypes = Symbol('Super Small State Machine Strict Types')"),
		),
	),
	D('Key Words',
		JS("static keyWords    = KeyWords"),
		JS("static kw          = KeyWords"),
	),
	D('Node Types',
		JS("static nodeTypes   = NodeTypes"),
		JS("static types       = NodeTypes"),
	),
	D('Config',
		JS("static config = {"),
		D('',
			JS("defaults: { [KeyWords.RS]: null },")
		),
		D('',
			JS("input: (a = {}) => a,")
		),
		D('',
			JS("result: a => a[KeyWords.RS],")
		),
		D('',
			JS("strict: false,")
		),
		D('',
			JS("iterations: 10000,")
		),
		D('',
			JS("until: result => this.Return in result,")
		),
		D('',
			JS("async: false,"),
			D('Special settings for async',
				JS("delay: 0,"),
				JS("allow: 1000,"),
				JS("wait: 0,"),
			),
		),
		D('',
			JS("override: null,")
		),
		D('',
			JS("nodes: new NodeDefinitions(nodes),")
		),
		D('',
			JS("adapt: [],")
		),
		D('',
			JS("adaptStart: [],")
		),
		D('',
			JS("adaptEnd: [],")
		),
		JS("}")
	),
	D('S._closest (instance, path = [], ...nodeTypes)',
		'Returns the path of the closest ancestor to the node at the given `path` that matches one of the given `nodeTypes`.',
		'Returns `null` if no ancestor matches the one of the given `nodeTypes`.',
		E.equals(() => {
			const instance = new S([
				{
					if: ({ result }) => result === 'start',
					then: [
						{ result: 'second' },
						S.Return,
					]
				}
			])
			return S._closest(instance, [0, 'then', 1], 'sequence')
		}, [0, 'then']),
		JS("static _closest (instance, path = [], ...nodeTypes) {"),
		D('',
			JS("const flatNodeTypes = nodeTypes.flat(Infinity)")
		),
		D('',
			JS("return get_closest_object(instance.process, path, i => {"),
			D('',
				JS("const nodeType = instance.config.nodes.typeof(i)")
			),
			D('',
				JS("return Boolean(nodeType && flatNodeTypes.includes(nodeType))")
			),
			JS("})")
		),
		JS("}")
	),
	D('S._changes (instance, state = {}, changes = {})',
		'Safely apply the given `changes` to the given `state`.',
		'Merges the `changes` with the given `state` and returns it.',
		'This will ignore any symbols in `changes`, and forward the important symbols of the given `state`.',
		E.equals(() => {
			const instance = new S()
			const result = S._changes(instance, {
				[S.Path]: ['preserved'],
				[S.Changes]: {},
				preserved: 'value',
				common: 'initial',
			}, {
				[S.Path]: ['ignored'],
				[S.Changes]: { ignored: true },
				common: 'changed',
			})
			return result
		}, {
			common: 'changed',
			preserved: 'value',
			[S.Path]: ['preserved'],
			[S.Changes]: {
				ignored: undefined,
				common: 'changed',
			}
		}, symbols),
		JS("static _changes (instance, state = {}, changes = {}) {"),
		D('',
			JS("if (instance.config.strict) {"),
			D('',
				JS("if (Object.entries(changes).some(([name]) => !(name in state)))"),
				D('',
					JS("throw new ContextReferenceError(`Only properties that exist on the initial context may be updated.\nYou changed [ ${Object.keys(changes).filter(property => !(property in state)).map(key => key.toString()).join(', ')} ], which ${Object.keys(changes).filter(property => !(property in state)).length === 1 ? 'is' : 'are'} not in: [ ${Object.keys(state).map(key => key.toString()).join(', ')} ].\nPath: [ ${state[this.Path].map(key => key.toString()).join(' / ')} ]`, { instance, state, path: state[S.Path], data: { changes } })"),
				),
			),
			D('',
				JS("if (instance.config.strict === this.StrictTypes) {"),
				D('',
					JS("if (Object.entries(changes).some(([name,value]) => typeof value !== typeof state[name])) {"),
					D('',
						JS("const errs = Object.entries(changes).filter(([name,value]) => typeof value !== typeof state[name])"),
					),
					D('',
						JS("throw new ContextTypeError(`Properties must have the same type as their initial value. ${errs.map(([name,value]) => `${typeof value} given for '${name}', should be ${typeof state[name]}`).join('. ')}.`, { instance, state, path: state[S.Path], data: { changes } })"),
					),
					JS("}"),
				),
				JS("}"),
			),
			JS("}"),
		),
		D('',
			JS("const allChanges = deep_merge_object(state[this.Changes] || {}, changes)"),
		),
		D('',
			JS("return {"),
			D('',
				JS("...deep_merge_object(state, allChanges),"),
			),
			D('',
				JS("[this.Path]: state[this.Path],"),
			),
			D('',
				JS("[this.Changes]: allChanges"),
			),
			JS("}"),
		),
		JS("}")
	),

	D('S._proceed (instance, state = {}, path = state[this.Path] || [])',
		'Proceed to the next execution path.',
		'Performs fallback logic when a node exits.',
		JS("static _proceed (instance, state = {}, path = state[this.Path] || []) {"),
		D('',
			JS("if (path.length === 0) return null"),
		),
		D('',
			JS("const parPath = this._closest(instance, path.slice(0,-1), [...instance.config.nodes.values()].filter(({ proceed }) => proceed).map(({ name }) => name))"),
		),
		D('',
			JS("if (!parPath) return null"),
		),
		D('',
			JS("const parActs = get_path_object(instance.process, parPath)"),
		),
		D('',
			JS("const parType = instance.config.nodes.typeof(parActs)"),
		),
		D('',
			JS("const nodeDefinition = parType && instance.config.nodes.get(parType)"),
		),
		D('',
			JS("if (!(nodeDefinition && nodeDefinition.proceed)) return null"),
		),
		D('',
			JS("const result = nodeDefinition.proceed.call(instance, parPath, state, path)"),
		),
		D('',
			JS("if (result !== undefined) return result"),
		),
		D('',
			JS("return this._proceed(instance, state, parPath)"),
		),
		JS("}")
	),
	D('S._perform (instance, state = {}, action = null)',
		'Perform actions on the state.',
		'Applies any changes in the given `output` to the given `state`.',
		'Proceeds to the next node if the action is not itself a directive or return.',
		JS("static _perform (instance, state = {}, action = null) { // Perform actions on the state"),
		D('',
			JS("const path = state[this.Path] || []"),
		),
		D('',
			JS("const nodeType = instance.config.nodes.typeof(action, typeof action, true)"),
		),
		D('',
			JS("const nodeDefinition = nodeType && instance.config.nodes.get(nodeType)"),
		),
		D('',
			JS("if (nodeDefinition && nodeDefinition.perform)"),
		),
		D('',
			JS("return nodeDefinition.perform.call(instance, action, state)"),
		),
		D('',
			JS("throw new NodeTypeError(`Unknown action or action type: ${typeof action}${nodeType ? `, nodeType: ${String(nodeType)}` : ''} at [ ${path.map(key => key.toString()).join(', ')} ]`, { instance, state, path, data: { action } })"),
		),
		JS("}")
	),
	D('S._execute (instance, state = {}, path = state[this.Path] || [])',
		'Execute a node in the process, return an action.',
		"Executes the node in the process at the state's current path and returns it's output.",
		'If the node is not executable it will be returned as the output.',
		JS("static _execute (instance, state = {}, path = state[this.Path] || []) { // Execute a node in the process, return an action"),
		D('',
			JS("const node = get_path_object(instance.process, path)"),
		),
		D('',
			JS("const nodeType = instance.config.nodes.typeof(node)"),
		),
		D('',
			JS("const nodeDefinition = nodeType && instance.config.nodes.get(nodeType)"),
		),
		D('',
			JS("if (nodeDefinition && nodeDefinition.execute)"),
		),
		D('',
			JS("return nodeDefinition.execute.call(instance, node, state)"),
		),
		D('',
			JS("return node"),
		),
		JS("}")
	),
	D('S._traverse(instance, iterator = a => a, post = b => b)',
		'TODO: traverse and adapt same thing?',
		JS("static _traverse(instance, iterator = a => a, post = b => b) {"),
		D('',
			JS("const boundPost = post.bind(instance)"),
		),
		D('',
			JS("const iterate = (path = []) => {"),
			D('',
				JS("const item = get_path_object(instance.process, path)"),
			),
			D('',
				JS("const nodeType = instance.config.nodes.typeof(item)"),
			),
			D('',
				JS("const nodeDefinition = nodeType && instance.config.nodes.get(nodeType)"),
			),
			D('',
				JS("if (nodeDefinition && nodeDefinition.traverse)"),
			),
			D('',
				JS("return nodeDefinition.traverse.call(instance, item, path, iterate, boundPost)"),
			),
			D('',
				JS("return iterator.call(instance, item, path)"),
			),
			JS("}")
		),
		D('',
			JS("return iterate()")
		),
		JS("}")
	),
	D('S._run (instance, ...input)',
		'Execute the entire state machine either synchronously or asynchronously depending on the config.',
		JS("static _run (instance, ...input) {"),
		D('',
			JS("if (instance.config.async) return this._runAsync(instance, ...input)"),
		),
		D('',
			JS("return this._runSync(instance, ...input)"),
		),
		JS("}"),
	),
	D('S._runSync (instance, ...input)',
		'Execute the entire state machine synchronously.',
		JS("static _runSync (instance, ...input) {"),
		D('',
			JS("const { until, iterations, input: inputModifier, result: adaptResult, adaptStart, adaptEnd, defaults } = { ...this.config, ...instance.config }")
		),
		D('',
			JS("const modifiedInput = inputModifier.apply(instance, input) || {}")
		),
		D('',
			JS("let r = 0, currentState = adaptStart.reduce((prev, modifier) => modifier.call(instance, prev), this._changes(instance, {"),
			D('',
				JS("[this.Changes]: {},")
			),
			D('',
				JS("...defaults,")
			),
			D('',
				JS("[this.Path]: modifiedInput[this.Path] || [],")
			),
			JS("}, modifiedInput))")
		),
		D('',
			JS("while (r < iterations) {"),
			D('',
				JS("if (until(currentState)) break;")
			),
			D('',
				JS("if (++r > iterations)"),
				D('',
					JS("throw new MaxIterationsError(`Maximim iterations of ${iterations} reached at path [ ${currentState[this.Path].map(key => key.toString()).join(', ')} ]`, { instance, state: currentState, data: { iterations } })")
				),
			),
			D('',
				JS("currentState = this._perform(instance, currentState, this._execute(instance, currentState))")
			),
			JS("}")
		),
		D('',
			JS("return adaptResult.call(instance, adaptEnd.reduce((prev, modifier) => modifier.call(instance, prev), currentState))")
		),
		JS("}")
	),
	D('S._runAsync (instance, ...input)',
		'Execute the entire state machine asynchronously. Always returns a promise.',
		JS("static async _runAsync (instance, ...input) {"),
		D('',
			JS("const { delay, allow, wait, until, iterations, input: inputModifier, result: adaptResult, adaptStart, adaptEnd, defaults } = { ...this.config, ...instance.config }"),
		),
		D('',
			JS("const modifiedInput = (await inputModifier.apply(instance, input)) || {}"),
		),
		D('',
			JS("if (delay) await wait_time(delay)"),
		),
		D('',
			JS("let r = 0, startTime = Date.now(), currentState = adaptStart.reduce((prev, modifier) => modifier.call(instance, prev), this._changes(instance, {"),
		),
		D('',
			JS("[this.Changes]: {},"),
		),
		D('',
			JS("...defaults,"),
		),
		D('',
			JS("[this.Path]: modifiedInput[this.Path] || [],"),
		),
		D('',
			JS("}, modifiedInput))"),
		),
		D('',
			JS("while (r < iterations) {"),
			D('',
				JS("if (until(currentState)) break;"),
			),
			D('',
				JS("if (++r >= iterations)"),
			),
			D('',
				JS("			throw new MaxIterationsError(`Maximim iterations of ${iterations} reached at path [ ${currentState[this.Path].map(key => key.toString()).join(', ')} ]`, { instance, state: currentState, data: { iterations } })"),
			),
			D('',
				JS("currentState = this._perform(instance, currentState, await this._execute(instance, currentState))"),
			),
			D('',
				JS("if (allow > 0 && r % 10 === 0) {"),
				D('',
					JS("const nowTime = Date.now()"),
				),
				D('',
					JS("if (nowTime - startTime >= allow) {"),
					D('',
						JS("await wait_time(wait)"),
					),
					D('',
						JS("startTime = Date.now()"),
					),
					JS("}"),
				),
				JS("}"),
			),
			JS("}"),
		),
		JS("return adaptResult.call(instance, adaptEnd.reduce((prev, modifier) => modifier.call(instance, prev), currentState))"),
		JS("}"),
	),
	JS("}")
),
D('Chain',
	JS("export class SuperSmallStateMachineChain extends SuperSmallStateMachineCore {"),
	D('instance.closest (path = [], ...nodeTypes)',
		'Returns the path of the closest ancestor to the node at the given `path` that matches one of the given `nodeTypes`.',
		'Returns `null` if no ancestor matches the one of the given `nodeTypes`.',
		E.equals(() => {
			const instance = new S([
				{
					if: ({ result }) => result === 'start',
					then: [
						{ result: 'second' },
						S.Return,
					]
				}
			])
			return S.closest([0, 'then', 1], 'sequence')(instance)
		}, [0, 'then']),
		JS("static closest(path, ...nodeTypes) { return instance => this._closest(instance, path, ...nodeTypes) }")
	),
	D('instance.changes (state = {}, changes = {})',
		'Safely apply the given `changes` to the given `state`.',
		'Merges the `changes` with the given `state` and returns it.',
		'This will ignore any symbols in `changes`, and forward the important symbols of the given `state`.',
		E.equals(() => {
			const instance = new S()
			const result = S.changes({
				[S.Path]: ['preserved'],
				[S.Changes]: {},
				preserved: 'value',
				common: 'initial',
			}, {
				[S.Path]: ['ignored'],
				[S.Changes]: { ignored: true },
				common: 'changed',
			})(instance)
			return result
		}, {
			common: 'changed',
			preserved: 'value',
			[S.Path]: ['preserved'],
			[S.Changes]: {
				ignored: undefined,
				common: 'changed',
			}
		}, symbols),
		JS("static changes(state, changes) { return instance => this._changes(instance, state, changes) }")
	),
	D('instance.proceed (state = {}, path = state[this.Path] || [])',
		'Proceed to the next execution path.',
		'Performs fallback logic when a node exits.',
		JS("static proceed(state, path)    { return instance => this._proceed(instance, state, path) }")
	),
	D('instance.perform (state = {}, action = null)',
		'Perform actions on the state.',
		'Applies any changes in the given `output` to the given `state`.',
		'Proceeds to the next node if the action is not itself a directive or return.',
		JS("static perform(state, action)  { return instance => this._perform(instance, state, action) }")
	),
	D('instance.execute (state = {}, path = state[this.Path] || [])',
		'Execute a node in the process, return an action.',
		"Executes the node in the process at the state's current path and returns it's output.",
		'If the node is not executable it will be returned as the output.',
		JS("static execute(state)          { return instance => this._execute(instance, state) }")
	),
	D('instance.traverse(iterator = a => a, post = b => b)',
		'TODO: traverse and adapt same thing?',
		JS("static traverse(iterator, post){ return instance => this._traverse(instance, iterator, post) }")
	),
	D('instance.run (...input)',
		'Execute the entire state machine either synchronously or asynchronously depending on the config.',
		JS("static run(...input)           { return instance => this._run(instance, ...input) }")
	),
	D('instance.runSync (...input)',
		'Execute the entire state machine synchronously.',
		JS("static runSync(...input)       { return instance => this._runSync(instance, ...input) }")
	),
	D('instance.runAsync (...input)',
		'Execute the entire state machine asynchronously. Always returns a promise.',
		JS("static runAsync(...input)      { return instance => this._runAsync(instance, ...input) }")
	),
	D('instance.do(process) <default: null>',
		'Defines a process to execute, overrides the existing process.',
		'Returns a function that will modify a given instance.',
		E.is(() => {
			const instance = new S({ result: 'old' })
			const newInstance = instance.with(S.do({ result: 'new' }))
			return newInstance()
		}, 'new'),
		JS("static do(process)             { return instance => ({ process: instance.config.adapt.reduce((prev, modifier) => modifier.call(instance, prev), process), config: instance.config }) }")
	),
	D('instance.defaults(defaults) <default: { result: null }>',
		'Defines the initial state to be used for all executions.',
		'Returns a function that will modify a given instance.',
		E.is(() => {
			const instance = new S()
			const newInstance = instance.with(S.defaults({ result: 'default' }))
			return newInstance()
		}, 'default'),
		JS("static defaults(defaults)      { return instance => ({ process: instance.process, config: { ...instance.config, defaults }, }) }")
	),
	D('instance.input(input) <default: (state => state)>',
		'Allows the definition of the arguments the executable will use, and how they will be applied to the initial state.',
		'Returns a function that will modify a given instance.',
		E.is(() => {
			const instance = new S(({ first, second }) => ({ [S.Return]: `${first} then ${second}` }))
			.with(
				S.defaults({ first: '', second: '' }),
				S.input((first, second) => ({ first, second }))
			)
			return instance('this', 'that')
		}, 'this then that'),
		JS("static input(input)            { return instance => ({ process: instance.process, config: { ...instance.config, input }, }) }")
	),
	D('instance.result(result) <default: (state => state.result)>',
		'Allows the modification of the value the executable will return.',
		'Returns a function that will modify a given instance.',
		E.is(() => {
			const instance = new S(({ myReturnValue }) => ({ myReturnValue: myReturnValue + ' extra' }))
				.with(S.result(state => state.myReturnValue))
			return instance({ myReturnValue: 'start' })
		}, 'start extra'),
		JS("static result(result)          { return instance => ({ process: instance.process, config: { ...instance.config, result }, }) }")
	),
	D('instance.unstrict <default>',
		'Execute without checking state properties when a state change is made.',
		'Will modify the given instance.',
		E.error(() => {
			const instance = new S(() => ({ unknownVariable: false}))
			.with(
				S.defaults({ knownVariable: true }),
				S.strict
			)
			return instance()
		}, Error),
		E.success(() => {
			const instance = new S(() => ({ unknownVariable: false}))
			.with(
				S.defaults({ knownVariable: true }),
				S.strict,
				S.unstrict
			)
			return instance()
		}),
		JS("static unstrict                 (instance) { return ({ process: instance.process, config: { ...instance.config, strict: false }, }) }")
	),
	D('instance.strict',
		'Checks state properties when an state change is made.',
		'Will modify the given instance.',
		E.success(() => {
			const instance = new S(() => ({ unknownVariable: false}))
				.with(S.defaults({ knownVariable: true }))
			return instance()
		}),
		E.error(() => {
			const instance = new S(() => ({ unknownVariable: false}))
			.with(
				S.defaults({ knownVariable: true }),
				S.strict
			)
			return instance()
		}, Error),
		JS("static strict                   (instance) { return ({ process: instance.process, config: { ...instance.config, strict: true }, }) }")
	),
	D('instance.strictTypes',
		'Checking state property types when an state change is made.',
		'Will modify the given instance.',
		E.error(() => {
			const instance = new S(() => ({ knownVariable: 45 }))
			.with(
				S.defaults({ knownVariable: true }),
				S.strictTypes
			)
			return instance()
		}, Error),
		JS("static strictTypes              (instance) { return ({ process: instance.process, config: { ...instance.config, strict: this.StrictTypes }, }) }")
	),
	D('instance.for(iterations = 10000) <default: 10000>',
		'Defines the maximum iteration limit.',
		'Returns a function that will modify a given instance.',
		E.todo(() => {
			const instance = new S(({ result }) => ({ result: result + 1}))
			.with(
				S.defaults({ result: 0 }),
				S.for(10)
			)
			const result = instance() // ??
		}),
		JS("static for(iterations = 10000) { return instance => ({ process: instance.process, config: { ...instance.config, iterations }, }) }")
	),
	D('instance.until(until) <default: (state => S.Return in state)>',
		'Stops execution of the machine once the given condition is met, and attempts to return.',
		'Returns a function that will modify a given instance.',
		E.is(() => {
			const instance = new S([
				({ result }) => ({ result: result + 1 }),
				{
					if: ({ result }) => result > 4,
					then: [{ result: 'exit' }, { result:'ignored' }],
					else: 0
				}
			])
				.with(S.until(({ result }) => result === 'exit'))
			return instance({ result: 0 })
		}, 'exit'),
		JS("static until(until)            { return instance => ({ process: instance.process, config: { ...instance.config, until }, }) }")
	),
	D('instance.forever',
		'Removes the max iteration limit.',
		'Will modify the given instance.',
		E.is(() => {
			const instance = new S().with(S.forever)
			return instance.config.iterations
		}, Infinity),
		JS("static forever                  (instance) { return ({ process: instance.process, config: { ...instance.config, iterations: Infinity }, }) }")
	),
	D('instance.step',
		'Execute one action or directive at a time, and always return the full state (ignoring previous `instance.result` calls)',
		'Will modify the given instance.',
		E.equals(() => {
			const instance = new S([{ result: 'first' }, { result: 'second' }])
			.with(
				S.defaults({ result: 'initial' }),
				S.step
			)
			const result1 = instance()
			const result2 = instance(result1)
			const result3 = instance(result2)
			return { result1, result2, result3 }
		}, {
			result1: { result: 'initial' },
			result2: { result: 'first' },
			result3: { result: 'second' }
		}),
		JS("static step                     (instance) { return ({ process: instance.process, config: { ...instance.config, iterations: 1, result: a => a }, }) }")
	),
	D('instance.sync <default>',
		'Execute synchronously and not allow for asynchronous actions.',
		'Will modify the given instance.',
		E.is(() => {
			const instance = new S(async () => ({ result: 'changed' }))
			.with(
				S.async,
				S.sync,
				S.defaults({ result: 'initial' })
			)
			return instance()
		}, 'initial'),
		JS("static sync                     (instance) { return ({ process: instance.process, config: { ...instance.config, async: false }, }) }")
	),
	D('instance.async',
		'Execute asynchronously and allow for asynchronous actions.',
		'Will modify the given instance.',
		E.is(() => {
			const instance = new S(async () => ({ result: 'changed' }))
			.with(S.defaults({ result: 'initial' }))
			return instance()
		}, 'initial'),
		E.is(async () => {
			const instance = new S(async () => ({ result: 'changed' }))
			.with(
				S.defaults({ result: 'initial' }),
				S.async
			)
			return await instance()
		}, 'changed'),
		JS("static async                    (instance) { return ({ process: instance.process, config: { ...instance.config, async: true }, }) }")
	),
	D('instance.delay(delay = 0) <default: 0>',
		'Defines an initial delay before starting to execute the process.',
		'Returns a function that will modify a given instance.',
		JS("static delay(delay = 0)        { return instance => ({ process: instance.process, config: { ...instance.config, delay }, }) }")
	),
	D('instance.allow(allow = 1000) <default: 1000>',
		'Defines the amount of time the process is allowed to run for before pausing.',
		'Returns a function that will modify a given instance.',
		JS("static allow(allow = 1000)     { return instance => ({ process: instance.process, config: { ...instance.config, allow }, }) }")
	),
	D('instance.wait(wait = 0) <default: 0>',
		'Defines the amount of time the process will pause for when the allowed time is exceeded.',
		'Returns a function that will modify a given instance.',
		JS("static wait(wait = 0)          { return instance => ({ process: instance.process, config: { ...instance.config, wait }, }) }")
	),
	D('instance.override(override) <default: instance.run>',
		'Overrides the method that will be used when the executable is called.',
		'Returns a function that will modify a given instance.',
		E.is(() => {
			const instance = new S({ result: 'definedResult' })
				.with(S.override(function (...args) {
					// console.log({ scope: this, args }) // { scope: { process: { result: 'definedResult' } }, args: [1, 2, 3] }
					return 'customReturn'
				}))
			return instance(1, 2, 3)
		}, 'customReturn'),
		JS("static override(override)      { return instance => ({ process: instance.process, config: { ...instance.config, override } }) }")
	),
	D('instance.addNode(...nodes)',
		'Allows for the addition of new node types.',
		'Returns a function that will modify a given instance.',
		E.todo(() => {
			const instance = new S()
			const result = instance()
		}),
		JS("static addNode(...nodes)       { return instance => ({ process: instance.process, config: { ...instance.config, nodes: new NodeDefinitions(...instance.config.nodes.values(),...nodes) }, }) }")
	),
	D('instance.adapt(...adapters)',
		'Transforms the process before usage, allowing for temporary nodes.',
		'Returns a function that will modify a given instance.',
		E.is(() => {
			const replaceMe = Symbol('replace me')
			const instance = new S([
				replaceMe,
				S.Return,
			]).with(S.adapt(function (process) {
				return S.traverse((node) => {
					if (node === replaceMe)
						return { result: 'changed' }
					return node
				})(this) }))
			return instance({ result: 'unchanged' })
		}, 'changed'),
		JS("static adapt(...adapters)      { return instance => ({ process: adapters.reduce((prev, adapter) => adapter.call(instance, prev), instance.process), config: { ...instance.config, adapt: [ ...instance.config.adapt, ...adapters ] }, }) }")
	),
	D('instance.adaptStart(...adapters)',
		'Transforms the state before execution.',
		'Returns a function that will modify a given instance.',
		E.todo(() => {
			const instance = new S()
			.adaptInput(state => ({
				...state,
				addedValue: 'new'
			}))
			const result = instance({ })
		}),
		JS("static adaptStart(...adapters) { return instance => ({ process: instance.process, config: { ...instance.config, adaptStart: [ ...instance.config.adaptStart, ...adapters ] }, }) }")
	),
	
	D('instance.adaptEnd(...adapters)',
		'Transforms the state after execution.',
		'Returns a function that will modify a given instance.',
		E.todo(() => {
			const instance = new S()
			const result = instance()
		}),
		JS("static adaptEnd(...adapters)   { return instance => ({ process: instance.process, config: { ...instance.config, adaptEnd: [ ...instance.config.adaptEnd, ...adapters ] }, }) }")
	),
	
	D('instance.with(...adapters)',
		'Allows for the addition of predifined modules.',
		'Returns a function that will modify a given instance.',
		E.todo(() => {
			// const instance = new S()
			// const result = instance()
		}),
		JS("static with(...adapters) {"),
		D('',
			JS("const flatAdapters = adapters.flat(Infinity)")
		),
		D('',
			JS("return instance => {"),
			D('',
				JS("const result = flatAdapters.reduce((prev, adapter) => adapter.call(instance, prev), instance)")
			),
			D('',
				JS("return result instanceof S ? result : new S(result.process, result.config)")
			),
			JS("}"),
		),
		JS("}")
	),
	JS("}")
),
D('Instance',
	JS("export default class S extends SuperSmallStateMachineChain {"),
	D('Process',
		E.todo(() => {
			const instance = new S({ result: 'value' })
			const result = instance.process // { result: 'value' }
		}),
		JS("process = null")
	),
	D('Config',
		E.todo(() => {
			// const instance = new S({ result: 'value' })
			// const modifiedInstance = instance
			// 	.async
			// 	.for(10)
			// 	.defaults({ result: 'other' })
			// 	.strict
			// 	.delay(20)
			// 	.allow(100)
			// 	.wait(100)
			// const result1 = instance.config
			// // { 
			// // 	defaults: { result: null },
			// // 	iterations: 10000,
			// // 	strict: false,
			// // 	async: false,
			// // 	delay: 0,
			// // 	allow: 1000,
			// // 	wait: 0,
			// // }
			// const result2 = modifiedInstance.config
			// // { 
			// // 	defaults: { result: 'other' }
			// // 	iterations: 10,
			// // 	strict: true,
			// // 	async: true,
			// // 	delay: 20,
			// // 	allow: 100,
			// // 	wait: 100,
			// // } 
		}),
		JS("#config = S.config"),
		JS("get config() { return { ...this.#config } }")
	),
	D('Instance Constructor',
		D('Basics',
			D('The primary way of interacting with this library is to create a new instance',
				E.success(() => {
					const instance = new S()
				})
			),
			D('Instances are executable, like functions',
				E.success(() => {
					const instance = new S()
					return instance() === undefined
				})
			),
			D('The constructor takes two arguments, the `process` and the `config`',
				E.todo(() => {
					const instance = new S({}, {})
				})
			),
			D('Neither of these arguments are required, and it is not recommended to configure them config via the constructor. Instead you should update the config using the various chainable methods and properties.',
				E.success(() => {
					const instance = new S(process)
						.defaults({})
						.input()
						.result()
				})
			),
		),
		JS("constructor(process = null, config = S.config) {"),
		D('',
			JS("super((...input) => (config.override || this.run).apply(this, input))")
		),
		D('',
			JS("this.#config = { ...this.#config, ...config }")
		),
		D('',
			JS("this.process = process")
		),
		JS("}"),
	),
	D('instance.closest (path = [], ...nodeTypes)',
		'Returns the path of the closest ancestor to the node at the given `path` that matches one of the given `nodeTypes`.',
		'Returns `null` if no ancestor matches the one of the given `nodeTypes`.',
		E.equals(() => {
			const instance = new S([
				{
					if: ({ result }) => result === 'start',
					then: [
						{ result: 'second' },
						S.Return,
					]
				}
			])
			return instance.closest([0, 'then', 1], 'sequence')
		}, [0, 'then']),
		JS("closest(path, ...nodeTypes) { return S._closest(this, path, ...nodeTypes) }")
	),
	D('instance.changes (state = {}, changes = {})',
		'Safely apply the given `changes` to the given `state`.',
		'Merges the `changes` with the given `state` and returns it.',
		'This will ignore any symbols in `changes`, and forward the important symbols of the given `state`.',
		E.equals(() => {
			const instance = new S()
			const result = instance.changes({
				[S.Path]: ['preserved'],
				[S.Changes]: {},
				preserved: 'value',
				common: 'initial',
			}, {
				[S.Path]: ['ignored'],
				[S.Changes]: { ignored: true },
				common: 'changed',
			})
			return result
		}, {
			common: 'changed',
			preserved: 'value',
			[S.Path]: ['preserved'],
			[S.Changes]: {
				ignored: undefined,
				common: 'changed',
			}
		}, symbols),
		JS("changes(state, changes) { return S._changes(this, state, changes) }")
	),
	D('instance.proceed (state = {}, path = state[this.Path] || [])',
		'Proceed to the next execution path.',
		'Performs fallback logic when a node exits.',
		JS("proceed(state, path)    { return S._proceed(this, state, path) }")
	),
	D('instance.perform (state = {}, action = null)',
		'Perform actions on the state.',
		'Applies any changes in the given `output` to the given `state`.',
		'Proceeds to the next node if the action is not itself a directive or return.',
		JS("perform(state, action)  { return S._perform(this, state, action) }")
	),
	D('instance.execute (state = {}, path = state[this.Path] || [])',
		'Execute a node in the process, return an action.',
		"Executes the node in the process at the state's current path and returns it's output.",
		'If the node is not executable it will be returned as the output.',
		JS("execute(state)          { return S._execute(this, state) }")
	),
	D('instance.traverse(iterator = a => a, post = b => b)',
		'TODO: traverse and adapt same thing?',
		JS("traverse(iterator, post){ return S._traverse(this, iterator, post) }")
	),
	D('instance.run (...input)',
		'Execute the entire state machine either synchronously or asynchronously depending on the config.',
		JS("run     (...input)      { return S._run(this, ...input) }")
	),
	D('instance.runSync (...input)',
		'Execute the entire state machine synchronously.',
		JS("runSync (...input)      { return S._runSync(this, ...input) }")
	),
	D('instance.runAsync (...input)',
		'Execute the entire state machine asynchronously. Always returns a promise.',
		JS("runAsync(...input)      { return S._runAsync(this, ...input) }")
	),
	D('instance.do(process) <default: null>',
		'Defines a process to execute, overrides the existing process.',
		'Returns a new instance.',
		E.is(() => {
			const instance = new S({ result: 'old' })
				.do({ result: 'new' })
			return instance()
		}, 'new'),
		JS("do(process)             { return this.with(S.do(process)) }")
	),
	D('instance.defaults(defaults) <default: { result: null }>',
		'Defines the initial state to be used for all executions.',
		'Returns a new instance.',
		E.is(() => {
			const instance = new S()
				.defaults({ result: 'default' })
			return instance()
		}, 'default'),
		JS("defaults(defaults)      { return this.with(S.defaults(defaults)) }")
	),
	D('instance.input(input) <default: (state => state)>',
		'Allows the definition of the arguments the executable will use, and how they will be applied to the initial state.',
		'Returns a new instance.',
		E.is(() => {
			const instance = new S(({ first, second }) => ({ [S.Return]: `${first} then ${second}` }))
				.defaults({ first: '', second: '' })
				.input((first, second) => ({ first, second }))
			return instance('this', 'that')
		}, 'this then that'),
		JS("input(input)            { return this.with(S.input(input)) }")
	),
	D('instance.result(result) <default: (state => state.result)>',
		'Allows the modification of the value the executable will return.',
		'Returns a new instance.',
		E.is(() => {
			const instance = new S(({ myReturnValue }) => ({ myReturnValue: myReturnValue + ' extra' }))
				.result(state => state.myReturnValue)
			return instance({ myReturnValue: 'start' })
		}, 'start extra'),
		JS("result(result)          { return this.with(S.result(result)) }")
	),
	D('instance.unstrict <default>',
		'Execute without checking state properties when a state change is made.',
		'Creates a new instance.',
		E.error(() => {
			const instance = new S(() => ({ unknownVariable: false}))
				.defaults({ knownVariable: true })
				.strict
			return instance()
		}, Error),
		E.success(() => {
			const instance = new S(() => ({ unknownVariable: false}))
				.defaults({ knownVariable: true })
				.strict
				.unstrict
			return instance()
		}),
		JS("get unstrict()          { return this.with(S.unstrict) }")
	),
	D('instance.strict',
		'Checks state properties when an state change is made.',
		'Creates a new instance.',
		E.success(() => {
			const instance = new S(() => ({ unknownVariable: false}))
				.defaults({ knownVariable: true })
			return instance()
		}),
		E.error(() => {
			const instance = new S(() => ({ unknownVariable: false}))
				.defaults({ knownVariable: true })
				.strict
			return instance()
		}, Error),
		JS("get strict()            { return this.with(S.strict) }")
	),
	D('instance.strictTypes',
		'Checking state property types when an state change is made.',
		'Creates a new instance.',
		E.error(() => {
			const instance = new S(() => ({ knownVariable: 45 }))
				.defaults({ knownVariable: true })
				.strictTypes
			return instance()
		}, Error),
		JS("get strictTypes()       { return this.with(S.strictTypes) }")
	),
	D('instance.for(iterations = 10000) <default: 10000>',
		'Defines the maximum iteration limit.',
		'Returns a new instance.',
		E.todo(() => {
			const instance = new S(({ result }) => ({ result: result + 1}))
				.defaults({ result: 0 })
				.for(10)
			const result = instance() // ??
		}),
		JS("for(iterations)         { return this.with(S.for(iterations)) }")
	),
	D('instance.until(until) <default: (state => S.Return in state)>',
		'Stops execution of the machine once the given condition is met, and attempts to return.',
		E.is(() => {
			const instance = new S([
				({ result }) => ({ result: result + 1 }),
				{
					if: ({ result }) => result > 4,
					then: [{ result: 'exit' }, { result:'ignored' }],
					else: 0
				}
			])
				.until(({ result }) => result === 'exit')
			return instance({ result: 0 })
		}, 'exit'),
		JS("until(until)            { return this.with(S.until(until)) }")
	),
	D('instance.forever',
		'Removes the max iteration limit.',
		'Creates a new instance.',
		E.is(() => {
			const instance = new S().forever
			return instance.config.iterations
		}, Infinity),
		JS("get forever()           { return this.with(S.forever) }")
	),
	D('instance.step',
		'Execute one action or directive at a time, and always return the full state (ignoring previous `instance.result` calls)',
		E.equals(() => {
			const instance = new S([{ result: 'first' }, { result: 'second' }])
				.defaults({ result: 'initial' })
				.step
			const result1 = instance()
			const result2 = instance(result1)
			const result3 = instance(result2)
			return { result1, result2, result3 }
		}, {
			result1: { result: 'initial' },
			result2: { result: 'first' },
			result3: { result: 'second' }
		}),
		JS("get step()              { return this.with(S.step) }")
	),
	D('instance.sync <default>',
		'Execute synchronously and not allow for asynchronous actions.',
		'Creates a new instance.',
		E.is(() => {
			const instance = new S(async () => ({ result: 'changed' }))
				.async
				.sync
				.defaults({ result: 'initial' })
			return instance()
		}, 'initial'),
		JS("get sync()              { return this.with(S.sync) }")
	),
	D('instance.async',
		'Execute asynchronously and allow for asynchronous actions.',
		'Creates a new instance.',
		E.is(() => {
			const instance = new S(async () => ({ result: 'changed' }))
				.defaults({ result: 'initial' })
			return instance()
		}, 'initial'),
		E.is(async () => {
			const instance = new S(async () => ({ result: 'changed' }))
				.defaults({ result: 'initial' })
				.async
			return await instance()
		}, 'changed'),
		JS("get async()             { return this.with(S.async) }")
	),
	D('instance.delay(delay = 0) <default: 0>',
		'Defines an initial delay before starting to execute the process.',
		'Returns a new instance.',
		JS("delay(delay)            { return this.with(S.delay(delay)) }")
	),
	D('instance.allow(allow = 1000) <default: 1000>',
		'Defines the amount of time the process is allowed to run for before pausing.',
		'Returns a new instance.',
		JS("allow(allow)            { return this.with(S.allow(allow)) }")
	),
	D('instance.wait(wait = 0) <default: 0>',
		'Defines the amount of time the process will pause for when the allowed time is exceeded.',
		'Returns a new instance.',
		JS("wait(wait)              { return this.with(S.wait(wait)) }")
	),
	D('instance.override(override) <default: instance.run>',
		'Overrides the method that will be used when the executable is called.',
		'Returns a new instance.',
		E.is(() => {
			const instance = new S({ result: 'definedResult' }).override(function (...args) {
				// console.log({ scope: this, args }) // { scope: { process: { result: 'definedResult' } }, args: [1, 2, 3] }
				return 'customReturn'
			})
			return instance(1, 2, 3)
		}, 'customReturn'),
		JS("override(override)      { return this.with(S.override(override)) }")
	),
	D('instance.addNode(...nodes)',
		'Allows for the addition of new node types.',
		'Returns a new instance.',
		E.todo(() => {
			const instance = new S()
			const result = instance()
		}),
		JS("addNode(...nodes)       { return this.with(S.addNode(...nodes)) }")
	),
	D('instance.adapt(...adapters)',
		'Transforms the process before usage, allowing for temporary nodes.',
		E.is(() => {
			const replaceMe = Symbol('replace me')
			const instance = new S([
				replaceMe,
				S.Return,
			])
			.adapt(function (process) {
				return S.traverse((node) => {
					if (node === replaceMe)
						return { result: 'changed' }
					return node
				})(this) })
			return instance({ result: 'unchanged' })
		}, 'changed'),
		JS("adapt(...adapters)      { return this.with(S.adapt(...adapters)) }")
	),
	D('instance.adaptStart(...adapters)',
		'Transforms the state before execution.',
		'Returns a new instance.',
		E.todo(() => {
			const instance = new S()
			.adaptInput(state => ({
				...state,
				addedValue: 'new'
			}))
			const result = instance({ })
		}),
		JS("adaptStart(...adapters) { return this.with(S.adaptStart(...adapters)) }")
	),
	
	D('instance.adaptEnd(...adapters)',
		'Transforms the state after execution.',
		'Returns a new instance.',
		E.todo(() => {
			const instance = new S()
			const result = instance()
		}),
		JS("adaptEnd(...adapters)   { return this.with(S.adaptEnd(...adapters)) }")
	),
	D('instance.with(...adapters)',
		'Allows for the addition of predifined modules.',
		'Returns a new instance.',
		E.todo(() => {
			// const instance = new S()
			// const result = instance()
		}),
		JS("with(...transformers)   { return S.with(...transformers)(this) }")
	),
	JS("}"),
	JS("export const StateMachine = S"),
	JS("export const SuperSmallStateMachine = S"),
),

D('Requirements',
	D('Execution',
		D('Can execute function',
			E.is(() => {
				const instance = new S(({ input }) => ({ result: (input + 5) * 47 }))
					.defaults({
						input: -5,
					})
				return instance({
					input: 8,
				})
			}, 611)
		),
		D('Can execute array',
			E.is(() => {
				const instance = new S([
					({ input }) => ({ result: input * 9 }),
					({ result }) => ({ result: result + 15 })
				])
					.defaults({
						input: 0,
					})
				return instance({
					input: 6
				})
			}, 69)
		),
		D('Can execute conditional (then)',
			E.is(() => {
				const instance = new S({
					if: ({ input }) => input === 25,
					then: () => ({ result: 44 }),
					else: () => ({ result: 55 }),
				})
					.defaults({
						input: 0,
					})
				return instance({
					input: 25
				})
			}, 44)
		),
		D('Can execute conditional (else)',
			E.is(() => {
				const instance = new S({
					if: ({ input }) => input === 25,
					then: () => ({ result: 44 }),
					else: () => ({ result: 55 }),
				})
					.defaults({
						input: 0,
					})
				return instance({
					input: 8
				})
			}, 55)
		),
		D('Can execute switch conditional (specific case)',
			E.is(() => {
				const instance = new S({
					switch: ({ mode }) => mode,
					case: {
						first: () => ({ result: 1 }),
						second: () => ({ result: 2 }),
						third: () => ({ result: 3 }),
						default: () => ({ result: -1 }),
					}
				})
					.defaults({
						mode: 'none'
					})
				return instance({
					mode: 'second'
				})
			}, 2)
		),
		D('Can execute switch conditional (default)',
			E.is(() => {
				const instance = new S({
					switch: ({ mode }) => mode,
					case: {
						first: () => ({ result: 1 }),
						second: () => ({ result: 2 }),
						third: () => ({ result: 3 }),
						default: () => ({ result: -1 }),
					}
				})
					.defaults({
						mode: 'none'
					})
				return instance({
					mode: 'blarg'
				})
			}, -1)
		),
		D('Can execute state machine',
			E.is(() => {
				const instance = new S({
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
				})
					.defaults({
						input: 0,
					})
				return instance({
					input: 32,
				})
			}, 2592)
		),
		D('Can execute array as state machine',
			E.is(() => {
				const instance = new S([
					({ input }) => ({ result: input - 1 }),
					({ result, input }) => ({ result: result + input }),
					({ input }) => ({ input: input - 1 }),
					{
						if: ({ input }) => input > 0,
						then: 1,
					}
				])
					.defaults({
						result: 0,
						input: 1,
					})
				return instance({
					input: 13,
				})
			}, 103)
		),
		D('Can nest indefinitely',
			E.is(() => {
				const instance = new S({
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
				})
					.defaults({
						input: 0,
					})
				return instance({
					input: 18,
				})
			}, 37)
		),
	),

	D('Static Values',
		// Can use path object as absolute path
		D('Can use path object as absolute path',
			E.is(() => {
				const instance = new S({
					initial: { [S.Path]: ['second',0] },
					second: [
						({ result }) => ({ result: result + 4 })
					]
				})
					.defaults({
						result: 0,
					})
				return instance({
					result: 5,
				})
			}, 9)
		),
		D('Can use path object as relative path',
			E.is(() => {
				const instance = new S({
					initial: { [S.Path]: 'second' },
					second: [
						({ result }) => ({ result: result + 4 })
					]
				})
					.defaults({
						result: 0,
					})
				return instance({
					result: 5,
				})
			}, 9)
		),
		D('Can use string as relative path',
			E.is(() => {
				const instance = new S({
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
				})
					.defaults({
						result: 9,
					})
				return instance({
					result: 0,
				})
			}, 7)
		),
		D('Can use symbol as relative path',
			E.is(() => {
				const testSymbol = Symbol('Test Symbol')
				const instance = new S({
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
				})
					.defaults({
						result: 9,
					})
				return instance({
					result: 0,
				})
			}, 7)
		),
		D('Can use number as relative path',
			E.is(() => {
				const instance = new S([
					({ result }) => ({ result: result + 1 }),
					{
						if: ({ result }) => result < 7,
						then: 0
					}
				])
					.defaults({
						result: 9,
					})
				return instance({
					result: 0,
				})
			}, 7)
		),
		D('Can use return as directive',
			E.is(() => {
				const instance = new S([
					({ result }) => ({ result: result - 1 }),
					{
						if: ({ result }) => result <= 0,
						then: S.Return,
						else: 0
					}
				])
					.defaults({
						result: -1,
					})
				return instance({
					result: 6,
				})
			}, 0)
		),
		D('Can use return object as directive',
			E.is(() => {
				const instance = new S([
					({ result }) => ({ result: result - 1 }),
					{
						if: ({ result }) => result <= 0,
						then: { [S.Return]: 66 },
						else: 0
					}
				])
					.defaults({
						result: -1,
					})
				return instance({
					result: 6,
				})
			}, 66)
		),
		D('Can use state change object as value',
			E.is(() => {
				const instance = new S({ result: 66 })
					.defaults({
						result: 0,
					})
				return instance({
					result: 99
				})
			}, 66)
		),
	),

	D('Dynamic Values',
		D('Can return array as absolute path',
			E.is(() => {
				const instance = new S({
					initial: () => ['second',0],
					second: [
						({ result }) => ({ result: result + 4 })
					]
				})
					.defaults({
						result: 0,
					})
				return instance({
					result: 5,
				})
			}, 9)
		),
		D('Can return path object as absolute path',
			E.is(() => {
				const instance = new S({
					initial: () => ({ [S.Path]: ['second',0] }),
					second: [
						({ result }) => ({ result: result + 4 })
					]
				})
					.defaults({
						result: 0,
					})
				return instance({
					result: 5,
				})
			}, 9)
		),
		D('Can return path object as relative path',
			E.is(() => {
				const instance = new S({
					initial: () => ({ [S.Path]: 'second' }),
					second: [
						({ result }) => ({ result: result + 4 })
					]
				})
					.defaults({
						result: 0,
					})
				return instance({
					result: 5,
				})
			}, 9)
		),
		D('Can return string as relative path',
			E.is(() => {
				const instance = new S({
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
				})
					.defaults({
						result: 9,
					})
				return instance({
					result: 0,
				})
			}, 7)
		),
		D('Can return symbol as relative path',
			E.is(() => {
				const testSymbol = Symbol('Test Symbol')
				const instance = new S({
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
				})
					.defaults({
						result: 9,
					})
				return instance({
					result: 0,
				})
			}, 7)
		),
		D('Can return number as relative path',
			E.is(() => {
				const instance = new S([
					({ result }) => ({ result: result + 1 }),
					{
						if: ({ result }) => result < 7,
						then: () => 0
					}
				])
					.defaults({
						result: 9,
					})
				return instance({
					result: 0,
				})
			}, 7)
		),
		D('Can return return as directive',
			E.is(() => {
				const instance = new S([
					({ result }) => ({ result: result - 1 }),
					{
						if: ({ result }) => result <= 0,
						then: () => S.Return,
						else: 0
					}
				])
					.defaults({
						result: -1,
					})
				return instance({
					result: 6,
				})
			}, 0)
		),
		D('Can return return object as directive',
			E.is(() => {
				const instance = new S([
					({ result }) => ({ result: result - 1 }),
					{
						if: ({ result }) => result <= 0,
						then: () => ({ [S.Return]: 66 }),
						else: 0
					}
				])
					.defaults({
						result: -1,
					})
				return instance({
					result: 6,
				})
			}, 66)
		),
		D('Can return object as state change',
			E.is(() => {
				const instance = new S(() => ({ result: 66 }))
					.defaults({
						result: 0,
					})
				return instance({
					result: 99
				})
			}, 66)
		),
	),

	D('Wrapping',
		D('Can use other machine as step',
			E.is(() => {
				const instance = new S({
					initial: [
						({ input }) => ({ realInput: input }),
						'testEnd'
					],
					testEnd: {
						if: ({ realInput }) => realInput <= 1,
						then: ({ stack }) => ({ [S.Return]: stack.join('_') }),
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
						.result(({result}) => ({ result })),
						({ realInput }) => ({ realInput: realInput - 1}),
						({ stack,result }) => ({ stack: [...stack,result]}),
						'testEnd'
					]
				})
					.defaults({
						input: 1,
						realInput: 1,
						result: 1,
						stack: [],
					})
				return instance({
					input: 10
				})
			}, '3628800_362880_40320_5040_720_120_24_6_2')
		),
		D('Can use other machine step as own step',
			E.is(() => {
				const instance = new S({
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
							[S.Path]: subPath
						})).result(({ [S.Path]: subPath, [S.Return]: subDone = false, ...subState }) => ({
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
							then: ({ resultList }) => ({ [S.Return]: resultList.join('_') }),
							else: 'cradle'
						}
					]
				})
					.defaults({
						input: 1,
						resultList: [],
						subState: {},
						subPath: [],
						subDone: false,
					})
				return instance({
					input: 10,
				})
			}, '1_2_6_24_120_720_5040_40320_362880_3628800')
		),
	),
),

D('Examples',
	D('7 bang is 5040',
		E.is(() => {
			const instance = new S([
				({ result, input }) => ({ result: result * input }),
				({ input }) => ({ input: input-1 }),
				{
					if: ({ input }) => input > 1,
					then: 0
				}
			],)
				.defaults({
					result: 1,
					input: 1,
				})
			return instance({
				input: 7
			})
		}, 5040)
	),
	D('12th fibonacci number is 144',
		E.is(() => {
			const instance = new S({
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
						else: S.Return,
					}
				]
			})
				.defaults({
					input: 1,
					result: 0,
					result2: 0,
				})
			return instance({
				input: 12,
			})
		}, 144)
	),
	D('12th fibonacci number is 144 (described)',
		E.is(() => {
			const instance = new S({
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
			})
				.with(describedPlugin({
					transitions: {
						exitOrLoop: {
							if: ({ input }) => input > 1,
							then: 'fib',
							else: S.Return,
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
				}))
				.defaults({
					input: 1,
					result: 0,
					result2: 0,
				})
			return instance({
				input: 12,
			})
		}, 144)
	),
	D('Parallel',
		D('Can perform parallel actions when using async.',
			E.is(() => {
				const instance = new S([
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
					({ result }) => ({ [S.Return]: result.join('_') })
				]).defaults( {
						input: 0,
						result: []
					})
					.async
					.with(parallelPlugin)
				return instance({
					input: 10 
				})
			}, '9_7')
		),
		D('Cannot perform parallel actions when not using async.',
			E.is(() => {
				const instance = new S([
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
					({ result }) => ({ [S.Return]: result.join('_') })
				])
					.defaults({
						input: 0,
						result: []
					}).with(parallelPlugin)
				return instance({
					input: 10 
				})
			}, '9_8_6')
		),
	),
	D('Events',
		D('Fibonacci numbers (events)',
			E.is(async () => {
				const instance = new S({
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
							kill: S.Return,
						}
					}
				})
					.defaults({
						input: 1,
						result: 0,
						result2: 0,
					})
					.async
					.with(eventsPlugin({
						nextNumber: {},
						getResult: {},
						kill: {},
					}))
				const runningInstance = instance({input:12})
				let results = []
				runningInstance.subscribe((event) => {
					if (event.name === 'result') {
						results.push(event.data)
					}
				});
				runningInstance.send('getResult')
				runningInstance.send('nextNumber')
				runningInstance.send('getResult')
				runningInstance.send('getResult')
				runningInstance.send('nextNumber')
				runningInstance.send('getResult')
				runningInstance.send('kill')
				await runningInstance
				return results.join('_')
			}, '144_233_233_377')
		),
		D('Fibonacci numbers (events + described)',
			E.is(async () => {
				const instance = new S({
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
							kill: S.Return,
						}
					}
				})
					.defaults({
						input: 1,
						result: 0,
						result2: 0,
					})
					.async
					.with(describedPlugin({
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
					}), eventsPlugin({
						nextNumber: {},
						getResult: {},
						kill: {},
					}))
				const runningInstance = instance({input:12})
				let results = []
				runningInstance.subscribe((event) => {
					if (event.name === 'result') {
						results.push(event.data)
					}
				});
				runningInstance.send('getResult')
				runningInstance.send('nextNumber')
				runningInstance.send('getResult')
				runningInstance.send('getResult')
				runningInstance.send('nextNumber')
				runningInstance.send('getResult')
				runningInstance.send('kill')
				await runningInstance
				return results.join('_')
			}, '144_233_233_377')
		),
	),
),
)

export default description
