import D, { E, JS, TS, CS } from './d.js'
import S, { clone_object, NodeDefinition, normalise_function, StateReferenceError, StateTypeError, unique_list_strings, wait_time } from '../index.js'
import * as testModule from '../index.js'
import describedPlugin, { a, c, t } from '../plugin/described.js'
import eventsPlugin, { emit } from '../plugin/events.js'
import parallelPlugin, { parallel } from '../plugin/parallel.js'
import { get_path_object } from '../index.js'
import { deep_merge_object } from '../index.js'
import { UndefinedNodeError } from '../index.js'
import { MaxIterationsError } from '../index.js'

const symbols = {
	'S.Path': S.Path,
	'S.Changes': S.Changes,
	'S.Return': S.Return,
	'S.StrictTypes': S.StrictTypes,
}

const commonGenericDefinitionInner = `
	State extends InitialState = { [KeyWords.RS]: undefined },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State, Result>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
`
const commonGenericDefinition = `<${commonGenericDefinitionInner}>`
const commonGenericArguments = `<State, Result, Input, Action, Process>`

const description = D('Super Small State Machine',
D('Language',
	'A process is made of nodes',
	'Nodes are executables or actions',
	'Actions are performed on the state',
	'It then proceeds to the next node',
	'The state is made of properties',
	'The state may be given special system symbols containing execution information',
	'Machines have multiple stages, refered to by strings or symbols',
	'Sequences have multiple indexes, refered to by numbers',
	'Conditions (including switch) have clauses',
),
D('Library Methods',
	D('clone_object (obj)',
		D('Deep clones objects.', E.equals(() => {
			const obj = {a:{b:3},c:5}
			const clone = clone_object(obj)
			return clone !== obj
				&& JSON.stringify(clone) === JSON.stringify(obj)
				&& clone.a !== obj.a
				&& clone.c === obj.c
		}, true)),
		D('This method is exported by the library as `{ clone_object }`',
			E.exports('clone_object', testModule, './index.js')
		),
		JS("export const clone_object = (obj) => {"),
		TS("export const clone_object = <T extends unknown = unknown>(obj: T): T => {"),
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
			JS("if (Array.isArray(obj)) return obj.map(clone_object)"),
			TS("if (Array.isArray(obj)) return obj.map(clone_object) as T"),
		),
		D('Returns null if given null',
			E.equals(() => {
				return clone_object(null)
			}, null),
			JS("if (obj === null) return null"),
			TS("if (obj === null) return null as T")
		),
		D('Returns input if not object',
			E.equals(() => {
				return clone_object('hello')
			}, 'hello'),
			CS("if (typeof obj !== 'object') return obj"),
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
			JS("return Object.fromEntries(Object.entries(obj).map(([key,value]) => [ key, clone_object(value) ]));"),
			TS("return Object.fromEntries(Object.entries(obj).map(([key,value]) => [ key, clone_object(value) ])) as T;")
		),
		CS("}"),
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
		D('This method is exported by the library as `{ unique_list_strings }`',
			E.exports('unique_list_strings', testModule, './index.js'),
		),
		JS("export const unique_list_strings = (list, getId = item => item) => Object.values(Object.fromEntries(list.map(item=>[getId(item),item])));"),
		TS("export const unique_list_strings = <T extends unknown = unknown>(list: Array<T>, getId: ((item: T) => string) = item => item as string): Array<T> => Object.values(Object.fromEntries(list.map(item=>[getId(item),item])));")
	),
	D('reduce_get_path_object (obj, step)',
		'Returns the value at a specific key `step` of the given object `obj`',
		D('This method is not exported by the library.',
			E.notExports('reduce_get_path_object', testModule, './index.js'),
		),
		JS("const reduce_get_path_object = (obj, step) => obj ? obj[step] : undefined"),
		TS("const reduce_get_path_object = <T extends unknown = unknown, O extends unknown = unknown>(obj: T | O | undefined, step: PathUnit): T | undefined => obj ? ((obj as any)[step] as T) : undefined")
	),
	D('get_path_object (object, path)',
		'Return the value at the given `path` in the given `object`',
		E.equals(() => {
			const obj = [
				{
					key: {
						another: { target: 'node' }
					}
				},
				{
					different: { path: 0 }
				}
			]
			const path = [0,'key','another']
			return get_path_object(obj, path)
		}, { target: 'node' }),
		D('This method is exported by the library as `{ get_path_object }`',
			E.exports('get_path_object', testModule, './index.js'),
		),
		JS("export const get_path_object = (object, path) => (path.reduce(reduce_get_path_object, object))"),
		TS("export const get_path_object = <T extends unknown = unknown, O extends unknown = unknown>(object: O, path: Path): undefined | T => (path.reduce(reduce_get_path_object<T,O>, object) as (T | undefined))")
	),
	D('normalise_function (functOrReturn)',
		"Wrap a value in a function, unless it's already one.",
		D("If the value is a function, return it as-is",
			E.is(() => {
				const method = () => {}
				const result = normalise_function(method)
				return result === method
			}, true)
		),
		D("If the value is not a function, return a function that returns that value when called",
			E.is(() => {
				const method = 'value'
				const result = normalise_function(method)
				return result()
			}, 'value')
		),
		D('This method is exported by the library as `{ normalise_function }`',
			E.exports('normalise_function', testModule, './index.js'),
		),
		JS("export const normalise_function = (functOrReturn) => (typeof functOrReturn === 'function') ? functOrReturn : () => functOrReturn"),
		TS("export const normalise_function = (functOrResult: Function | unknown): Function => (typeof functOrResult === 'function') ? functOrResult : () => functOrResult")
	),
	D('reduce_deep_merge_object (base, override)',
		'Merge the given `override` object into the given `base` object.',
		D('This method is not exported by the library',
			E.notExports('reduce_deep_merge_object', testModule, './index.js'),
		),
		JS("const reduce_deep_merge_object = (base, override) => {"),
		TS("const reduce_deep_merge_object = <T extends unknown = unknown>(base: T, override: unknown): T => {"),
		D('If both objects are not pure objects',
			CS("if (!((base && typeof base === 'object') && !Array.isArray(base) && (override && typeof override === 'object') && !Array.isArray(override)))"),
			D('Return the override value',
				JS("return override;"),
				TS("return override as T;")
			),
		),
		D('Get all combined unique keys',
			CS("const allKeys = unique_list_strings(Object.keys(base).concat(Object.keys(override)));"),
		),
		D('Make a new object with the combined keys',
			CS("return Object.fromEntries(allKeys.map(key => ["),
			D('Merge each value recursively if the key exists in both objects',
				JS("key, key in override ? deep_merge_object(base[key], override[key]) : base[key]"),
				TS("key, key in override ? deep_merge_object((base as Record<string,unknown>)[key], (override as Record<string,unknown>)[key]) : (base as Record<string,unknown>)[key]")
			),
			JS("]));"),
			TS("])) as T;")
		),
		CS("}"),
	),
	D('deep_merge_object (base, ...overrides)',
		'Merge each of the given `overrides` into the given `base` object, in the order they are given.',
		D('Deep merges two objects, using the second as the override',
			E.equals(() => {
				return deep_merge_object({
					key1: 'value1',
					key2: {
						key3: 'value3',
						key4: 'value4',
					}
				}, {
					key1: 'value2',
					key2: {
						key3: 'value5'
					}
				})
			}, {
				key1: 'value2',
				key2: {
					key3: 'value5',
					key4: 'value4',
				}
			}),
		),
		D('Does not merge arrays',
			E.equals(() => {
				return deep_merge_object({
					array: [{ deep: 'object' }, 2, 3, 4 ]
				}, {
					array: [{ new: 'value' }, 5, 6 ]
				})
			}, {
				array: [ { new: 'value', deep: undefined }, 5, 6 ]
			}),
		),
		D('If the values have different types, the override is always used without deep merging.',
			E.equals(() => {
				return deep_merge_object({
					original: 'string',
					another: {
						deep: 'object'
					}
				}, {
					original: { new: 'object' },
					another: 'changed'
				})
			}, {
				original: { new: 'object' },
				another: 'changed'
			}),
		),
		D('Does not preserve symbols',
			E.equals(() => {
				const mySymbol = Symbol('My Symbol')
				return deep_merge_object({
					[mySymbol]: 'value'
				}, { })
			}, { }),
		),
		D('Preserves original key order',
			E.equals(() => {
				return Object.keys(deep_merge_object({
					first: 1,
					second: 2,
					third: 3
				}, {
					second: 4,
					first: 5,
				}))
			}, ['first','second','third']),
		),
		D('Merges multiple objects into the base object',
			E.equals(() => {
				return deep_merge_object({
					first: 1,
				}, {
					second: 2,
				}, {
					first: 5,
					third: 3,
				}, {
					first: 6,
					second: 7,
					fourth: 4,
				})
			}, {
				first: 6,
				second: 7,
				third: 3,
				fourth: 4,
			}),
		),
		D('This method is exported by the library as `{ deep_merge_object }`',
			E.exports('deep_merge_object', testModule, './index.js'),
		),
		JS("export const deep_merge_object = (base, ...overrides) => overrides.reduce(reduce_deep_merge_object, base)"),
		TS("export const deep_merge_object = <T extends unknown = unknown>(base: T, ...overrides: Array<unknown>): T => overrides.reduce(reduce_deep_merge_object<T>, base)")
	),
	D('get_closest_path (object, path = [], condition = (node, path, object) => boolean)',
		'Returns the path of the closest node that matches the given `conditon`. It will check all ancestors including the node at the given `path`.',
		D('This method is exported by the library as `{ get_closest_path }`',
			E.exports('get_closest_path', testModule, './index.js'),
		),
		JS("export const get_closest_path = (object, path = [], condition = () => true) => {"),
		TS("export const get_closest_path = <T extends unknown = unknown, O extends unknown = unknown>(object: O, path: Path = [], condition: ((item: T, path: Path, object: O) => boolean) = () => true): Path | null => {"),
		D('Get the object at the given path',
			JS("const item = get_path_object(object, path)"),
			TS("const item = get_path_object<T>(object, path)!")
		),
		D('Check the item against the condition',
			CS("if (condition(item, path, object)) return path"),
		),
		D('If the root node is reached, return `null` (unsuccessful)',
			CS("if (path.length === 0) return null"),
		),
		D('Ascend up the tree',
			CS("return get_closest_path(object, path.slice(0,-1), condition)"),
		),
		CS("}"),
	),
	D('wait_time (delay)',
		'Returns a promise that waits for the given `delay` time before resolving.',
		D('If zero is passed, it resolves as immediately as possible.',
			E.equals(async () => {
				const startTime = Date.now()
				await wait_time(0)
				const endTime = Date.now()
				return endTime - startTime
			}, 0)
		),
		D('It may not be possible to accurately set times less than four ms.',
			E.notEquals(async () => {
				const startTime = Date.now()
				await wait_time(2)
				await wait_time(2)
				const endTime = Date.now()
				return endTime - startTime
			}, 4)
		),
		D('This method is exported by the library as `{ wait_time }`',
			E.exports('wait_time', testModule, './index.js'),
		),
		JS("export const wait_time = delay => (delay ? new Promise(resolve => setTimeout(resolve, delay)) : Promise.resolve())"),
		TS("export const wait_time = (delay: number): Promise<void> => (delay ? new Promise(resolve => setTimeout(resolve, delay)) : Promise.resolve())")
	),
),
D('Errors',
	D('SuperSmallStateMachineError',
		'All Super Small State Machine Errors will inherit from this class.',
		'Allows for contextual information to be provided with the error',
		D('This class is exported by the library as `{ SuperSmallStateMachineError }`',
			E.exports('SuperSmallStateMachineError', testModule, './index.js'),
		),
		JS("export class SuperSmallStateMachineError extends Error {"),
		TS(`export class SuperSmallStateMachineError${commonGenericDefinition} extends Error {`),
		D('Declare contextual properties on the class',
			JS("instance; state; data; path;"),
			TS(`public instance?: Partial<S${commonGenericArguments}>`),
			TS("public state?: SystemState<State, Result>"),
			TS("public data?: any"),
			TS("public path?: Path")
		),
		D('Take in the message, followed by an object conatining the properties',
			JS("constructor(message, { instance, state, data, path } = {}) {"),
			TS(`constructor(message: string, { instance, state, data, path }: Partial<SuperSmallStateMachineError${commonGenericArguments}>) {`),
			D('Create a normal error with the message',
				CS("super(message)"),
			),
			D('Assign the given properties to the instance',
				CS("Object.assign(this, { instance, state, data, path })"),
			),
			CS("}"),
		),
		CS("}"),
	),
	D('SuperSmallStateMachineReferenceError',
		'All Super Small State Machine Reference Errors will inherit from this class',
		D('This class is exported by the library as `{ SuperSmallStateMachineReferenceError }`',
			E.exports('SuperSmallStateMachineReferenceError', testModule, './index.js'),
		),
		JS("export class SuperSmallStateMachineReferenceError extends SuperSmallStateMachineError {}"),
		TS(`export class SuperSmallStateMachineReferenceError${commonGenericDefinition} extends SuperSmallStateMachineError${commonGenericArguments} {}`)
	),
	D('SuperSmallStateMachineTypeError',
		'All Super Small State Machine Type Errors will inherit from this class',
		D('This class is exported by the library as `{ SuperSmallStateMachineTypeError }`',
			E.exports('SuperSmallStateMachineTypeError', testModule, './index.js'),
		),
		JS("export class SuperSmallStateMachineTypeError extends SuperSmallStateMachineError {}"),
		TS(`export class SuperSmallStateMachineTypeError${commonGenericDefinition} extends SuperSmallStateMachineError${commonGenericArguments} {}`)
	),
	D('StateReferenceError',
		'A state change has set a property that was not defined in the original state defaults.',
		'This is likely intentional, as this is not default behaviour.',
		D('This class is exported by the library as `{ StateReferenceError }`',
			E.exports('StateReferenceError', testModule, './index.js'),
		),
		JS("export class StateReferenceError extends SuperSmallStateMachineReferenceError {}"),
		TS(`export class StateReferenceError${commonGenericDefinition} extends SuperSmallStateMachineReferenceError${commonGenericArguments} {}`)
	),
	D('StateTypeError',
		'A state change has updated a property that was defined as a different type in the original state defaults.',
		'This is likely intentional, as this is not default behaviour.',
		D('This class is exported by the library as `{ StateTypeError }`',
			E.exports('StateTypeError', testModule, './index.js'),
		),
		JS("export class StateTypeError extends SuperSmallStateMachineTypeError {}"),
		TS(`export class StateTypeError${commonGenericDefinition} extends SuperSmallStateMachineTypeError${commonGenericArguments} {}`)
	),
	D('NodeTypeError',
		'A node of an unknown type was used in a process.',
		'This was probably caused by a custom node definition',
		D('This class is exported by the library as `{ NodeTypeError }`',
			E.exports('NodeTypeError', testModule, './index.js'),
		),
		JS("export class NodeTypeError extends SuperSmallStateMachineTypeError {}"),
		TS(`export class NodeTypeError${commonGenericDefinition} extends SuperSmallStateMachineTypeError${commonGenericArguments} {}`)
	),
	D('UndefinedNodeError',
		'An undefined node was used in a process.',
		'This is probably caused by a missing variable.',
		'If you wish to perform an intentional no-op, use `null`',
		D('This class is exported by the library as `{ UndefinedNodeError }`',
			E.exports('UndefinedNodeError', testModule, './index.js'),
		),
		JS("export class UndefinedNodeError extends SuperSmallStateMachineReferenceError {}"),
		TS(`export class UndefinedNodeError${commonGenericDefinition} extends SuperSmallStateMachineReferenceError${commonGenericArguments} {}`)
	),
	D('MaxIterationsError',
		'The execution of the process took more iterations than was allowed.',
		'This can be configured using `.for` or `.forever`',
		D('This class is exported by the library as `{ MaxIterationsError }`',
			E.exports('MaxIterationsError', testModule, './index.js'),
		),
		JS("export class MaxIterationsError extends SuperSmallStateMachineError {}"),
		TS(`export class MaxIterationsError${commonGenericDefinition} extends SuperSmallStateMachineError${commonGenericArguments} {}`)
	),
	D('PathReferenceError',
		'A path was referenced which could not be found in the given process.',
		D('This class is exported by the library as `{ PathReferenceError }`',
			E.exports('PathReferenceError', testModule, './index.js'),
		),
		JS("export class PathReferenceError extends SuperSmallStateMachineReferenceError {}"),
		TS(`export class PathReferenceError${commonGenericDefinition} extends SuperSmallStateMachineReferenceError${commonGenericArguments} {}`)
	),
),
D('Node Types',
	'The string names of node types, index by two-letter abbreviations',
	D('This reference table is exported by the library as `{ NodeTypes }`',
		E.exports('NodeTypes', testModule, './index.js'),
	),
	JS("export const NodeTypes = {"),
	TS("export enum NodeTypes {"),
	D('Undefined Node',
		JS("UN: 'undefined',"),
		TS("UN = 'undefined',")
	),
	D('Empty Node',
		JS("EM: 'empty',"),
		TS("EM = 'empty',")
	),
	D('Return Node',
		JS("RT: 'return',"),
		TS("RT = 'return',")
	),
	D('Function Node',
		JS("FN: 'function',"),
		TS("FN = 'function',")
	),
	D('Sequence Node',
		JS("SQ: 'sequence',"),
		TS("SQ = 'sequence',")
	),
	D('Condition Node',
		JS("CD: 'condition',"),
		TS("CD = 'condition',")
	),
	D('Switch Node',
		JS("SW: 'switch',"),
		TS("SW = 'switch',")
	),
	D('Machine Node',
		JS("MC: 'machine',"),
		TS("MC = 'machine',")
	),
	D('Changes Node',
		JS("CH: 'changes',"),
		TS("CH = 'changes',")
	),
	D('Directive Node',
		JS("DR: 'directive',"),
		TS("DR = 'directive',")
	),
	D('Absolute Directive Node',
		JS("AD: 'absolute-directive',"),
		TS("AD = 'absolute-directive',")
	),
	D('Machine Directive Node',
		JS("MD: 'machine-directive',"),
		TS("MD = 'machine-directive',")
	),
	D('Sequence Directive Node',
		JS("SD: 'sequence-directive',"),
		TS("SD = 'sequence-directive',")
	),
	CS("}"),
),
D('Key Words',
	'Key Words used by specific nodes',
	D('This reference table is exported by the library as `{ KeyWords }`',
		E.exports('KeyWords', testModule, './index.js'),
	),
	JS("export const KeyWords = {"),
	TS("export enum KeyWords {"),
	D("`'if'` used by Condition Node",
		JS("IF: 'if',"),
		TS("IF = 'if',")
	),
	D("`'then'` used by Condition Node",
		JS("TN: 'then',"),
		TS("TN = 'then',")
	),
	D("`'else'` used by Condition Node",
		JS("EL: 'else',"),
		TS("EL = 'else',")
	),
	D("`'switch'` used by Switch Node",
		JS("SW: 'switch',"),
		TS("SW = 'switch',")
	),
	D("`'case'` used by Switch Node",
		JS("CS: 'case',"),
		TS("CS = 'case',")
	),
	D("`'default'` used by Switch Node",
		JS("DF: 'default',"),
		TS("DF = 'default',")
	),
	D("`'initial'` used by Machine Node",
		JS("IT: 'initial',"),
		TS("IT = 'initial',")
	),
	D("`'result'` used by Changes Node",
		'is the default property on the state.',
		'Should be used for pasing in arguments to actions, and returning a value from the machine itself.',
		JS("RS: 'result',"),
		TS("RS = 'result',")
	),
	CS("}"),
),
D('Node Definitions',
	'Extends the Map class.',
	D('This class is exported by the library as `{ NodeDefinitions }`',
		E.exports('NodeDefinitions', testModule, './index.js'),
	),
	JS("export class NodeDefinitions extends Map {"),
	TS(`export class NodeDefinitions${commonGenericDefinition} extends Map<NodeDefinition['name'], NodeDefinition<Process, Action, State, Result, Input, Action, Process>> {`),
	D('Takes in a list of nodes and acts as a collection-object for them',
		JS("constructor(...nodes) { super(nodes.flat(Infinity).map(node => [node.name,node])) }"),
		TS("constructor(...nodes: Array<NodeDefinition<Process, Action, State, Result, Input, Action, Process>>) { super(nodes.flat(Infinity).map(node => [node.name,node])) }")
	),
	D('Provides a typeof method that checks the given `object` against the node definitions and returns the name of the node.',
		JS("typeof(object, objectType = typeof object, isAction = false) {"),
		TS("typeof(object: unknown, objectType: (typeof object) = typeof object, isAction: boolean = false): false | NodeDefinition['name'] {"),
		D('Search from last to first to allow easy overriding',
			'Newer types override older types',
			JS("const foundType = [...this.values()].findLast(current => current.typeof && current.typeof(object, objectType, isAction))"),
			TS("const foundType = [...this.values()].reverse().find(current => current.typeof && current.typeof(object, objectType, isAction))")
		),
		D('Return the name of the type if the type is found, otherwise return false',
			CS("return foundType ? foundType.name : false"),
		),
		CS("}"),
	),
	CS("}"),
),
D('Node Definition',
	D('This class is exported by the library as `{ NodeDefinition }`',
		E.exports('NodeDefinition', testModule, './index.js'),
	),
	JS("export class NodeDefinition {"),
	TS(`export class NodeDefinition<
	SelfType extends unknown = never,
	SelfActionType extends unknown = never,${commonGenericDefinitionInner}> {`),
	D('The name will deafault to "Unnamed node", but will be a unique symbol each time',
		JS("static name = Symbol('Unnamed node')"),
		TS("public readonly name: string | symbol = Symbol('Unnamed node')")
	),
	D('The typeof method will be null by default.',
		JS("static typeof = null;"),
		TS("public readonly typeof: ((object: unknown, objectType: typeof object, isAction: boolean) => object is SelfType) | null = null"),
	),
	D('The execute method will be null by default.',
		JS("static execute = null;"),
		TS("public readonly execute: ((node: SelfType, state: SystemState<State, Result>) => Action | Promise<Action>) | null = null")
	),
	D('The proceed method will be null by default.',
		JS("static proceed = null;"),
		TS("public readonly proceed: ((parPath: Path, state: SystemState<State, Result>, path: Path) => undefined | null | Path) | null = null")
	),
	D('The perform method will be null by default.',
		JS("static perform = null;"),
		TS("public readonly perform: ((action: SelfActionType, state: SystemState<State, Result>) => SystemState<State, Result>) | null = null")
	),
	D('The traverse method will be null by default.',
		JS("static traverse = null;"),
		TS(`public readonly traverse: ((item: SelfType, path: Path, iterate: ((path: Path) => SelfType), post: ((item: SelfType, path: Path) => SelfType)) => SelfType) | null = null`)
	),
	D('Typescript requires us to do this through a constructor for some reason. This should probably be fixed.',
		TS("constructor(name: NodeDefinition['name'], { execute = null, typeof: typeofMethod = null, proceed = null, perform = null, traverse = null }: Partial<Pick<NodeDefinition<SelfType, SelfActionType, State, Result, Input, Action, Process>, 'execute' | 'proceed' | 'typeof' | 'perform' | 'traverse'>>) {"),
		D('Assigns the given properties to the new instance',
			TS("this.name = name"),
			TS("this.execute = execute"),
			TS("this.typeof = typeofMethod"),
			TS("this.proceed = proceed"),
			TS("this.perform = perform"),
			TS("this.traverse = traverse"),
		),
		TS("}"),
	),
	CS("}"),
	CS("export const N = NodeDefinition"),
),

D('exitFindNext (action, state)',
	'TODO: merge into S._proceed? or S._perform?',
	JS("const exitFindNext = function (action, state) {"),
	TS("const exitFindNext = function (this: S, _: ActionNode, state: SystemState) {"),
	D('Attempts to proceed to the next path',
		CS("const path = S._proceed(this, state)"),
	),
	D('If it fails, we should return',
		CS("return path ? { ...state, [S.Path]: path } : { ...state, [S.Return]: undefined }"),
	),
	CS("}")
),
D('Extra types',
	TS(`export interface InitialState {
	[KeyWords.RS]: unknown,
	[key: string]: unknown,
}
export type SystemState<State extends InitialState = { [KeyWords.RS]: undefined }, Result extends unknown = State[KeyWords.RS]> = State & {
	[S.Path]: Path
	[S.Changes]: Partial<State>
	[S.Return]?: Result | undefined
}
export type InputSystemState<State extends InitialState = { [KeyWords.RS]: undefined }, Result extends unknown = State[KeyWords.RS]> = State & Partial<Pick<SystemState<State, Result>, typeof S.Path | typeof S.Return>>

export interface Config<
	State extends InitialState = { [KeyWords.RS]: undefined },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State, Result>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
> {
	defaults: State,
	iterations: number,
	until: (state: SystemState<State, Result>) => boolean,
	strict: boolean | typeof S.StrictTypes,
	override: null | ((...args: Input) => Result),
	adapt: Array<(process: Process) => Process>,
	adaptStart: Array<(state: SystemState<State, Result>) => SystemState<State, Result>>,
	adaptEnd: Array<(state: SystemState<State, Result>) => SystemState<State, Result>>,
	input: (...input: Input) => Partial<InputSystemState<State, Result>>,
	result: (state: SystemState<State, Result>) => Result,
	nodes: NodeDefinitions<State, Result, Input, Action, Process>,
	async: boolean,
	pause: (state: SystemState<State, Result>, runs: number) => false | Promise<any>
}`)
),

D('Default Nodes',
	D('Changes Node',
		'Updates the state by deep-merging the properties. Arrays will not be deep merged.',
		D('Overrides existing properties when provided',
			E.is(() => {
				const instance = new S({ result: 'overridden' })
				return instance({ result: 'start' })
			}, 'overridden'),
		),

		D('Adds new properties while preserving existing properties',
			E.equals(() => {
				const instance = new S({ result: { newValue: true } })
				return instance({ result: { existingValue: true } })
			}, {
				existingValue: true,
				newValue: true
			}),
		),
		D('This definition is exported by the library as `{ ChangesNode }`',
			E.exports('ChangesNode', testModule, './index.js'),
		),
		TS("export type ChangesNode<State extends InitialState = { [KeyWords.RS]: undefined }> = Partial<State>"),
		JS("export class ChangesNode extends NodeDefinition {"),
		TS("const ChangesNode = new N<ChangesNode,ChangesNode>(NodeTypes.CH, {"),
		D('Use the `NodeTypes.CH` (changes) value as the name.',
			JS("static name = NodeTypes.CH")
		),
		D('Any object not caught by other conditions should qualify as a state change.',
			JS("static typeof(object, objectType) { return Boolean(object && objectType === 'object') }"),
			TS("typeof(this: S, object, objectType): object is ChangesNode { return Boolean(object && objectType === 'object') },")
		),
		D('Apply the changes to the state and step forward to the next node',
			JS("static perform(action, state) { return exitFindNext.call(this, action, S._changes(this, state, action)) }"),
			TS("perform(this: S, action, state) { return exitFindNext.call(this, action, S._changes(this, state, action)) }"),
		),
		JS("}"),
		TS("})")
	),
	D('Sequence Node',
		'Sequences are lists of nodes and executables, they will visit each node in order and exit when done.',
		D('Sequences will execute each index in order',
			E.is(() => {
				const instance = new S([
					({ result }) => ({ result: result + ' addition1' }),
					({ result }) => ({ result: result + ' addition2' }),
				])
				return instance({ result: 'start' })
			}, 'start addition1 addition2'),
		),
		D('This definition is exported by the library as `{ SequenceNode }`',
			E.exports('SequenceNode', testModule, './index.js'),
		),
		TS("export type SequenceNode<State extends InitialState = { [KeyWords.RS]: undefined }, Result extends unknown = State[KeyWords.RS], Action extends unknown = ActionNode<State, Result>> = Array<ProcessNode<State, Result, Action>>"),
		JS("export class SequenceNode extends NodeDefinition {"),
		TS("const SequenceNode = new N<SequenceNode, Path>(NodeTypes.SQ, {"),
		D('Use the `NodeTypes.SQ` (sequence) value as the name.',
			JS("static name = NodeTypes.SQ")
		),
		D('Proceed by running the next item in the sequence',
			JS("static proceed(parPath, state, path) {"),
			TS("proceed(this: S, parPath, state, path) {"),
			D('Get the sequence at the path',
				JS("const parActs = get_path_object(this.process, parPath)"),
				TS("const parActs = get_path_object<SequenceNode>(this.process, parPath)"),
			),
			D('Get the current index in this sequence from the path',
				JS("const childItem = path[parPath.length]"),
				TS("const childItem = path[parPath.length] as number"),
			),
			D('Increment the index, unless the end has been reached',
				CS("if (parActs && childItem+1 < parActs.length) return [ ...parPath, childItem+1 ]"),
			),
			JS("}"),
			TS("},")
		),
		D('A sequence is an array. A sequence cannot be an action, that will be interpreted as an absolute-directive.',
			JS("static typeof(object, objectType, isAction) { return ((!isAction) && objectType === 'object' && Array.isArray(object)) }"),
			TS("typeof(this: S, object, objectType, isAction): object is SequenceNode { return ((!isAction) && objectType === 'object' && Array.isArray(object)) },")
		),
		D('Execute a sequence by directing to the first node (so long as it has nodes)',
			JS("static execute(node, state) { return node.length ? [ ...state[S.Path], 0 ] : null }"),
			TS("execute(this: S, node, state) { return node.length ? [ ...state[S.Path], 0 ] : null },"),
		),
		D('Traverse a sequence by iterating through each item in the array.',
			JS("static traverse(item, path, iterate, post) { return item.map((_,i) => iterate([...path,i])) }"),
			TS("traverse(this: S, item, path, iterate, post) { return item.map((_,i) => iterate([...path,i])) },")
		),
		JS("}"),
		TS("})"),
	),
	D('Function Node',
		'The only argument to the function will be the state.',
		'You can return any of the previously mentioned action types from a function, or return nothing at all for a set-and-forget action.',
		D('A function can return a state change',
			E.is(() => {
				const instance = new S(({ result }) => ({ result: result + ' addition' }))
				return instance({ result: 'start' })
			}, 'start addition'),
		),
		D('A function can return a directive',
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
		),
		D('A function can return a return statement',
			E.is(() => {
				const instance = new S(() => ({ [S.Return]: 'changed' }))
				return instance({ result: 'start' })
			}, 'changed'),
		),
		D('A function can do anything without needing to return (set and forget)',
			E.is(() => {
				const instance = new S(() => {
					// Arbitrary code
				})
				return instance({ result: 'start' })
			}, 'start'),
		),

		D('This definition is exported by the library as `{ FunctionNode }`',
			E.exports('FunctionNode', testModule, './index.js'),
		),
		TS("export type FunctionNode<State extends InitialState = { [KeyWords.RS]: undefined }, Result extends unknown = State[KeyWords.RS], Action extends unknown = ActionNode<State, Result>> = (state: SystemState<State, Result>) => Action | Promise<Action>"),
		JS("export class FunctionNode extends NodeDefinition {"),
		TS("const FunctionNode = new N<FunctionNode>(NodeTypes.FN, {"),
		D('Use the `NodeTypes.FN` (function) value as the name.',
			JS("static name = NodeTypes.FN")
		),
		D('A function is a JS function. A function cannot be an action.',
			JS("static typeof(object, objectType, isAction) { return (!isAction) && objectType === 'function' }"),
			TS("typeof(this: S, object, objectType, isAction): object is FunctionNode { return (!isAction) && objectType === 'function' },")
		),
		D('Exectute a functon by running it, passing in the state.',
			JS("static execute(node, state) { return node(state) }"),
			TS("execute(this: S, node, state) { return node(state) },")
		),
		JS("}"),
		TS("})"),
	),
	D('Undefined Node',
		D('This definition is exported by the library as `{ UndefinedNode }`',
			E.exports('UndefinedNode', testModule, './index.js'),
		),
		JS("export class UndefinedNode extends NodeDefinition {"),
		TS("const UndefinedNode = new N<undefined,undefined>(NodeTypes.UN, {"),
		D('Use the `NodeTypes.UN` (undefined) value as the name.',
			JS("static name = NodeTypes.UN")
		),
		D('Undefined is the `undefined` keyword.',
			JS("static typeof(object, objectType) { return objectType === 'undefined' }"),
			TS("typeof(this: S, object, objectType): object is undefined { return objectType === 'undefined' },")
		),
		D('Un undefined node cannot be executed, throw an error to help catch incorrect configuration.',
			E.error(() => {
				const instance = new S([undefined])
				return instance()
			}, UndefinedNodeError),
			JS("static execute(node, state) { throw new UndefinedNodeError(`There is nothing to execute at path [ ${state[S.Path].map(key => key.toString()).join(', ')} ]`, { instance: this, state, path: state[S.Path], data: { node } }) }"),
			TS("execute(this: S, node, state) { throw new UndefinedNodeError(`There is nothing to execute at path [ ${state[S.Path].map(key => key.toString()).join(', ')} ]`, { instance: this, state, data: {node}, path: state[S.Path] }) },")
		),
		D('When used as an action, undefined only moves to the next node.',
			E.equals(() => {
				const instance = new S([() => undefined, { result: 'second' }])
				return instance({ result: 'start' })
			}, 'second'),
			JS("static perform = exitFindNext"),
			TS("perform: exitFindNext")
		),
		JS("}"),
		TS("})")
	),
	D('Empty Node',
		D('This definition is exported by the library as `{ EmptyNode }`',
			E.exports('EmptyNode', testModule, './index.js'),
		),
		JS("export class EmptyNode extends NodeDefinition {"),
		TS("const EmptyNode = new N<null,null>(NodeTypes.EM, {"),
		D('Use the `NodeTypes.EM` (empty) value as the name.',
			JS("static name = NodeTypes.EM")
		),
		D('Empty is the `null` keyword.',
			JS("static typeof(object, objectType) { return object === null }"),
			TS("typeof: (object, objectType): object is null => object === null,"),
		),
		D('Empty is a no-op, and will do nothing except move to the next node',
			E.equals(() => {
				const instance = new S([null, { result: 'second' }, () => null])
				return instance({ result: 'start' })
			}, 'second'),
			JS("static perform = exitFindNext"),
			TS("perform: exitFindNext"),
		),
		JS("}"),
		TS("})"),
	),
	D('Condition Node',
		TS(`export interface ConditionNode<
			State extends InitialState = { [KeyWords.RS]: undefined },
			Result extends unknown = State[KeyWords.RS],
			Action extends unknown = ActionNode<State, Result>,
		> {
			[KeyWords.IF]: (state: SystemState<State, Result>) => boolean,
			[KeyWords.TN]?: ProcessNode<State, Result, Action>
			[KeyWords.EL]?: ProcessNode<State, Result, Action>
		}`),
		D('This definition is exported by the library as `{ ConditionNode }`',
			E.exports('ConditionNode', testModule, './index.js'),
		),
		JS("export class ConditionNode extends NodeDefinition {"),
		TS("const ConditionNode = new N<ConditionNode>(NodeTypes.CD, {"),
		D('Use the `NodeTypes.CD` (condition) value as the name.',
			JS("static name = NodeTypes.CD")
		),
		D("A condition is an object with the `'if'` property. A condition cannot be an action.",
			JS("static typeof(object, objectType, isAction) { return Boolean((!isAction) && object && objectType === 'object' && (KeyWords.IF in object)) }"),
			TS("typeof: (object, objectType, isAction): object is ConditionNode => Boolean((!isAction) && object && objectType === 'object' && (KeyWords.IF in (object as object))),")
		),
		D("Execute a condition by evaluating the `'if'` property and directing to the `'then'` or `'else'` clauses",
			JS("static execute(node, state) {"),
			TS("execute: (node, state) => {"),
			D("Evaluate the `'if'` property as a function that depends on the state.",
				CS("if (normalise_function(node[KeyWords.IF])(state))"),
			),
			D("If truthy, direct to the `'then'` clause if it exists",
				E.is(() => {
					const instance = new S({
						if: ({ result }) => result === 'start',
						then: { result: 'truthy' },
						else: { result: 'falsey' },
					})
					return instance({ result: 'start' })
				}, 'truthy'),
				CS("return KeyWords.TN in node ? [ ...state[S.Path], KeyWords.TN ] : null"),
			),
			D("Otherwise, direct to the `'else'` clause if it exists",
				E.is(() => {
					const instance = new S({
						if: ({ result }) => result === 'start',
						then: { result: 'truthy' },
						else: { result: 'falsey' },
					})
					return instance({ result: 'other' })
				}, 'falsey'),
				CS("return KeyWords.EL in node ? [ ...state[S.Path], KeyWords.EL ] : null"),
			),
			JS("}"),
			TS("},")
		),
		D('Traverse a condition by iterating on the then and else clauses.',
			'Run `post` on the result to allow the interception of the condition method.',
			JS("static traverse(item, path, iterate, post) { return post({"),
			TS("traverse: (item, path, iterate, post) => { return post({"),
			D('Copy over the original properties to preserve any custom symbols.',
				CS("...item,"),
			),
			D("Copy over the `'if'` property",
				CS("[KeyWords.IF]: item[KeyWords.IF],"),
			),
			D("Iterate on the `'then'` clause if it exists",
				CS("...(KeyWords.TN in item ? { [KeyWords.TN]: iterate([...path,KeyWords.TN]) } : {}),"),
			),
			D("Iterate on the `'else'` clause if it exists",
				CS("...(KeyWords.EL in item ? { [KeyWords.EL]: iterate([...path,KeyWords.EL]) } : {})"),
			),
			CS("}, path) }"),
		),
		JS("}"),
		TS("})")
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
		D('This definition is exported by the library as `{ SwitchNode }`',
			E.exports('SwitchNode', testModule, './index.js'),
		),
		TS(`export interface SwitchNode<
			State extends InitialState = { [KeyWords.RS]: undefined },
			Result extends unknown = State[KeyWords.RS],
			Action extends unknown = ActionNode<State, Result>,
		> {
			[KeyWords.SW]: (state: SystemState<State, Result>) => string | number,
			[KeyWords.CS]: Record<string | number, ProcessNode<State, Result, Action>>
		}`),
		JS("export class SwitchNode extends NodeDefinition {"),
		TS("const SwitchNode = new N<SwitchNode>(NodeTypes.SW, {"),
		D('Use the `NodeTypes.SW` (switch) value as the name.',
			JS("static name = NodeTypes.SW")
		),
		D("A switch node is an object with the `'switch'` property.",
			JS("static typeof(object, objectType, isAction) { return Boolean((!isAction) && object && objectType === 'object' && (KeyWords.SW in object)) }"),
			TS("typeof: (object, objectType, isAction): object is SwitchNode => Boolean((!isAction) && object && objectType === 'object' && (KeyWords.SW in (object as object))),")
		),
		D("Execute a switch by evaluating the `'switch'` property and directing to the approprtate `'case'` clause.",
			JS("static execute(node, state) {"),
			TS("execute: (node, state) => {"),
			D("Evaluate the `'switch'` property as a function that returns a key.",
				CS("const key = normalise_function(node[KeyWords.SW])(state)"),
			),
			D("If the key exists in the `'case'` caluses, use the key, otherwise use the `'default'` clause",
				CS("const fallbackKey = (key in node[KeyWords.CS]) ? key : KeyWords.DF"),
			),
			D("Check again if the key exists (`'default'` clause may not be defined), if it does, redirect to the case, otherwise do nothing.",
				CS("return (fallbackKey in node[KeyWords.CS]) ? [ ...state[S.Path], KeyWords.CS, fallbackKey ] : null"),
			),
			JS("}"),
			TS("},"),
		),
		D("Traverse a switch by iterating over the `'case'` clauses",
			JS("static traverse(item, path, iterate, post) { return post({"),
			TS("traverse: (item, path, iterate, post) => { return post({"),
			D('Copy over the original properties to preserve any custom symbols.',
				CS("...item,"),
			),
			D("Copy over the `'switch'` property",
				CS("[KeyWords.SW]: item[KeyWords.SW],"),
			),
			D("Iterate over each of the `'case'` clauses.",
				CS("[KeyWords.CS]: Object.fromEntries(Object.keys(item[KeyWords.CS]).map(key => [ key, iterate([...path,KeyWords.CS,key]) ])),"),
			),
			CS("}, path) }"),
		),
		JS("}"),
		TS("})"),
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
		D('This definition is exported by the library as `{ MachineNode }`',
			E.exports('MachineNode', testModule, './index.js'),
		),
		TS(`export interface MachineNode<
			State extends InitialState = { [KeyWords.RS]: undefined },
			Result extends unknown = State[KeyWords.RS],
			Action extends unknown = ActionNode<State, Result>,
		> {
			[KeyWords.IT]: ProcessNode<State, Result, Action>
			[key: string | number | symbol]: ProcessNode<State, Result, Action>
		}`),
		JS("export class MachineNode extends NodeDefinition {"),
		TS("const MachineNode = new N<MachineNode>(NodeTypes.MC, {"),
		D('Use the `NodeTypes.MC` (machine) value as the name.',
			JS("static name = NodeTypes.MC")
		),
		D("A machine is an object with the `'initial'` property. A machine cannot be used as an action.",
			JS("static typeof(object, objectType, isAction) { return Boolean((!isAction) && object && objectType === 'object' && (KeyWords.IT in object)) }"),
			TS("typeof: (object, objectType, isAction): object is MachineNode => Boolean((!isAction) && object && objectType === 'object' && (KeyWords.IT in (object as object))),")
		),
		D("Execute a machine by directing to the `'initial'` stages.",
			JS("static execute(node, state) { return [ ...state[S.Path], KeyWords.IT ] }"),
			TS("execute: (node, state) => [ ...state[S.Path], KeyWords.IT ],"),
		),
		D('Traverse a machine by iterating over all the stages',
			JS("static traverse(item, path, iterate, post) { return post({"),
			TS("traverse: (item, path, iterate, post) => { return post({"),
			D('Copy over the original properties to preserve any custom symbols.',
				CS("...item,"),
			),
			D("Iterate over each of the stages.",
				CS("...Object.fromEntries(Object.keys(item).map(key => [ key, iterate([...path,key]) ]))"),
			),
			CS("}, path) }"),
		),
		JS("}"),
		TS("})")
	),
	D('Directive Node',
		D('Transitioning is also possible by using and object with the `S.Path` key set to a relative or absolute path. This is not recommended as it is almost never required, it should be considered system-only.',
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
		),
		D('It is not possible to send any other information in this object, such as a state change.',
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
		),
		D('This definition is exported by the library as `{ DirectiveNode }`',
			E.exports('DirectiveNode', testModule, './index.js'),
		),
		TS("export type DirectiveNode = { [S.Path]: AbsoluteDirectiveNode | SequenceDirectiveNode | MachineDirectiveNode }"),
		JS("export class DirectiveNode extends NodeDefinition {"),
		TS("const DirectiveNode = new N<DirectiveNode, DirectiveNode>(NodeTypes.DR, {"),
		D('Use the `NodeTypes.DR` (directive) value as the name.',
			JS("static name = NodeTypes.DR")
		),
		D('A directive is an object with the `S.Path` property.',
			JS("static typeof(object, objectType, isAction) { return Boolean(object && objectType === 'object' && (S.Path in object)) }"),
			TS("typeof(this: S, object, objectType, isAction): object is DirectiveNode { return Boolean(object && objectType === 'object' && (S.Path in (object as object))) },")
		),
		D('A directive is performed by performing the value of the `S.Path` property to allow for using absolute or relative directives',
			JS("static perform(action, state) { return S._perform(this, state, action[S.Path]) }"),
			TS("perform(this: S, action, state) { return S._perform(this, state, action[S.Path]) }")
		),
		JS("}"),
		TS("})")
	),
	D('Sequence Directive Node',
		D('Numbers indicate a goto for a sequence. It is not recommended to use this as it may be unclear, but it must be possible, and should be considered system-only.',
			E.is(() => {
				const instance = new S([
					{ result: 'first' },
					4,
					{ result: 'skip' },
					S.Return,
					{ result: 'second' },
				])
				return instance({ result: 'start' })
			}, 'second')
		),
		D('Slightly less not recommended is transitioning in a sequence conditonally. If you\'re making an incredibly basic state machine this is acceptable.',
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
		),
		D('This definition is exported by the library as `{ SequenceDirectiveNode }`',
			E.exports('SequenceDirectiveNode', testModule, './index.js'),
		),
		TS("export type SequenceDirectiveNode = number"),
		JS("export class SequenceDirectiveNode extends DirectiveNode {"),
		TS("const SequenceDirectiveNode = new N<SequenceDirectiveNode, SequenceDirectiveNode>(NodeTypes.SD, {"),
		D('Use the `NodeTypes.SD` (sequence-directive) value as the name.',
			JS("static name = NodeTypes.SD"),
		),
		D('A sequence directive is a number.',
			JS("static typeof(object, objectType, isAction) { return objectType === 'number' }"),
			TS("typeof(this: S, object, objectType, isAction): object is SequenceDirectiveNode { return objectType === 'number' },")
		),
		D('A sequence directive is performed by finding the last sequence and setting the index to the given value.',
			JS("static perform(action, state) {"),
			TS("perform(this: S, action, state) {"),
			D('Get the closest ancestor that is a sequence.',
				CS("const lastOf = S._closest(this, state[S.Path].slice(0,-1), NodeTypes.SQ)"),
			),
			D('If there is no such ancestor, throw a `PathReferenceError`',
				CS("if (!lastOf) throw new PathReferenceError(`A relative directive has been provided as a number (${String(action)}), but no sequence exists that this number could be an index of from path [ ${state[S.Path].map(key => key.toString()).join(', ')} ].`, { instance: this, state, path: state[S.Path], data: { action } })"),
			),
			D('Update the path to the parent>index',
				CS("return { ...state, [S.Path]: [...lastOf, action] }"),
			),
			JS("}"),
			TS("},")
		),
		JS("}"),
		TS("})"),
	),
	D('Machine Directive Node',
		'Directives are effectively `goto` commands, or `transitions` if you prefer.',
		D('Directives are the natural way of proceeding in state machines, using the name of a neighboring state as a string you can direct flow through a state machine.',
			E.is(() => {
				const instance = new S({
					initial: [
						{ result: 'first' },
						'next'
					],
					next: { result: 'second' }
				})
				return instance({ result: 'start' })
			}, 'second')
		),
		D('You can also use symbols as state names.',
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
		),
		D('This definition is exported by the library as `{ MachineDirectiveNode }`',
			E.exports('MachineDirectiveNode', testModule, './index.js'),
		),
		TS("export type MachineDirectiveNode = string | symbol"),
		JS("export class MachineDirectiveNode extends DirectiveNode {"),
		TS("const MachineDirectiveNode = new N<MachineDirectiveNode, MachineDirectiveNode>(NodeTypes.MD, {"),
		D('Use the `NodeTypes.MD` (machine-directive) value as the name.',
			JS("static name = NodeTypes.MD")
		),
		D('A machine directive is a string or a symbol.',
			JS("static typeof(object, objectType, isAction) { return objectType === 'string' || objectType === 'symbol' }"),
			TS("typeof(this: S, object, objectType, isAction): object is MachineDirectiveNode { return objectType === 'string' || objectType === 'symbol' },")
		),
		D('A machine directive is performed by directing to the given stage.',
			JS("static perform(action, state) {"),
			TS("perform(this: S, action, state) {"),
			D('Get the closest ancestor that is a machine.',
				CS("const lastOf = S._closest(this, state[S.Path].slice(0,-1), NodeTypes.MC)"),
			),
			D('If no machine ancestor is foun, throw a `PathReferenceError`',
				CS("if (!lastOf) throw new PathReferenceError(`A relative directive has been provided as a ${typeof action} (${String(action)}), but no state machine exists that this ${typeof action} could be a state of from path [ ${state[S.Path].map(key => key.toString()).join(', ')} ].`, { instance: this, state, path: state[S.Path], data: { action } })"),
			),
			D('Update the path to parent>stage',
				CS("return { ...state, [S.Path]: [...lastOf, action] }"),
			),
			CS("}"),
		),
		JS("}"),
		TS("})"),
	),
	D('Absolute Directive Node',
		'Arrays can be used to perform absolute redirects. This is not recommended as it may make your transition logic unclear.',
		'Arrays cannot be used on their own, because they would be interpreted as sequences. For this reason they must be contained in an object with the `S.Path` symbol as a ky, with the array as the value, or returned by an action.',
		D('Using an absolute directive in a directive object works',
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
			}, 'first')
		),
		D('Using an absolute directive as a return value works',
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
			}, 'first')
		),
		D('Using an absolute directive as an action does NOT work.',
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
		),
		D('This definition is exported by the library as `{ AbsoluteDirectiveNode }`',
			E.exports('AbsoluteDirectiveNode', testModule, './index.js'),
		),
		TS("export type AbsoluteDirectiveNode = Path"),
		JS("export class AbsoluteDirectiveNode extends DirectiveNode {"),
		TS("const AbsoluteDirectiveNode = new N<AbsoluteDirectiveNode, AbsoluteDirectiveNode>(NodeTypes.AD, {"),
		D('Use the `NodeTypes.AD` (absolute-directive) value as the name.',
			JS("static name = NodeTypes.AD")
		),
		D('An absolute directive is a list of strings, symbols, and numbers. It can only be used as an action as it would otherwise be interpreted as a sequence.',
			JS("static typeof(object, objectType, isAction) { return isAction && Array.isArray(object) }"),
			TS("typeof(this: S, object, objectType, isAction): object is AbsoluteDirectiveNode { return isAction && Array.isArray(object) },")
		),
		D('An absolute directive is performed by setting `S.Path` to the path',
			JS("static perform(action, state) { return { ...state, [S.Path]: action } }"),
			TS("perform(this: S, action, state) { return { ...state, [S.Path]: action } }")
		),
		JS("}"),
		TS("})")
	),
	D('Return Node',
		'Causes the entire process to terminate immediately and return, setting `S.Return` to `true` on the state.',
		'If the symbol is used on its own, the it will simply return whatever value is in the "result".',
		D('It is reccomended you use the result variable for this purpose.',
			E.is(() => {
				const instance = new S(S.Return)
				return instance({ result: 'start' })
			}, 'start')
		),
		D('Using the return symbol as the key to an object will set the return property to that value before returning.',
			E.equals(() => {
				const instance = new S({ [S.Return]: 'custom' })
				return instance({ result: 'start' })
			}, 'custom'),
			E.equals(() => {
				const instance = new S({ [S.Return]: 'custom' })
				return instance.result(state => state)({ result: 'start' })
			}, { result: 'start', [S.Return]: 'custom' }, symbols),
		),
		D('This definition is exported by the library as `{ ReturnNode }`',
			E.exports('ReturnNode', testModule, './index.js'),
		),
		TS("export type ReturnNode<Result extends unknown = unknown> = { [S.Return]: Result } | typeof S.Return"),
		JS("export class ReturnNode extends NodeDefinition {"),
		TS("const ReturnNode = new N<ReturnNode,ReturnNode>(NodeTypes.RT, {"),
		D('Use the `NodeTypes.RT` (return) value as the name.',
			JS("static name = NodeTypes.RT")
		),
		D('A return node is the `S.Return` symbol itself, or an object with an `S.Return` property.',
			JS("static typeof(object, objectType) { return object === S.Return || Boolean(object && objectType === 'object' && (S.Return in object)) }"),
			TS("typeof: (object, objectType): object is ReturnNode => object === S.Return || Boolean(object && objectType === 'object' && (S.Return in (object as object))),")
		),
		D('Perform a return by setting the result to the return value and setting the `S.Return` flag on the state to `true`',
			JS("static perform(action, state) { return {"),
			TS("perform: (action, state) => ({"),
			D('Copy the original properties from the state',
				CS("...state,"),
			),
			D('Set `S.Return` to undefined or the given return value',
				JS("[S.Return]: !action || action === S.Return ? undefined : action[S.Return],"),
				TS("[S.Return]: !action || action === S.Return ? undefined : action[S.Return] as undefined,"),

			),
			D('Copy over the original path to preserve it.',
				CS("[S.Path]: state[S.Path],"),
			),
			JS("} }"),
			TS("})")
		),
		JS("}"),
		TS("})")
	),
	TS(`export type PathUnit = SequenceDirectiveNode | MachineDirectiveNode
export type Path = Array<PathUnit>

export type ProcessNode<
	State extends InitialState = { [KeyWords.RS]: undefined },
	Result extends unknown = State[KeyWords.RS],
	Action extends unknown = ActionNode<State, Result>,
> =
| SequenceNode<State, Result, Action>
| MachineNode<State, Result, Action>
| ConditionNode<State, Result, Action>
| SwitchNode<State, Result, Action>
| FunctionNode<State, Result, Action>
| DirectiveNode | SequenceDirectiveNode | MachineDirectiveNode
| ReturnNode<Result>
| ChangesNode<State>
| null

export type ActionNode<
	State extends InitialState = { [KeyWords.RS]: undefined },
	Result extends unknown = State[KeyWords.RS],
> = DirectiveNode | AbsoluteDirectiveNode | SequenceDirectiveNode | MachineDirectiveNode | ReturnNode<Result>| ChangesNode<State> | null | undefined | void
`),

	D('Export all the defaults nodes together in one list.',
		D('This list is exported by the library as `{ nodes }`',
			E.exports('nodes', testModule, './index.js'),
		),
		CS("export const nodes = [ ChangesNode, SequenceNode, FunctionNode, UndefinedNode, EmptyNode, ConditionNode, SwitchNode, MachineNode, DirectiveNode, AbsoluteDirectiveNode, MachineDirectiveNode, SequenceDirectiveNode, ReturnNode, ]"),
	),
),

D('Extensible Function',
	JS("export class ExtensibleFunction extends Function { constructor(f) { super(); return Object.setPrototypeOf(f, new.target.prototype); }; }"),
	TS("export class ExtensibleFunction extends Function { constructor(f: Function) { super(); return Object.setPrototypeOf(f, new.target.prototype); }; }")
),
D('Core',
	D('Every instance must have a process and be callable.',
		TS(`export interface SuperSmallStateMachineCore${commonGenericDefinition} { process: Process; (...args: Input): Result; }`),
	),
	JS("export class SuperSmallStateMachineCore extends ExtensibleFunction {"),
	TS(`export abstract class SuperSmallStateMachineCore${commonGenericDefinition} extends ExtensibleFunction {`),
	D('Symbols',
		D('Return',
			'Use for intentionally exiting the entire process, can be used in an object to override the result value before returning',
			E.success(() => {
				return { [S.Return]: "value" }
			}),
			JS("static Return      = Symbol('Super Small State Machine Return')"),
			TS("public static readonly Return = Symbol('Super Small State Machine Return')")
		),
		D('Changes',
			'Returned in the state. Should not be passed in.',
			E.success(() => {
				return { [S.Changes]: {} }
			}),
			JS("static Changes     = Symbol('Super Small State Machine Changes')"),
			TS("public static readonly Changes = Symbol('Super Small State Machine Changes')"),
		),
		D('Path',
			'Returned in the state to indicate the next action path, or passed in with the state to direct the machine. This can also be used as a node on its own to change the executing path.',
			E.success(() => {
				return { [S.Path]: [] }
			}),
			JS("static Path        = Symbol('Super Small State Machine Path')"),
			TS("public static readonly Path = Symbol('Super Small State Machine Path')"),
		),
		D('StrictTypes',
			'Possible value of `config.strict`, used to indicate strict types as well as values.',
			JS("static StrictTypes = Symbol('Super Small State Machine Strict Types')"),
			TS("public static readonly StrictTypes = Symbol('Super Small State Machine Strict Types')"),
		),
	),
	D('Key Words',
		JS("static keyWords    = KeyWords"),
		JS("static kw          = KeyWords"),
		TS("public static readonly keyWords: typeof KeyWords = KeyWords"),
		TS("public static readonly kw:       typeof KeyWords = KeyWords"),
	),
	D('Node Types',
		JS("static nodeTypes   = NodeTypes"),
		JS("static types       = NodeTypes"),
		TS("public static readonly nodeTypes:typeof NodeTypes = NodeTypes"),
		TS("public static readonly types:    typeof NodeTypes = NodeTypes")
	),

	D('Config',
		JS("static config = {"),
		TS("public static readonly config: Config = {"),
		D('Initialise the result property as `null` by default',
			CS("defaults: { [KeyWords.RS]: undefined },")
		),
		D('Input the initial state by default',
			CS("input: (state = {}) => state,"),
		),
		D('Return the result property by default',
			CS("result:  state => state[S.Return] !== undefined ? state[S.Return] : state[KeyWords.RS],")
		),
		D('Do not perform strict state checking by default',
			CS("strict: false,"),
		),
		D('Allow 1000 iterations by default',
			CS("iterations: 10000,")
		),
		D('Run util the return symbol is present by default.',
			CS("until: state => S.Return in state,")
		),
		D('Do not allow for asynchronous actions by default',
			CS("pause: () => false,"),
		),
		D('Do not allow for asynchronous actions by default',
			CS("async: false,"),
		),
		D('Do not override the execution method by default',
			CS("override: null,"),
		),
		D('Use the provided nodes by default.',
			JS("nodes: new NodeDefinitions(...nodes),"),
			TS("nodes: new NodeDefinitions(...nodes as unknown as []),")
		),
		D('Initialise with an empty adapters list.',
			CS("adapt: [],"),
		),
		D('Initialise with an empty start adapters list.',
			CS("adaptStart: [],"),
		),
		D('Initialise with an empty end adapters list.',
			CS("adaptEnd: [],"),
		),
		CS("}"),
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
		TS(`public static _closest${commonGenericDefinition}(instance: Pick<S${commonGenericArguments}, 'process' | 'config'>, path: Path, ...nodeTypes: Array<NodeDefinition['name'] | Array<NodeDefinition['name']>>): Path | null {`),
		D('Node types can be passed in as arrays of strings, or arrays of arrays of strings...',
			CS("const flatNodeTypes = nodeTypes.flat(Infinity)"),
		),
		D('Use get_closest_path to find the closest path.',
			CS("return get_closest_path(instance.process, path, i => {"),
			D('Get the type of the node',
				CS("const nodeType = instance.config.nodes.typeof(i)"),
			),
			D('Pick this node if it matches any of the given types',
				CS("return Boolean(nodeType && flatNodeTypes.includes(nodeType))"),
			),
			CS("})"),
		),
		CS("}"),
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
		TS(`public static _changes${commonGenericDefinition}(instance: Pick<S${commonGenericArguments}, 'process' | 'config'>, state: SystemState<State, Result>, changes: Partial<State>): SystemState<State, Result> {`),
		D('If the strict state flag is truthy, perform state checking logic',
			CS("if (instance.config.strict) {"),
			D('Go through each property in the changes and check they all already exist',
				CS("if (Object.entries(changes).some(([name]) => !(name in state)))"),
				D('Throw a StateReferenceError if a property is referenced that did not previosly exist.',
					CS("throw new StateReferenceError(`Only properties that exist on the initial context may be updated.\\nYou changed [ ${Object.keys(changes).filter(property => !(property in state)).map(key => key.toString()).join(', ')} ], which ${Object.keys(changes).filter(property => !(property in state)).length === 1 ? 'is' : 'are'} not in: [ ${Object.keys(state).map(key => key.toString()).join(', ')} ].\\nPath: [ ${state[S.Path].map(key => key.toString()).join(' / ')} ]`, { instance, state, path: state[S.Path], data: { changes } })"),
				),
			),
			D('If the strict state flag is set to the Strict Types Symbol, perform type checking logic.',
				CS("if (instance.config.strict === this.StrictTypes) {"),
				D('Go through each property and check the JS type is the same as the initial values.',
					CS("if (Object.entries(changes).some(([name,value]) => typeof value !== typeof state[name])) {"),
					D('Collect all the errors, using the same logic as above.',
						CS("const errs = Object.entries(changes).filter(([name,value]) => typeof value !== typeof state[name])"),
					),
					D('Throw a StateTypeError if a property changes types.',
						CS("throw new StateTypeError(`Properties must have the same type as their initial value. ${errs.map(([name,value]) => `${typeof value} given for '${name}', should be ${typeof state[name]}`).join('. ')}.`, { instance, state, path: state[S.Path], data: { changes } })"),
					),
					CS("}"),
				),
				CS("}"),
			),
			CS("}"),
		),
		D('Collect all the changes in the changes object.',
			CS("const allChanges = deep_merge_object(state[S.Changes] || {}, changes)"),
		),
		D('Return a new object',
			CS("return {"),
			D('Deep merge the current state with the new changes',
				CS("...deep_merge_object(state, allChanges),"),
			),
			D('Carry over the original path.',
				CS("[S.Path]: state[S.Path],"),
			),
			D('Update the changes to the new changes',
				CS("[S.Changes]: allChanges"),
			),
			CS("}"),
		),
		CS("}"),
	),

	D('S._proceed (instance, state = {}, path = state[S.Path] || [])',
		D('Proceed to the next execution path.',
			E.equals(() => {
				const instance = new S([
					'firstAction',
					'secondAction'
				])
				return S._proceed(instance, {
					[S.Path]: [0]
				})
			}, {
				[S.Path]: [1]
			}, symbols),
		),
		D('Performs fallback logic when a node exits.',
			E.equals(() => {
				const instance = new S([
					[
						'firstAction',
						'secondAction',
					],
					'thirdAction'
				])
				return S._proceed(instance, {
					[S.Path]: [0,1]
				})
			}, {
				[S.Path]: [1]
			}, symbols),
		),
		JS("static _proceed (instance, state = {}, path = state[S.Path] || []) {"),
		TS(`public static _proceed${commonGenericDefinition}(instance: Pick<S${commonGenericArguments}, 'process' | 'config'>, state: SystemState<State, Result>, path: Path = state[S.Path] || []): Path | null {`),
		D('Return `null` (unsuccessful) if the root node is reached',
			CS("if (path.length === 0) return null"),
		),
		D('Get the next closest ancestor that can be proceeded',
			CS("const parPath = this._closest(instance, path.slice(0,-1), [...instance.config.nodes.values()].filter(({ proceed }) => proceed).map(({ name }) => name))"),
		),
		D('If no such node exists, return `null` (unsuccessful)',
			CS("if (!parPath) return null"),
		),
		D('Get this closest ancestor',
			CS("const parActs = get_path_object(instance.process, parPath)"),
		),
		D('Determine what type of node the ancestor is',
			CS("const parType = instance.config.nodes.typeof(parActs)"),
		),
		D('Get the node defintion for the ancestor',
			CS("const nodeDefinition = parType && instance.config.nodes.get(parType)"),
		),
		D('If the node definition cannot be proceeded, return `null` (unsuccessful)',
			CS("if (!(nodeDefinition && nodeDefinition.proceed)) return null"),
		),
		D('Call the `proceed` method of the ancestor node to get the next path.',
			CS("const result = nodeDefinition.proceed.call(instance, parPath, state, path)"),
		),
		D('If there a next path, return it',
			CS("if (result !== undefined) return result"),
		),
		D('Proceed updwards through the tree and try again.',
			CS("return this._proceed(instance, state, parPath)"),
		),
		CS("}")
	),
	D('S._perform (instance, state = {}, action = null)',
		D('Perform actions on the state.',
			E.equals(() => {
				const instance = new S([
					'firstAction',
					'secondAction',
					'thirdAction'
				])
				return S._perform(instance, { [S.Path]: [0], prop: 'value' }, { prop: 'newValue' })
			}, {
				[S.Path]: [1],
				prop: 'newValue'
			}, symbols),
		),
		D('Applies any changes in the given `action` to the given `state`.',
			E.equals(() => {
				const instance = new S([
					'firstAction',
					'secondAction',
					'thirdAction'
				])
				return S._perform(instance, { [S.Path]: [0], prop: 'value' }, { [S.Path]: [2] })
			}, {
				[S.Path]: [2],
				prop: 'value'
			}, symbols),
		),
		D('Proceeds to the next node if the action is not itself a directive or return.',
			E.equals(() => {
				const instance = new S([
					'firstAction',
					'secondAction'
				])
				return S._perform(instance, { [S.Path]: [0] }, null)
			}, {
				[S.Path]: [1]
			}, symbols),
		),
		JS("static _perform (instance, state = {}, action = null) {"),
		TS(`public static _perform${commonGenericDefinition}(instance: Pick<S${commonGenericArguments}, 'process' | 'config'>, state: SystemState<State, Result>, action: Action = null as Action): SystemState<State, Result> {`),
		D('Get the current path, default to the root node.',
			CS("const path = state[S.Path] || []"),
		),
		D('Get the node type of the given `action`',
			CS("const nodeType = instance.config.nodes.typeof(action, typeof action, true)"),
		),
		D('Gets the node definition for the action',
			CS("const nodeDefinition = nodeType && instance.config.nodes.get(nodeType)"),
		),
		D('If the action can be performed',
			CS("if (nodeDefinition && nodeDefinition.perform)"),
			D('Perform the action on the state',
				CS("return nodeDefinition.perform.call(instance, action, state)"),
			),
		),
		D('Throw a NodeTypeError if the action cannot be performed',
			CS("throw new NodeTypeError(`Unknown action or action type: ${typeof action}${nodeType ? `, nodeType: ${String(nodeType)}` : ''} at [ ${path.map(key => key.toString()).join(', ')} ]`, { instance, state, path, data: { action } })"),
		),
		CS("}")
	),
	D('S._execute (instance, state = {}, path = state[S.Path] || [])',
		D("Executes the node in the process at the state's current path and returns it's action.",
			E.equals(() => {
				const instance = new S([
					() => ({ result: 'first' }),
					() => ({ result: 'second' }),
					() => ({ result: 'third' }),
				])
				return S._execute(instance, { [S.Path]: [1] })
			}, { result: 'second' })
		),
		D('If the node is not executable it will be returned as the action.',
			E.equals(() => {
				const instance = new S([
					({ result: 'first' }),
					({ result: 'second' }),
					({ result: 'third' }),
				])
				return S._execute(instance, { [S.Path]: [1] })
			}, { result: 'second' })
		),
		JS("static _execute (instance, state = {}, path = state[S.Path] || []) {"),
		TS(`public static _execute${commonGenericDefinition}(instance: Pick<S${commonGenericArguments}, 'process' | 'config'>, state: SystemState<State, Result>, path: Path = state[S.Path]): Action {`),
		D('Get the node at the given `path`',
			JS("const node = get_path_object(instance.process, path)"),
			TS("const node = get_path_object<Process>(instance.process, path)!"),
		),
		D('Get the type of that node',
			CS("const nodeType = instance.config.nodes.typeof(node)"),
		),
		D('Get the definition of the node',
			CS("const nodeDefinition = nodeType && instance.config.nodes.get(nodeType)"),
		),
		D('If the node can be executed',
			CS("if (nodeDefinition && nodeDefinition.execute)"),
			D('Execute the node and return its resulting action',
				JS("return nodeDefinition.execute.call(instance, node, state)"),
				TS("return nodeDefinition.execute.call(instance, node, state) as Action"),
			),
		),
		D('If it cannot be executed, return the node to be used as an action',
			JS("return node"),
			TS("return node as Action")
		),
		CS("}")
	),
	D('S._traverse(instance, iterator = a => a, post = b => b)',
		'Traverses a process, mapping each node to a new value, effectively cloning the process.',
		'You can customise how each leaf node is mapped by supplying the `iterator` method',
		'You can also customise how branch nodes are mapped by supplying the `post` method',
		'The post method will be called after child nodes have been processed by the `iterator`',
		JS("static _traverse(instance, iterator = a => a, post = b => b) {"),
		TS(`public static _traverse${commonGenericDefinition} (instance: Pick<S${commonGenericArguments}, 'process' | 'config'>, iterator: ((item: Process, path: Path) => Process), post: ((item: Process, path: Path) => Process)): Process {`),
		D('Make sure the post functions is scoped to the given instance',
			CS("const boundPost = post.bind(instance)"),
		),
		D('Create an interation function to be used recursively',
			JS("const iterate = (path = []) => {"),
			TS("const iterate = (path: Path = []) => {"),
			D('Get the node at the given `path`',
				JS("const item = get_path_object(instance.process, path)"),
				TS("const item = get_path_object<Process>(instance.process, path)!"),
			),
			D('Get the type of the node',
				CS("const nodeType = instance.config.nodes.typeof(item)"),
			),
			D('Get the definition of the node',
				CS("const nodeDefinition = nodeType && instance.config.nodes.get(nodeType)"),
			),
			D('If the node can be traversed',
				CS("if (nodeDefinition && nodeDefinition.traverse)"),
				D('Traverse it',
					CS("return nodeDefinition.traverse.call(instance, item, path, iterate, boundPost)"),
				),
			),
			D('If it cannot be traversed, it is a leaf node',
				CS("return iterator.call(instance, item, path)"),
			),
			CS("}")
		),
		D('Call the primary method and return the result',
			CS("return iterate()")
		),
		CS("}")
	),
	D('S._run (instance, ...input)',
		'Execute the entire process either synchronously or asynchronously depending on the config.',
		JS("static _run (instance, ...input) {"),
		TS(`public static _run${commonGenericDefinition}(instance: Pick<S${commonGenericArguments}, 'process' | 'config'>, ...input: Input): Result {`),
		D('If the process is asynchronous, execute use `runAsync`',
			JS("if (instance.config.async) return this._runAsync(instance, ...input)"),
			TS("if (instance.config.async) return this._runAsync(instance, ...input) as Result"),
		),
		D('If the process is asynchronous, execute use `runSync`',
			CS("return this._runSync(instance, ...input)"),
		),
		CS("}"),
	),
	D('S._runSync (instance, ...input)',
		'Execute the entire process synchronously.',
		JS("static _runSync (instance, ...input) {"),
		TS(`public static _runSync${commonGenericDefinition}(instance: Pick<S${commonGenericArguments}, 'process' | 'config'>, ...input: Input): Result {`),
		D('Extract the useful parts of the config',
			CS("const { until, iterations, input: inputModifier, result: adaptResult, adaptStart, adaptEnd, defaults } = { ...this.config, ...instance.config }")
		),
		D('Turn the arguments into an initial condition',
			CS("const modifiedInput = inputModifier.apply(instance, input) || {}")
		),
		D('Merge the initial condition with the default initial state',
			CS("let r = 0, currentState = adaptStart.reduce((prev, modifier) => modifier.call(instance, prev), this._changes(instance, {"),
			D('Default to an empty change object',
				CS("[S.Changes]: {},")
			),
			D('Use the defaults as an initial state',
				CS("...defaults,")
			),
			D('Use the path from the initial state - allows for starting at arbitrary positions',
				CS("[S.Path]: modifiedInput[S.Path] || [],")
			),
			JS("}, modifiedInput))"),
			TS("} as SystemState<State, Result>, modifiedInput))")
		),
		D('Repeat for a limited number of iterations.',
			'This should be fine for most finite machines, but may be too little for some constantly running machines.',
			CS("while (r < iterations) {"),
			D('Check the configured `until` condition to see if we should exit.',
				'Do it first to catch starting with a `S.Return` in place.',
				CS("if (until(currentState)) break;")
			),
			D('If the interations are exceeded, Error',
				CS("if (++r >= iterations)"),
				D('Throw new MaxIterationsError',
					CS("throw new MaxIterationsError(`Maximim iterations of ${iterations} reached at path [ ${currentState[S.Path].map(key => key.toString()).join(', ')} ]`, { instance, state: currentState, path: currentState[S.Path], data: { iterations } })"),
				),
			),
			D('Execute the current node on the process and perform any required actions. Updating the currentState',
				CS("currentState = this._perform(instance, currentState, this._execute(instance, currentState))")
			),
			CS("}")
		),
		D('When returning, run the ends state adapters, then the result adapter to complete execution.',
			CS("return adaptResult.call(instance, adaptEnd.reduce((prev, modifier) => modifier.call(instance, prev), currentState))")
		),
		CS("}")
	),
	D('S._runAsync (instance, ...input)',
		'Execute the entire process asynchronously. Always returns a promise.',
		JS("static async _runAsync (instance, ...input) {"),
		TS(`public static async _runAsync${commonGenericDefinition}(instance: Pick<S${commonGenericArguments}, 'process' | 'config'>, ...input: Input): Promise<Result> {`),
		D('Extract the useful parts of the config',
			CS("const { pause, until, iterations, input: inputModifier, result: adaptResult, adaptStart, adaptEnd, defaults } = { ...this.config, ...instance.config }"),
		),
		D('Turn the arguments into an initial condition',
			CS("const modifiedInput = (await inputModifier.apply(instance, input)) || {}"),
		),
		D('Merge the initial condition with the default initial state',
			CS("let r = 0, currentState = adaptStart.reduce((prev, modifier) => modifier.call(instance, prev), this._changes(instance, {"),
			D('Default to an empty change object',
				CS("[S.Changes]: {},"),
			),
			D('Use the defaults as an initial state',
				CS("...defaults,"),
			),
			D('Use the path from the initial state - allows for starting at arbitrary positions',
				CS("[S.Path]: modifiedInput[S.Path] || [],"),
			),
			JS("}, modifiedInput))"),
			TS("} as SystemState<State, Result>, modifiedInput))")
		),
		D('Repeat for a limited number of iterations.',
			CS("while (r < iterations) {"),
			'This should be fine for most finite machines, but may be too little for some constantly running machines.',
			D('Pause execution based on the pause customisation method',
				CS(`const pauseExecution = pause.call(instance, currentState, r)`),
				CS(`if (pauseExecution) await pauseExecution;`),
			),
			D('Check the configured `until` condition to see if we should exit.',
				CS("if (until(currentState)) break;"),
			),
			D('If the interaction are exceeded, Error',
				CS("if (++r >= iterations)"),
				D('Throw new MaxIterationsError',
					CS("throw new MaxIterationsError(`Maximim iterations of ${iterations} reached at path [ ${currentState[S.Path].map(key => key.toString()).join(', ')} ]`, { instance, state: currentState, path: currentState[S.Path], data: { iterations } })"),
				),
			),
			D('Execute the current node on the process and perform any required actions. Updating the currentState',
				CS("currentState = this._perform(instance, currentState, await this._execute(instance, currentState))"),
			),
			CS("}"),
		),
		D('When returning, run the ends state adapters, then the result adapter to complete execution.',
			CS("return adaptResult.call(instance, adaptEnd.reduce((prev, modifier) => modifier.call(instance, prev), currentState))"),
		),
		CS("}"),
	),
	CS("}"),
),
D('Chain',
	JS("export class SuperSmallStateMachineChain extends SuperSmallStateMachineCore {"),
	TS(`export abstract class SuperSmallStateMachineChain${commonGenericDefinition} extends SuperSmallStateMachineCore${commonGenericArguments} {`),
	D('S.closest (path = [], ...nodeTypes)',
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
		JS("static closest(path, ...nodeTypes) { return instance => this._closest(instance, path, ...nodeTypes) }"),
		TS(`static closest${commonGenericDefinition}(path: Path, ...nodeTypes: Array<NodeDefinition['name'] | Array<NodeDefinition['name']>>) { return (instance: Pick<S${commonGenericArguments}, 'process' | 'config'>): Path | null => this._closest(instance, path, ...nodeTypes) }`)
	),
	D('S.changes (state = {}, changes = {})',
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
		JS("static changes(state, changes)     { return instance => this._changes(instance, state, changes) }"),
		TS(`static changes${commonGenericDefinition}(state: SystemState<State, Result>, changes: Partial<State>) { return (instance: Pick<S${commonGenericArguments}, 'process' | 'config'>): SystemState<State, Result> => this._changes(instance, state, changes) }`)
	),
	D('S.proceed (state = {}, path = state[S.Path] || [])',
		'Proceed to the next execution path.',
		'Performs fallback logic when a node exits.',
		JS("static proceed(state, path)        { return instance => this._proceed(instance, state, path) }"),
		TS(`static proceed${commonGenericDefinition}(state: SystemState<State, Result>, path: Path) { return (instance: Pick<S${commonGenericArguments}, 'process' | 'config'>): Path | null => this._proceed(instance, state, path) }`)
	),
	D('S.perform (state = {}, action = null)',
		'Perform actions on the state.',
		'Applies any changes in the given `action` to the given `state`.',
		'Proceeds to the next node if the action is not itself a directive or return.',
		JS("static perform(state, action)      { return instance => this._perform(instance, state, action) }"),
		TS(`static perform${commonGenericDefinition}(state: SystemState<State, Result>, action: Action) { return (instance: Pick<S${commonGenericArguments}, 'process' | 'config'>): SystemState<State, Result> => this._perform(instance, state, action) }`)
	),
	D('S.execute (state = {}, path = state[S.Path] || [])',
		'Execute a node in the process, return an action.',
		"Executes the node in the process at the state's current path and returns it's action.",
		'If the node is not executable it will be returned as the action.',
		JS("static execute(state, path)        { return instance => this._execute(instance, state, path) }"),
		TS(`static execute${commonGenericDefinition}(state: SystemState<State, Result>, path?: Path) { return (instance: Pick<S${commonGenericArguments}, 'process' | 'config'>): Action => this._execute(instance, state, path) }`)
	),
	D('S.traverse(iterator = a => a, post = b => b)',
		'TODO: traverse and adapt same thing?',
		JS("static traverse(iterator, post)    { return instance => this._traverse(instance, iterator, post) }"),
		TS(`static traverse${commonGenericDefinition}(iterator: ((item: Process, path: Path) => Process), post: ((item: Process, path: Path) => Process)) { return (instance: Pick<S${commonGenericArguments}, 'process' | 'config'>) => this._traverse(instance, iterator, post) }`)
	),
	D('S.run (...input)',
		'Execute the entire process either synchronously or asynchronously depending on the config.',
		JS("static run(...input)               { return instance => this._run(instance, ...input) }"),
		TS(`static run${commonGenericDefinition}(...input: Input) { return (instance: Pick<S${commonGenericArguments}, 'process' | 'config'>): Result => this._run(instance, ...input) }`)
	),
	D('S.runSync (...input)',
		'Execute the entire process synchronously.',
		JS("static runSync(...input)           { return instance => this._runSync(instance, ...input) }"),
		TS(`static runSync${commonGenericDefinition}(...input: Input) { return (instance: Pick<S${commonGenericArguments}, 'process' | 'config'>): Result => this._runSync(instance, ...input) }`)
	),
	D('S.runAsync (...input)',
		'Execute the entire process asynchronously. Always returns a promise.',
		JS("static runAsync(...input)          { return instance => this._runAsync(instance, ...input) }"),
		TS(`static runAsync${commonGenericDefinition}(...input: Input) { return (instance: Pick<S${commonGenericArguments}, 'process' | 'config'>): Promise<Result> => this._runAsync(instance, ...input) }`)
	),
	D('S.do(process) <default: null>',
		'Defines a process to execute, overrides the existing process.',
		'Returns a function that will modify a given instance.',
		E.is(() => {
			const instance = new S({ result: 'old' })
			const newInstance = instance.with(S.do({ result: 'new' }))
			return newInstance()
		}, 'new'),
		JS("static do(process = null)                    { return instance => ({ process: instance.config.adapt.reduce((prev, modifier) => modifier.call(instance, prev), process), config: instance.config }) }"),
		TS(`static do${commonGenericDefinition}(process: Process) { return (instance: Pick<S${commonGenericArguments}, 'process' | 'config'>): Pick<S${commonGenericArguments}, 'process' | 'config'> => ({ process: instance.config.adapt.reduce((prev, modifier) => modifier.call(instance, prev), process), config: instance.config }) }`)
	),
	D('S.defaults(defaults) <default: { result: undefined }>',
		'Defines the initial state to be used for all executions.',
		'Returns a function that will modify a given instance.',
		E.is(() => {
			const instance = new S()
			const newInstance = instance.with(S.defaults({ result: 'default' }))
			return newInstance()
		}, 'default'),
		JS("static defaults(defaults = S.config.defaults){ return instance => ({ process: instance.process, config: { ...instance.config, defaults }, }) }"),
		TS(`static defaults<${commonGenericDefinitionInner}	NewState extends InitialState = State,\n>(defaults: NewState) { return (instance: Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'>): Pick<S<NewState, NewState[KeyWords.RS], [Partial<InputSystemState<NewState>>] | [], ActionNode<NewState, NewState[KeyWords.RS]>, ProcessNode<NewState, NewState[KeyWords.RS], ActionNode<NewState, NewState[KeyWords.RS]>>>, 'process' | 'config'> => ({ process: instance.process as unknown as ProcessNode<NewState, NewState[KeyWords.RS], ActionNode<NewState, NewState[KeyWords.RS]>>, config: { ...instance.config, defaults } as unknown as Config<NewState, NewState[KeyWords.RS], [Partial<InputSystemState<NewState>>] | [], ActionNode<NewState, NewState[KeyWords.RS]>, ProcessNode<NewState, NewState[KeyWords.RS], ActionNode<NewState, NewState[KeyWords.RS]>>>, }) }`)
	),
	D('S.input(input) <default: (state => state)>',
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
		JS("static input(input = S.config.input)         { return instance => ({ process: instance.process, config: { ...instance.config, input }, }) }"),
		TS(`static input<${commonGenericDefinitionInner}	NewInput extends Array<unknown> = Array<unknown>,\n>(input: (...input: NewInput) => Partial<InputSystemState<State, Result>>) { return (instance: Pick<S${commonGenericArguments}, 'process' | 'config'>): Pick<S<State, Result, NewInput, Action, Process>, 'process' | 'config'> => ({ process: instance.process, config: { ...instance.config, input } as unknown as Config<State, Result, NewInput, Action, Process>, }) }`)
	),
	D('S.result(result) <default: (state => state.result)>',
		'Allows the modification of the value the executable will return.',
		'Returns a function that will modify a given instance.',
		E.is(() => {
			const instance = new S(({ myReturnValue }) => ({ myReturnValue: myReturnValue + ' extra' }))
				.with(S.result(state => state.myReturnValue))
			return instance({ myReturnValue: 'start' })
		}, 'start extra'),
		JS("static result(result = S.config.result)      { return instance => ({ process: instance.process, config: { ...instance.config, result }, }) }"),
		TS(`static result<${commonGenericDefinitionInner}	NewResult extends unknown = Result,\n>(result: (state: SystemState<State, Result>) => NewResult) { return (instance: Pick<S${commonGenericArguments}, 'process' | 'config'>): Pick<S<State, NewResult, Input, ActionNode<State, NewResult>, ProcessNode<State, NewResult, ActionNode<State, NewResult>>>, 'process' | 'config'> => ({ process: instance.process as unknown as ProcessNode<State, NewResult, ActionNode<State, NewResult>>, config: { ...instance.config, result } as unknown as Config<State, NewResult, Input, ActionNode<State, NewResult>, ProcessNode<State, NewResult, ActionNode<State, NewResult>>>, }) }`)
	),
	D('S.unstrict <default>',
		'Execute without checking state properties when a state change is made.',
		'Will modify the given instance.',
		D('With the strict flag, an unknown property cannot be set on the state.',
			E.error(() => {
				const instance = new S(() => ({ unknownVariable: false}))
				.with(
					S.defaults({ knownVariable: true }),
					S.strict
				)
				return instance()
			}, StateReferenceError),
		),
		D('The unstrict flag will override strict behaviour, so that an unknown property can be set on the state.',
			E.success(() => {
				const instance = new S(() => ({ unknownVariable: false}))
				.with(
					S.defaults({ knownVariable: true }),
					S.strict,
					S.unstrict
				)
				return instance()
			}),
		),
		JS("static unstrict                               (instance) { return ({ process: instance.process, config: { ...instance.config, strict: false }, }) }"),
		TS(`static unstrict${commonGenericDefinition}(instance: Pick<S${commonGenericArguments}, 'process' | 'config'>): Pick<S${commonGenericArguments}, 'process' | 'config'> { return ({ process: instance.process, config: { ...instance.config, strict: false }, }) }`)
	),
	D('S.strict',
		'Checks state properties when an state change is made.',
		'Will modify the given instance.',
		D('Without the strict flag, unknown properties can be set on the state by a state change action.',
			E.success(() => {
				const instance = new S(() => ({ unknownVariable: false}))
					.with(S.defaults({ knownVariable: true }))
				return instance()
			}),
		),
		D('With the strict flag, unknown properties cannot be set on the state by a state change action.',
			E.error(() => {
				const instance = new S(() => ({ unknownVariable: false}))
				.with(
					S.defaults({ knownVariable: true }),
					S.strict
				)
				return instance()
			}, StateReferenceError),
		),
		JS("static strict                                 (instance) { return ({ process: instance.process, config: { ...instance.config, strict: true }, }) }"),
		TS(`static strict${commonGenericDefinition} (instance: Pick<S${commonGenericArguments}, 'process' | 'config'>): Pick<S${commonGenericArguments}, 'process' | 'config'> { return ({ process: instance.process, config: { ...instance.config, strict: true }, }) }`)
	),
	D('S.strictTypes',
		'Checking state property types when an state change is made.',
		'Will modify the given instance.',
		D('With the strict types flag, known properties cannot have their type changed by a state change action',
			E.error(() => {
				const instance = new S(() => ({ knownVariable: 45 }))
				.with(
					S.defaults({ knownVariable: true }),
					S.strictTypes
				)
				return instance()
			}, StateTypeError),
		),
		JS("static strictTypes                            (instance) { return ({ process: instance.process, config: { ...instance.config, strict: S.StrictTypes }, }) }"),
		TS(`static strictTypes${commonGenericDefinition} (instance: Pick<S${commonGenericArguments}, 'process' | 'config'>): Pick<S${commonGenericArguments}, 'process' | 'config'> { return ({ process: instance.process, config: { ...instance.config, strict: S.StrictTypes }, }) }`),
	),
	D('S.for(iterations = 10000) <default: 10000>',
		'Defines the maximum iteration limit.',
		'Returns a function that will modify a given instance.',
		D('A limited number of iterations will cause the machine to exit early',
			E.error(() => {
				const instance = new S([
					({ result }) => ({ result: result + 1}),
					0
				])
				.with(
					S.defaults({ result: 0 }),
					S.for(10)
				)
				return instance()
			}, MaxIterationsError),
		),
		JS("static for(iterations = S.config.iterations) { return instance => ({ process: instance.process, config: { ...instance.config, iterations }, }) }"),
		TS(`static for${commonGenericDefinition}(iterations: number = 10000) { return (instance: Pick<S${commonGenericArguments}, 'process' | 'config'>): Pick<S${commonGenericArguments}, 'process' | 'config'> => ({ process: instance.process, config: { ...instance.config, iterations }, }) }`),
	),
	D('S.until(until) <default: (state => S.Return in state)>',
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
		JS("static until(until = S.config.until)         { return instance => ({ process: instance.process, config: { ...instance.config, until }, }) }"),
		TS(`static until${commonGenericDefinition}(until: Config${commonGenericArguments}['until']) { return (instance: Pick<S${commonGenericArguments}, 'process' | 'config'>): Pick<S${commonGenericArguments}, 'process' | 'config'> => ({ process: instance.process, config: { ...instance.config, until }, }) }`),
	),
	D('S.forever',
		'Removes the max iteration limit.',
		'Will modify the given instance.',
		E.is(() => {
			const instance = new S().with(S.forever)
			return instance.config.iterations
		}, Infinity),
		JS("static forever                                (instance) { return ({ process: instance.process, config: { ...instance.config, iterations: Infinity }, }) }"),
		TS(`static forever${commonGenericDefinition} (instance: Pick<S${commonGenericArguments}, 'process' | 'config'>): Pick<S${commonGenericArguments}, 'process' | 'config'> { return ({ process: instance.process, config: { ...instance.config, iterations: Infinity }, }) }`)
	),
	D('S.sync <default>',
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
		JS("static sync                                   (instance) { return ({ process: instance.process, config: { ...instance.config, async: false }, }) }"),
		TS(`static sync${commonGenericDefinition} (instance: Pick<S${commonGenericArguments}, 'process' | 'config'>): Pick<S<State, Awaited<Result>, Input, Action, Process>, 'process' | 'config'> { return ({ process: instance.process, config: { ...instance.config, async: false } as unknown as Config<State, Awaited<Result>, Input, Action, Process>, }) }`)
	),
	D('S.async',
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
		JS("static async                                  (instance) { return ({ process: instance.process, config: { ...instance.config, async: true }, }) }"),
		TS(`static async${commonGenericDefinition} (instance: Pick<S${commonGenericArguments}, 'process' | 'config'>): Pick<S<State, Promise<Result>, Input, Action, Process>, 'process' | 'config'> { return ({ process: instance.process, config: { ...instance.config, async: true } as unknown as Config<State, Promise<Result>, Input, Action, Process>, }) }`),
	),
	D('S.pause(pause) <default: (() => false)>',
		'Allows an async execution to be paused between steps.',
		'Returns a function that will modify a given instance.',
		JS("static pause(pause = S.config.pause)         { return instance => ({ process: instance.process, config: { ...instance.config, pause }, }) }"),
		TS(`static pause${commonGenericDefinition}(pause: Config${commonGenericArguments}['pause'] = (S.config.pause as Config${commonGenericArguments}['pause'])) { return (instance: Pick<S${commonGenericArguments}, 'process' | 'config'>): Pick<S${commonGenericArguments}, 'process' | 'config'> => ({ process: instance.process, config: { ...instance.config, pause }, }) }`)
	),
	D('S.override(override) <default: instance.run>',
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
		JS("static override(override = S.config.override){ return instance => ({ process: instance.process, config: { ...instance.config, override } }) }"),
		TS(`static override${commonGenericDefinition}(override: ((...args: Input) => Result) | null) { return (instance: Pick<S${commonGenericArguments}, 'process' | 'config'>): Pick<S${commonGenericArguments}, 'process' | 'config'> => ({ process: instance.process, config: { ...instance.config, override } }) }`)
	),
	D('S.addNode(...nodes)',
		'Allows for the addition of new node types.',
		'Returns a function that will modify a given instance.',
		E.equals(() => {
			const specialSymbol = Symbol('My Symbol')
			class SpecialNode extends NodeDefinition {
				static name = 'special'
				static typeof(object, objectType) { return Boolean(objectType === 'object' && object && specialSymbol in object)}
				static execute(){ return { [S.Return]: 'specialValue' } }
			}
			const instance = new S({ [specialSymbol]: true })
				.with(S.addNode(SpecialNode))
			return instance({ result: 'start' })
		}, 'specialValue'),
		E.equals(() => {
			const specialSymbol = Symbol('My Symbol')
			const instance = new S({ [specialSymbol]: true })
			return instance({ result: 'start' })
		}, 'start'),
		JS("static addNode(...nodes)                     { return instance => ({ process: instance.process, config: { ...instance.config, nodes: new NodeDefinitions(...instance.config.nodes.values(),...nodes) }, }) }"),
		TS(`static addNode${commonGenericDefinition}(...nodes: any[]) { return (instance: Pick<S${commonGenericArguments}, 'process' | 'config'>) => ({ process: instance.process, config: { ...instance.config, nodes: new NodeDefinitions(...instance.config.nodes.values(),...nodes) }, }) }`)
	),
	D('S.adapt(...adapters)',
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
		JS("static adapt(...adapters)                    { return instance => ({ process: adapters.reduce((prev, adapter) => adapter.call(instance, prev), instance.process), config: { ...instance.config, adapt: [ ...instance.config.adapt, ...adapters ] }, }) }"),
		TS(`static adapt${commonGenericDefinition}(...adapters: Array<(process: Process) => Process>) { return (instance: Pick<S${commonGenericArguments}, 'process' | 'config'>): Pick< S${commonGenericArguments}, 'process' | 'config'> => ({ process: adapters.reduce((prev, adapter) => adapter.call(instance, prev), instance.process), config: { ...instance.config, adapt: [ ...instance.config.adapt, ...adapters ] }, }) }`)
	),
	D('S.adaptStart(...adapters)',
		'Transforms the state before execution.',
		'Returns a function that will modify a given instance.',
		E.equals(() => {
			const instance = new S()
			.adaptStart(state => ({
				...state,
				result: 'overridden'
			}))
			return instance({ result: 'input' })
		}, 'overridden'),
		JS("static adaptStart(...adapters)               { return instance => ({ process: instance.process, config: { ...instance.config, adaptStart: [ ...instance.config.adaptStart, ...adapters ] }, }) }"),
		TS(`static adaptStart${commonGenericDefinition}(...adapters: Array<(state: SystemState<State, Result>) => SystemState<State, Result>>) { return (instance: Pick<S${commonGenericArguments}, 'process' | 'config'>): Pick<S${commonGenericArguments}, 'process' | 'config'> => ({ process: instance.process, config: { ...instance.config, adaptStart: [ ...instance.config.adaptStart, ...adapters ] }, }) }`),
	),
	
	D('S.adaptEnd(...adapters)',
		'Transforms the state after execution.',
		'Returns a function that will modify a given instance.',
		E.equals(() => {
			const instance = new S()
			.adaptEnd(state => ({
				...state,
				result: 'overridden'
			}))
			return instance({ result: 'input' })
		}, 'overridden'),
		JS("static adaptEnd(...adapters)                 { return instance => ({ process: instance.process, config: { ...instance.config, adaptEnd: [ ...instance.config.adaptEnd, ...adapters ] }, }) }"),
		TS(`static adaptEnd${commonGenericDefinition}(...adapters: Array<(state: SystemState<State, Result>) => SystemState<State, Result>>) { return (instance: Pick<S${commonGenericArguments}, 'process' | 'config'>): Pick<S${commonGenericArguments}, 'process' | 'config'> => ({ process: instance.process, config: { ...instance.config, adaptEnd: [ ...instance.config.adaptEnd, ...adapters ] }, }) }`)
	),
	
	D('S.with(...adapters)',
		'Allows for the addition of predifined modules.',
		'Returns a function that will modify a given instance.',
		E.equals(() => {
			const plugin = S.with(S.strict, S.async, S.for(10))
			const instance = new S().with(plugin)
			return instance.config
		}, { async: true, strict: true, iterations: 10}),
		JS("static with(...adapters) {"),
		TS(`static with<${commonGenericDefinitionInner}
	NewState extends InitialState = State,
	NewResult extends unknown = Result,
	NewInput extends Array<unknown> = Input,
	NewAction extends unknown = Action,
	NewProcess extends unknown = Process
>(...adapters: Array<((instance: Pick<S${commonGenericArguments}, 'process' | 'config'>) => Pick<S<NewState, NewResult, NewInput, NewAction, NewProcess>, 'process' | 'config'>)>) {`),
		D('Allow the input of a list or a list of lists, etc.',
			CS("const flatAdapters = adapters.flat(Infinity)"),
		),
		D('Return a function that takes a specific instance.',
			JS("return instance => {"),
			TS(`return (instance: Pick<S${commonGenericArguments}, 'process' | 'config'>): S<NewState, NewResult, NewInput, NewAction, NewProcess> => {`),
			D('Pass each state through the adapters sequentially.',
				JS("const result = flatAdapters.reduce((prev, adapter) => adapter.call(instance, prev), instance)"),
				TS("const result = flatAdapters.reduce((prev, adapter) => adapter.call(instance, prev) as unknown as Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'>, instance) as unknown as Pick<S<NewState, NewResult, NewInput, NewAction, NewProcess>, 'process' | 'config'>")
			),
			D('Make sure an instance is returned.',
				JS("return result instanceof S ? result : new S(result.process, result.config)"),
				TS("return result instanceof S ? result : new S<NewState, NewResult, NewInput, NewAction, NewProcess>(result.process, result.config)")
			),
			CS("}"),
		),
		CS("}"),
	),
	CS("}")
),
D('Instance',
	JS("export default class S extends SuperSmallStateMachineChain {"),
	TS(`export default class S${commonGenericDefinition} extends SuperSmallStateMachineChain${commonGenericArguments} {`),
	D('Process',
		E.equals(() => {
			const instance = new S({ result: 'value' })
			return instance.process
		}, { result: 'value' }),
		JS("process = null"),
		TS("process = null as Process")
	),
	D('Config',
		E.equals(() => {
			const instance = new S()
			return instance.config
		}, { 
			defaults: { result: undefined },
			iterations: 10000,
			strict: false,
			async: false,
		}),
		E.equals(() => {
			const instance = new S()
			const modifiedInstance = instance
				.async
				.for(10)
				.defaults({ result: 'other' })
				.strict
			return modifiedInstance.config
		}, { 
			defaults: { result: 'other' },
			iterations: 10,
			strict: true,
			async: true,
		}),
		JS("#config = S.config"),
		JS("get config() { return { ...this.#config } }"),
		TS(`#config: Config${commonGenericArguments} = S.config as unknown as Config${commonGenericArguments}`),
		TS(`get config(): Config${commonGenericArguments} { return { ...this.#config } }`),
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
				E.success(() => {
					const instance = new S({}, {})
					return instance()
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
		TS(`constructor(process: Process = (null as Process), config: Config${commonGenericArguments} = (S.config as unknown as Config${commonGenericArguments})) {`),
		D('Create an ExtensibleFunction that can execute the `run` or `override` method in scope of the new SuperSmallStateMachine instance.',
			JS("super((...input) => (config.override || this.run).apply(this, input))"),
			TS("super((...input: Input): Result => (config.override || this.run).apply(this, input))")
		),
		D('Create the config by merging the passed config with the defaults.',
			'This is private so it cannot be mutated at runtime',
			JS("this.#config = { ...this.#config, ...config }"),
			TS(`this.#config = { ...this.#config, ...config } as unknown as Config${commonGenericArguments}`)
		),
		D('The process must be public, it cannot be deep merged or cloned as it may contain symbols.',
			CS("this.process = process"),
		),
		CS("}"),
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
		JS("closest(path, ...nodeTypes) { return S._closest(this, path, ...nodeTypes) }"),
		TS("closest(path: Path, ...nodeTypes: Array<NodeDefinition['name'] | Array<NodeDefinition['name']>>): Path | null { return S._closest(this, path, ...nodeTypes) }")
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
		JS("changes(state, changes) { return S._changes(this, state, changes) }"),
		TS("changes(state: SystemState<State, Result>, changes: Partial<State>): SystemState<State, Result> { return S._changes(this, state, changes) }")
	),
	D('instance.proceed (state = {}, path = state[S.Path] || [])',
		'Proceed to the next execution path.',
		'Performs fallback logic when a node exits.',
		JS("proceed(state, path)    { return S._proceed(this, state, path) }"),
		TS("proceed(state: SystemState<State, Result>, path: Path) { return S._proceed(this, state, path) }")
	),
	D('instance.perform (state = {}, action = null)',
		'Perform actions on the state.',
		'Applies any changes in the given `action` to the given `state`.',
		'Proceeds to the next node if the action is not itself a directive or return.',
		JS("perform(state, action)  { return S._perform(this, state, action) }"),
		TS("perform(state: SystemState<State, Result>, action: Action) { return S._perform(this, state, action) }")
	),
	D('instance.execute (state = {}, path = state[S.Path] || [])',
		'Execute a node in the process, return an action.',
		"Executes the node in the process at the state's current path and returns it's action.",
		'If the node is not executable it will be returned as the action.',
		JS("execute(state, path)    { return S._execute(this, state, path) }"),
		TS("execute(state: SystemState<State, Result>, path?: Path) { return S._execute(this, state, path) }")
	),
	D('instance.traverse(iterator = a => a, post = b => b)',
		'TODO: traverse and adapt same thing?',
		JS("traverse(iterator, post){ return S._traverse(this, iterator, post) }"),
		TS("traverse(iterator: ((item: Process, path: Path) => Process), post: ((item: Process, path: Path) => Process)){ return S._traverse(this, iterator, post) }")
	),
	D('instance.run (...input)',
		'Execute the entire process either synchronously or asynchronously depending on the config.',
		JS("run     (...input)      { return S._run(this, ...input) }"),
		TS("run (...input: Input): Result { return S._run(this, ...input) }")
	),
	D('instance.runSync (...input)',
		'Execute the entire process synchronously.',
		JS("runSync (...input)      { return S._runSync(this, ...input) }"),
		TS("runSync (...input: Input): Result { return S._runSync(this, ...input) }")
	),
	D('instance.runAsync (...input)',
		'Execute the entire process asynchronously. Always returns a promise.',
		JS("runAsync(...input)      { return S._runAsync(this, ...input) }"),
		TS("runAsync(...input: Input): Promise<Result> { return S._runAsync(this, ...input) }")
	),
	D('instance.do(process) <default: null>',
		'Defines a process to execute, overrides the existing process.',
		'Returns a new instance.',
		E.is(() => {
			const instance = new S({ result: 'old' })
				.do({ result: 'new' })
			return instance()
		}, 'new'),
		JS("do(process)             { return this.with(S.do(process)) }"),
		TS(`do(process: Process): S${commonGenericArguments} { return this.with(S.do(process)) }`)
	),
	D('instance.defaults(defaults) <default: { result: undefined }>',
		'Defines the initial state to be used for all executions.',
		'Returns a new instance.',
		E.is(() => {
			const instance = new S()
				.defaults({ result: 'default' })
			return instance()
		}, 'default'),
		JS("defaults(defaults)      { return this.with(S.defaults(defaults)) }"),
		TS("defaults<NewState extends InitialState = State>(defaults: NewState): S<NewState, NewState[KeyWords.RS], [Partial<InputSystemState<NewState>>] | [], ActionNode<NewState, NewState[KeyWords.RS]>, ProcessNode<NewState, NewState[KeyWords.RS], ActionNode<NewState, NewState[KeyWords.RS]>>> { return this.with(S.defaults(defaults)) }")
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
		JS("input(input)            { return this.with(S.input(input)) }"),
		TS("input<NewInput extends Array<unknown> = Array<unknown>>(input: (...input: NewInput) => Partial<InputSystemState<State, Result>>): S<State, Result, NewInput, Action, Process> { return this.with(S.input(input)) }")
	),
	D('instance.result(result) <default: (state => state.result)>',
		'Allows the modification of the value the executable will return.',
		'Returns a new instance.',
		E.is(() => {
			const instance = new S(({ myReturnValue }) => ({ myReturnValue: myReturnValue + ' extra' }))
				.result(state => state.myReturnValue)
			return instance({ myReturnValue: 'start' })
		}, 'start extra'),
		JS("result(result)          { return this.with(S.result(result)) }"),
		TS("result<NewResult extends unknown = Result>(result: (state: SystemState<State, Result>) => NewResult): S<State, NewResult, Input, ActionNode<State, NewResult>, ProcessNode<State, NewResult, ActionNode<State, NewResult>>> { return this.with(S.result(result)) }")
	),
	D('instance.unstrict <default>',
		'Execute without checking state properties when a state change is made.',
		'Creates a new instance.',
		E.error(() => {
			const instance = new S(() => ({ unknownVariable: false}))
				.defaults({ knownVariable: true })
				.strict
			return instance()
		}, StateReferenceError),
		E.success(() => {
			const instance = new S(() => ({ unknownVariable: false}))
				.defaults({ knownVariable: true })
				.strict
				.unstrict
			return instance()
		}),
		JS("get unstrict()          { return this.with(S.unstrict) }"),
		TS(`get unstrict(): S${commonGenericArguments} { return this.with(S.unstrict) }`)
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
		}, StateReferenceError),
		JS("get strict()            { return this.with(S.strict) }"),
		TS(`get strict(): S${commonGenericArguments} { return this.with(S.strict) }`)
	),
	D('instance.strictTypes',
		'Checking state property types when an state change is made.',
		'Creates a new instance.',
		E.error(() => {
			const instance = new S([() => ({ knownVariable: 45 }), ({ knownVariable }) => ({ result: knownVariable })])
				.defaults({ knownVariable: true })
				.strictTypes
			return instance()
		}, StateTypeError),
		JS("get strictTypes()       { return this.with(S.strictTypes) }"),
		TS(`get strictTypes(): S${commonGenericArguments} { return this.with(S.strictTypes) }`)
	),
	D('instance.for(iterations = 10000) <default: 10000>',
		'Defines the maximum iteration limit.',
		'Returns a new instance.',
		E.error(() => {
			const instance = new S([
				({ result }) => ({ result: result + 1}),
				0
			])
				.defaults({ result: 0 })
				.for(10)
			return instance()
		}, MaxIterationsError),
		JS("for(iterations)         { return this.with(S.for(iterations)) }"),
		TS(`for(iterations: number): S${commonGenericArguments} { return this.with(S.for(iterations)) }`)
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
		JS("until(until)            { return this.with(S.until(until)) }"),
		TS(`until(until: Config${commonGenericArguments}['until']): S${commonGenericArguments} { return this.with(S.until(until)) }`)
	),
	D('instance.forever',
		'Removes the max iteration limit.',
		'Creates a new instance.',
		E.is(() => {
			const instance = new S().forever
			return instance.config.iterations
		}, Infinity),
		JS("get forever()           { return this.with(S.forever) }"),
		TS(`get forever(): S${commonGenericArguments} { return this.with(S.forever) }`)
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
		JS("get sync()              { return this.with(S.sync) }"),
		TS("get sync(): S<State, Awaited<Result>, Input, Action, Process> { return this.with(S.sync) }"),
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
		JS("get async()             { return this.with(S.async) }"),
		TS("get async(): S<State, Promise<Result>, Input, Action, Process> { return this.with(S.async) }")
	),
	D('instance.pause(pause) <default: (() => false)>',
		'Allows an async execution to be paused between steps.',
		'Returns a new instance.',
		JS("pause(pause)            { return this.with(S.pause(pause)) }"),
		TS(`pause(pause: Config${commonGenericArguments}['pause']): S${commonGenericArguments} { return this.with(S.pause(pause)) }`)
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
		JS("override(override)      { return this.with(S.override(override)) }"),
		TS(`override(override: ((...args: Input) => Result) | null): S${commonGenericArguments} { return this.with(S.override(override)) }`)
	),
	D('instance.addNode(...nodes)',
		'Allows for the addition of new node types.',
		'Returns a new instance.',
		E.equals(() => {
			const specialSymbol = Symbol('My Symbol')
			class SpecialNode extends NodeDefinition {
				static name = 'special'
				static typeof(object, objectType) { return Boolean(objectType === 'object' && object && specialSymbol in object)}
				static execute(){ return { [S.Return]: 'specialValue' } }
			}
			const instance = new S({ [specialSymbol]: true })
				.addNode(SpecialNode)
			return instance({ result: 'start' })
		}, 'specialValue'),
		E.equals(() => {
			const specialSymbol = Symbol('My Symbol')
			const instance = new S({ [specialSymbol]: true })
			return instance({ result: 'start' })
		}, 'start'),
		JS("addNode(...nodes)       { return this.with(S.addNode(...nodes)) }"),
		TS(`addNode(...nodes: any[]) { return this.with(S.addNode(...nodes)) }`)
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
		JS("adapt(...adapters)      { return this.with(S.adapt(...adapters)) }"),
		TS(`adapt(...adapters: Array<(process: Process) => Process>): S${commonGenericArguments} { return this.with(S.adapt(...adapters)) }`)
	),
	D('instance.adaptStart(...adapters)',
		'Transforms the state before execution.',
		'Returns a new instance.',
		E.equals(() => {
			const instance = new S()
			.adaptStart(state => ({
				...state,
				result: 'overridden'
			}))
			return instance({ result: 'input' })
		}, 'overridden'),
		JS("adaptStart(...adapters) { return this.with(S.adaptStart(...adapters)) }"),
		TS(`adaptStart(...adapters: Array<(state: SystemState<State, Result>) => SystemState<State, Result>>): S${commonGenericArguments} { return this.with(S.adaptStart(...adapters)) }`)
	),
	
	D('instance.adaptEnd(...adapters)',
		'Transforms the state after execution.',
		'Returns a new instance.',
		E.equals(() => {
			const instance = new S()
				.adaptEnd(state => ({
					...state,
					result: 'overridden'
				}))
			return instance({ result: 'start' })
		}, 'overridden'),
		JS("adaptEnd(...adapters)   { return this.with(S.adaptEnd(...adapters)) }"),
		TS(`adaptEnd(...adapters: Array<(state: SystemState<State, Result>) => SystemState<State, Result>>): S${commonGenericArguments} { return this.with(S.adaptEnd(...adapters)) }`)
	),
	D('instance.with(...adapters)',
		'Allows for the addition of predifined modules.',
		'Returns a new instance.',
		E.equals(() => {
			const instance = new S()
				.with(S.strict, S.async, S.for(10))
			return instance.config
		}, { async: true, strict: true, iterations: 10}),
		JS("with(...transformers)   { return S.with(...transformers)(this) }"),
		TS(`with<NewState extends InitialState = State, NewResult extends unknown = Result, NewInput extends Array<unknown> = Input, NewAction extends unknown = Action, NewProcess extends unknown = Process>(...transformers: Array<(instance: Pick<S${commonGenericArguments}, 'process' | 'config'>) => Pick<S<NewState, NewResult, NewInput, NewAction, NewProcess>, 'process' | 'config'>>): S<NewState, NewResult, NewInput, NewAction, NewProcess> { return S.with<State, Result, Input, Action, Process, NewState, NewResult, NewInput, NewAction, NewProcess>(...transformers)(this) }`)
	),
	CS("}"),
	CS("export const StateMachine = S"),
	CS("export const SuperSmallStateMachine = S"),
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
						new S([
							({ counter }) => ({ counter: counter + 1 }),
							({ result, counter }) => ({ result: result * counter }),
							{
								if: ({ input, counter }) => counter < input,
								then: 0
							}
						])
						.override(function ({ subState: currentSubState, subPath: currentSubPath }) {
							const currentState = {
								result: 1,
								input: 1,
								counter: 0,
								...currentSubState,
								[S.Path]: currentSubPath
							}
							const stepResult = this.perform(currentState, this.execute(currentState))
							const { [S.Path]: subPath, [S.Return]: subDone, ...subState } = stepResult
							return {
								subPath, subState, subDone: S.Return in stepResult
							}
						}),
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
