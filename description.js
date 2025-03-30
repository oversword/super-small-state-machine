import D, { E, JS, TS, CS } from './d/index.js'
import S, {  list_path_object,  get_closest_path, named, inc, or, forIn, SuperSmallStateMachineReferenceError, NodeTypeError, PathReferenceError, Return, Goto, StrictTypes, Changes, Stack, Trace, Continue, Break, SuperSmallStateMachineTypeError, SuperSmallStateMachineError, not, and, ident, name, shallow_merge_object, update_path_object, set_path_object, clone_object, Node, normalise_function, StateReferenceError, StateTypeError, wait_time, get_path_object, deep_merge_object, NodeReferenceError, MaxIterationsError, Symbols, ConditionNode, SequenceNode, BreakNode, ContinueNode, ReturnNode, AbsoluteGotoNode, AbsoluteGoto, InterruptGotoNode, InterruptGoto, MachineGotoNode, MachineGoto, SequenceGotoNode, SequenceGoto, GotoNode, MachineNode, WhileNode, While, SwitchNode, Switch, Condition, EmptyNode, Empty, UndefinedNode, Undefined, FunctionNode, FunctionN, Sequence, ChangesNode, ErrorNode, ErrorN, Machine } from './index.js'
import * as testModule from './index.js'
import { Nodes } from './index.js'
import { ExtensibleFunction } from './index.js'
import asyncPlugin, { Interrupt, Wait } from './plugin/async.js'
import parallelPlugin, { parallel } from './plugin/parallel.js'

class TestError extends Error {

}
const testSymbol = Symbol('test symbol')
const testSymbol2 = Symbol('test symbol 2')
const symbols = {
	Stack,
	Trace,
	StrictTypes,
	testSymbol,
	testSymbol2,
	Changes,
	Sequence,
	FunctionN,
	Condition,
	Switch,
	While,
	Machine,
	Goto,
	InterruptGoto,
	AbsoluteGoto,
	MachineGoto,
	SequenceGoto,
	ErrorN,
	Undefined,
	Empty,
	Continue,
	Break,
	Return,
}

const commonGenericDefinitionInner = `
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
`
const commonGenericDefinition = `<${commonGenericDefinitionInner}>`
const commonGenericArguments = `<State, Output, Input, Action, Process>`

/*
D('',
	E.equals(() => {
		const testObject = {
			
		}
		return
	}, {})
),

D('',
	E.todo(),
),
*/
const description = D('Super Small State Machine',
D('Language',
	'A process is made of nodes',
	'Nodes are executables or actions',
	'There are three phases: execute, perform, proceed',
	'- An executable results in an action',
	'- Actions are performed on the state',
	'- Then we proceed to the next node',
	'The state is made of properties',
	'The state may be given special system symbols containing execution information',
	'Machines have multiple stages, refered to by strings',
	'Machines have multiple interrupts, refered to by symbols',
	'Sequences have multiple indexes, refered to by numbers',
	'Conditions (including switch) have clauses',
),
D('Tutorial',
	D('To create a new state machine, create a new instance of the `S` class',
		E.success(() => {
			const instance = new S()
		})
	),
	D('The instance is executable, and can be run just like a function',
		E.equals(() => {
			const instance = new S([
				{ myProperty: 'myValue' },
				({ myProperty }) => ({ [Return]: myProperty })
			])
			return instance()
		}, 'myValue')
	),
	D('The initial state can be passed into the function call',
		E.equals(() => {
			const instance = new S([
				({ myProperty }) => ({ [Return]: myProperty })
			])
			return instance({ myProperty: 'myValue' })
		}, 'myValue')
	),
	D('An intuitive syntax can be used to construct the process of the state machine',
		E.success(() => {
			const instance = new S({
				initial: [
					{ order: [] }, // Set the "order" property to an empty list
					'second',      // Goto the "second" stage
				],
				second: { // Conditionally add the next number
					if: ({ order }) => order.length < 10,
					then: ({ order }) => ({ order: [ ...order, order.length ] }),
					else: 'end' // Goto the "end" stage if we have already counted to 10
				},
				end: ({ order }) => ({ [Return]: order }) // Return the list we have constructed
			})
		})
	),
	D('To configure the state machine, you can cahin configuration methods',
		E.success(() => {
			const instance = new S()
				.deep
				.strict
				.forever
		})
	),
	D('You can avoid making a new instance for each method by using `.with`',
		E.success(() => {
			const specificConfig = S.with(S.deep, S.strict, S.forever)
			const instance = new S()
				.with(specificConfig)
		})
	),
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
		D('Copies over symbols from the object.',
			E.equals(() => {
				return clone_object({
					[testSymbol]: 'testValue'
				})
			}, {
				[testSymbol]: 'testValue'
			}, symbols),
		),
		D('Only shallow copies symbols.',
			E.equals(() => {
				const content = {
					something: 'complex'
				}
				const clone = clone_object({ [testSymbol]: content })
				return clone[testSymbol] === content
			}, true, symbols),
		),
		D('Will deep merge symbols that are listed in `[Symbols]`.',
			E.equals(() => {
				const content = {
					something: 'complex'
				}
				const clone = clone_object({ [testSymbol]: content, [Symbols]: [testSymbol] })
				return clone[testSymbol] === content
			}, false, symbols),
		),
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
			JS("return { ...obj, ...Object.fromEntries(Object.entries(obj).concat(Symbols in obj ? obj[Symbols].map(key => [key,obj[key]]) : []).map(([key,value]) => [ key, clone_object(value) ])) }"),
			TS("return { ...obj, ...Object.fromEntries(Object.entries(obj).concat(Symbols in obj ? (obj[Symbols] as Array<string>).map(key => [key,obj[key]]) : []).map(([key,value]) => [ key, clone_object(value) ])) }")
		),
		CS("}"),
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
		D('Strings can be used to get object paths.',
			E.equals(() => {
				return get_path_object({ someString: 'someValue' }, ['someString'])
			}, 'someValue'),
		),
		D('Numbers can be used to get array paths.',
			E.equals(() => {
				return get_path_object([ 'firstValue', 'secondValue' ], [1])
			}, 'secondValue'),
		),
		D('Symbols can be used to get object paths.',
			E.equals(() => {
				return get_path_object({ [testSymbol]: 'someValue' }, [testSymbol])
			}, 'someValue'),
		),
		D('Numbers can be used to get object paths.',
			E.equals(() => {
				return get_path_object({ 99: 'someValue' }, [99])
			}, 'someValue'),
		),
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
		JS("export const get_path_object = (object, path = []) => (path.reduce(reduce_get_path_object, object))"),
		TS("export const get_path_object = <T extends unknown = unknown, O extends unknown = unknown>(object: O, path: Path = []): undefined | T => (path.reduce(reduce_get_path_object<T,O>, object) as (T | undefined))")
	),
	D('set_path_object (object, path, value)',
		'Returns a copy of the given object with the given path set to the given value',
		D('This method is exported by the library as `{ set_path_object }`',
			E.exports('set_path_object', testModule, './index.js'),
		),
		D('Strings can be used to set object keys',
			E.equals(() => {
				const testObject = {
					myExistingProperty: 'myExistingValue'
				}
				return set_path_object(testObject, ['myNewProperty'], 'myNewValue')
			}, { myExistingProperty: 'myExistingValue', myNewProperty: 'myNewValue' })
		),
		D('Numbers can be used to set array keys',
			E.equals(() => {
				const testObject = [
					'firstValue',
					'secondValue',
					'thirdValue',
					'fourthValue'
				]
				return set_path_object(testObject, [2], 'myNewValue')
			}, [ 'firstValue', 'secondValue', 'myNewValue', 'fourthValue' ])
		),
		D('Symbols can be used to set object keys',
			E.equals(() => {
				const testObject = {
					[testSymbol]: 'myExistingValue'
				}
				return set_path_object(testObject, [testSymbol], 'myNewValue')
			}, { [testSymbol]: 'myNewValue' }, [testSymbol])
		),
		D('Deep paths can be set',
			E.equals(() => {
				const testObject = {
					myObjectKey: {
						[testSymbol]: [
							'firstValue',
							'secondValue',
							'thirdValue',
							'fourthValue'
						]
					}
				}
				return set_path_object(testObject, ['myObjectKey',testSymbol,1], 'myNewValue')
			}, { myObjectKey: { [testSymbol]: [ 'firstValue', 'myNewValue', 'thirdValue', 'fourthValue' ] } })
		),
		D('Returns a copy of the original object',
			E.equals(() => {
				const testObject = {
					myObjectKey: 'myExistingValue'
				}
				return set_path_object(testObject, ['myObjectKey',testSymbol,1], 'myNewValue') === testObject
			}, false)
		),
		JS("export const set_path_object = (object, path = [], value = undefined) => {"),
		TS("export const set_path_object = <T extends unknown = unknown>(object: T, path: Path = [], value: unknown = undefined): T => {"),
		D("If we have an invalid input, just return the input",
			JS("if (path.length === 0 || typeof object !== 'object' || !object) return value"),
			TS("if (path.length === 0 || typeof object !== 'object' || !object) return value as T")
		),
		D('If the input is an Array, set the given index and recurse',
			JS("if (Array.isArray(object)) return [ ...object.slice(0,path[0]), set_path_object(object[path[0]], path.slice(1), value), ...object.slice(1+path[0]) ]"),
			TS("if (Array.isArray(object)) return [ ...object.slice(0, path[0] as number), set_path_object(object[path[0] as number], path.slice(1), value), ...object.slice(1 + (path[0] as number)) ] as T")
		),
		D('If the input is another object, set the given key and recurse',
			JS("return { ...object, [path[0]]: set_path_object(object[path[0]], path.slice(1), value), }"),
			TS("return { ...object, [path[0]]: set_path_object((object as Record<string,unknown>)[path[0] as string], path.slice(1), value), }")
		),
		CS("}")
	),
	D('update_path_object (object, path, transformer)',
		'Returns a copy of the given object with the given path set to the given value',
		'Does the same thing as set_path_object, but allows you to pass in a transformer instead of a value, which will take the current value as the first argument.',
		D('This method is exported by the library as `{ update_path_object }`',
			E.exports('update_path_object', testModule, './index.js'),
		),
		D('Has the same functionality as set_path_object',
			E.equals(() => {
				const testObject = {
					myObjectKey: 'myExistingValue'
				}
				return update_path_object(testObject, ['myObjectKey',testSymbol,1], () => 'myNewValue')
			}, { myObjectKey: 'myNewValue' })
		),
		D('Passes the current value at the path into the transformer method',
			E.equals(() => {
				const testObject = {
					myObjectKey: {
						[testSymbol]: [
							'firstValue',
							'secondValue',
							'thirdValue',
							'fourthValue'
						]
					}
				}
				let capturedValue;
				update_path_object(testObject, ['myObjectKey',testSymbol,1], (existingValue) => {
					capturedValue = existingValue
				})
				return capturedValue
			}, 'secondValue')
		),
		JS("export const update_path_object = (object, path = [], transformer = ident) => set_path_object(object, path, transformer(get_path_object(object, path), path, object))"),
		TS("export const update_path_object = <T extends unknown = unknown, O extends unknown = unknown>(object: O, path: Path = [], transformer: ((original: T, path: Path, object: O) => T) = ident) => set_path_object(object, path, transformer(get_path_object<T>(object, path)!, path, object))"),
	),
	D('map_list_path_object ([ key, value ])',
		'Finds all the paths in an object entry',
		D('This method is not exported by the library',
			E.notExports('map_list_path_object', testModule, './index.js'),
		),
		JS("const map_list_path_object = ([ key, value ]) => list_path_object(value).map(path => [ key, ...path ])"),
		TS("const map_list_path_object = ([ key, value ]: [ string, unknown ]): Array<Path> => list_path_object(value).map(path => [ key, ...path ])")
	),
	D('list_path_object (object)',
		'Finds all the paths in an object, always including the root path: `[]`.',
		D('This method is exported by the library as `{ list_path_object }`',
			E.exports('list_path_object', testModule, './index.js'),
		),

		D('Always returns the root path',
			E.equals(() => {
				const testObject = null
				return list_path_object(testObject)
			}, [[]])
		),
		D('Returns all the keys in an object',
			E.equals(() => {
				const testObject = {
					myKey1: 'testValue1',
					myKey2: 'testValue2',
					myKey3: 'testValue3',
					myKey4: 'testValue4',
				}
				return list_path_object(testObject)
			}, [[], ['myKey1'], ['myKey2'], ['myKey3'], ['myKey4']])
		),
		D('Returns all the indexes in an array',
			E.equals(() => {
				const testObject = [
					'firstValue',
					'secondValue',
					'thirdValue',
					'fourthValue'
				]
				return list_path_object(testObject)
			}, [[], ['0'], ['1'], ['2'], ['3']])
		),
		D('Returns deep paths',
			E.equals(() => {
				const testObject = {
					myObjectKey: [
						'firstValue',
						'secondValue',
						'thirdValue',
						{
							myKey2: 'fourthValue'
						}
					]
				}
				return list_path_object(testObject)
			}, [[], ['myObjectKey'], ['myObjectKey', '0'], ['myObjectKey', '1'], ['myObjectKey', '2'], ['myObjectKey', '3'], ['myObjectKey', '3', 'myKey2']])
		),
		JS("export const list_path_object = object => typeof object !== 'object' || !object ? [[]] : [[]].concat(...Object.entries(object).map(map_list_path_object))"),
		TS("export const list_path_object = (object: unknown): Array<Path> => typeof object !== 'object' || !object ? [[]] : ([[]] as Array<Path>).concat(...Object.entries(object).map(map_list_path_object))")
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
		JS("export const normalise_function = (functOrReturn) => ((functOrReturn instanceof Function) || (typeof functOrReturn === 'function')) ? functOrReturn : () => functOrReturn"),
		TS("export const normalise_function = (functOrReturn: Function | unknown): Function => ((functOrReturn instanceof Function) || (typeof functOrReturn === 'function')) ? functOrReturn : () => functOrReturn")
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
				JS("return override"),
				TS("return override as T")
			),
		),
		D('Get all combined unique keys',
			JS("const allKeys = [ ...new Set(Object.keys(base).concat(Symbols in base ? base[Symbols] : [], Object.keys(override), Symbols in override ? override[Symbols] : [])) ]"),
			TS("const allKeys = [ ...new Set((Object.keys(base) as Array<string | symbol>).concat(Symbols in base ? (base[Symbols] as Array<symbol>) : [], Object.keys(override), Symbols in override ? (override[Symbols] as Array<symbol>) : [])) ]"),
		),
		D('Make a new object with the combined keys',
			JS("return { ...base, ...override, ...Object.fromEntries(allKeys.map(key => [ key, key in override ? deep_merge_object(base[key], override[key]) : base[key] ])) }"),
			TS("return { ...base, ...override, ...Object.fromEntries(allKeys.map(key => [ key, key in override ? deep_merge_object((base as Record<string|symbol,unknown>)[key], (override as Record<string|symbol,unknown>)[key]) : (base as Record<string|symbol,unknown>)[key] ])) }"),
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
		D('Does preserve symbols',
			E.equals(() => {
				return deep_merge_object({
					[testSymbol]: 'value'
				}, { })
			}, { [testSymbol]: 'value' }, symbols),
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
	D('shallow_merge_object',
		'Merges all of the given arguments into one object, using the first as a base, and subsequent objects as overrides.',
		'Discards any symbol keys from all given objects',
		D('This method is exported by the library as `{ shallow_merge_object }`',
			E.exports('shallow_merge_object', testModule, './index.js'),
		),
		D('Merges object keys',
			E.equals(() => {
				const testObject = {
					myKey1: 'myTestValue1',
					myKey2: 'myTestValue2'
				}
				return shallow_merge_object(testObject, { myNewKey: 'myTestValue3', myKey2: 'myNewValue' })
			}, { myKey1: 'myTestValue1', myNewKey: 'myTestValue3', myKey2: 'myNewValue' })
		),
		D('Merges symbols',
			E.equals(() => {
				return shallow_merge_object({
					[testSymbol]: 'before',
					[testSymbol2]: 'merged'
				}, {
					[testSymbol]: 'overridden'
				})
			}, { [testSymbol]: 'overridden', [testSymbol2]: 'merged' }, symbols),
		),
		D('Does not deep merge objects',
			E.equals(() => {
				const testObject = {
					myKey1: 'myTestValue1',
					myKey2: {
						myOriginalKey: 'myTestValue2'
					}
				}
				return shallow_merge_object(testObject, { myKey2: { myNewKey: 'myNewValue' } })
			}, { myKey1: 'myTestValue1', myKey2: { myNewKey: 'myNewValue', myOriginalKey: undefined } })
		),
		TS('export const shallow_merge_object = <T extends unknown = unknown>(a: T, ...objects: Array<Partial<T>>): T => Object.assign({}, a, ...objects) as T'),
		JS('export const shallow_merge_object = (...objects) => Object.assign({}, ...objects)')
	),
	D('get_closest_path (object, path = [], condition = (node, path, object) => boolean)',
		'Returns the path of the closest node that matches the given `conditon`. It will check all ancestors including the node at the given `path`.',
		D('This method is exported by the library as `{ get_closest_path }`',
			E.exports('get_closest_path', testModule, './index.js'),
		),
		D('Returns the current node if it matches the condition',
			E.equals(() => {
				const testObject = {
					mySpecialKey: true,
					myKey: {
						mySpecialKey: true,
					}
				}
				return get_closest_path(testObject, ['myKey'], obj => obj.mySpecialKey)
			}, ['myKey'])
		),
		D('Returns the parent node if it matches the condition',
			E.equals(() => {
				const testObject = {
					mySpecialKey: true,
					myKey: {
						notMySpecialKey: true,
					}
				}
				return get_closest_path(testObject, ['myKey'], obj => obj.mySpecialKey)
			}, [])
		),
		D('Returns the first ancestor node that matches the condition',
			E.equals(() => {
				const testObject = {
					mySpecialKey: true,
					myKey2:{
						mySpecialKey: true,
						myKey: {
							notMySpecialKey: true,
							myKey3: 'something'
						}
					}
				}
				return get_closest_path(testObject, ['myKey2','myKey','myKey3'], obj => obj.mySpecialKey)
			}, ['myKey2'])
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
	D('name(obj)',
		'Gets the name of a given object',
		D('This method is exported by the library as `{ name }`',
			E.exports('name', testModule, './index.js'),
		),
		D('Gets the name property of an object',
			E.equals(() => {
				const testObject = {
					name: 'someName'
				}
				return name(testObject)
			}, 'someName')
		),
		D('Gets the name property of a function',
			E.equals(() => {
				const testFunction = () => {}
				return name(testFunction)
			}, 'testFunction')
		),
		JS("export const name = obj => obj.name"),
		TS("export const name = (obj: Function | { name?: string } | (Array<unknown> & { name?: string })): string | undefined => obj.name")
	),
	D('named(name, obj)',
		'Returns a new object, function, or array with the `name` property set to the gven name',
		D('This method is exported by the library as `{ named }`',
			E.exports('named', testModule, './index.js'),
		),
		D('Returns a function with the given name',
			E.equals(() => {
				const testFunction = () => {}
				const result = named('myNewName', testFunction)
				return typeof result === 'function' && result.name
			}, 'myNewName')
		),
		D('Returns a new function that takes the same arguments and returns the same value',
			E.equals(() => {
				const testFunction = (a, b, c) => `${a} + ${b} - ${c}`
				const result = named('myNewName', testFunction)
				return result !== testFunction && result(1, 2, 3)
			}, '1 + 2 - 3')
		),
		D('Returns an object with the name property set to the given name',
			E.equals(() => {
				const testObject = {
					myKey: 'myValue'
				}
				return named('myNewName', testObject)
			}, { name: 'myNewName', myKey: 'myValue' })
		),
		D('Returns an array with a name property set to the given name',
			E.equals(() => {
				const testObject = [
					'myValue'
				]
				const result = named('myNewName', testObject)
				return Array.isArray(result) && result.name
			}, 'myNewName')
		),
		D('Returns a new object',
			E.equals(() => {
				const testObject = {
					myKey: 'myValue'
				}
				return named('myNewName', testObject) === testObject
			}, false)
		),
		D('Returns a new array',
			E.equals(() => {
				const testObject = [
					'myValue'
				]
				return named('myNewName', testObject) === testObject
			}, false)
		),
		JS("export const named = (name, obj) => {"),
		TS("export const named = <T extends unknown = unknown>(name: string, obj: T): T & { name: string } => {"),
		D('Get the type of the given object',
			CS("const type = typeof obj")
		),
		D("If the given object is a function, use this trick to rename it",
			JS("if (type === 'function') return ({ [name]: (...args) => obj(...args) })[name]"),
			TS("if (typeof obj === 'function') return ({ [name]: (...args: Array<unknown>) => obj(...args) })[name] as T & { name: string }")
		),
		D('If the given object is an object that is not an array, add the name property',
			JS("if (type === 'object' && !Array.isArray(obj)) return { ...obj, name }"),
			TS("if (typeof obj === 'object' && !Array.isArray(obj)) return { ...obj, name }")
		),
		D('If it is an array, copy it',
			JS("const ret = type === 'object' ? [...obj] : obj"),
			TS("const ret = Array.isArray(obj) ? [...obj] : obj;")
		),
		D('Set the name property',
			JS("ret.name = name"),
			TS("(ret as T & { name: string }).name = name")
		),
		D('Return it',
			JS("return ret"),
			TS("return (ret as T & { name: string })")
		),
		CS("}")
	),
	D('noop',
		'No-op function, does nothing and returns undefined.',
		D('This method is exported by the library as `{ noop }`',
			E.exports('noop', testModule, './index.js'),
		),
		CS("export const noop = () => {}"),
	),
	D('ident',
		'The identity function, returns whatever is passed in.',
		'Used as the default for transformers',
		D('This method is exported by the library as `{ ident }`',
			E.exports('ident', testModule, './index.js'),
		),
		D('Returns the first argument, unmodified',
			E.equals(() => {
				const testObject = { myKey: 'myValue' }
				return ident(testObject) === testObject
			}, true)
		),
		JS("export const ident = original => original"),
		TS("export const ident = <T extends unknown = unknown>(original: T): T => original")
	),
	D('inc(property, by = 1)',
		'Returns a state change function that will increment the given property by the given amount',
		D('This method is exported by the library as `{ inc }`',
			E.exports('inc', testModule, './index.js'),
		),
		D('Returns a function',
			E.equals(() => {
				return typeof inc('someProperty')
			}, 'function')
		),
		D('The new function is named after the property',
			E.equals(() => {
				return inc('someProperty').name.includes('someProperty')
			}, true)
		),
		D('Increments a value in an object',
			E.equals(() => {
				const testObject = {
					myProperty: 8
				}
				return inc('myProperty')(testObject)
			}, { myProperty: 9 })
		),
		D('Returns a new object with only that key',
			E.equals(() => {
				const testObject = {
					myProperty: 8,
					myOtherProperty: 'something'
				}
				return inc('myProperty')(testObject)
			}, { myProperty: 9, myOtherProperty: undefined })
		),
		D('Decrements a value if -1 is passed',
			E.equals(() => {
				const testObject = {
					myProperty: 8
				}
				return inc('myProperty', -1)(testObject)
			}, { myProperty: 7 })
		),
		D('Can add any number to a value',
			E.equals(() => {
				const testObject = {
					myProperty: 8
				}
				return inc('myProperty', -12.5)(testObject)
			}, { myProperty: -4.5 })
		),
		JS("export const inc = (property, by = 1) => named(`${by === 1 ? 'increment ':''}${by === -1 ? 'decrement ':''}${property}${Math.sign(by) === 1 && by !== 1 ? ` plus ${by}`:''}${Math.sign(by) === -1 && by !== -1 ? ` minus ${Math.abs(by)}`:''}`, ({ [property]: i }) => ({ [property]: i + by }))"),
		TS("export const inc = <State extends InitialState = InitialState>(property: keyof State, by: number = 1): ((state: SystemState<State>) => ChangesType<State>) => named(`${by === 1 ? 'increment ':''}${by === -1 ? 'decrement ':''}${String(property)}${Math.sign(by) === 1 && by !== 1 ? ` plus ${by}`:''}${Math.sign(by) === -1 && by !== -1 ? ` minus ${Math.abs(by)}`:''}`, ({ [property]: i }) => ({ [property]: (i as number) + by } as ChangesType<State>))")
	),
	D('and(...methods)',
		'Returns a function that returns true if all the given methods return true',
		D('This method is exported by the library as `{ and }`',
			E.exports('and', testModule, './index.js'),
		),
		D('Returns a function',
			E.equals(() => {
				const result = and()
				return typeof result
			}, 'function')
		),
		D('Names the returned function after the given methods',
			E.equals(() => {
				const firstFunction = () => {}
				const secondFunction = () => {}
				const result = and(firstFunction, secondFunction)
				return result.name.includes(firstFunction.name) && result.name.includes(secondFunction.name)
			}, true)
		),
		D('Passes all arguments into the methods',
			E.equals(() => {
				let allArgs = []
				const firstFunction = (...args) => { allArgs.push(args); return true; }
				const secondFunction = (...args) => { allArgs.push(args); return true; }
				const result = and(firstFunction, secondFunction)
				result(1, 'a', 'Something', 5)
				return allArgs
			}, [ [1, 'a', 'Something', 5], [1, 'a', 'Something', 5] ])
		),
		D('Evaluates to true if all methods return truthy',
			E.equals(() => {
				const firstFunction = () => true
				const secondFunction = () => true
				const thridFunction = () => true
				const result = and(firstFunction, secondFunction, thridFunction)
				return result()
			}, true)
		),
		D('Evaluates to false if some methods return falsey',
			E.equals(() => {
				const firstFunction = () => true
				const secondFunction = () => false
				const thridFunction = () => true
				const result = and(firstFunction, secondFunction, thridFunction)
				return result()
			}, false)
		),
		D('Evaluates to true if no methods are given',
			E.equals(() => {
				const result = and()
				return result()
			}, true)
		),
		JS("export const and = (...methods) => named(methods.map(name).join(' and '), (...args) => methods.every(method => method(...args)))"),
		TS("export const and = <Args extends Array<unknown> = Array<unknown>>(...methods: Array<(...args: Args) => boolean>): ((...args: Args) => boolean) => named(methods.map(name).join(' and '), (...args) => methods.every(method => method(...args)))")
	),
	D('or(...methods)',
		'Returns a function that returns true if any of the given methods return truthy',
		D('This method is exported by the library as `{ or }`',
			E.exports('or', testModule, './index.js'),
		),
		D('Returns a function',
			E.equals(() => {
				const result = or()
				return typeof result
			}, 'function')
		),
		D('Names the returned function after the given methods',
			E.equals(() => {
				const firstFunction = () => {}
				const secondFunction = () => {}
				const result = or(firstFunction, secondFunction)
				return result.name.includes(firstFunction.name) && result.name.includes(secondFunction.name)
			}, true)
		),
		D('Passes all arguments into the methods',
			E.equals(() => {
				let allArgs = []
				const firstFunction = (...args) => { allArgs.push(args); return false; }
				const secondFunction = (...args) => { allArgs.push(args); return false; }
				const result = or(firstFunction, secondFunction)
				result(1, 'a', 'Something', 5)
				return allArgs
			}, [ [1, 'a', 'Something', 5], [1, 'a', 'Something', 5] ])
		),
		D('Evaluates to true if some methods return truthy',
			E.equals(() => {
				const firstFunction = () => false
				const secondFunction = () => true
				const thridFunction = () => false
				const result = or(firstFunction, secondFunction, thridFunction)
				return result()
			}, true)
		),
		D('Evaluates to false if no methods return truthy',
			E.equals(() => {
				const firstFunction = () => false
				const secondFunction = () => false
				const thridFunction = () => false
				const result = or(firstFunction, secondFunction, thridFunction)
				return result()
			}, false)
		),
		D('Evaluates to false if there are no methods',
			E.equals(() => {
				const result = or()
				return result()
			}, false)
		),
		JS("export const or = (...methods) => named(methods.map(name).join(' or '), (...args) => methods.some(method => method(...args)))"),
		TS("export const or = <Args extends Array<unknown> = Array<unknown>>(...methods: Array<(...args: Args) => boolean>): ((...args: Args) => boolean) => named(methods.map(name).join(' or '), (...args) => methods.some(method => method(...args)))")
	),
	D('not(method)',
		'Returns a function that returns true if the given method returns falsey',
		D('This method is exported by the library as `{ not }`',
			E.exports('not', testModule, './index.js'),
		),
		D('Returns a function',
			E.equals(() => {
				const myFunction = () => {}
				const result = not(myFunction)
				return typeof result
			}, 'function')
		),
		D('Names the returned function after the given method',
			E.equals(() => {
				const myFunction = () => {}
				const result = not(myFunction)
				return result.name.includes(myFunction.name)
			}, true)
		),
		D('Passes all arguments into the method',
			E.equals(() => {
				let allArgs = []
				const myFunction = (...args) => { allArgs.push(args); return false; }
				const result = not(myFunction)
				result(1, 'a', 'Something', 5)
				return allArgs
			}, [ [1, 'a', 'Something', 5] ])
		),
		D('Returns true if the method returns falsey',
			E.equals(() => {
				const myFunction = () => null
				const result = not(myFunction)
				return result()
			}, true)
		),
		D('Returns false if the given method returns truthy',
			E.equals(() => {
				const myFunction = () => 'some string'
				const result = not(myFunction)
				return result()
			}, false)
		),
		JS("export const not = method => named(`not ${method.name}`, (...args) => !method(...args))"),
		TS("export const not = <Args extends Array<unknown> = Array<unknown>>(method: ((...args: Args) => boolean)): ((...args: Args) => boolean) => named(`not ${method.name}`, (...args) => !method(...args))")
	),
	D('forIn(list, index, ...methods)',
		'Provides an easy way to make a "for index in list" loop using the in-built while loop.',
		D('This method is exported by the library as `{ forIn }`',
			E.exports('forIn', testModule, './index.js'),
		),
		D('Returns a list with a name',
			E.equals(() => {
				const result = forIn('myList', 'myIndex')
				return Array.isArray(result) && result.name
			}, 'for myIndex in myList')
		),
		D('Can be executed in a machine as a for loop',
			E.equals(() => {
				const machine = new S([
					forIn('stack', 'pointer',
						{ if: ({ pointer }) => pointer !== 0, then: ({ result }) => ({ result: result + ' ' }) },
						({ result, stack, pointer }) => ({ result: result + stack[pointer] })
					),
					({ result }) => ({ [Return]: result }) 
				])
				return machine({ stack: [ 'a', 'b', 'c', 'd' ], result: '', pointer: -1 })
			}, 'a b c d')
		),
		JS("export const forIn = (list, index, ...methods) => named(`for ${index} in ${list}`, [ named(`reset ${index}`, () => ({ [index]: 0 })), { while: named(`${index} is within ${list}`, ({ [index]: i, [list]: l }) => i < l.length), do: [ methods, inc(index) ] } ])"),
		TS(`export const forIn = ${commonGenericDefinition}(list: string, index: string, ...methods: Array<Process>): Process => named(\`for \${index} in \${list}\`, [ named(\`reset \${index}\`, () => ({ [index]: 0 })), { while: named(\`\${index} is within \${list}\`, ({ [index]: i, [list]: l }: State) => (i as number) < (l as Array<unknown>).length), do: [ methods, inc(index) ] } ]) as Process`)
	),
),
D('Errors',
	D('SuperSmallStateMachineError',
		'All Super Small State Machine Errors will inherit from this class.',
		'Allows for contextual information to be provided with the error',
		D('This class is exported by the library as `{ SuperSmallStateMachineError }`',
			E.exports('SuperSmallStateMachineError', testModule, './index.js'),
		),
		D('Is an error instance',
			E.equals(() => {
				return (new SuperSmallStateMachineError()) instanceof Error
			}, true)
		),
		D('A message string can be passed into the error',
			E.equals(() => {
				return new SuperSmallStateMachineError('My String!')
			}, { message: 'My String!' })
		),
		D('All exported errors inherit from this class',
			E.equals(() => {
				const referenceError      = new SuperSmallStateMachineReferenceError()
				const typeError           = new SuperSmallStateMachineTypeError()
				const stateReferenceError = new StateReferenceError()
				const stateTypeError      = new StateTypeError()
				const nodeTypeError       = new NodeTypeError()
				const nodeReferenceError  = new NodeReferenceError()
				const maxIterationsError  = new MaxIterationsError()
				const pathReferenceError  = new PathReferenceError()
				return referenceError      instanceof SuperSmallStateMachineError
					&& typeError           instanceof SuperSmallStateMachineError
					&& stateReferenceError instanceof SuperSmallStateMachineError
					&& stateTypeError      instanceof SuperSmallStateMachineError
					&& nodeTypeError       instanceof SuperSmallStateMachineError
					&& nodeReferenceError  instanceof SuperSmallStateMachineError
					&& maxIterationsError  instanceof SuperSmallStateMachineError
					&& pathReferenceError  instanceof SuperSmallStateMachineError
			}, true)
		),
		D('Passing a state, instance, and/or data will make those properties available in the error',
			E.equals(() => {
				return new SuperSmallStateMachineError('', {
					instance: 'something',
					state: 'my state',
					data: 'special data'
				})
			}, {
				instance: 'something',
				state: 'my state',
				data: 'special data'
			})
		),
		JS("export class SuperSmallStateMachineError extends Error {"),
		TS(`export class SuperSmallStateMachineError${commonGenericDefinition} extends Error {`),
		D('Declare contextual properties on the class',
			JS("instance; state; data;"),
			TS(`public instance?: Partial<S${commonGenericArguments}>`),
			TS("public state?: SystemState<State, Output>"),
			TS("public data?: any"),
		),
		D('Take in the message, followed by an object conatining the properties',
			JS("constructor(message, { instance, state, data } = {}) {"),
			TS(`constructor(message: string, { instance, state, data }: Partial<SuperSmallStateMachineError${commonGenericArguments}> = {}) {`),
			D('Create a normal error with the message',
				CS("super(message)"),
			),
			D('Assign the given properties to the instance',
				CS("Object.assign(this, { instance, state, data })"),
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
		D('All exported reference errors inherit from this class',
			E.equals(() => {
				const stateReferenceError = new StateReferenceError()
				const nodeReferenceError  = new NodeReferenceError()
				const pathReferenceError  = new PathReferenceError()
				return stateReferenceError instanceof SuperSmallStateMachineReferenceError
					&& nodeReferenceError  instanceof SuperSmallStateMachineReferenceError
					&& pathReferenceError  instanceof SuperSmallStateMachineReferenceError
			}, true)
		),
		JS("export class SuperSmallStateMachineReferenceError extends SuperSmallStateMachineError {}"),
		TS(`export class SuperSmallStateMachineReferenceError${commonGenericDefinition} extends SuperSmallStateMachineError${commonGenericArguments} {}`)
	),
	D('SuperSmallStateMachineTypeError',
		'All Super Small State Machine Type Errors will inherit from this class',
		D('This class is exported by the library as `{ SuperSmallStateMachineTypeError }`',
			E.exports('SuperSmallStateMachineTypeError', testModule, './index.js'),
		),
		D('All exported type errors inherit from this class',
			E.equals(() => {
				const stateTypeError = new StateTypeError()
				const nodeTypeError  = new NodeTypeError()
				return stateTypeError instanceof SuperSmallStateMachineTypeError
					&& nodeTypeError  instanceof SuperSmallStateMachineTypeError
			}, true)
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
		D('A state reference error is thrown when a new property is added to the state of a machine while in strict mode',
			E.error(() => {
				const machine = new S({ myUnknownVar: true }).strict
				return machine()
			}, StateReferenceError)
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
		D('A state type errors is thrown when a property changes type in strict state mode',
			E.error(() => {
				const machine = new S({ myKnownVar: 'not a boolean' }).strictTypes
				.defaults({ myKnownVar: true })
				return machine()
			}, StateTypeError)
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
		D('A node type error is thrown when an unrecognised node is used in a process',
			E.error(() => {
				const machine = new S(true)
				return machine()
			}, NodeTypeError)
		),
		JS("export class NodeTypeError extends SuperSmallStateMachineTypeError {}"),
		TS(`export class NodeTypeError${commonGenericDefinition} extends SuperSmallStateMachineTypeError${commonGenericArguments} {}`)
	),
	D('NodeReferenceError',
		'An undefined node was used in a process.',
		'This is probably caused by a missing variable.',
		'If you wish to perform an intentional no-op, use `null`',
		D('This class is exported by the library as `{ NodeReferenceError }`',
			E.exports('NodeReferenceError', testModule, './index.js'),
		),
		D('An node reference error is thrown when a node in a process is `undefined`',
			E.error(() => {
				const machine = new S([undefined])
				return machine()
			}, NodeReferenceError)
		),
		JS("export class NodeReferenceError extends SuperSmallStateMachineReferenceError {}"),
		TS(`export class NodeReferenceError${commonGenericDefinition} extends SuperSmallStateMachineReferenceError${commonGenericArguments} {}`)
	),
	D('MaxIterationsError',
		'The execution of the process took more iterations than was allowed.',
		'This can be configured using `.for` or `.forever`',
		D('This class is exported by the library as `{ MaxIterationsError }`',
			E.exports('MaxIterationsError', testModule, './index.js'),
		),
		D('A max iterations errors is thrown when an execution exceeds the maximum allowed iterations',
			E.error(() => {
				const machine = new S([ 0 ]).for(10)
				return machine()
			}, MaxIterationsError)
		),
		JS("export class MaxIterationsError extends SuperSmallStateMachineError {}"),
		TS(`export class MaxIterationsError${commonGenericDefinition} extends SuperSmallStateMachineError${commonGenericArguments} {}`)
	),
	D('PathReferenceError',
		'A path was referenced which could not be found in the given process.',
		D('This class is exported by the library as `{ PathReferenceError }`',
			E.exports('PathReferenceError', testModule, './index.js'),
		),
		D('A path reference error is thrown when the machine is told to target a node that does not exist',
			E.error(() => {
				const machine = new S('not a stage')
				return machine()
			}, PathReferenceError)
		),
		JS("export class PathReferenceError extends SuperSmallStateMachineReferenceError {}"),
		TS(`export class PathReferenceError${commonGenericDefinition} extends SuperSmallStateMachineReferenceError${commonGenericArguments} {}`)
	),
),
D('Symbols',
	D('Stack',
		'Exists in the state to indicate the next action path.',
		E.success(() => {
			return { [Stack]: [] }
		}),
		CS("export const Stack       = Symbol('SSSM Stack')"),
	),
	
	D('Symbols',
		'Can be used in any object to indicate symbols that should be parsed like normal properties.',
		E.success(() => {
			return { [Symbols]: [] }
		}),
		CS("export const Symbols     = Symbol('SSSM Symbols')"),
	),
	
	D('Trace',
		'Exists in the state when the trace flag is on, will contain every path that was executed during the run.',
		E.success(() => {
			return { [Trace]: [] }
		}),
		CS("export const Trace       = Symbol('SSSM Trace')"),
	),
	D('StrictTypes',
		'Possible value of `config.strict`, used to indicate strict types as well as values.',
		CS("export const StrictTypes = Symbol('SSSM Strict Types')")
	),
),
D('Node Definitions',
	'Extends the Map class.',
	E.equals(() => {
		return new Nodes() instanceof Map
	}, true, symbols),
	D('This class is exported by the library as `{ Nodes }`',
		E.exports('Nodes', testModule, './index.js'),
	),
	JS("export class Nodes extends Map {"),
	TS(`export class Nodes${commonGenericDefinition} extends Map<string | symbol, typeof Node> {`),
	D('Takes in a list of nodes and acts as a collection-object for them',
		E.equals(() => {
			class MyNode extends Node {
				static type = testSymbol
				static typeof(object) { return object === testSymbol }
			}
			return [...new Nodes(MyNode).entries()]
		}, [[testSymbol, { type: testSymbol }]], symbols),
		JS("constructor(...nodes) { super(nodes.flat(Infinity).map(node => [node.type,node])) }"),
		TS("constructor(...nodes: Array<typeof Node>) { super(nodes.flat(Infinity).map(node => [node.type,node])) }")
	),
	D('Provides a typeof method that checks the given `object` against the node definitions and returns the type of the node.',
		JS("typeof(object, objectType = typeof object, isAction = false) {"),
		TS("typeof(object: unknown, objectType: (typeof object) = typeof object, isAction: boolean = false): false | string | symbol {"),
		D('Check if the node is an instance of Node to skip lookup',
			E.equals(() => {
				let typeofCalled = false
				const MyNodeType = Symbol("My Node")
				class MyNode extends Node {
					static type = MyNodeType
					static typeof(object) {
						typeofCalled = true
						return object === MyNodeType
					}
				}
				const result = new Nodes(MyNode).typeof(new MyNode(MyNodeType)) === MyNodeType
				return !typeofCalled && result
			}, true, symbols),
			JS("if (object instanceof Node) return object.constructor.type"),
			TS("if (object instanceof Node) return (object.constructor as typeof Node).type"),
		),
		D('Search from last to first to allow easy overriding',
			E.equals(() => {
				const MyNodeType = Symbol("My Node")
				class MyNode extends Node {
					static type = MyNodeType
					static typeof(object) { return object === MyNodeType }
				}
				const MyOtherNodeType = Symbol("My Other Node")
				class MyOtherNode extends Node {
					static type = MyOtherNodeType
					static typeof(object) { return object === MyNodeType }
				}
				return new Nodes(MyNode, MyOtherNode).typeof(MyNodeType) === MyOtherNodeType
			}, true, symbols),
			'Newer types override older types',
			JS("const foundType = [...this.values()].findLast(current => current.typeof(object, objectType, isAction))"),
			TS("const foundType = [...this.values()].reverse().find(current => current.typeof(object, objectType, isAction))")
		),
		D('Return the name of the type if the type is found, otherwise return false',
			E.equals(() => {
				const MyNodeType = Symbol("My Node")
				class MyNode extends Node {
					static type = MyNodeType
					static typeof(object) { return object === MyNodeType }
				}
				return new Nodes(MyNode).typeof(MyNodeType) === MyNodeType
			}, true, symbols),
			E.equals(() => {
				const MyNodeType = Symbol("My Node")
				class MyNode extends Node {
					static type = MyNodeType
					static typeof(object) { return object === MyNodeType }
				}
				return new Nodes().typeof(MyNodeType)
			}, false, symbols),
			CS("return foundType ? foundType.type : false"),
		),
		CS("}"),
	),
	D('Provides a list of keywords that the nodes have registered',
		E.equals(() => {
			return new Nodes({ type: 'a', keywords: ['this','that','theother'] }, { type: 'b', keywords: ['more'] }).keywords
		}, ['this','that','theother','more'], symbols),
		CS("get keywords() { return [...this.values()].flatMap(({ keywords }) => keywords) }")

	),
	CS("}"),
),
D('Node Definition',
	D('This class is exported by the library as `{ Node }`',
		E.exports('Node', testModule, './index.js'),
	),
	CS("export class Node {"),
	D('The type will deafault to "SSSM Unnamed"',
		E.equals(() => {
			return typeof Node.type
		}, 'symbol'),
		JS("static type = Symbol('SSSM Unnamed')"),
		TS("static type: string | symbol = Symbol('SSSM Unnamed')"),
	),
	D('The typeof method will return false by default.',
		E.equals(() => {
			return Node.typeof(true) === false && Node.typeof(1) === false && Node.typeof('string') === false && Node.typeof([]) === false && Node.typeof({}) === false
		}, true),
		JS("static typeof = () => false"),
		TS("static typeof<SelfType extends unknown = never>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType { return false };"),
	),
	D('The keyword list will be empty be default.',
		E.equals(() => {
			return Node.keywords
		}, []),
		JS("static keywords = []"),
		TS("static keywords: Array<string> = []"),
	),
	D('The execute method will return the node as an action by default.',
		E.equals(() => {
			const obj = { myProperty: 'myValue' }
			return Node.execute(obj) === obj
		}, true),
		JS("static execute = ident"),
		TS(`static execute<${commonGenericDefinitionInner}SelfType extends unknown = never,>(this: Instance${commonGenericArguments}, node: SelfType, state: SystemState<State, Output>): Action | Promise<Action> { return node as unknown as Action }`)
	),
	D('The proceed method will ascend up the process tree, or up the stack, or exit by default.',
		E.equals(() => {
			return Node.proceed.call(new S({
				initial: [
					{ myProperty: 'myValue' },
					testSymbol,
					({ myProperty }) => ({ myProperty: myProperty + '-B' }),
				],
				[testSymbol]: [
					({ myProperty }) => ({ myProperty: myProperty + '-A' }),
				],
			}), undefined, {
				myProperty: 'myValue-A-B',
				[Stack]: [{path:['initial',1],origin:Return,point:2}]
			})
		}, { myProperty: 'myValue-A-B',
			[Stack]: [{path:['initial',2],origin:Return,point:2}]
		}, symbols),
		JS("static proceed (node, state) {"),
		TS(`static proceed<${commonGenericDefinitionInner}SelfType extends unknown = never,>(this: Instance${commonGenericArguments}, node: SelfType, state: SystemState<State, Output>): SystemState<State, Output> | Promise<SystemState<State, Output>> {`),
		D('Get the stack',
			D('Will use the stack on the state if it is given',
				E.equals(() => {
					let stackAccessed = false
					Node.proceed.call(new S(null), undefined, new Proxy({
						[Stack]: [{path:[],origin:Return,point:0}],
					}, {
						get(target, property) {
							if (property === Stack)
								stackAccessed = true
							return target[property]
						}
					}))
					return stackAccessed
				}, true, symbols),
			),
			D('Will proceed on an empty stack by default',
				E.equals(() => {
					return Node.proceed.call(new S(null), undefined, {
						[Return]: 'myValue'
					})
				}, {[Return]:'myValue',[Stack]:[]}, symbols),
			),
			CS("const stack = state[Stack] || [{path:[],origin:Return,point:0}]"),
		),
		D('If the current path has reached the end',
			CS("if (stack[0].point === 0) {"),
			D('If there are no more paths left, return with the existing value.',
				E.equals(() => {
					return Node.proceed.call(new S(null), undefined, {
						[Stack]: [{path:[],origin:Return,point:0}],
						[Return]: 'myValue'
					})
				}, {[Return]:'myValue',[Stack]:[]}, symbols),
				CS("if (stack.length === 1) return { ...state, [Return]: state[Return], [Stack]: [] }"),
			),
			D('If there are paths left, intercept the return value',
				E.equals(() => {
					return Node.proceed.call(new S({initial:null,[testSymbol]:null}), undefined, {
						[Stack]: [{path:[testSymbol],origin:testSymbol,point:1},{path:[],origin:Return,point:0}],
						[Return]: 'myValue'
					})
				}, {[Return]:undefined}, symbols),
				CS("const { [Return]: interruptReturn, ...cleanState } = state"),
			),
			D('Set the interrupt which was the origin of the thread to the return value in the state.',
				E.equals(() => {
					return Node.proceed.call(new S({initial:null,[testSymbol]:null}), undefined, {
						[Stack]: [{path:[],origin:testSymbol,point:1},{path:[],origin:Return,point:0}],
						[Return]: 'myValue'
					})
				}, {[testSymbol]:'myValue'}, symbols),
				JS("return { ...cleanState, [Stack]: stack.slice(1), [stack[0].origin]: interruptReturn }"),
				TS("return { ...cleanState, [Stack]: stack.slice(1), [stack[0].origin]: interruptReturn } as SystemState<State, Output>"),
			),
			CS("}"),
		),
		D('Proceeds as normal for the parent node by moving the pointer down.',
			CS("return S._proceed(this, { ...state, [Stack]: [{ ...stack[0], point: stack[0].point-1 }, ...stack.slice(1)] }, get_path_object(this.process, stack[0].path.slice(0,stack[0].point-1)))"),
		),
		CS("}"),
	),
	D('The perform method will do nothing, and return the state as-is by default.',
		E.equals(() => {
			const stateObj = { myProperty: 'myValue' }
			return Node.perform(undefined, stateObj) === stateObj
		}, true),
		JS(`static perform(action, state) { return state }`),
		TS(`static perform<${commonGenericDefinitionInner}SelfType extends unknown = never,>(this: Instance${commonGenericArguments}, action: SelfType, state: SystemState<State, Output>): SystemState<State, Output> | Promise<SystemState<State, Output>> { return state }`)
	),
	D('The traverse method will return the node by default.',
		E.equals(() => {
			const obj = { myProperty: 'myValue' }
			return Node.traverse(obj) === obj
		}, true),
		JS("static traverse = ident"),
		TS(`static traverse<${commonGenericDefinitionInner}SelfType extends unknown = never,>(this: Instance${commonGenericArguments}, node: SelfType, path: Path, iterate: ((path: Path) => SelfType)): SelfType { return node }`)
	),
	D('An instance of a node will keep track of the original value for later reference.',
		E.equals(() => {
			const obj = { myProperty: 'myValue' }
			return new Node(obj).value === obj
		}, true),
		CS("value = undefined"),
		CS("constructor(node) { this.value = node }"),
	),
	CS("}"),
),
D('Extra types',
	TS(`export interface Instance<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
> {
	config: Config${commonGenericArguments},
	process: Process,
}
export interface InitialState {
	[key: string]: unknown,
}
export type SystemState<State extends InitialState = InitialState, Output extends unknown = undefined> = State & {
	[Stack]: StackType
	[Trace]: Array<StackType>
	[Changes]: Partial<State>
	[Return]?: Output | undefined
}
export type InputSystemState<State extends InitialState = InitialState, Output extends unknown = undefined> = State & Partial<Pick<SystemState<State, Output>, typeof Stack | typeof Return | typeof Trace | typeof Changes>>

export interface Config<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
> {
	defaults: State,
	iterations: number,
	until: (this: Instance${commonGenericArguments}, state: SystemState<State, Output>, runs: number) => boolean,
	strict: boolean | typeof StrictTypes,
	override: null | ((...args: Input) => Output),
	adapt: Array<(process: Process) => Process>,
	before: Array<(state: SystemState<State, Output>) => SystemState<State, Output>>,
	after: Array<(state: SystemState<State, Output>) => SystemState<State, Output>>,
	input: (...input: Input) => Partial<InputSystemState<State, Output>>,
	output: (state: SystemState<State, Output>) => Output,
	nodes: Nodes${commonGenericArguments},
	trace: boolean,
	deep: boolean,
}`)
),

D('Default Nodes',
	D('Error Node',
		'Throws the given error',
		D('The ErrorN symbol is exported as `{ ErrorN }`',
			E.exports('ErrorN', testModule, './index.js'),
		),
		CS("export const ErrorN = Symbol('SSSM Error')"),
		TS("export type ErrorType = Error | ErrorConstructor"),
		D('This definition is exported by the library as `{ ErrorNode }`',
			E.exports('ErrorNode', testModule, './index.js'),
		),
		CS("export class ErrorNode extends Node {"),
		D('Uses the ErrorN symbol as the type.',
			CS("static type = ErrorN"),
			E.equals(() => {
				return ErrorNode.type
			}, ErrorN, symbols),
		),
		D('Look for Error objects, or Error constructors.',
			D('Matches error objects',
				E.equals(() => {
					return S.config.nodes.typeof(new Error('My Error'))
				}, ErrorN, symbols),
			),
			D('Matches error constructors',
				E.equals(() => {
					return S.config.nodes.typeof(Error)
				}, ErrorN, symbols),
			),
			D('Matches descendent error objects',
				E.equals(() => {
					return S.config.nodes.typeof(new TypeError('My Error'))
				}, ErrorN, symbols),
			),
			D('Matches descendent error constructors',
				E.equals(() => {
					return S.config.nodes.typeof(TypeError)
				}, ErrorN, symbols),
			),
			JS("static typeof = (object, objectType) => (objectType === 'object' && object instanceof Error) || (objectType === 'function' && (object === Error || object.prototype instanceof Error))"),
			TS("static typeof<SelfType = ErrorType>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType { return (objectType === 'object' && object instanceof Error) || (objectType === 'function' && (object === Error || (object as Function).prototype instanceof Error)) }")
		),
		D('Perform an error by throwing it, no fancy magic.',
			JS("static perform(action, state) {"),
			TS(`static perform<${commonGenericDefinitionInner}SelfType = ErrorType,>(this: Instance${commonGenericArguments}, action: SelfType, state: SystemState<State, Output>): SystemState<State, Output> | Promise< SystemState<State, Output>> {`),
			D('Throw an error constructed by the function.',
				E.error(() => {
					return ErrorNode.perform(TestError, {})
				}, TestError),
				JS("if (typeof action === 'function') throw new action()"),
				TS("if (typeof action === 'function') throw new (action as unknown as ErrorConstructor)()")
			),
			D('Throw an existing error instance.',
				E.error(() => {
					return ErrorNode.perform(new TestError(), {})
				}, TestError),
				CS("throw action")
			),
			CS("}")
		),
		CS("}"),
	),
	D('Changes Node',
		'Updates the state by merging the properties. Arrays will not be merged.',
		D('Overrides existing properties when provided',
			E.is(() => {
				const instance = new S({ result: 'overridden' })
					.output(({ result }) => result)
				return instance({ result: 'start' })
			}, 'overridden'),
		),

		D('Adds new properties while preserving existing properties',
			E.equals(() => {
				const instance = new S({ newValue: true })
					.output(state => state)
				return instance({ existingValue: true })
			}, {
				existingValue: true,
				newValue: true
			}),
		),
		D('The Changes symbol is exported as `{ Changes }`',
			E.exports('Changes', testModule, './index.js'),
		),
		CS("export const Changes = Symbol('SSSM Changes')"),
		TS("export type ChangesType<State extends InitialState = InitialState> = Partial<State>"),
		D('This definition is exported by the library as `{ ChangesNode }`',
			E.exports('ChangesNode', testModule, './index.js'),
		),
		CS("export class ChangesNode extends Node {"),
		D('Uses the Changes symbol as the type.',
			CS("static type = Changes"),
			E.equals(() => {
				return ChangesNode.type
			}, Changes, symbols),
		),
		D('Any object not caught by other conditions should qualify as a state change.',
			E.equals(() => {
				return S.config.nodes.typeof({ someProperty: 'someValue' })
			}, Changes, symbols),
			JS("static typeof(object, objectType) { return Boolean(object && objectType === 'object') }"),
			TS("static typeof<SelfType = ChangesType>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType { return Boolean(object && objectType === 'object') }")
		),
		D('Apply the changes to the state and step forward to the next node',
			E.equals(() => {
				return ChangesNode.perform.call(new S(), { myProperty: 'changed' }, { [Changes]: {}, myProperty: 'myValue' })
			}, { myProperty: 'changed', [Changes]: { myProperty: 'changed' }}, symbols),
			JS("static perform(action, state) { return S._changes(this, state, action) }"),
			TS(`static perform<${commonGenericDefinitionInner}SelfType = ChangesType<State>,>(this: Instance${commonGenericArguments}, action: SelfType, state: SystemState<State, Output>): SystemState<State, Output> | Promise< SystemState<State, Output>> { return S._changes(this, state, action as ChangesType<State>) as SystemState<State, Output> }`),
		),
		CS("}"),
	),
	D('Sequence Node',
		'Sequences are lists of nodes and executables, they will visit each node in order and exit when done.',
		D('Sequences will execute each index in order',
			E.is(() => {
				const instance = new S([
					({ result }) => ({ result: result + ' addition1' }),
					({ result }) => ({ result: result + ' addition2' }),
				]).output(({ result }) => result)
				return instance({ result: 'start' })
			}, 'start addition1 addition2'),
		),
		D('The Sequence symbol is exported as `{ Sequence }`',
			E.exports('Sequence', testModule, './index.js'),
		),
		CS("export const Sequence = Symbol('SSSM Sequence')"),
		TS("export type SequenceType<State extends InitialState = InitialState, Output extends unknown = undefined, Action extends unknown = ActionType<State, Output>> = Array<ProcessType<State, Output, Action>>"),
		D('This definition is exported by the library as `{ SequenceNode }`',
			E.exports('SequenceNode', testModule, './index.js'),
		),
		CS("export class SequenceNode extends Node {"),
		D('Uses the Sequence symbol as the type.',
			CS("static type = Sequence"),
			E.equals(() => {
				return SequenceNode.type
			}, Sequence, symbols),
		),
		D('Proceed by running the next node in the sequence',
			JS("static proceed(node, state) {"),
			TS(`static proceed<${commonGenericDefinitionInner}SelfType = SequenceType<State, Output, Action>,>(this: Instance${commonGenericArguments}, node: SelfType, state: SystemState<State, Output>): SystemState<State, Output> | Promise<SystemState<State, Output>> {`),
			D('Get the current index in this sequence from the path',
				CS("const index = state[Stack][0].path[state[Stack][0].point]"),
			),
			D('If there are more nodes to execute',
				E.equals(() => {
					return SequenceNode.proceed.call(new S([[null,null,null], null]), [null,null,null], { [Stack]: [{path:[0,1],origin:Return,point:1}]})
				}, { [Stack]: [{path:[0,2],origin:Return,point:2}] }, symbols),
				JS("if (node && (typeof index === 'number') && (index+1 < node.length))"),
				TS("if (node && (typeof index === 'number') && (index+1 < (node as SequenceType<State, Output, Action>).length))"),
				D('Execute the next node',
					CS("return { ...state, [Stack]: [{ ...state[Stack][0], path: [...state[Stack][0].path.slice(0,state[Stack][0].point), index+1], point: state[Stack][0].point + 1 }, ...state[Stack].slice(1)] }"),
				),
			),
			D('Proceed as normal if the list is complete',
				E.equals(() => {
					return SequenceNode.proceed.call(new S([[null,null,null], null]), [null,null,null], { [Stack]: [{path:[0,2],origin:Return,point:1}]})
				}, { [Stack]: [{path:[1],origin:Return,point:1}] }, symbols),
				JS("return Node.proceed.call(this, node, state)"),
				TS("return Node.proceed.call(this as any, node, state) as SystemState<State, Output>"),
			),
			CS("}"),
		),
		D('A sequence is an array.',
			E.equals(() => {
				return S.config.nodes.typeof([ 1, 2, 3 ])
			}, Sequence, symbols),
			E.equals(() => {
				return S.config.nodes.typeof([ 1, 2, 3 ], 'object', true)
			}, AbsoluteGoto),
			JS("static typeof(object, objectType, isAction) { return ((!isAction) && objectType === 'object' && Array.isArray(object)) }"),
			TS("static typeof<SelfType = SequenceType>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType { return ((!isAction) && objectType === 'object' && Array.isArray(object)) }")
		),
		D('Execute a sequence by directing to the first node (so long as it has nodes)',
			E.equals(() => {
				return SequenceNode.execute([null,null,null], { [Stack]: [{path:['some',0,'complex','path'],origin:Return,point:4}]})
			}, ['some',0,'complex','path',0], symbols),
			JS("static execute(node, state) { return node.length ? [ ...state[Stack][0].path.slice(0,state[Stack][0].point), 0 ] : null }"),
			TS(`static execute<${commonGenericDefinitionInner}SelfType = SequenceType<State, Output, Action>,>(this: Instance${commonGenericArguments}, node: SelfType, state: SystemState<State, Output>): Action | Promise<Action> { return ((node as SequenceType<State, Output, Action>).length ? [ ...state[Stack][0].path.slice(0,state[Stack][0].point), 0 ] : null) as Action }`),
		),
		D('Traverse a sequence by iterating through each node in the array.',
			// E.todo(),
			JS("static traverse(node, path, iterate) { return node.map((_,i) => iterate([...path,i])) }"),
			TS(`static traverse<${commonGenericDefinitionInner}SelfType = SequenceType<State, Output, Action>,>(this: Instance${commonGenericArguments}, node: SelfType, path: Path, iterate: ((path: Path) => SelfType)): SelfType { return (node as SequenceType<State, Output, Action>).map((_,i) => iterate([...path,i])) as SelfType }`)
		),
		CS("}"),
	),
	D('Function Node',
		'The only argument to the function will be the state.',
		'You can return any of the previously mentioned action types from a function, or return nothing at all for a set-and-forget action.',
		D('A function can return a state change',
			E.is(() => {
				const instance = new S(({ result }) => ({ result: result + ' addition' }))
					.output(({ result }) => result)
				return instance({ result: 'start' })
			}, 'start addition'),
		),
		D('A function can return a goto',
			E.is(() => {
				const instance = new S([
					{ result: 'first' },
					() => 4,
					{ result: 'skipped' },
					Return,
					{ result: 'second' },
				]).output(({ result }) => result)
				return instance({ result: 'start' })
			}, 'second'),
		),
		D('A function can return a return statement',
			E.is(() => {
				const instance = new S(() => ({ [Return]: 'changed' }))
				return instance()
			}, 'changed'),
		),
		D('A function can do anything without needing to return (set and forget)',
			E.is(() => {
				const instance = new S(() => {
					// Arbitrary code
				}).output(({ result }) => result)
				return instance({ result: 'start' })
			}, 'start'),
		),
		D('The FunctionN symbol is exported as `{ FunctionN }`',
			E.exports('FunctionN', testModule, './index.js'),
		),
		CS("export const FunctionN = Symbol('SSSM Function')"),
		TS("export type FunctionType<State extends InitialState = InitialState, Output extends unknown = undefined, Action extends unknown = ActionType<State, Output>> = (state: SystemState<State, Output>) => Action | Promise<Action>"),
		D('This definition is exported by the library as `{ FunctionNode }`',
			E.exports('FunctionNode', testModule, './index.js'),
		),
		CS("export class FunctionNode extends Node {"),
		D('Uses the FunctionN symbol as the type.',
			CS("static type = FunctionN"),
			E.equals(() => {
				return FunctionNode.type
			}, FunctionN, symbols),
		),
		D('A function is a JS function. A function cannot be an action.',
			E.equals(() => {
				return S.config.nodes.typeof(() => {})
			}, FunctionN, symbols),
			JS("static typeof(object, objectType, isAction) { return (!isAction) && objectType === 'function' }"),
			TS("static typeof<SelfType = FunctionType>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType { return (!isAction) && objectType === 'function' }")
		),
		D('Exectute a functon by running it, passing in the state.',
			E.equals(() => {
				let methodRun = false
				const result = FunctionNode.execute((...args) => {
					methodRun = true
					return args
				}, { [Stack]: [{path:[],origin:Return,point:0}] })
				return methodRun && result
			}, [{ [Stack]: [{path:[],origin:Return,point:0}] }], symbols),
			JS("static execute(node, state) { return node(state) }"),
			TS(`static execute<${commonGenericDefinitionInner}SelfType = FunctionType<State, Output, Action>,>(this: Instance${commonGenericArguments}, node: SelfType, state: SystemState<State, Output>): Action | Promise<Action> { return (node as FunctionType<State, Output, Action>)(state) }`)
		),
		CS("}"),
	),
	D('Undefined Node',
		D('The Undefined symbol is exported as `{ Undefined }`',
			E.exports('Undefined', testModule, './index.js'),
		),
		CS("export const Undefined = Symbol('SSSM Undefined')"),
		D('This definition is exported by the library as `{ UndefinedNode }`',
			E.exports('UndefinedNode', testModule, './index.js'),
		),
		CS("export class UndefinedNode extends Node {"),
		D('Uses the Undefined symbol as the type.',
			CS("static type = Undefined"),
			E.equals(() => {
				return UndefinedNode.type
			}, Undefined, symbols),
		),
		D('Undefined is the `undefined` keyword.',
			E.equals(() => {
				return S.config.nodes.typeof(undefined)
			}, Undefined, symbols),
			JS("static typeof(object, objectType) { return objectType === 'undefined' }"),
			TS("static typeof<SelfType = undefined>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType { return objectType === 'undefined' }")
		),
		D('Un undefined node cannot be executed, throw an error to help catch incorrect configuration.',
			E.error(() => {
				const instance = new S([undefined])
				return instance()
			}, NodeReferenceError),
			JS("static execute(node, state) { throw new NodeReferenceError(`There is nothing to execute at path [ ${state[Stack][0].path.slice(0,state[Stack][0].point).map(key => key.toString()).join(', ')} ]`, { instance: this, state, data: { node } }) }"),
			TS(`static execute<${commonGenericDefinitionInner}SelfType = undefined>(this: Instance${commonGenericArguments}, node: SelfType, state: SystemState<State, Output>): Action | Promise<Action> { throw new NodeReferenceError(\`There is nothing to execute at path [ \${state[Stack][0].path.slice(0,state[Stack][0].point).map(key => key.toString()).join(', ')} ]\`, { instance: this, state, data: { node } }) }`)
		),
		D('When used as an action, undefined only moves to the next node.',
			E.equals(() => {
				const instance = new S([
					() => undefined,
					{ [Return]: 'second' }
				])
				return instance()
			}, 'second'),
		),
		CS("}"),
	),
	D('Empty Node',
		D('The Empty symbol is exported as `{ Empty }`',
			E.exports('Empty', testModule, './index.js'),
		),
		CS("export const Empty = Symbol('SSSM Empty')"),
		D('This definition is exported by the library as `{ EmptyNode }`',
			E.exports('EmptyNode', testModule, './index.js'),
		),
		CS("export class EmptyNode extends Node {"),
		D('Uses the Empty symbol as the type.',
			CS("static type = Empty"),
			E.equals(() => {
				return EmptyNode.type
			}, Empty, symbols),
		),
		D('Empty is the `null` keyword.',
			E.equals(() => {
				return S.config.nodes.typeof(null)
			}, Empty, symbols),
			JS("static typeof(object, objectType) { return object === null }"),
			TS("static typeof<SelfType = null>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType { return object === null }"),
		),
		D('Empty is a no-op, and will do nothing except move to the next node',
			E.equals(() => {
				const instance = new S([null, { result: 'second' }, () => null])
					.output(({ result }) => result)
				return instance({ result: 'start' })
			}, 'second'),
		),
		CS("}"),
	),
	D('Condition Node',
		D('The Condition symbol is exported as `{ Condition }`',
			E.exports('Condition', testModule, './index.js'),
		),
		CS("export const Condition = Symbol('SSSM Condition')"),
		TS(`export interface ConditionType<
			State extends InitialState = InitialState,
			Output extends unknown = undefined,
			Action extends unknown = ActionType<State, Output>,
		> {
			if: (state: SystemState<State, Output>) => boolean,
			then?: ProcessType<State, Output, Action>
			else?: ProcessType<State, Output, Action>
		}`),
		D('This definition is exported by the library as `{ ConditionNode }`',
			E.exports('ConditionNode', testModule, './index.js'),
		),
		CS("export class ConditionNode extends Node {"),
		D('Uses the Condition symbol as the type.',
			CS("static type = Condition"),
			E.equals(() => {
				return ConditionNode.type
			}, Condition, symbols),
		),
		D("A condition is an object with the `'if'` property. A condition cannot be an action.",
			E.equals(() => {
				return S.config.nodes.typeof({ if: false })
			}, Condition, symbols),
			JS("static typeof(object, objectType, isAction) { return Boolean((!isAction) && object && objectType === 'object' && ('if' in object)) }"),
			TS("static typeof<SelfType = ConditionType>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType { return Boolean((!isAction) && object && objectType === 'object' && ('if' in (object as object))) }")
		),
		D("Defines `'if', 'then', 'else'` keywords",
			CS("static keywords = ['if','then','else']"),
			E.equals(() => {
				return ConditionNode.keywords
			}, ['if','then','else'], symbols),
		),
		D("Execute a condition by evaluating the `'if'` property and directing to the `'then'` or `'else'` clauses",
			JS("static execute(node, state) {"),
			TS(`static execute<${commonGenericDefinitionInner}SelfType = ConditionType<State, Output, Action>,>(this: Instance${commonGenericArguments}, node: SelfType, state: SystemState<State, Output>): Action | Promise<Action> {`),
			D("Evaluate the `'if'` property as a function that depends on the state.",
				E.equals(() => {
					let switchMethodRun = false
					ConditionNode.execute({ if: () => {
						switchMethodRun = true
						return 'someKey'
					}, then: null }, { [Stack]: [{path:[],origin:Return,point:0}] })
					return switchMethodRun
				}, true, symbols),
				JS("if (normalise_function(node.if)(state))"),
				TS(`if (normalise_function((node as ConditionType<State, Output, Action>).if)(state))`)
			),
			D("If truthy, direct to the `'then'` clause if it exists",
				E.is(() => {
					const instance = new S({
						if: ({ input }) => input === 'the same',
						then: { [Return]: 'truthy' },
						else: { [Return]: 'falsey' },
					})
					return instance({ input: 'the same' })
				}, 'truthy'),
				JS("return 'then' in node ? [ ...state[Stack][0].path.slice(0,state[Stack][0].point), 'then' ] : null"),
				TS(`return ('then' in (node as ConditionType<State, Output, Action>) ? [ ...state[Stack][0].path.slice(0,state[Stack][0].point), 'then' ] : null) as Action`)
			),
			D("Otherwise, direct to the `'else'` clause if it exists",
				E.is(() => {
					const instance = new S({
						if: ({ input }) => input === 'the same',
						then: { [Return]: 'truthy' },
						else: { [Return]: 'falsey' },
					})
					return instance({ input: 'NOT the same' })
				}, 'falsey'),
				JS("return 'else' in node ? [ ...state[Stack][0].path.slice(0,state[Stack][0].point), 'else' ] : null"),
				TS(`return ('else' in (node as ConditionType<State, Output, Action>) ? [ ...state[Stack][0].path.slice(0,state[Stack][0].point), 'else' ] : null) as Action`)
			),
			CS("}"),
		),
		D('Traverse a condition by iterating on the then and else clauses.',
			JS("static traverse(node, path, iterate) { return {"),
			TS(`static traverse<${commonGenericDefinitionInner}SelfType = ConditionType<State, Output, Action>,>(this: Instance${commonGenericArguments}, node: SelfType, path: Path, iterate: ((path: Path) => SelfType)): SelfType { return {`),
			D('Copy over the original properties to preserve any custom symbols.',
				// E.todo(),
				CS("...node,"),
			),
			D("Iterate on the `'then'` clause if it exists",
				// E.todo(),
				JS("...('then' in node ? { then: iterate([...path,'then']) } : {}),"),
				TS(`...('then' in (node as ConditionType<State, Output, Action>) ? { then: iterate([...path,'then']) } : {}),`)
			),
			D("Iterate on the `'else'` clause if it exists",
				// E.todo(),
				JS("...('else' in node ? { else: iterate([...path,'else']) } : {}),"),
				TS(`...('else' in (node as ConditionType<State, Output, Action>) ? { else: iterate([...path,'else']) } : {}),`)
			),
			D("Iterate over any symbols specified",
				// E.todo(),
				JS("...(Symbols in node ? Object.fromEntries(node[Symbols].map(key => [key, iterate([...path,key])])) : {}),"),
				TS("...(Symbols in (node as ConditionType<State, Output, Action>) ? Object.fromEntries((node[Symbols] as Array<symbol>).map(key => [key, iterate([...path,key])])) : {}),")

			),
			CS("} }"),
		),
		CS("}"),
	),
	D('Switch Node',
		E.equals(() => {
			const instance = new S({
				switch: ({ input }) => input,
				case: {
					start: { [Return]: 'first' },
					two: { [Return]: 'second' },
					default: { [Return]: 'none' },
				}
			})
			const output1 = instance({ input: 'start' })
			const output2 = instance({ input: 'two' })
			const output3 = instance({ input: 'other' })
			return { output1, output2, output3 }
		}, {
			output1: 'first',
			output2: 'second',
			output3: 'none'
		}),
		D('The Switch symbol is exported as `{ Switch }`',
			E.exports('Switch', testModule, './index.js'),
		),
		CS("export const Switch = Symbol('SSSM Switch')"),
		TS(`export interface SwitchType<
			State extends InitialState = InitialState,
			Output extends unknown = undefined,
			Action extends unknown = ActionType<State, Output>,
		> {
			switch: (state: SystemState<State, Output>) => string | number,
			case: Record<string | number, ProcessType<State, Output, Action>>
		}`),
		D('This definition is exported by the library as `{ SwitchNode }`',
			E.exports('SwitchNode', testModule, './index.js'),
		),
		CS("export class SwitchNode extends Node {"),
		D('Uses the Switch symbol as the type.',
			CS("static type = Switch"),
			E.equals(() => {
				return SwitchNode.type
			}, Switch, symbols),
		),
		D("A switch node is an object with the `'switch'` property.",
			E.equals(() => {
				return S.config.nodes.typeof({ switch: false })
			}, Switch, symbols),
			JS("static typeof(object, objectType, isAction) { return Boolean((!isAction) && object && objectType === 'object' && ('switch' in object)) }"),
			TS("static typeof<SelfType = SwitchType>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType { return Boolean((!isAction) && object && objectType === 'object' && ('switch' in (object as object))) }")
		),
		D("Defines `'switch', 'case', 'default'` keywords.",
			CS("static keywords = ['switch','case','default']"),
			E.equals(() => {
				return SwitchNode.keywords
			}, ['switch','case','default'], symbols),
		),
		D("Execute a switch by evaluating the `'switch'` property and directing to the approprtate `'case'` clause.",
			JS("static execute(node, state) {"),
			TS(`static execute<${commonGenericDefinitionInner}SelfType = SwitchType<State, Output, Action>,>(this: Instance${commonGenericArguments}, node: SelfType, state: SystemState<State, Output>): Action | Promise<Action> {`),
			D("Evaluate the `'switch'` property as a function that returns a key.",
				E.equals(() => {
					let switchMethodRun = false
					SwitchNode.execute({ switch: () => {
						switchMethodRun = true
						return 'someKey'
					}, case: { someKey: null } }, { [Stack]: [{path:[],origin:Return,point:0}] })
					return switchMethodRun
				}, true, symbols),
				JS("const key = normalise_function(node.switch)(state)"),
				TS(`const key = normalise_function((node as SwitchType<State, Output, Action>).switch)(state)`)
			),
			D("If the key exists in the `'case'` caluses, use the key, otherwise use the `'default'` clause",
				E.equals(() => {
					return SwitchNode.execute({ switch: 'extant', case: { extant: null } }, { [Stack]: [{path:[],origin:Return,point:0}] })
				}, ['case','extant'], symbols),
				E.equals(() => {
					return SwitchNode.execute({ switch: 'non extant', case: { default: null } }, { [Stack]: [{path:[],origin:Return,point:0}] })
				}, ['case','default'], symbols),
				JS("const fallbackKey = (key in node.case) ? key : 'default'"),
				TS(`const fallbackKey = (key in (node as SwitchType<State, Output, Action>).case) ? key : 'default'`)
			),
			D("Check again if the key exists (`'default'` clause may not be defined), if it does, redirect to the case, otherwise do nothing.",
				E.equals(() => {
					return SwitchNode.execute({ switch: 'non extant', case: {} }, { [Stack]: [{path:[],origin:Return,point:0}] })
				}, null, symbols),
				JS("return (fallbackKey in node.case) ? [ ...state[Stack][0].path.slice(0,state[Stack][0].point), 'case', fallbackKey ] : null"),
				TS(`return ((fallbackKey in (node as SwitchType<State, Output, Action>).case) ? [ ...state[Stack][0].path.slice(0,state[Stack][0].point), 'case', fallbackKey ] : null) as Action`)
			),
			CS("}"),
		),
		D("Traverse a switch by iterating over the `'case'` clauses",
			// E.todo(),
			JS("static traverse(node, path, iterate) { return { ...node, case: Object.fromEntries(Object.keys(node.case).map(key => [ key, iterate([...path,'case',key]) ])), ...(Symbols in node ? Object.fromEntries(node[Symbols].map(key => [key, iterate([...path,key])])) : {}) } }"),
			TS(`static traverse<${commonGenericDefinitionInner}SelfType = SwitchType<State, Output, Action>,>(this: Instance${commonGenericArguments}, node: SelfType, path: Path, iterate: ((path: Path) => SelfType)): SelfType { return { ...node, case: Object.fromEntries(Object.keys((node as SwitchType<State, Output, Action>).case).map(key => [ key, iterate([...path,'case',key]) ])), ...(Symbols in (node as SwitchType<State, Output, Action>) ? Object.fromEntries((node[Symbols] as Array<symbol>).map(key => [key, iterate([...path,key])])) : {}) } }`),
		),
		CS("}"),
	),
	D('While Node',
		"Repeatedly executes the 'do' clause, so long as the 'while' condition is true",
		D('The While symbol is exported as `{ While }`',
			E.exports('While', testModule, './index.js'),
		),
		CS("export const While = Symbol('SSSM While')"),
		TS(`export interface WhileType<
			State extends InitialState = InitialState,
			Output extends unknown = undefined,
			Action extends unknown = ActionType<State, Output>,
		> {
			while: (state: SystemState<State, Output>) => boolean,
			do: ProcessType<State, Output, Action>
		}`),
		D('This definition is exported by the library as `{ WhileNode }`',
			E.exports('WhileNode', testModule, './index.js'),
		),
		CS("export class WhileNode extends Node {"),
		D('Uses the While symbol as the type.',
			CS("static type = While"),
			E.equals(() => {
				return WhileNode.type
			}, While, symbols),
		),
		D("A while node is an object with the `'while'` property.",
			E.equals(() => {
				return S.config.nodes.typeof({ while: false })
			}, While, symbols),
			JS("static typeof(object, objectType, isAction) { return Boolean((!isAction) && object && objectType === 'object' && ('while' in object)) }"),
			TS("static typeof<SelfType = WhileType>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType { return Boolean((!isAction) && object && objectType === 'object' && ('while' in (object as object))) }")
		),
		D("Defines `'while`, 'do'` keywords",
			CS("static keywords = ['while','do']"),
			E.equals(() => {
				return WhileNode.keywords
			}, ['while','do'], symbols),
		),
		D("Execute a while by evaluating the `'while'` property and directing to the `'do'` clause if `true`.",
			JS("static execute(node, state) {"),
			TS(`static execute<${commonGenericDefinitionInner}SelfType = WhileType<State, Output, Action>,>(this: Instance${commonGenericArguments}, node: SelfType, state: SystemState<State, Output>): Action | Promise<Action> {`),
			D("Evaluate the `'while'` property as a function that returns a boolean.",
				E.equals(() => {
					return WhileNode.execute({ while: false, do: null }, { [Stack]: [{path:[0,0],origin:Return,point:2}] })
				}, null, symbols),
				D("If the condition is false, exit the while loop.",
					JS("if (!(('do' in node) && normalise_function(node.while)(state))) return null"),
					TS(`if (!(('do' in (node as WhileType<State, Output, Action>)) && normalise_function((node as WhileType<State, Output, Action>).while)(state))) return null as Action`),
				),
				D("If `true`, execute the `'do'` clause",
					E.equals(() => {
						return WhileNode.execute({ while: true, do: null }, { [Stack]: [{path:[0,0],origin:Return,point:2}] })
					}, [0,0,'do'], symbols),
					JS("return [ ...state[Stack][0].path.slice(0,state[Stack][0].point), 'do' ]"),
					TS(`return [ ...state[Stack][0].path.slice(0,state[Stack][0].point), 'do' ] as Action`)
				),
			),
			CS("}"),
		),
		D("Proceed by re-entering the while loop.",
			E.equals(() => {
				return WhileNode.proceed(undefined, { [Stack]: [{path:['some',0,'complex',0,'path'],origin:Return,point:2}] })
			}, { [Stack]: [{path:['some',0],origin:Return,point:2}] }, symbols),
			JS("static proceed(node, state) { return { ...state, [Stack]: [ { ...state[Stack][0], path: state[Stack][0].path.slice(0,state[Stack][0].point) }, ...state[Stack].slice(1) ] } }"),
			TS(`static proceed<${commonGenericDefinitionInner}SelfType = WhileType<State, Output, Action>,>(this: Instance${commonGenericArguments}, node: SelfType, state: SystemState<State, Output>): SystemState<State, Output> | Promise<SystemState<State, Output>> { return { ...state, [Stack]: [ { ...state[Stack][0], path: state[Stack][0].path.slice(0,state[Stack][0].point) }, ...state[Stack].slice(1) ] } }`),
		),
		D("Traverse a while by iterating over the `'do'` clause",
			// E.todo(),
			JS("static traverse(node, path, iterate) { return { ...node, ...('do' in node ? { do: iterate([ ...path, 'do' ]) } : {}), ...(Symbols in node ? Object.fromEntries(node[Symbols].map(key => [key, iterate([...path,key])])) : {}), } }"),
			TS(`static traverse<${commonGenericDefinitionInner}SelfType = WhileType<State, Output, Action>,>(this: Instance${commonGenericArguments}, node: SelfType, path: Path, iterate: ((path: Path) => SelfType)): SelfType { return { ...node, ...('do' in (node as WhileType<State, Output, Action>) ? { do: iterate([ ...path, 'do' ]) } : {}), ...(Symbols in (node as WhileType<State, Output, Action>) ? Object.fromEntries((node[Symbols] as Array<symbol>).map(key => [key, iterate([...path,key])])) : {}), } }`),
		),
		CS("}"),
	),
	D('Machine Node',
		E.is(() => {
			const instance = new S({
				initial: [
					() => ({ result: 'first' }),
					'next',
				],
				next: { result: 'second' }
			}).output(({ result }) => result)
			return instance({ result: 'start' })
		}, 'second'),
		D('The Machine symbol is exported as `{ Machine }`',
			E.exports('Machine', testModule, './index.js'),
		),
		CS("export const Machine = Symbol('SSSM Machine')"),
		TS(`export interface MachineType<
			State extends InitialState = InitialState,
			Output extends unknown = undefined,
			Action extends unknown = ActionType<State, Output>,
		> {
			initial: ProcessType<State, Output, Action>
			[key: string | number]: ProcessType<State, Output, Action>
			[Symbols]?: Array<InterruptGotoType>
		}`),
		D('This definition is exported by the library as `{ MachineNode }`',
			E.exports('MachineNode', testModule, './index.js'),
		),
		CS("export class MachineNode extends Node {"),
		D('Uses the Machine symbol as the type.',
			CS("static type = Machine"),
			E.equals(() => {
				return MachineNode.type
			}, Machine, symbols),
		),
		D("A machine is an object with the `'initial'` property. A machine cannot be used as an action.",
			E.equals(() => {
				return S.config.nodes.typeof({ initial: null })
			}, Machine, symbols),
			JS("static typeof(object, objectType, isAction) { return Boolean((!isAction) && object && objectType === 'object' && ('initial' in object)) }"),
			TS("static typeof<SelfType = MachineType>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType { return Boolean((!isAction) && object && objectType === 'object' && ('initial' in (object as object))) }")
		),
		D("Defines `'initial'` keyword.",
			CS("static keywords = ['initial']"),
			E.equals(() => {
				return MachineNode.keywords
			}, ['initial'], symbols),
		),
		D("Execute a machine by directing to the `'initial'` stages.",
			E.equals(() => {
				return MachineNode.execute(undefined, { [Stack]: [{path:['a','b','c'],oirign:Return,point:3}]})
			}, ['a','b','c','initial'], symbols),
			JS("static execute(node, state) { return [ ...state[Stack][0].path.slice(0,state[Stack][0].point), 'initial' ] }"),
			TS(`static execute<${commonGenericDefinitionInner}SelfType = MachineType<State, Output, Action>,>(this: Instance${commonGenericArguments}, node: SelfType, state: SystemState<State, Output>): Action | Promise<Action> { return [ ...state[Stack][0].path.slice(0,state[Stack][0].point), 'initial' ] as Action }`),
		),
		D('Traverse a machine by iterating over all the stages',
			// E.todo(),
			JS("static traverse(node, path, iterate) { return { ...node, ...Object.fromEntries(Object.keys(node).concat(Symbols in node ? node[Symbols]: []).map(key => [ key, iterate([...path,key]) ])) } }"),
			TS(`static traverse<${commonGenericDefinitionInner}SelfType = MachineType<State, Output, Action>,>(this: Instance${commonGenericArguments}, node: SelfType, path: Path, iterate: ((path: Path) => SelfType)): SelfType { return { ...node, ...Object.fromEntries(Object.keys(node as object).concat((Symbols in (node as object)) ? (node as SelfType)[Symbols]: []).map(key => [ key, iterate([...path,key]) ])) } }`),
		),
		CS("}"),
	),
	D('Goto Node',
		D('Transitioning is also possible by using and object with the `Goto` key set to a relative or absolute path. This is not recommended as it is almost never required, it should be considered system-only.',
			E.is(() => {
				const instance = new S({
					initial: [
						{ result: 'first' },
						{ [Goto]: 'next' }
					],
					next: { result: 'second' }
				}).output(({ result }) => result)
				return instance({ result: 'start' })
			}, 'second'),
		),
		D('It is not possible to send any other information in this object, such as a state change.',
			E.is(() => {
				const instance = new S({
					initial: [
						{ result: 'first' },
						{ [Goto]: 'next', result: 'ignored' }
					],
					next: Return
				}).output(({ result }) => result)
				return instance({ result: 'start' })
			}, 'first'),
		),
		D('The Goto symbol is exported as `{ Goto }`',
			E.exports('Goto', testModule, './index.js'),
		),
		CS("export const Goto = Symbol('SSSM Goto')"),
		TS("export type GotoType = { [Goto]: AbsoluteGotoType | SequenceGotoType | MachineGotoType }"),
		D('This definition is exported by the library as `{ GotoNode }`',
			E.exports('GotoNode', testModule, './index.js'),
		),
		CS("export class GotoNode extends Node {"),
		D('Uses the Goto symbol as the type.',
			CS("static type = Goto"),
			E.equals(() => {
				return GotoNode.type
			}, Goto, symbols),
		),
		D('A goto is an object with the `Goto` property.',
			E.equals(() => {
				return S.config.nodes.typeof({ [Goto]: 'stage' })
			}, Goto, symbols),
			JS("static typeof(object, objectType, isAction) { return Boolean(object && objectType === 'object' && (Goto in object)) }"),
			TS("static typeof<SelfType = GotoType>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType  { return Boolean(object && objectType === 'object' && (Goto in (object as object))) }")
		),
		D('A goto is performed by performing the value of the `Goto` property to allow for using absolute or relative gotos',
			E.equals(() => {
				let performCalled = false
				const MyNodeType = Symbol("My Node")
				class MyNode extends Node {
					static type = MyNodeType
					static typeof(object) { return object === MyNodeType }
					static perform(action, state) {
						performCalled = true
						return { ...state, someChange: 'someValue' }
					}
				}
				const result = GotoNode.perform.call(new S().addNode(MyNode), { [Goto]: MyNodeType }, {})
				return performCalled && result
			}, { someChange: 'someValue' }, symbols),
			JS("static perform(action, state) { return S._perform(this, state, action[Goto]) }"),
			TS(`static perform<${commonGenericDefinitionInner}SelfType = GotoType,>(this: Instance${commonGenericArguments}, action: SelfType, state: SystemState<State, Output>): SystemState<State, Output> | Promise< SystemState<State, Output>> { return S._perform(this, state, (action as GotoType)[Goto] as Action) }`)
		),
		D('A goto does not require proceeding, simply return the current state unmodified',
			E.equals(() => {
				const stateObj = { myProperty: 'myValue' }
				return GotoNode.proceed(undefined, stateObj) === stateObj
			}, true, symbols),
			JS("static proceed(node, state) { return state }"),
			TS(`static proceed(node, state) { return state }`)
		),
		CS("}"),
	),
	D('Sequence Goto Node',
		D('Numbers indicate a goto for a sequence. It is not recommended to use this as it may be unclear, but it must be possible, and should be considered system-only.',
			E.is(() => {
				const instance = new S([
					2,
					{ [Return]: 'skipped' },
					{ [Return]: 'second' },
				])
				return instance()
			}, 'second')
		),
		D('Slightly less not recommended is transitioning in a sequence conditonally. If you\'re making an incredibly basic state machine this is acceptable.',
			E.is(() => {
				const instance = new S([
					{
						if: ({ input }) => input === 'skip',
						then: 2,
						else: 1
					},
					{ [Return]: 'skipped' },
					{ [Return]: 'second' },
				])
				return instance({ input: 'skip' })
			}, 'second'),
		),
		D('The SequenceGoto symbol is exported as `{ SequenceGoto }`',
			E.exports('SequenceGoto', testModule, './index.js'),
		),
		CS("export const SequenceGoto = Symbol('SSSM Sequence Goto')"),
		TS("export type SequenceGotoType = number"),
		D('This definition is exported by the library as `{ SequenceGotoNode }`',
			E.exports('SequenceGotoNode', testModule, './index.js'),
		),
		CS("export class SequenceGotoNode extends GotoNode {"),
		D('Uses the SequenceGoto symbol as the type.',
			CS("static type = SequenceGoto"),
			E.equals(() => {
				return SequenceGotoNode.type
			}, SequenceGoto, symbols),
		),
		D('A sequence goto is a number.',
			E.equals(() => {
				return S.config.nodes.typeof(8)
			}, SequenceGoto, symbols),
			JS("static typeof(object, objectType, isAction) { return objectType === 'number' }"),
			TS("static typeof<SelfType = SequenceGotoType>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType { return objectType === 'number' }")
		),
		D('A sequence goto is performed by finding the last sequence and setting the index to the given value.',
			JS("static perform(action, state) {"),
			TS(`static perform<${commonGenericDefinitionInner}SelfType = SequenceGotoType,>(this: Instance${commonGenericArguments}, action: SelfType, state: SystemState<State, Output>): SystemState<State, Output> | Promise< SystemState<State, Output>> {`),
			D('Get the closest ancestor that is a sequence.',
				E.equals(() => {
					return SequenceGotoNode.perform.call(new S([[null,{initial:null}]]), 2, { [Stack]: [{path:[0,1,'initial'],origin:Return,point:3}] })
				}, { [Stack]: [{path:[0,2],origin:Return,point:2}] }, symbols),
				CS("const lastOf = S._closest(this, state[Stack][0].path.slice(0,state[Stack][0].point-1), SequenceNode.type)"),
			),
			D('If there is no such ancestor, throw a `PathReferenceError`',
				E.error(() => {
					return SequenceGotoNode.perform.call(new S({initial:{initial:{initial:null}}}), 'myStage', { [Stack]: [{path:['initial','initial','initial'],origin:Return,point:3}] })
				}, PathReferenceError),
				CS("if (!lastOf) throw new PathReferenceError(`A relative goto has been provided as a number (${String(action)}), but no sequence exists that this number could be an index of from path [ ${state[Stack][0].path.slice(0,state[Stack][0].point).map(key => key.toString()).join(', ')} ].`, { instance: this, state, data: { action } })"),
			),
			D('Update the path to the parent > index',
				E.equals(() => {
					return SequenceGotoNode.perform.call(new S([[null,null]]), 2, { [Stack]: [{path:[0,0],origin:Return,point:2}] })
				}, { [Stack]: [{path:[0,2],origin:Return,point:2}] }, symbols),
				JS("return { ...state, [Stack]: [ { ...state[Stack][0], path: [...lastOf, action], point: lastOf.length + 1 }, ...state[Stack].slice(1) ] }"),
				TS("return { ...state, [Stack]: [ { ...state[Stack][0], path: [...lastOf, action as SequenceGotoType], point: lastOf.length + 1 }, ...state[Stack].slice(1) ] }"),
			),
			CS("}"),
		),
		CS("}"),
	),
	D('Machine Goto Node',
		D('Gotos are the natural way of proceeding in state machines, using the name of a neighboring state as a string you can direct flow through a state machine.',
			E.is(() => {
				const instance = new S({
					initial: [
						{ result: 'first' },
						'next'
					],
					next: { result: 'second' }
				}).output(({ result }) => result)
				return instance({ result: 'start' })
			}, 'second')
		),
		D('The MachineGoto symbol is exported as `{ MachineGoto }`',
			E.exports('MachineGoto', testModule, './index.js'),
		),
		CS("export const MachineGoto = Symbol('SSSM Machine Goto')"),
		TS("export type MachineGotoType = string"),
		D('This definition is exported by the library as `{ MachineGotoNode }`',
			E.exports('MachineGotoNode', testModule, './index.js'),
		),
		CS("export class MachineGotoNode extends GotoNode {"),
		D('Uses the MachineGoto symbol as the type.',
			CS("static type = MachineGoto"),
			E.equals(() => {
				return MachineGotoNode.type
			}, MachineGoto, symbols),
		),
		D('A machine goto is a string.',
			E.equals(() => {
				return S.config.nodes.typeof('stage')
			}, MachineGoto, symbols),
			JS("static typeof(object, objectType, isAction) { return objectType === 'string' }"),
			TS("static typeof<SelfType = MachineGotoType>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType { return objectType === 'string' }")
		),
		D('A machine goto is performed by directing to the given stage.',
			JS("static perform(action, state) {"),
			TS(`static perform<${commonGenericDefinitionInner}SelfType = MachineGotoType,>(this: Instance${commonGenericArguments}, action: SelfType, state: SystemState<State, Output>): SystemState<State, Output> | Promise< SystemState<State, Output>> {`),
			D('Get the closest ancestor that is a machine.',
				E.equals(() => {
					return MachineGotoNode.perform.call(new S({initial:[{ initial: [null] }]}), 'myStage', { [Stack]: [{path:['initial',0,'initial',0],origin:Return,point:4}] })
				}, { [Stack]: [{path:['initial',0,'myStage'],origin:Return,point:3}] }, symbols),
				CS("const lastOf = S._closest(this, state[Stack][0].path.slice(0,state[Stack][0].point-1), MachineNode.type)"),
			),
			D('If no machine ancestor is found, throw a `PathReferenceError`',
				E.error(() => {
					return MachineGotoNode.perform.call(new S([null]), 'myStage', { [Stack]: [{path:[0],origin:Return,point:1}] })
				}, PathReferenceError),
				CS("if (!lastOf) throw new PathReferenceError(`A relative goto has been provided as a string (${String(action)}), but no state machine exists that this string could be a state of. From path [ ${state[Stack][0].path.slice(0,state[Stack][0].point).map(key => key.toString()).join(', ')} ].`, { instance: this, state, data: { action } })"),
			),
			D('Update the path to parent > stage',
				E.equals(() => {
					return MachineGotoNode.perform.call(new S([[{ initial: null }]]), 'myStage', { [Stack]: [{path:[0,0,'initial'],origin:Return,point:3}] })
				}, { [Stack]: [{path:[0,0,'myStage'],origin:Return,point:3}] }, symbols),
				JS("return { ...state, [Stack]: [ { ...state[Stack][0], path: [...lastOf, action], point: lastOf.length + 1 }, ...state[Stack].slice(1) ] }"),
				TS("return { ...state, [Stack]: [ { ...state[Stack][0], path: [...lastOf, action as MachineGotoType], point: lastOf.length + 1 }, ...state[Stack].slice(1) ] }"),
			),
			CS("}"),
		),
		CS("}"),
	),
	D('Interrupt Goto Node',
		'Interrupts are like gotos, except they will return to the previous execution path once complete.',
		D('Interrupts a way of performing other paths, then returning to the current path, using the symbol of a neghboring interrupt you can direct flow through a state machine.',
			E.is(() => {
				const interrupt = Symbol('interrupt')
				const instance = new S({
					initial: [
						{ result: 'first' },
						interrupt
					],
					[interrupt]: { result: 'second' }
				}).output(({ result }) => result)
				return instance({ result: 'start' })
			}, 'second')
		),
		D('The InterruptGoto symbol is exported as `{ InterruptGoto }`',
			E.exports('InterruptGoto', testModule, './index.js'),
		),
		CS("export const InterruptGoto = Symbol('SSSM Interrupt Goto')"),
		TS("export type InterruptGotoType = symbol"),
		D('This definition is exported by the library as `{ InterruptGotoNode }`',
			E.exports('InterruptGotoNode', testModule, './index.js'),
		),
		CS("export class InterruptGotoNode extends GotoNode {"),
		D('Uses the InterruptGoto symbol as the type.',
			CS("static type = InterruptGoto"),
			E.equals(() => {
				return InterruptGotoNode.type
			}, InterruptGoto, symbols),
		),
		D('An interrupt goto is a symbol.',
			E.equals(() => {
				return S.config.nodes.typeof(testSymbol)
			}, InterruptGoto, symbols),
			JS("static typeof(object, objectType, isAction) { return objectType === 'symbol' }"),
			TS("static typeof<SelfType = InterruptGotoType>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType { return objectType === 'symbol' }")
		),
		D('An interrupt goto is performed by directing to the given interrupt.',
			JS("static perform(action, state) {"),
			TS(`static perform<${commonGenericDefinitionInner}SelfType = InterruptGotoType,>(this: Instance${commonGenericArguments}, action: SelfType, state: SystemState<State, Output>): SystemState<State, Output> | Promise< SystemState<State, Output>> {`),
			D('Get the closest ancestor that contains this interrupt symbol.',
				E.equals(() => {
					return InterruptGotoNode.perform.call(new S({ [testSymbol]: null, initial:{ [testSymbol]: null,initial: { initial: null } } }), testSymbol, { [Stack]: [{path:['initial','initial','initial'],origin:Return,point:3}] })
				}, { [Stack]:  [{path:['initial',testSymbol],origin:testSymbol,point:2}, {path:['initial','initial','initial'],origin:Return,point:3}] }, symbols),
				JS("const lastOf = get_closest_path(this.process, state[Stack][state[Stack].length-1].path.slice(0,state[Stack][state[Stack].length-1].point-1), parentNode => Boolean(parentNode && (typeof parentNode === 'object') && (action in parentNode)))"),
				TS("const lastOf = get_closest_path(this.process, state[Stack][state[Stack].length-1].path.slice(0,state[Stack][state[Stack].length-1].point-1), parentNode => Boolean(parentNode && (typeof parentNode === 'object') && ((action as InterruptGotoType) in (parentNode as object))))"),
			),
			D('If no suitable ancestor is found, return the interrupt symbol itself.',
				E.equals(() => {
					return InterruptGotoNode.perform.call(new S([[{ initial: null }]]), testSymbol, { [Stack]: [{path:[0,0,'initial'],origin:Return,point:3}] })
				}, { [Return]: testSymbol, [Stack]:  [{path:[0,0,'initial'],origin:Return,point:3}] }, symbols),
				JS("if (!lastOf) return { ...state, [Return]: action }"),
				TS("if (!lastOf) return { ...state, [Return]: action } as SystemState<State, Output>"),
			),
			D('Update the path to parent > interrupt',
				E.equals(() => {
					return InterruptGotoNode.perform.call(new S([[{ [testSymbol]: null, initial: null }]]), testSymbol, { [Stack]: [{path:[0,0,'initial'],origin:Return,point:3}] })
				}, { [Stack]:  [{path:[0,0,testSymbol],origin:testSymbol,point:3}, {path:[0,0,'initial'],origin:Return,point:3}] }, symbols),
				JS("return { ...state, [Stack]: [ { origin: action, path: [...lastOf, action], point: lastOf.length + 1 }, ...state[Stack] ] }"),
				TS("return { ...state, [Stack]: [ { origin: action as InterruptGotoType, path: [...lastOf, action as InterruptGotoType], point: lastOf.length + 1 }, ...state[Stack] ] }"),
			),
			CS("}"),
		),
		D('An interrupt goto proceeds the path previous to it, but preserves the interrupts place at the top of the stack.',
			JS("static proceed(node, state) {"),
			TS(`static proceed<${commonGenericDefinitionInner}SelfType = InterruptGotoType,>(this: Instance${commonGenericArguments}, node: SelfType, state: SystemState<State, Output>): SystemState<State, Output> | Promise< SystemState<State, Output>> {`),
			D('Proceed the stack before this point, and strip out the affected system properties.',
				E.equals(() => {
					return InterruptGotoNode.proceed.call(new S([ null, null ]), testSymbol, { [Stack]: [{path:['first','item'],origin:testSymbol,point:2},{path:[0],origin:Return,point:1}] })
				}, { [Stack]:  [{path:['first','item'],origin:testSymbol,point:2}, {path:[1],origin:Return,point:1}] }, symbols),
				CS("const { [Stack]: stack, [Return]: interruptReturn, ...proceedPrevious } = S._proceed(this, { ...state, [Stack]: state[Stack].slice(1) }, undefined)"),
			),
			D('Add the current interrupt back in to the resulting stack.',
				E.equals(() => {
					return InterruptGotoNode.proceed.call(new S(), testSymbol, { [Stack]: [{path:['first','item'],origin:testSymbol,point:2},{path:[],origin:Return,point:0}] })
				}, { [Stack]:  [{path:['first','item'],origin:testSymbol,point:2}] }, symbols),
				JS("return { ...proceedPrevious, [Stack]: [ state[Stack][0], ...stack ] }"),
				TS("return { ...proceedPrevious, [Stack]: [ state[Stack][0], ...stack ] } as SystemState<State, Output>"),
			),
			CS("}"),
		),
		CS("}"),
	),
	D('Absolute Goto Node',
		'Arrays can be used to perform absolute redirects. This is not recommended as it may make your transition logic unclear.',
		'Arrays cannot be used on their own, because they would be interpreted as sequences. For this reason they must be contained in an object with the `Goto` symbol as a key, with the array as the value, or returned by an action.',
		D('Using an absolute goto in a goto object works',
			E.is(() => {
				const instance = new S({
					initial: [
						{ result: 'first' },
						{ [Goto]: ['next',1] }
					],
					next: [
						{ result: 'skipped' },
						({ result }) => ({ [Return]: result }),
					]
				})
				return instance({ result: 'start' })
			}, 'first')
		),
		D('Using an absolute goto as a return value works',
			E.is(() => {
				const instance = new S({
					initial: [
						{ result: 'first' },
						() => ['next',1]
					],
					next: [
						{ result: 'skipped' },
						({ result }) => ({ [Return]: result }),
					]
				})
				return instance({ result: 'start' })
			}, 'first')
		),
		D('Using an absolute goto as an action does NOT work.',
			E.is(() => {
				const instance = new S({
					initial: [
						{ result: 'first' },
						['next',1]
					],
					next: [
						{ result: 'not skipped' },
						({ result }) => ({ [Return]: result }),
					]
				})
				return instance({ result: 'start' })
			}, 'not skipped'),
		),
		D('The AbsoluteGoto symbol is exported as `{ AbsoluteGoto }`',
			E.exports('AbsoluteGoto', testModule, './index.js'),
		),
		CS("export const AbsoluteGoto = Symbol('SSSM Absolute Goto')"),
		TS("export type AbsoluteGotoType = Path"),
		D('This definition is exported by the library as `{ AbsoluteGotoNode }`',
			E.exports('AbsoluteGotoNode', testModule, './index.js'),
		),
		CS("export class AbsoluteGotoNode extends GotoNode {"),
		D('Uses the AbsoluteGoto symbol as the type.',
			CS("static type = AbsoluteGoto"),
			E.equals(() => {
				return AbsoluteGotoNode.type
			}, AbsoluteGoto, symbols),
		),
		D('An absolute goto is a list of strings, symbols, and numbers. It can only be used as an action as it would otherwise be interpreted as a sequence.',
			E.equals(() => {
				const path = [1,'stage',testSymbol]
				return S.config.nodes.typeof(path, typeof path, true)
			}, AbsoluteGoto, symbols),
			JS("static typeof(object, objectType, isAction) { return isAction && Array.isArray(object) }"),
			TS("static typeof<SelfType = AbsoluteGotoType>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType  { return isAction && Array.isArray(object) }")
		),
		D('An absolute goto is performed by setting `Stack` to the path',
			E.equals(() => {
				return AbsoluteGotoNode.perform(['a','b','c'], { [Stack]: [{path:[],origin:Return,point:0}] })
			}, { [Stack]: [{path:['a','b','c'],origin:Return,point:3}] },symbols),
			JS("static perform(action, state) { return { ...state, [Stack]: [ { ...state[Stack][0], path: action, point: action.length }, ...state[Stack].slice(1) ] } }"),
			TS(`static perform<${commonGenericDefinitionInner}SelfType = AbsoluteGotoType,>(this: Instance${commonGenericArguments}, action: SelfType, state: SystemState<State, Output>): SystemState<State, Output> | Promise< SystemState<State, Output>> { return { ...state, [Stack]: [ { ...state[Stack][0], path: (action as AbsoluteGotoType), point: (action as AbsoluteGotoType).length }, ...state[Stack].slice(1) ] } }`)
		),
		CS("}"),
	),
	D('Return Node',
		'Causes the entire process to terminate immediately and return, setting `Return` to `true` on the state.',
		D('If the symbol is used with a `.output` configuration, then it will return according to the given method.',
			E.is(() => {
				const instance = new S(Return)
					.output(({ result }) => result)
				return instance({ result: 'start' })
			}, 'start')
		),
		D('If the symbol is used on its own, then it will simply return `undefined`.',
			E.is(() => {
				const instance = new S(Return)
				return instance({ result: 'start' })
			}, undefined)
		),
		D('Using the return symbol as the key to an object will set the return property to that value before returning.',
			E.equals(() => {
				const instance = new S({ [Return]: 'custom' })
				return instance()
			}, 'custom'),
			E.equals(() => {
				const instance = new S({ [Return]: 'custom' })
				return instance.output(state => state)({ result: 'start' })
			}, { result: 'start', [Return]: 'custom' }, symbols),
		),
		D('The Return symbol is exported as `{ Return }`',
			E.exports('Return', testModule, './index.js'),
		),
		CS("export const Return = Symbol('SSSM Return')"),
		TS("export type ReturnObjectType<Output extends unknown = unknown> = { [Return]: Output }"),
		TS("export type ReturnType<Output extends unknown = unknown> = ReturnObjectType<Output> | typeof Return"),
		D('This definition is exported by the library as `{ ReturnNode }`',
			E.exports('ReturnNode', testModule, './index.js'),
		),
		CS("export class ReturnNode extends GotoNode {"),
		D('Uses the Return symbol as the type.',
			CS("static type = Return"),
			E.equals(() => {
				return ReturnNode.type
			}, Return, symbols),
		),
		D('A return node is the `Return` symbol itself, or an object with an `Return` property.',
			E.equals(() => {
				return S.config.nodes.typeof(Return)
			}, Return, symbols),
			E.equals(() => {
				return S.config.nodes.typeof({ [Return]: 'value' })
			}, Return, symbols),
			JS("static typeof(object, objectType) { return object === Return || Boolean(object && objectType === 'object' && (Return in object)) }"),
			TS("static typeof<SelfType = ReturnType>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType  { return object === Return || Boolean(object && objectType === 'object' && (Return in (object as object))) }")
		),
		D('Perform a return by setting the `Return` property on the state to the return value',
			E.equals(() => {
				return ReturnNode.perform({ [Return]: 'myValue' }, {})
			}, { [Return]: 'myValue' }, symbols),
			JS("static perform(action, state) { return { ...state, [Return]: !action || action === Return ? undefined : action[Return], } }"),
			TS(`static perform<${commonGenericDefinitionInner}SelfType = ReturnType<Output>,>(this: Instance${commonGenericArguments}, action: SelfType, state: SystemState<State, Output>): SystemState<State, Output> | Promise< SystemState<State, Output>> { return { ...state, [Return]: !action || action === Return ? undefined : (action as unknown as ReturnObjectType<Output>)[Return] as Output, } }`),
		),
		D('Inherit from root node definition, not GotoNode.',
			E.equals(() => {
				return ReturnNode.proceed
			}, Node.proceed),
			CS("static proceed = Node.proceed")
		),
		CS("}"),
	),
	D('Continue Node',
		'Exit this pass of a While loop and evaluate the condition again.',
		D('The Continue symbol is exported as `{ Continue }`',
			E.exports('Continue', testModule, './index.js'),
		),
		CS("export const Continue = Symbol('SSSM Continue')"),
		TS("export type ContinueType = typeof Continue"),
		D('This definition is exported by the library as `{ ContinueNode }`',
			E.exports('ContinueNode', testModule, './index.js'),
		),
		CS("export class ContinueNode extends GotoNode {"),
		D('Uses the Continue symbol as the type.',
			CS("static type = Continue"),
			E.equals(() => {
				return ContinueNode.type
			}, Continue, symbols),
		),
		D('Looks for the Continue symbol specifically.',
			E.equals(() => {
				return S.config.nodes.typeof(Continue)
			}, Continue, symbols),
			JS("static typeof(object, objectType) { return object === Continue }"),
			TS("static typeof<SelfType = ContinueType>(object: unknown, objectType: typeof object): object is SelfType { return object === Continue }"),
		),
		D('A Continue is performed by finding the closest While loop and re-entering.',
			JS("static perform(action, state) {"),
			TS(`static perform<${commonGenericDefinitionInner}SelfType = ContinueType,>(this: Instance${commonGenericArguments}, action: SelfType, state: SystemState<State, Output>): SystemState<State, Output> | Promise< SystemState<State, Output>> {`),
			D('Find the closest While loop.',
				E.equals(() => {
					return ContinueNode.perform.call(new S([{ while: true, do: {while:true,do:null} }, null]), Continue, { [Stack]: [{path:[0,'do','do'],origin:Return,point:3}] })
				}, { [Stack]: [{ path: [0,'do'], origin:Return, point:2 }] }, symbols),
				CS("const lastOf = S._closest(this, state[Stack][0].path.slice(0,state[Stack][0].point-1), WhileNode.type)"),
			),
			D('If there is none, throw a `PathReferenceError`.',
				E.error(() => {
					return ContinueNode.perform.call(new S(null), Continue, { [Stack]: [{path:[],origin:Return,point:0}] })
				}, PathReferenceError, symbols),
				CS("if (!lastOf) throw new PathReferenceError(`A Continue has been used, but no While exists that this Continue could refer to. From path [ ${state[Stack][0].path.slice(0,state[Stack][0].point).map(key => key.toString()).join(', ')} ].`, { instance: this, state, data: { action } })"),
			),
			D('Modify the stack to point to the closest While loop.',
				E.equals(() => {
					return ContinueNode.perform.call(new S([{ while: true, do: [null] }, null]), Continue, { [Stack]: [{path:[0,'do',0],origin:Return,point:3}] })
				}, { [Stack]: [{ path: [0],origin:Return,point:1 }] }, symbols),
				CS("return { ...state, [Stack]: [ { ...state[Stack][0], path: lastOf, point: lastOf.length }, ...state[Stack].slice(1) ] }"),
			),
			CS("}")
		),
		CS("}")
	),
	D('Break Node',
		'Break out of a while loop, and proceed as if the condition has failed.',
		D('The Break symbol is exported as `{ Break }`',
			E.exports('Break', testModule, './index.js'),
		),
		CS("export const Break = Symbol('SSSM Break')"),
		TS("export type BreakType = typeof Break"),
		D('This definition is exported by the library as `{ BreakNode }`',
			E.exports('BreakNode', testModule, './index.js'),
		),
		CS("export class BreakNode extends GotoNode {"),
		D('Uses the Break symbol as the type.',
			CS("static type = Break"),
			E.equals(() => {
				return BreakNode.type
			}, Break, symbols),
		),
		D('Looks for the Break symbol specifically.',
			E.equals(() => {
				return S.config.nodes.typeof(Break)
			}, Break, symbols),
			JS("static typeof(object, objectType, isAction) { return object === Break }"),
			TS("static typeof<SelfType = BreakType>(object: unknown, objectType: typeof object): object is SelfType { return object === Break }"),
		),
		D('A Break is performed by finding the closest While loop and proceeding from there.',
			JS("static proceed (node, state) {"),
			TS(`static proceed<${commonGenericDefinitionInner}SelfType = BreakType,>(this: Instance${commonGenericArguments}, node: SelfType, state: SystemState<State, Output>): SystemState<State, Output> | Promise< SystemState<State, Output>> {`),
			D('Find the closest While loop.',
				E.equals(() => {
					return BreakNode.proceed.call(new S([{ while: true, do: {while:true,do:null} }, null]), Break, { [Stack]: [{path:[0,'do','do'],origin:Return,point:3}] })
				}, { [Stack]: [{ path: [0], origin:Return, point:1 }] }, symbols),
				CS("const lastOf = S._closest(this, state[Stack][0].path.slice(0,state[Stack][0].point-1), WhileNode.type)"),
			),
			D('If there is none, throw a `PathReferenceError`.',
				E.error(() => {
					return BreakNode.proceed.call(new S(null), Break, { [Stack]: [{path:[],origin:Return,point:0}] })
				}, PathReferenceError, symbols),
				CS("if (!lastOf) throw new PathReferenceError(`A Break has been used, but no While exists that this Break could refer to. From path [ ${state[Stack][0].path.slice(0,state[Stack][0].point).map(key => key.toString()).join(', ')} ].`, { instance: this, state, data: { node } })"),
			),
			D('Proceed on the While loop as if it is exiting.',
				E.equals(() => {
					return BreakNode.proceed.call(new S([{ while: true, do: [null] }, null]), Break, { [Stack]: [{path:[0,'do',0],origin:Return,point:3}] })
				}, { [Stack]: [{ path: [1],origin:Return,point:1 }] }, symbols),
				CS("return S._proceed(this, { ...state, [Stack]: [{ ...state[Stack][0], point: lastOf.length-1 }, ...state[Stack].slice(1)] }, get_path_object(this.process, lastOf.slice(0,-1)))"),
			),
			CS("}")
		),
		D('Perform by doing nothing, do not inherit from `GotoNode`.',
			E.equals(() => {
				const stateObj = { myProperty: 'myValue' }
				return BreakNode.perform(Break, stateObj) === stateObj
			}, true),
			CS("static perform = Node.perform"),
		),
		CS("}")
	),
	TS(`export type PathUnit = SequenceGotoType | MachineGotoType | InterruptGotoType
export type Path = Array<PathUnit>
export type StackType = Array<{ path: Path, origin: typeof Return | InterruptGotoType, point: number }>

export type ProcessType<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Action extends unknown = ActionType<State, Output>,
> =
| SequenceType<State, Output, Action>
| MachineType<State, Output, Action>
| ConditionType<State, Output, Action>
| SwitchType<State, Output, Action>
| WhileType<State, Output, Action>
| FunctionType<State, Output, Action>
| GotoType | SequenceGotoType | MachineGotoType
| ReturnType<Output>
| ChangesType<State>
| null

export type ActionType<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
> = GotoType | AbsoluteGotoType | SequenceGotoType | MachineGotoType | ReturnType<Output>| ChangesType<State> | null | undefined | void
`),
),
D('Extensible Function',
	D('Create an executable object with custom properties',
		E.equals(() => {
			class MyExecutable extends ExtensibleFunction {
				prop1 = 0
				#prop2 = 0
				get prop2 () { return this.#prop2 }
				prop3 = 0
				constructor(prop1,prop2,prop3) {
					super(() => {})
					this.prop1 = prop1
					this.#prop2 = prop2
					this.prop3 = prop3
				}
			}
			return new MyExecutable(1, 2, 3)
		}, { prop1: 1, prop2: 2, prop3: 3 }),
	),
	CS("export class ExtensibleFunction extends Function {"),
	D('Some prototype magic to make it work',
		D('A function is passed into the the ExtensibleFunction',
			E.success(() => {
				return new ExtensibleFunction(() => {})
			}, {}, symbols),
		),
		D('The created instance will call the passed in function when it is called',
			E.equals(() => {
				let methodCalled = false;
				const result = new ExtensibleFunction((...args) => {
					methodCalled = true
					return args
				})(1, 'b', Math.PI)
				return methodCalled && result
			}, [1, 'b', Math.PI], symbols),
		),
		D('The created instance will be the passed in function',
			E.equals(() => {
				const myFunct = () => {}
				return new ExtensibleFunction(myFunct) === myFunct
			}, true, symbols),
		),
		D('The created instance will be an `instanceof ExtensibleFunction`',
			E.equals(() => {
				return new ExtensibleFunction(() => {}) instanceof ExtensibleFunction
			}, true, symbols),
		),
		D('The created instance will be an `instanceof Function`',
			E.equals(() => {
				return new ExtensibleFunction(() => {}) instanceof Function
			}, true, symbols),
		),
		JS("constructor(f) { super(); return Object.setPrototypeOf(f, new.target.prototype) }"),
		TS("constructor(f: Function) { super(); return Object.setPrototypeOf(f, new.target.prototype) }")
	),
	CS("}")
),
D('Core',
	D('Every instance must have a process and be callable.',
		TS(`export interface SuperSmallStateMachineCore${commonGenericDefinition} { process: Process; (...args: Input): Output; }`),
	),
	JS("export class SuperSmallStateMachineCore extends ExtensibleFunction {"),
	TS(`export abstract class SuperSmallStateMachineCore${commonGenericDefinition} extends ExtensibleFunction {`),
	D('Config',
		JS("static config = {"),
		TS("public static readonly config: Config = {"),
		E.equals(() => {
			return S.config
		}, { deep: false, strict: false, trace: false, iterations: 10000, override: null, adapt: [], before: [], after: [], defaults: {} }),
		D('Initialise an empty state by default',
			E.equals(() => {
				return Object.keys(new S(null).config.defaults)
			}, [], symbols),
			CS("defaults: {},")
		),
		D('Input the initial state by default',
			E.equals(() => {
				return new S(null).config.input({ myProperty: 'myValue' }, 2, 3)
			}, { myProperty: 'myValue' }, symbols),
			CS("input: (state = {}) => state,"),
		),
		D('Return the `Return` property by default',
			E.equals(() => {
				return new S(null).config.output({ [Return]: 'myValue' })
			}, 'myValue', symbols),
			CS("output:  state => state[Return],")
		),
		D('Do not perform strict state checking by default',
			E.equals(() => {
				return new S(null).config.strict
			}, false, symbols),
			CS("strict: false,"),
		),
		D('Allow 10000 iterations by default',
			E.equals(() => {
				return new S(null).config.iterations
			}, 10000, symbols),
			CS("iterations: 10000,")
		),
		D('Run until the return symbol is present by default.',
			E.equals(() => {
				return new S(null).config.until({ [Return]: undefined })
			}, true, symbols),
			CS("until: state => Return in state,")
		),
		D('Do not keep the stack trace by default',
			E.equals(() => {
				return new S(null).config.trace
			}, false, symbols),
			CS("trace: false,"),
		),
		D('Shallow merge changes by default',
			E.equals(() => {
				return new S(null).config.deep
			}, false, symbols),
			CS("deep: false,"),
		),
		D('Do not override the execution method by default',
			E.equals(() => {
				return new S(null).config.override
			}, null, symbols),
			CS("override: null,"),
		),
		D('Uses the provided nodes by default.',
			E.equals(() => {
				return new S(null).config.nodes
			}, { [Changes]: ChangesNode, [Sequence]: SequenceNode, [FunctionN]: FunctionNode, [Condition]: ConditionNode, [Switch]: SwitchNode, [While]: WhileNode, [Machine]: MachineNode, [Goto]: GotoNode, [InterruptGoto]: InterruptGotoNode, [AbsoluteGoto]: AbsoluteGotoNode, [MachineGoto]: MachineGotoNode, [SequenceGoto]: SequenceGotoNode, [ErrorN]: ErrorNode, [Undefined]: UndefinedNode, [Empty]: EmptyNode, [Continue]: ContinueNode, [Break]: BreakNode, [Return]: ReturnNode }, symbols),
			CS("nodes: new Nodes(ChangesNode, SequenceNode, FunctionNode, ConditionNode, SwitchNode, WhileNode, MachineNode, GotoNode, InterruptGotoNode, AbsoluteGotoNode, MachineGotoNode, SequenceGotoNode, ErrorNode, UndefinedNode, EmptyNode, ContinueNode, BreakNode, ReturnNode),"),
		),
		D('Initialise with an empty process adapters list.',
			E.equals(() => {
				return new S(null).config.adapt
			}, [], symbols),
			CS("adapt: [],"),
		),
		D('Initialise with an empty `before` adapters list.',
			E.equals(() => {
				return new S(null).config.before
			}, [], symbols),
			CS("before: [],"),
		),
		D('Initialise with an empty `after` adapters list.',
			E.equals(() => {
				return new S(null).config.after
			}, [], symbols),
			CS("after: [],"),
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
						Return,
					]
				}
			])
			return S._closest(instance, [0, 'then', 1], SequenceNode.type)
		}, [0, 'then']),
		JS("static _closest (instance, path = [], ...nodeTypes) {"),
		TS(`public static _closest${commonGenericDefinition}(instance: Instance${commonGenericArguments}, path: Path, ...nodeTypes: Array<string | symbol | Array<string | symbol>>): Path | null {`),
		D('Node types can be passed in as arrays of strings, or arrays of arrays of strings...',
			// E.todo(),
			CS("const flatTypes = nodeTypes.flat(Infinity)"),
		),
		D('Use get_closest_path to find the closest path.',
			// E.todo(),
			CS("return get_closest_path(instance.process, path, node => {"),
			D('Get the type of the node',
				// E.todo(),
				CS("const nodeType = instance.config.nodes.typeof(node)"),
			),
			D('Pick this node if it matches any of the given types',
				// E.todo(),
				CS("return Boolean(nodeType && flatTypes.includes(nodeType))"),
			),
			CS("})"),
		),
		CS("}"),
	),
	D('S._changes (instance, state = {}, changes = {})',
		'Safely apply the given `changes` to the given `state`.',
		'Merges the `changes` with the given `state` and returns it.',
		E.equals(() => {
			const instance = new S()
			const result = S._changes(instance, {
				[Changes]: {},
				preserved: 'value',
				common: 'initial',
			}, {
				common: 'changed',
			})
			return result
		}, {
			common: 'changed',
			preserved: 'value',
			[Changes]: {
				common: 'changed',
			}
		}, symbols),
		JS("static _changes (instance, state = {}, changes = {}) {"),
		TS(`public static _changes${commonGenericDefinition}(instance: Instance${commonGenericArguments}, state: SystemState<State, Output>, changes: Partial<State>): SystemState<State, Output> {`),
		D('If the strict state flag is truthy, perform state checking logic',
			// E.todo(),
			'Go through each property in the changes and check they all already exist',
			CS("if (instance.config.strict && Object.entries(changes).some(([property]) => !(property in state)))"),
			D('Throw a StateReferenceError if a property is referenced that did not previosly exist.',
				// E.todo(),
				CS("throw new StateReferenceError(`Only properties that exist on the initial context may be updated.\\nYou changed [ ${Object.keys(changes).filter(property => !(property in state)).map(key => key.toString()).join(', ')} ], which ${Object.keys(changes).filter(property => !(property in state)).length === 1 ? 'is' : 'are'} not in: [ ${Object.keys(state).map(key => key.toString()).join(', ')} ].\\nPath: [ ${state[Stack][0].path.slice(0,state[Stack][0].point).map(key => key.toString()).join(' / ')} ]`, { instance, state, data: { changes } })"),
			),
		),
		D('If the strict state flag is set to the Strict Types Symbol, perform type checking logic.',
			// E.todo(),
			'Go through each property and check the JS type is the same as the initial values.',
			CS("if (instance.config.strict === StrictTypes && Object.entries(changes).some(([property,value]) => typeof value !== typeof state[property]))"),
			D('Throw a StateTypeError if a property changes types.',
				// E.todo(),
				CS("throw new StateTypeError(`Properties must have the same type as their initial value. ${Object.entries(changes).filter(([property,value]) => typeof value !== typeof state[property]).map(([property,value]) => `${typeof value} given for '${property}', should be ${typeof state[property]}`).join('. ')}.`, { instance, state, data: { changes } })"),
			),
		),
		D('Collect all the changes in the changes object.',
			// E.todo(),
			CS("const merge = instance.config.deep ? deep_merge_object : shallow_merge_object"),
			CS("const allChanges = merge(state[Changes] || {}, changes)"),
		),
		D('Deep merge the current state with the new changes',
			// E.todo(),
			JS("return { ...merge(state, allChanges), [Changes]: allChanges }"), 
			TS("return { ...merge(state, allChanges), [Changes]: allChanges } as SystemState<State, Output>"), 
		),
		CS("}"),
	),

	D('S._proceed (instance, state = {}, node = undefined)',
		D('Proceed to the next execution path.',
			E.equals(() => {
				const instance = new S([
					'firstAction',
					'secondAction'
				])
				return S._proceed(instance, {
					[Stack]: [{path:[0],origin:Return,point:1}]
				})
			}, {
				[Stack]: [{path:[1],origin:Return,point:1}]
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
					[Stack]: [{path:[0,1],origin:Return,point:2}]
				})
			}, {
				[Stack]: [{path:[1],origin:Return,point:1}]
			}, symbols),
		),
		JS("static _proceed (instance, state = {}, node = undefined) {"),
		TS(`public static _proceed${commonGenericDefinition}(instance: Instance${commonGenericArguments}, state: SystemState<State, Output>, node: Process | Action = undefined as unknown as Action): SystemState<State, Output> {`),
		D('Gets the type of the given `node`',
			E.equals(() => {
				let typeofCalled = false
				const MyNodeType = Symbol("My Node")
				class MyNode extends Node {
					static type = MyNodeType
					static typeof(object) {
						typeofCalled = true
						return object === MyNodeType
					}
				}
				S._proceed(
					new S(null).addNode(MyNode),
					{[Stack]:[{path:[],origin:Return,point:0}]},
					MyNodeType,
				)
				return typeofCalled
			}, true, symbols),
			CS(`const nodeType = instance.config.nodes.typeof(node, typeof node, state[Stack][0].point === state[Stack][0].path.length)`),
		),
		D('If the node is unrecognised, throw a TypeEror',
			E.error(() => {
				return S._proceed(
					new S(null),
					{[Stack]:[{path:[],origin:Return,point:0}]},
					false
				)
			}, NodeTypeError, symbols),
			CS("if (!nodeType) throw new NodeTypeError(`Unknown action type: ${typeof node}${nodeType ? `, nodeType: ${String(nodeType)}` : ''}`, { instance, state, data: { node } })"),
		),
		D('Call the `proceed` method of the node to get the next path.',
			E.equals(() => {
				let proceedCalled = false
				const MyNodeType = Symbol("My Node")
				class MyNode extends Node {
					static type = MyNodeType
					static typeof(object) { return object === MyNodeType }
					static proceed(action, state) {
						proceedCalled = true
						return { ...state, someChange: 'someValue' }
					}
				}
				const result = S._proceed(
					new S(null).addNode(MyNode),
					{[Stack]:[{path:[0],origin:Return,point:1}]},
					MyNodeType
				)
				return proceedCalled && result
			}, { someChange: 'someValue' }, symbols),
			JS(`return instance.config.nodes.get(nodeType).proceed.call(instance, node instanceof Node ? node.value : node, state)`),
			TS(`return instance.config.nodes.get(nodeType)!.proceed.call(instance as any, node instanceof Node ? node.value : node, state) as SystemState<State, Output>`),
		),
		CS("}")
	),
	D('S._perform (instance, state = {}, action = undefined)',
		D('Perform actions on the state.',
			E.equals(() => {
				const instance = new S([
					'firstAction',
					'secondAction',
					'thirdAction'
				])
				return S._perform(instance, { [Stack]: [{path:[0],origin:Return,point:1}], prop: 'value' }, { prop: 'newValue' })
			}, {
				[Stack]: [{path:[0],origin:Return,point:1}],
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
				return S._perform(instance, { [Stack]: [{path:[0],origin:Return,point:1}], prop: 'value' }, { [Goto]: [2] })
			}, {
				[Stack]: [{path:[2],origin:Return,point:1}],
				prop: 'value'
			}, symbols),
		),
		JS("static _perform (instance, state = {}, action = undefined) {"),
		TS(`public static _perform${commonGenericDefinition}(instance: Instance${commonGenericArguments}, state: SystemState<State, Output>, action: Action = null as Action): SystemState<State, Output> {`),
		D('Gets the node type of the given `action`',
			E.equals(() => {
				let typeofCalled = false
				const MyNodeType = Symbol("My Node")
				class MyNode extends Node {
					static type = MyNodeType
					static typeof(object) {
						typeofCalled = true
						return object === MyNodeType
					}
				}
				S._perform(
					new S(null).addNode(MyNode),
					{},
					MyNodeType
				)
				return typeofCalled
			}, true, symbols),
			CS("const nodeType = instance.config.nodes.typeof(action, typeof action, true)"),
		),
		D('If the given `action` is not recognised, throw a NodeTypeError',
			E.error(() => {
				return S._perform(
					new S(null),
					{},
					false
				)
			}, NodeTypeError, symbols),
			CS("if (!nodeType) throw new NodeTypeError(`Unknown action type: ${typeof action}${nodeType ? `, nodeType: ${String(nodeType)}` : ''}.`, { instance, state, data: { action } })"),
		),
		D('Performs the given `action` on the state',
			E.equals(() => {
				let performCalled = false
				const MyNodeType = Symbol("My Node")
				class MyNode extends Node {
					static type = MyNodeType
					static typeof(object) { return object === MyNodeType }
					static perform(action, state) {
						performCalled = true
						return { ...state, someChange: 'someValue' }
					}
				}
				const result = S._perform(
					new S(null).addNode(MyNode),
					{},
					MyNodeType
				)
				return performCalled && result
			}, { someChange: 'someValue' }, symbols),
			JS("return instance.config.nodes.get(nodeType).perform.call(instance, action instanceof Node ? action.value : action, state)"),
			TS("return instance.config.nodes.get(nodeType)!.perform.call(instance as any, action instanceof Node ? action.value : action, state) as SystemState<State, Output>"),
		),
		CS("}")
	),
	D('S._execute (instance, state = {}, node = get_path_object(instance.process, state[Stack][0].path.slice(0,state[Stack][0].point))))',
		D("Executes the node in the process at the state's current path and returns its action.",
			E.equals(() => {
				const instance = new S([
					() => ({ result: 'first' }),
					() => ({ result: 'second' }),
					() => ({ result: 'third' }),
				])
				return S._execute(instance, { [Stack]: [{path:[1],origin:Return,point:1}] })
			}, { result: 'second' })
		),
		D('If the node is not executable it will be returned as the action.',
			E.equals(() => {
				const instance = new S([
					({ result: 'first' }),
					({ result: 'second' }),
					({ result: 'third' }),
				])
				return S._execute(instance, { [Stack]: [{path:[1],origin:Return,point:1}] })
			}, { result: 'second' })
		),
		JS("static _execute (instance, state = {}, node = get_path_object(instance.process, state[Stack][0].path.slice(0,state[Stack][0].point))) {"),
		TS(`public static _execute${commonGenericDefinition}(instance: Instance${commonGenericArguments}, state: SystemState<State, Output>, node: Process = get_path_object(instance.process, state[Stack][0].path.slice(0,state[Stack][0].point)) as Process): Action {`),
		D('Gets the type of the given `node`',
			E.equals(() => {
				let typeofCalled = false
				const MyNodeType = Symbol("My Node")
				class MyNode extends Node {
					static type = MyNodeType
					static typeof(object) {
						typeofCalled = true
						return object === MyNodeType
					}
				}
				S._execute(
					new S(null).addNode(MyNode),
					{},
					MyNodeType
				)
				return typeofCalled
			}, true, symbols),
			CS("const nodeType = instance.config.nodes.typeof(node)"),
		),
		D('If the given `node` is not recognised, throw a `NodeTypeError`',
			E.error(() => {
				return S._execute(
					new S(null),
					{},
					false
				)
			}, NodeTypeError, symbols),
			CS("if (!nodeType) throw new NodeTypeError(`Unknown node type: ${typeof node}${nodeType ? `, nodeType: ${String(nodeType)}` : ''}.`, { instance, state, data: { node } })"),
		),
		D('Execute the given `node` and return an action',
			E.equals(() => {
				let executeCalled = false
				const MyNodeType = Symbol("My Node")
				class MyNode extends Node {
					static type = MyNodeType
					static typeof(object) { return object === MyNodeType }
					static execute() {
						executeCalled = true
						return 'some action'
					}
				}
				const result = S._execute(
					new S(null).addNode(MyNode),
					{},
					MyNodeType
				)
				return executeCalled && result
			}, 'some action', symbols),
			JS("return instance.config.nodes.get(nodeType).execute.call(instance, node instanceof Node ? node.value : node, state)"),
			TS("return instance.config.nodes.get(nodeType)!.execute.call(instance as any, node instanceof Node ? node.value : node, state) as Action")
		),
		CS("}")
	),
	D('S._traverse(instance, iterator)',
		'Traverses a process, mapping each node to a new value, effectively cloning the process.',
		'You can customise how each leaf node is mapped by supplying the `iterator` method',
		E.equals(() => {
			const inputProcess = {
				initial: 'swap this',
				other: [
					{
						if: 'swap this too',
						then: 'also swap this'
					}
				]
			}
			return S._traverse({
				process: inputProcess,
				config: S.config,
			}, (node, path, process, nodeType) => {
				if (node === 'swap this') return 'with this'
				if (node === 'also swap this') return 'with that'
				if (nodeType === ConditionNode.type && node.if === 'swap this too')
					return {
						...node,
						if: 'with another thing'
					}
				return node
			})
		}, {
			initial: 'with this',
			other: [
				{
					if: 'with another thing',
					then: 'with that'
				}
			]
		}),
		JS("static _traverse(instance, iterator = ident) {"),
		TS(`public static _traverse${commonGenericDefinition} (instance: Instance${commonGenericArguments}, iterator: ((node: Process, path: Path, process: Process, nodeType: string | symbol) => Process) = ident): Process {`),
		D('Create an iteration function to be used recursively',
			// E.todo(),
			JS("const iterate = (path = []) => {"),
			TS("const iterate = (path: Path = []): Process => {"),
			D('Get the node at the given `path`',
				// E.todo(),
				JS("const node = get_path_object(instance.process, path)"),
				TS("const node = get_path_object<Process>(instance.process, path)!"),
			),
			D('Get the type of the node',
				// E.todo(),
				CS("const nodeType = instance.config.nodes.typeof(node)"),
			),
			// E.todo(),
			D('If the node is not recognised, throw a NodeTypeError',
				CS("if (!nodeType) throw new NodeTypeError(`Unknown node type: ${typeof node}${nodeType ? `, nodeType: ${String(nodeType)}` : ''} at [ ${path.map(key => key.toString()).join(', ')} ]`, { instance, data: { node } })"),
			),
			D('Call the iterator for all nodes as a transformer',
				// E.todo(),
				JS("return iterator.call(instance, instance.config.nodes.get(nodeType).traverse.call(instance, node instanceof Node ? node.value : node, path, iterate), path, instance.process, nodeType)"),
				TS("return iterator.call(instance, instance.config.nodes.get(nodeType)!.traverse.call(instance as any, node instanceof Node ? node.value : node, path, iterate) as Process, path, instance.process, nodeType)"),
			),
			CS("}")
		),
		D('Call the primary method',
			CS("return iterate()")
		),
		CS("}")
	),
	D('S._run (instance, ...input)',
		'Execute the entire process synchronously.',

		D('Will execute the process',
			E.equals(() => {
				const instance = new S({ [Return]: 'return value' })
				return S._run(instance)
			}, 'return value'),
		),
		D('Will not handle promises even if it is configured',
			E.equals(() => {
				const instance = new S(() => Promise.resolve({ [Return]: 'return value' }))
				.with(asyncPlugin)
				return S._run(instance)
			}, undefined),
		),
		D('Will not handle promises in sync mode',
			E.equals(() => {
				const instance = new S(() => Promise.resolve({ [Return]: 'return value' }))
				return S._run(instance)
			}, undefined),
		),
		D('Is the same as running the executable instance itself',
			E.equals(() => {
				const instance = new S({ [Return]: 'return value' })
				return S._run(instance) === instance()
			}, true),
		),
		D('Takes the same arguments as the executable instance itself',
			E.equals(() => {
				const instance = new S(({ a, b, c }) => ({ [Return]: `${a} + ${b} - ${c}` }))
					.input((a, b, c) => ({ a, b, c }))
				return S._run(instance, 1, 2, 3) === instance(1, 2, 3)
			}, true),
		),
		JS("static _run (instance, ...input) {"),
		TS(`public static _run${commonGenericDefinition}(instance: Instance${commonGenericArguments}, ...input: Input): Output {`),
		D('Extract the useful parts of the config',
			E.equals(() => {
				const instance = new S(null).output(ident).until(() => true)
				let gettersAccessed = {}
				S._run(
					{
						config: new Proxy(instance.config, {
							get(target, property) {
								gettersAccessed[property] = true
								return target[property]
							}
						}),
						process: instance.process,
					},
					{  }
				)
				return gettersAccessed
			}, {until:true, iterations:true, input: true, output: true, before: true, after: true, defaults: true, trace: true }, symbols),
			CS("const { until, iterations, input: adaptInput, output: adaptOutput, before, after, defaults, trace } = { ...this.config, ...instance.config }")
		),
		D('Turn the arguments into an initial condition',
			D('Runs the input adapter',
				E.equals(() => {
					let inputAdapterCalled;
					S._run(
						new S(null).output(ident).until(() => true)
							.input((state) => {
								inputAdapterCalled = true
								return state
							}),
						{  }
					)
					return inputAdapterCalled
				}, true, symbols),
			),
			D('Takes in all arguments passed in after the instance',
				E.equals(() => {
					let passedArgs;
					S._run(
						new S(null).output(ident).until(() => true)
							.input((...args) => {
								passedArgs = args
								return {}
							}),
						1, 2, 3, 4
					)
					return passedArgs
				}, [1, 2, 3, 4], symbols),
			),
			CS("const modifiedInput = adaptInput.apply(instance, input) || {}")
		),
		D('Merge the initial condition with the default initial state',
			D('the iterations are initialised at 0',
				E.equals(() => {
					let firstValue;
					S._run(
						new S(null).output(ident)
							.until((state, iterations) => {
								if (firstValue === undefined)
									firstValue = iterations
								return state
							}),
						{  }
					)
					return firstValue
				}, 0, symbols),
			),
			D('Before modifiers are called',
				E.equals(() => {
					let beforeAdapterCalled = false
					S._run(
						new S(null).output(ident).until(() => true)
							.before((state) => {
								beforeAdapterCalled = true
								return state
							}),
						{  }
					)
					return beforeAdapterCalled
				}, true, symbols),
			),
			D('Before adapter are called after input adapter',
				E.equals(() => {
					let inputAdapterCalled = false
					let beforeAdapterCalled = false
					let beforeAdapterCalledAfterInputAdapter = false
					S._run(
						new S(null).output(ident).until(() => true)
							.input((state) => {
								inputAdapterCalled = true
								return state
							})
							.before((state) => {
								beforeAdapterCalled = true
								if (inputAdapterCalled)
									beforeAdapterCalledAfterInputAdapter = true
								return state
							}),
						{  }
					)
					return inputAdapterCalled && beforeAdapterCalled && beforeAdapterCalledAfterInputAdapter
				}, true, symbols),
			),
			D('Initial state will be deep merged if enabled',
				E.equals(() => {
					return S._run(
						new S(null).output(ident).until(() => true).deep
						.defaults({ myProperty: { subProperty: 'otherValue' } }),
						{ myProperty: { myOtherProperty: 'myValue' } }
					)
				}, {
					myProperty: { myOtherProperty: 'myValue', subProperty: 'otherValue' },
				}, symbols),
			),
			D('Initial state will be merged before passing it into the before modifiers',
				E.equals(() => {
					let initialState = null
					S._run(
						new S(null).output(ident).until(() => true)
							.before((state) => {
								initialState = state
								return state
							}),
						{ myProperty: 'myValue' }
					)
					return initialState
				}, {
					myProperty: 'myValue',
					[Changes]: { myProperty: 'myValue' },
					[Stack]: [{path:[],origin:Return,point:0}],
					[Trace]: [],
					[Return]: undefined
				}, symbols),
			),
			CS("let r = 0, currentState = { ...before.reduce((prev, modifier) => modifier.call(instance, prev), this._changes(instance, {"),
			D('Default to an empty change object',
				CS("[Changes]: {},")
			),
			D('Uses the defaults as an initial state',
				E.equals(() => {
					return S._run(
						new S(null).output(ident).until(() => true)
							.defaults({ myProperty: 'myValue' }),
						{ }
					)
				}, {
					myProperty: 'myValue'
				}, symbols),
				CS("...defaults,")
			),
			D('Uses the Stack from the initial state - allows for starting at arbitrary positions',
				E.equals(() => {
					return S._run(
						new S(null).output(ident).until(() => true),
						{ [Stack]: [{path:['some','specific','path'],origin:Return,point:3}] }
					)
				}, {
					[Stack]: [{path:['some','specific','path'],origin:Return,point:3}]
				}, symbols),
				D('Stack starts as root node path by default.',
					E.equals(() => {
						return S._run(
							new S(null).output(ident).until(() => true),
							{ }
						)
					}, {
						[Stack]: [{path:[],origin:Return,point:0}]
					}, symbols),
				),
				D('Trace can be populated by passing it in',
					E.equals(() => {
						return S._run(
							new S([null]).output(ident).until(() => true),
							{ [Trace]: [[{path:['some','specific','path'],origin:Return,point:3}]] }
						)
					}, {
						[Trace]: [[{path:['some','specific','path'],origin:Return,point:3}]]
					}, symbols),
				),
				D('Trace will be an empty list by default.',
					E.equals(() => {
						return S._run(
							new S(null).output(ident).until(() => true),
							{ }
						)
					}, {
						[Trace]: []
					}, symbols),
				),
				CS("[Stack]: modifiedInput[Stack] || [{path:[],origin:Return,point:0}], [Trace]: modifiedInput[Trace] || [],")
			),
			D('Keep the return value if it already exists',
				E.equals(() => {
					return S._run(new S(null).output(ident), { [Return]: 'myValue' })
				}, {
					[Return]: 'myValue'
				}, symbols),
				D('Do not define a return value by default',
					E.equals(() => {
						return S._run(new S(null).output(ident), { })
					}, {
						[Return]: undefined
					}, symbols),
				),
				CS("...(Return in modifiedInput ? {[Return]: modifiedInput[Return]} : {})"),
			),
			D('Changes will be empty after initialisation',
				E.equals(() => {
					return S._run(
						new S(null).output(ident).before(function (state) {
							return this.changes(state, { myOtherProperty: 'myOtherValue' })
						}),
						{ myProperty: 'myValue' }
					)
				}, {
					myProperty: 'myValue',
					myOtherProperty: 'myOtherValue',
					[Changes]: {
						myProperty: undefined,
						myOtherProperty: undefined,
					}
				}, symbols)
			),
			D('Changes can be populated by passing it in',
				E.equals(() => {
					return S._run(
						new S(null).output(ident).before(function (state) {
							return this.changes(state, { myOtherProperty: 'myOtherValue' })
						}),
						{ myProperty: 'myValue', [Changes]: { myProperty: 'anything' } }
					)
				}, {
					myProperty: 'myValue',
					myOtherProperty: 'myOtherValue',
					[Changes]: {
						myProperty: 'anything',
						myOtherProperty: undefined,
					}
				}, symbols)
			),
			JS("}, modifiedInput)), [Changes]: modifiedInput[Changes] || {} }"),
			TS("} as SystemState<State, Output>, modifiedInput)), [Changes]: modifiedInput[Changes] || {} }")
		),
		D('Repeat for a limited number of iterations.',
			'This should be fine for most finite machines, but may be too little for some constantly running machines.',	
			CS("while (r < iterations) {"),
			D('Check the configured `until` condition to see if we should exit.',
				E.equals(() => {
					let untilCalled = false
					S._run(new S(
						() => ({ myProperty: 'myValue' })
					).until(() => {
						untilCalled = true
						return true
					}).output(ident), {
						[Stack]: [{path:[],origin:Return,point:0}],
					})
					return untilCalled
				}, true, symbols),
				D('Do it first to catch starting with a `Return` in place.',
					E.equals(() => {
						return S._run(new S(
							() => ({ myProperty: 'myValue' })
						).output(ident), {
							[Stack]: [{path:[],origin:Return,point:0}],
							[Return]: 'myValue'
						})
					}, {
						[Stack]: [{path:[],origin:Return,point:0}],
						myProperty: undefined,
						[Return]: 'myValue'
					}, symbols),
					CS("if (until.call(instance, currentState, r)) break"),
				)
			),
			D('If the iterations are exceeded, Error',
				E.error(() => {
					return S._run(new S([
						() => ({ myProperty: 'myValue' })
					]).for(1).trace.output(ident), {
						[Stack]: [{path:[],origin:Return,point:0}],
						[Trace]: [],
					})
				}, MaxIterationsError),
				CS("if (++r >= iterations) throw new MaxIterationsError(`Maximum iterations of ${iterations} reached at path [ ${currentState[Stack][0].path.slice(0,currentState[Stack][0].point).map(key => key.toString()).join(', ')} ]`, { instance, state: currentState, data: { iterations } })"),
			),
			D('If stack trace is enabled, push the current path to the stack',
				E.equals(() => {
					return S._run(new S(
						() => ({ myProperty: 'myValue' })
					).until((_,runs)=>runs>=1).trace.output(ident), {
						[Stack]: [{path:[],origin:Return,point:0}],
						[Trace]: [],
					})
				}, {
					[Trace]: [[{path:[],origin:Return,point:0}]]
				}, symbols),
				CS("if (trace) currentState = { ...currentState, [Trace]: [ ...currentState[Trace], currentState[Stack] ] }")
			),
			D('Executes the current node on the process, returning the action to perform',
				E.equals(() => {
					return S._run(new S(
						() => ({ myProperty: 'myValue' })
					).until((_,runs)=>runs>=1).output(ident), {
						[Stack]: [{path:[],origin:Return,point:0}]
					})
				}, {
					myProperty: 'myValue',
				}, symbols),
				CS("const action = this._execute(instance, currentState)")
			),
			D('Performs any required actions. Updating the currentState',
				E.equals(() => {
					return S._run(new S([
						{ myProperty: 'myValue' }
					]).until((_,runs)=>runs>=1).output(ident), {
						[Stack]: [{path:[0],origin:Return,point:1}]
					})
				}, {
					myProperty: 'myValue',
				}, symbols),
				CS("currentState = this._perform(instance, currentState, action)")
			),
			D('Proceeds to the next action',
				E.equals(() => {
					return S._run(new S([
						null,
						null
					]).until((_,runs)=>runs>=1).output(ident), {
						[Stack]: [{path:[0],origin:Return,point:1}]
					})
				}, {
					[Stack]: [{path:[1],origin:Return,point:1}]
				}, symbols),
				CS("currentState = this._proceed(instance, currentState, action)")
			),
			CS("}")
		),
		D('When returning, run the end state adapters, then the output adapter to complete execution.',
			E.equals(() => {
				let adaptOutputCalled = false
				let afterCalled = false
				let adaptOutputCalledAfterAfter = false

				new S(Return)
					.after((state) => {
						afterCalled = true
						return state
					})
					.output((state) => {
						adaptOutputCalled = true
						if (afterCalled)
							adaptOutputCalledAfterAfter = true
						return state
					})
					({
						myProperty: 'myValue'
					})

				return adaptOutputCalled && afterCalled && adaptOutputCalledAfterAfter
			}, true, symbols),
			CS("return adaptOutput.call(instance, after.reduce((prev, modifier) => modifier.call(instance, prev), currentState))")
		),
		CS("}")
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
						Return,
					]
				}
			])
			return S.closest([0, 'then', 1], SequenceNode.type)(instance)
		}, [0, 'then']),
		JS("static closest(path, ...nodeTypes) { return instance => this._closest(instance, path, ...nodeTypes) }"),
		TS(`static closest${commonGenericDefinition}(path: Path, ...nodeTypes: Array<string | symbol | Array<string | symbol>>) { return (instance: Instance${commonGenericArguments}): Path | null => this._closest(instance, path, ...nodeTypes) }`)
	),
	D('S.changes (state = {}, changes = {})',
		'Safely apply the given `changes` to the given `state`.',
		'Merges the `changes` with the given `state` and returns it.',
		E.equals(() => {
			const instance = new S()
			const result = S.changes({
				[Changes]: {},
				preserved: 'value',
				common: 'initial',
			}, {
				common: 'changed',
			})(instance)
			return result
		}, {
			common: 'changed',
			preserved: 'value',
			[Changes]: {
				common: 'changed',
			}
		}, symbols),
		JS("static changes(state, changes)     { return instance => this._changes(instance, state, changes) }"),
		TS(`static changes${commonGenericDefinition}(state: SystemState<State, Output>, changes: Partial<State>) { return (instance: Instance${commonGenericArguments}): SystemState<State, Output> => this._changes(instance, state, changes) }`)
	),
	D('S.proceed (state = {}, action = undefined)',
		'Proceed to the next execution path.',
		'Performs fallback logic when a node exits.',
		E.equals(() => {
			const instance = new S([
				null,
				null,
				[
					null,
					null,
				],
				null
			])
			const proceeder = S.proceed({ [Stack]: [{path:[ 2, 1 ],origin:Return,point:2}] })
			return proceeder(instance)
		}, { [Stack]: [{path:[ 3 ],origin:Return,point:1}] }, symbols),
		JS("static proceed(state, node)        { return instance => this._proceed(instance, state, node) }"),
		TS(`static proceed${commonGenericDefinition}(state: SystemState<State, Output>, node: Process | Action) { return (instance: Instance${commonGenericArguments}): SystemState<State, Output> => this._proceed(instance, state, node) }`)
	),
	D('S.perform (state = {}, action = null)',
		'Perform actions on the state.',
		'Applies any changes in the given `action` to the given `state`.',
		E.equals(() => {
			const instance = new S()
			const performer = S.perform({ myProperty: 'start value' }, { myProperty: 'new value' })
			return performer(instance)
		}, { myProperty: 'new value' }),
		JS("static perform(state, action)      { return instance => this._perform(instance, state, action) }"),
		TS(`static perform${commonGenericDefinition}(state: SystemState<State, Output>, action: Action) { return (instance: Instance${commonGenericArguments}): SystemState<State, Output> => this._perform(instance, state, action) }`)
	),
	D('S.execute (state = {}, node = undefined)',
		'Execute a node in the process, return an action.',
		"Executes the node in the process at the state's current path and returns its action.",
		'If the node is not executable it will be returned as the action.',
		E.equals(() => {
			const instance = new S([
				{ myProperty: 'this value' },
				{ myProperty: 'that value' },
				{ myProperty: 'the other value' },
			])
			const executor = S.execute({ [Stack]: [{path:[1],origin:Return,point:1}], myProperty: 'start value' })
			return executor(instance)
		}, { myProperty: 'that value' }, symbols),
		JS("static execute(state, node)        { return instance => this._execute(instance, state, node) }"),
		TS(`static execute${commonGenericDefinition}(state: SystemState<State, Output>, node: Process) { return (instance: Instance${commonGenericArguments}): Action => this._execute(instance, state, node) }`)
	),
	D('S.traverse(iterator = a => a)',
		'Traverses the process of the given instance, mapping each node to a new value, effectively cloning the process.',
		'You can customise how each leaf node is mapped by supplying the `iterator` method',
		E.equals(() => {
			const instance = new S({
				initial: 'swap this',
				other: [
					{
						if: 'swap this too',
						then: 'also swap this'
					}
				]
			})
			const traverser = S.traverse((node, path, process, nodeType) => {
				if (node === 'swap this') return 'with this'
				if (node === 'also swap this') return 'with that'
				if (nodeType === ConditionNode.type && node.if === 'swap this too')
					return {
						...node,
						if: 'with another thing'
					}
				return node
			})
			return traverser(instance)
		}, {
			initial: 'with this',
			other: [
				{
					if: 'with another thing',
					then: 'with that'
				}
			]
		}),
		JS("static traverse(iterator)          { return instance => this._traverse(instance, iterator) }"),
		TS(`static traverse${commonGenericDefinition}(iterator: ((node: Process, path: Path, process: Process, nodeType: string | symbol) => Process)) { return (instance: Instance${commonGenericArguments}) => this._traverse(instance, iterator) }`)
	),
	D('S.run (...input)',
		'Execute the entire process.',
		D('Will execute the process',
			E.equals(() => {
				const instance = new S({ [Return]: 'return value' })
				return S.run()(instance)
			}, 'return value'),
		),
		D('Will not handle promises in async mode even if it is configured',
			E.equals(() => {
				const instance = new S(() => Promise.resolve({ [Return]: 'return value' }))
					.with(asyncPlugin)
				return S.run()(instance)
			}, undefined),
		),
		D('Will not handle promises in sync mode',
			E.equals(() => {
				const instance = new S(() => Promise.resolve({ [Return]: 'return value' }))
				return S.run()(instance)
			}, undefined),
		),
		D('Is the same as running the executable instance itself',
			E.equals(() => {
				const instance = new S({ [Return]: 'return value' })
				return S.run()(instance) === instance()
			}, true),
		),
		D('Takes the same arguments as the executable instance itself',
			E.equals(() => {
				const instance = new S(({ a, b, c }) => ({ [Return]: `${a} + ${b} - ${c}` }))
					.input((a, b, c) => ({ a, b, c }))
				return S.run(1, 2, 3)(instance) === instance(1, 2, 3)
			}, true),
		),
		JS("static run(...input)               { return instance => this._run(instance, ...input) }"),
		TS(`static run${commonGenericDefinition}(...input: Input) { return (instance: Instance${commonGenericArguments}): Output => this._run(instance, ...input) }`)
	),
	D('S.do(process) <default: null>',
		'Defines a process to execute, overrides the existing process.',
		'Returns a function that will modify a given instance.',
		E.is(() => {
			const instance = new S({ [Return]: 'old' })
			const newInstance = instance.with(S.do({ [Return]: 'new' }))
			return newInstance()
		}, 'new'),
		JS("static do(process = null)                    { return instance => ({ process: instance.config.adapt.reduce((prev, modifier) => modifier.call(instance, prev), process), config: instance.config }) }"),
		TS(`static do${commonGenericDefinition}(process: Process) { return (instance: Instance${commonGenericArguments}): Instance${commonGenericArguments} => ({ process: instance.config.adapt.reduce((prev, modifier) => modifier.call(instance, prev), process), config: instance.config }) }`)
	),
	D('S.defaults(defaults) <default: {}>',
		'Defines the initial state to be used for all executions.',
		'Returns a function that will modify a given instance.',
		E.is(() => {
			const instance = new S(({ result }) => ({ [Return]: result }))
			const newInstance = instance.with(S.defaults({ result: 'default' }))
			return newInstance()
		}, 'default'),
		JS("static defaults(defaults = S.config.defaults){ return instance => ({ process: instance.process, config: { ...instance.config, defaults }, }) }"),
		TS(`static defaults<${commonGenericDefinitionInner}	NewState extends InitialState = State,\n>(defaults: NewState) { return (instance: Instance${commonGenericArguments}): Pick<S<NewState, Output, [Partial<InputSystemState<NewState>>] | [], ActionType<NewState, Output>, ProcessType<NewState, Output, ActionType<NewState, Output>>>, 'process' | 'config'> => ({ process: instance.process as unknown as ProcessType<NewState, Output, ActionType<NewState, Output>>, config: { ...instance.config, defaults } as unknown as Config<NewState, Output, [Partial<InputSystemState<NewState>>] | [], ActionType<NewState, Output>, ProcessType<NewState, Output, ActionType<NewState, Output>>>, }) }`)
	),
	D('S.input(input) <default: (state => state)>',
		'Allows the definition of the arguments the executable will use, and how they will be applied to the initial state.',
		'Returns a function that will modify a given instance.',
		E.is(() => {
			const instance = new S(({ first, second }) => ({ [Return]: `${first} then ${second}` }))
			.with(
				S.defaults({ first: '', second: '' }),
				S.input((first, second) => ({ first, second }))
			)
			return instance('this', 'that')
		}, 'this then that'),
		JS("static input(input = S.config.input)         { return instance => ({ process: instance.process, config: { ...instance.config, input }, }) }"),
		TS(`static input<${commonGenericDefinitionInner}	NewInput extends Array<unknown> = Array<unknown>,\n>(input: (...input: NewInput) => Partial<InputSystemState<State, Output>>) { return (instance: Instance${commonGenericArguments}): Pick<S<State, Output, NewInput, Action, Process>, 'process' | 'config'> => ({ process: instance.process, config: { ...instance.config, input } as unknown as Config<State, Output, NewInput, Action, Process>, }) }`)
	),
	D('S.output(output) <default: (state => state[Return])>',
		'Allows the modification of the value the executable will return.',
		'Returns a function that will modify a given instance.',
		E.is(() => {
			const instance = new S(({ myReturnValue }) => ({ myReturnValue: myReturnValue + ' extra' }))
				.with(S.output(state => state.myReturnValue))
			return instance({ myReturnValue: 'start' })
		}, 'start extra'),
		JS("static output(output = S.config.output)      { return instance => ({ process: instance.process, config: { ...instance.config, output }, }) }"),
		TS(`static output<${commonGenericDefinitionInner}	NewResult extends unknown = Output,\n>(output: (state: SystemState<State, Output>) => NewResult) { return (instance: Instance${commonGenericArguments}): Pick<S<State, NewResult, Input, ActionType<State, NewResult>, ProcessType<State, NewResult, ActionType<State, NewResult>>>, 'process' | 'config'> => ({ process: instance.process as unknown as ProcessType<State, NewResult, ActionType<State, NewResult>>, config: { ...instance.config, output } as unknown as Config<State, NewResult, Input, ActionType<State, NewResult>, ProcessType<State, NewResult, ActionType<State, NewResult>>>, }) }`)
	),
	D('S.untrace <default>',
		'Shallow merges the state every time a state change is made.',
		'Returns a function that will modify a given instance.',
		E.equals(() => {
			const instance = new S({
				initial: 'other',
				other: 'oneMore',
				oneMore: [
					null,
					null
				]
			})
			.with(S.untrace)
			.output(({ [Trace]: trace }) => trace)
			return instance()
		}, []),
		JS("static untrace                                (instance) { return ({ process: instance.process, config: { ...instance.config, trace: false }, }) }"),
		TS(`static untrace${commonGenericDefinition}(instance: Instance${commonGenericArguments}): Instance${commonGenericArguments} { return ({ process: instance.process, config: { ...instance.config, trace: false }, }) }`)
	),
	D('S.trace',
		'Deep merges the all properties in the state every time a state change is made.',
		'Returns a function that will modify a given instance.',
		E.equals(() => {
			const instance = new S({
				initial: 'other',
				other: 'oneMore',
				oneMore: [
					null,
					null
				]
			})
			.with(S.trace)
			.output(({ [Trace]: trace }) => trace)
			return instance()
		}, [
			[{path:[],origin:Return,point:0}],
			[{path:['initial'],origin:Return,point:1}],
			[{path:['other'],origin:Return,point:1}],
			[{path:['oneMore'],origin:Return,point:1}],
			[{path:['oneMore', 0],origin:Return,point:2}],
			[{path:['oneMore', 1],origin:Return,point:2}]
		]),
		JS("static trace                                  (instance) { return ({ process: instance.process, config: { ...instance.config, trace: true }, }) }"),
		TS(`static trace${commonGenericDefinition}(instance: Instance${commonGenericArguments}): Instance${commonGenericArguments} { return ({ process: instance.process, config: { ...instance.config, trace: true }, }) }`)
	),
	D('S.shallow <default>',
		'Shallow merges the state every time a state change is made.',
		'Returns a function that will modify a given instance.',
		E.equals(() => {
			const instance = new S({ myProperty: { existingKey: 'newValue', deepKey: { deepValue2: 7 } } })
				.with(S.shallow)
				.output(ident)
			return instance({ myProperty: { existingKey: 'existingValue', anotherKey: 'anotherValue', deepKey: { deepVaue: 6 } } })
		}, { myProperty: { existingKey: 'newValue', anotherKey: undefined, deepKey: { deepVaue: undefined, deepValue2: 7 } } }),
		JS("static shallow                                (instance) { return ({ process: instance.process, config: { ...instance.config, deep: false }, }) }"),
		TS(`static shallow${commonGenericDefinition}(instance: Instance${commonGenericArguments}): Instance${commonGenericArguments} { return ({ process: instance.process, config: { ...instance.config, deep: false }, }) }`)
	),
	D('S.deep',
		'Deep merges the all properties in the state every time a state change is made.',
		'Returns a function that will modify a given instance.',
		E.equals(() => {
			const instance = new S({ myProperty: { existingKey: 'newValue', deepKey: { deepValue2: 7 } } })
				.with(S.deep)
				.output(ident)
			return instance({ myProperty: { existingKey: 'existingValue', anotherKey: 'anotherValue', deepKey: { deepVaue: 6 } } })
		}, { myProperty: { existingKey: 'newValue', anotherKey: 'anotherValue', deepKey: { deepVaue: 6, deepValue2: 7 } } }),
		JS("static deep                                   (instance) { return ({ process: instance.process, config: { ...instance.config, deep: true }, }) }"),
		TS(`static deep${commonGenericDefinition}(instance: Instance${commonGenericArguments}): Instance${commonGenericArguments} { return ({ process: instance.process, config: { ...instance.config, deep: true }, }) }`)
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
		TS(`static unstrict${commonGenericDefinition}(instance: Instance${commonGenericArguments}): Instance${commonGenericArguments} { return ({ process: instance.process, config: { ...instance.config, strict: false }, }) }`)
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
		TS(`static strict${commonGenericDefinition} (instance: Instance${commonGenericArguments}): Instance${commonGenericArguments} { return ({ process: instance.process, config: { ...instance.config, strict: true }, }) }`)
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
		JS("static strictTypes                            (instance) { return ({ process: instance.process, config: { ...instance.config, strict: StrictTypes }, }) }"),
		TS(`static strictTypes${commonGenericDefinition} (instance: Instance${commonGenericArguments}): Instance${commonGenericArguments} { return ({ process: instance.process, config: { ...instance.config, strict: StrictTypes }, }) }`),
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
		TS(`static for${commonGenericDefinition}(iterations: number = 10000) { return (instance: Instance${commonGenericArguments}): Instance${commonGenericArguments} => ({ process: instance.process, config: { ...instance.config, iterations }, }) }`),
	),
	D('S.until(until) <default: (state => Return in state)>',
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
				.with(
					S.output(({ result }) => result),
					S.until(({ result }) => result === 'exit')
				)
			return instance({ result: 0 })
		}, 'exit'),
		JS("static until(until = S.config.until)         { return instance => ({ process: instance.process, config: { ...instance.config, until }, }) }"),
		TS(`static until${commonGenericDefinition}(until: Config${commonGenericArguments}['until']) { return (instance: Instance${commonGenericArguments}): Instance${commonGenericArguments} => ({ process: instance.process, config: { ...instance.config, until }, }) }`),
	),
	D('S.forever',
		'Removes the max iteration limit.',
		'Will modify the given instance.',
		E.is(() => {
			const instance = new S().with(S.forever)
			return instance.config.iterations
		}, Infinity),
		JS("static forever                                (instance) { return ({ process: instance.process, config: { ...instance.config, iterations: Infinity }, }) }"),
		TS(`static forever${commonGenericDefinition} (instance: Instance${commonGenericArguments}): Instance${commonGenericArguments} { return ({ process: instance.process, config: { ...instance.config, iterations: Infinity }, }) }`)
	),
	D('S.override(override) <default: instance.run>',
		'Overrides the method that will be used when the executable is called.',
		'Returns a function that will modify a given instance.',
		E.is(() => {
			const instance = new S({ [Return]: 'definedResult' })
				.with(
					S.override(function (a, b, c) {
						// console.log({ scope: this, args }) // { scope: { process: { result: 'definedResult' } }, args: [1, 2, 3] }
						return `customResult. a: ${a}, b: ${b}, c: ${c}`
					})
				)
			return instance(1, 2, 3)
		}, 'customResult. a: 1, b: 2, c: 3'),
		JS("static override(override = S.config.override){ return instance => ({ process: instance.process, config: { ...instance.config, override } }) }"),
		TS(`static override${commonGenericDefinition}(override: ((...args: Input) => Output) | null) { return (instance: Instance${commonGenericArguments}): Instance${commonGenericArguments} => ({ process: instance.process, config: { ...instance.config, override } }) }`)
	),
	D('S.addNode(...nodes)',
		'Allows for the addition of new node types.',
		'Returns a function that will modify a given instance.',
		E.equals(() => {
			const specialSymbol = Symbol('My Symbol')
			class SpecialNode extends Node {
				static type = 'special'
				static typeof(object, objectType) { return Boolean(objectType === 'object' && object && specialSymbol in object)}
				static execute(){ return { [Return]: 'specialValue' } }
			}
			const instance = new S({ [specialSymbol]: true })
				.with(
					S.output(({ result, [Return]: output = result }) => output),
					S.addNode(SpecialNode)
				)
			return instance({ result: 'start' })
		}, 'specialValue'),
		E.equals(() => {
			const specialSymbol = Symbol('My Symbol')
			const instance = new S({ [specialSymbol]: true })
				.with(
					S.output(({ result, [Return]: output = result }) => output)
				)
			return instance({ result: 'start' })
		}, 'start'),
		JS("static addNode(...nodes)                     { return instance => ({ process: instance.process, config: { ...instance.config, nodes: new Nodes(...instance.config.nodes.values(),...nodes) }, }) }"),
		TS(`static addNode${commonGenericDefinition}(...nodes: any[]) { return (instance: Instance${commonGenericArguments}) => ({ process: instance.process, config: { ...instance.config, nodes: new Nodes(...instance.config.nodes.values(),...nodes) }, }) }`)
	),
	D('S.adapt(...adapters)',
		'Transforms the process before usage, allowing for temporary nodes.',
		'Returns a function that will modify a given instance.',
		E.is(() => {
			const replaceMe = Symbol('replace me')
			const instance = new S([
				replaceMe,
			]).with(
				S.adapt(function (process) {
					return S.traverse((node) => {
						if (node === replaceMe)
							return { [Return]: 'replaced' }
						return node
					})(this)
				})
			)
			return instance()
		}, 'replaced'),
		JS("static adapt(...adapters)                    { return instance => ({ process: adapters.reduce((prev, adapter) => adapter.call(instance, prev), instance.process), config: { ...instance.config, adapt: [ ...instance.config.adapt, ...adapters ] }, }) }"),
		TS(`static adapt${commonGenericDefinition}(...adapters: Array<(process: Process) => Process>) { return (instance: Instance${commonGenericArguments}): Pick< S${commonGenericArguments}, 'process' | 'config'> => ({ process: adapters.reduce((prev, adapter) => adapter.call(instance, prev), instance.process), config: { ...instance.config, adapt: [ ...instance.config.adapt, ...adapters ] }, }) }`)
	),
	D('S.before(...adapters)',
		'Transforms the state before execution.',
		'Returns a function that will modify a given instance.',
		E.equals(() => {
			const instance = new S()
			.with(
				S.output(({ result }) => result),
				S.before(state => ({
					...state,
					result: 'overridden'
				}))
			)
			return instance({ result: 'input' })
		}, 'overridden'),
		JS("static before(...adapters)                   { return instance => ({ process: instance.process, config: { ...instance.config, before: [ ...instance.config.before, ...adapters ] }, }) }"),
		TS(`static before${commonGenericDefinition}(...adapters: Array<(state: SystemState<State, Output>) => SystemState<State, Output>>) { return (instance: Instance${commonGenericArguments}): Instance${commonGenericArguments} => ({ process: instance.process, config: { ...instance.config, before: [ ...instance.config.before, ...adapters ] }, }) }`),
	),
	
	D('S.after(...adapters)',
		'Transforms the state after execution.',
		'Returns a function that will modify a given instance.',
		E.equals(() => {
			const instance = new S()
			.with(
				S.output(({ result }) => result),
				S.after(state => ({
					...state,
					result: 'overridden'
				}))
			)
			return instance({ result: 'input' })
		}, 'overridden'),
		JS("static after(...adapters)                    { return instance => ({ process: instance.process, config: { ...instance.config, after: [ ...instance.config.after, ...adapters ] }, }) }"),
		TS(`static after${commonGenericDefinition}(...adapters: Array<(state: SystemState<State, Output>) => SystemState<State, Output>>) { return (instance: Instance${commonGenericArguments}): Instance${commonGenericArguments} => ({ process: instance.process, config: { ...instance.config, after: [ ...instance.config.after, ...adapters ] }, }) }`)
	),
	
	D('S.with(...adapters)',
		'Allows for the addition of predifined modules.',
		'Returns a function that will modify a given instance.',
		E.equals(() => {
			const plugin = S.with(S.strict, asyncPlugin, S.for(10))
			const instance = new S().with(plugin)
			return instance.config
		}, { strict: true, iterations: 10}),
		JS("static with(...adapters) {"),
		TS(`static with<${commonGenericDefinitionInner}
	NewState extends InitialState = State,
	NewResult extends unknown = Output,
	NewInput extends Array<unknown> = Input,
	NewAction extends unknown = Action,
	NewProcess extends unknown = Process
>(...adapters: Array<((instance: Instance${commonGenericArguments}) => Pick<S<NewState, NewResult, NewInput, NewAction, NewProcess>, 'process' | 'config'>)>) {`),
		D('Allow the input of a list or a list of lists, etc.',
			CS("const flatAdapters = adapters.flat(Infinity)"),
		),
		D('Return a function that takes a specific instance.',
			JS("return instance => {"),
			TS(`return (instance: Instance${commonGenericArguments}): S<NewState, NewResult, NewInput, NewAction, NewProcess> => {`),
			D('Pass each state through the adapters sequentially.',
				JS("const adapted = flatAdapters.reduce((prev, adapter) => adapter.call(instance, prev), instance)"),
				TS(`const adapted = flatAdapters.reduce((prev, adapter) => adapter.call(instance, prev) as unknown as Instance${commonGenericArguments}, instance) as unknown as Pick<S<NewState, NewResult, NewInput, NewAction, NewProcess>, 'process' | 'config'>`)
			),
			D('Make sure an instance is returned.',
				JS("return adapted instanceof S ? adapted : new S(adapted.process, adapted.config)"),
				TS("return adapted instanceof S ? adapted : new S<NewState, NewResult, NewInput, NewAction, NewProcess>(adapted.process, adapted.config)")
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
		}),
		E.equals(() => {
			const instance = new S()
			const modifiedInstance = instance
				.with(asyncPlugin)
				.for(10)
				.defaults({ result: 'other' })
				.strict
			return modifiedInstance.config
		}, { 
			defaults: { result: 'other' },
			iterations: 10,
			strict: true,
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
			D('Neither of these arguments are required, and it is not recommended to configure them via the constructor. Instead you should update the config using the various chainable methods and properties.',
				E.success(() => {
					const instance = new S(process)
						.defaults({})
						.input()
						.output()
				})
			),
		),
		JS("constructor(process = null, config = S.config) {"),
		TS(`constructor(process: Process = (null as Process), config: Config${commonGenericArguments} = (S.config as unknown as Config${commonGenericArguments})) {`),
		D('The executable instance will be an `instanceof ExecutableFunction` ',
			'It will execute the `run` or `override` method in scope of the new SuperSmallStateMachine instance.',
			JS("super((...input) => (config.override || this.run).apply(this, input))"),
			TS("super((...input: Input): Output => (config.override || this.run).apply(this, input))")
		),
		D('Create the config by merging the passed config with the defaults.',
			'This is private so it cannot be mutated at runtime',
			E.equals(() => {
				const myConfig = { iterations: 1000 }
				const instance = new S(null, myConfig)
				const retrievedConfig = instance.config
				return retrievedConfig !== myConfig && retrievedConfig !== instance.config
			}, true),
			E.equals(() => {
				const myConfig = { iterations: 'original' }
				const instance = new S(null, myConfig)
				instance.config.iterations = 'new value'
				return instance.config.iterations
			}, 'original'),
			JS("this.#config = { ...this.#config, ...config }"),
			TS(`this.#config = { ...this.#config, ...config } as unknown as Config${commonGenericArguments}`)
		),
		D('The process must be public, it cannot be deep merged or cloned as it may contain symbols.',
			E.equals(() => {
				const myProcess = { mySpecialKey: 23864 }
				const instance = new S(myProcess)
				return instance.process === myProcess
			}, true),
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
						Return,
					]
				}
			])
			return instance.closest([0, 'then', 1], SequenceNode.type)
		}, [0, 'then']),
		JS("closest(path, ...nodeTypes) { return S._closest(this, path, ...nodeTypes) }"),
		TS("closest(path: Path, ...nodeTypes: Array<string | symbol | Array<string | symbol>>): Path | null { return S._closest(this, path, ...nodeTypes) }")
	),
	D('instance.changes (state = {}, changes = {})',
		'Safely apply the given `changes` to the given `state`.',
		'Merges the `changes` with the given `state` and returns it.',
		E.equals(() => {
			const instance = new S()
			const result = instance.changes({
				[Changes]: {},
				preserved: 'value',
				common: 'initial',
			}, {
				common: 'changed',
			})
			return result
		}, {
			common: 'changed',
			preserved: 'value',
			[Changes]: {
				common: 'changed',
			}
		}, symbols),
		JS("changes(state, changes) { return S._changes(this, state, changes) }"),
		TS("changes(state: SystemState<State, Output>, changes: Partial<State>): SystemState<State, Output> { return S._changes(this, state, changes) }")
	),
	D('instance.proceed (state = {}, node = undefined)',
		'Proceed to the next execution path.',
		'Performs fallback logic when a node exits.',
		E.equals(() => {
			const instance = new S([
				null,
				null,
				[
					null,
					null,
				],
				null
			])
			return instance.proceed({ [Stack]: [{path:[ 2, 1 ],origin:Return,point:2}] })
		}, { [Stack]: [{path:[ 3 ],origin:Return,point:1}] }, symbols),
		JS("proceed(state, node)    { return S._proceed(this, state, node) }"),
		TS("proceed(state: SystemState<State, Output>, node: Process | Action) { return S._proceed(this, state, node) }")
	),
	D('instance.perform (state = {}, action = null)',
		'Perform actions on the state.',
		'Applies any changes in the given `action` to the given `state`.',
		E.equals(() => {
			const instance = new S()
			return instance.perform({ myProperty: 'start value' }, { myProperty: 'new value' })
		}, { myProperty: 'new value' }),
		JS("perform(state, action)  { return S._perform(this, state, action) }"),
		TS("perform(state: SystemState<State, Output>, action: Action) { return S._perform(this, state, action) }")
	),
	D('instance.execute (state = {}, node = undefined)',
		'Execute a node in the process, return an action.',
		"Executes the node in the process at the state's current path and returns its action.",
		'If the node is not executable it will be returned as the action.',
		E.equals(() => {
			const instance = new S([
				{ myProperty: 'this value' },
				{ myProperty: 'that value' },
				{ myProperty: 'the other value' },
			])
			return instance.execute({ [Stack]: [{path:[1],origin:Return,point:1}], myProperty: 'start value' }, get_path_object(instance.process, [1]))
		}, { myProperty: 'that value' }, symbols),
		JS("execute(state, node)    { return S._execute(this, state, node) }"),
		TS("execute(state: SystemState<State, Output>, node: Process) { return S._execute(this, state, node) }")
	),
	D('instance.traverse(iterator = a => a)',
		'Traverses the process of the instance, mapping each node to a new value, effectively cloning the process.',
		'You can customise how each leaf node is mapped by supplying the `iterator` method',
		E.equals(() => {
			const instance = new S({
				initial: 'swap this',
				other: [
					{
						if: 'swap this too',
						then: 'also swap this'
					}
				]
			})
			return instance.traverse((node, path, process, nodeType) => {
				if (node === 'swap this') return 'with this'
				if (node === 'also swap this') return 'with that'
				if (nodeType === ConditionNode.type && node.if === 'swap this too')
					return {
						...node,
						if: 'with another thing'
					}
				return node
			})
		}, {
			initial: 'with this',
			other: [
				{
					if: 'with another thing',
					then: 'with that'
				}
			]
		}),
		JS("traverse(iterator)      { return S._traverse(this, iterator) }"),
		TS("traverse(iterator: ((node: Process, path: Path, process: Process, nodeType: string | symbol) => Process)){ return S._traverse(this, iterator) }")
	),
	D('instance.run (...input)',
		'Execute the entire process.',
		D('Will execute the process',
			E.equals(() => {
				const instance = new S({ [Return]: 'return value' })
				return instance.run()
			}, 'return value'),
		),
		D('Will not handle promises in async mode even if it is configured',
			E.equals(() => {
				const instance = new S(() => Promise.resolve({ [Return]: 'return value' }))
					.with(asyncPlugin)
				return instance.run()
			}, undefined),
		),
		D('Will not handle promises in sync mode',
			E.equals(() => {
				const instance = new S(() => Promise.resolve({ [Return]: 'return value' }))
				return instance.run()
			}, undefined),
		),
		D('Is the same as running the executable instance itself',
			E.equals(() => {
				const instance = new S({ [Return]: 'return value' })
				return instance.run() === instance()
			}, true),
		),
		D('Takes the same arguments as the executable instance itself',
			E.equals(() => {
				const instance = new S(({ a, b, c }) => ({ [Return]: `${a} + ${b} - ${c}` }))
					.input((a, b, c) => ({ a, b, c }))
				return instance.run(1, 2, 3) === instance(1, 2, 3)
			}, true),
		),
		JS("run     (...input)      { return S._run(this, ...input) }"),
		TS("run (...input: Input): Output { return S._run(this, ...input) }")
	),
	D('instance.do(process) <default: null>',
		'Defines a process to execute, overrides the existing process.',
		'Returns a new instance.',
		E.is(() => {
			const instance = new S({ [Return]: 'old' })
				.do({ [Return]: 'new' })
			return instance()
		}, 'new'),
		JS("do(process)             { return this.with(S.do(process)) }"),
		TS(`do(process: Process): S${commonGenericArguments} { return this.with(S.do(process)) }`)
	),
	D('instance.defaults(defaults) <default: {}>',
		'Defines the initial state to be used for all executions.',
		'Returns a new instance.',
		E.is(() => {
			const instance = new S(({ result }) => ({ [Return]: result }))
				.defaults({ result: 'default' })
			return instance()
		}, 'default'),
		JS("defaults(defaults)      { return this.with(S.defaults(defaults)) }"),
		TS("defaults<NewState extends InitialState = State>(defaults: NewState): S<NewState, Output, [Partial<InputSystemState<NewState>>] | [], ActionType<NewState, Output>, ProcessType<NewState, Output, ActionType<NewState, Output>>> { return this.with(S.defaults(defaults)) }")
	),
	D('instance.input(input) <default: (state => state)>',
		'Allows the definition of the arguments the executable will use, and how they will be applied to the initial state.',
		'Returns a new instance.',
		E.is(() => {
			const instance = new S(({ first, second }) => ({ [Return]: `${first} then ${second}` }))
				.defaults({ first: '', second: '' })
				.input((first, second) => ({ first, second }))
			return instance('this', 'that')
		}, 'this then that'),
		JS("input(input)            { return this.with(S.input(input)) }"),
		TS("input<NewInput extends Array<unknown> = Array<unknown>>(input: (...input: NewInput) => Partial<InputSystemState<State, Output>>): S<State, Output, NewInput, Action, Process> { return this.with(S.input(input)) }")
	),
	D('instance.output(output) <default: (state => state.output)>',
		'Allows the modification of the value the executable will return.',
		'Returns a new instance.',
		E.is(() => {
			const instance = new S(({ myReturnValue }) => ({ myReturnValue: myReturnValue + ' extra' }))
				.output(state => state.myReturnValue)
			return instance({ myReturnValue: 'start' })
		}, 'start extra'),
		JS("output(output)          { return this.with(S.output(output)) }"),
		TS("output<NewResult extends unknown = Output>(output: (state: SystemState<State, Output>) => NewResult): S<State, NewResult, Input, ActionType<State, NewResult>, ProcessType<State, NewResult, ActionType<State, NewResult>>> { return this.with(S.output(output)) }")
	),
	D('instance.untrace <default>',
		'Disables the stack trace.',
		'Creates a new instance.',
		E.equals(() => {
			const instance = new S({
				initial: 'other',
				other: 'oneMore',
				oneMore: [
					null,
					null
				]
			}).untrace
			.output(({ [Trace]: trace }) => trace)
			return instance()
		}, []),
		JS("get untrace()           { return this.with(S.untrace) }"),
		TS(`get untrace(): S${commonGenericArguments} { return this.with(S.untrace) }`)
	),
	D('instance.trace',
		'Enables the stack trace.',
		'Creates a new instance.',
		E.equals(() => {
			const instance = new S({
				initial: 'other',
				other: 'oneMore',
				oneMore: [
					null,
					null
				]
			}).trace
			.output(({ [Trace]: trace }) => trace)
			return instance()
		}, [
			[{path:[],origin:Return,point:0}],
			[{path:['initial'],origin:Return,point:1}],
			[{path:['other'],origin:Return,point:1}],
			[{path:['oneMore'],origin:Return,point:1}],
			[{path:['oneMore', 0],origin:Return,point:2}],
			[{path:['oneMore', 1],origin:Return,point:2}]
		]),
		JS("get trace()             { return this.with(S.trace) }"),
		TS(`get trace(): S${commonGenericArguments} { return this.with(S.trace) }`)
	),
	D('instance.shallow <default>',
		'Shallow merges the state every time a state change is made.',
		'Creates a new instance.',
		E.equals(() => {
			const instance = new S({ myProperty: { existingKey: 'newValue', deepKey: { deepValue2: 7 } } })
				.shallow
				.output(ident)
			return instance({ myProperty: { existingKey: 'existingValue', anotherKey: 'anotherValue', deepKey: { deepVaue: 6 } } })
		}, { myProperty: { existingKey: 'newValue', anotherKey: undefined, deepKey: { deepVaue: undefined, deepValue2: 7 } } }),
		JS("get shallow()           { return this.with(S.shallow) }"),
		TS(`get shallow(): S${commonGenericArguments} { return this.with(S.shallow) }`)
	),
	D('instance.deep',
		'Deep merges the all properties in the state every time a state change is made.',
		'Creates a new instance.',
		E.equals(() => {
			const instance = new S({ myProperty: { existingKey: 'newValue', deepKey: { deepValue2: 7 } } })
				.deep
				.output(ident)
			return instance({ myProperty: { existingKey: 'existingValue', anotherKey: 'anotherValue', deepKey: { deepVaue: 6 } } })
		}, { myProperty: { existingKey: 'newValue', anotherKey: 'anotherValue', deepKey: { deepVaue: 6, deepValue2: 7 } } }),
		JS("get deep()              { return this.with(S.deep) }"),
		TS(`get deep(): S${commonGenericArguments} { return this.with(S.deep) }`)
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
			const instance = new S([
				() => ({ knownVariable: 45 }),
				({ knownVariable }) => ({ [Return]: knownVariable })
			])
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
	D('instance.until(until) <default: (state => Return in state)>',
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
				.output(({ result }) => result)
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
	D('instance.override(override) <default: instance.run>',
		'Overrides the method that will be used when the executable is called.',
		'Returns a new instance.',
		E.is(() => {
			const instance = new S({ [Return]: 'definedResult' })
				.override(function (a, b, c) {
					// console.log({ scope: this, args }) // { scope: { process: { result: 'definedResult' } }, args: [1, 2, 3] }
					return `customResult. a: ${a}, b: ${b}, c: ${c}`
				})
			return instance(1, 2, 3)
		}, 'customResult. a: 1, b: 2, c: 3'),
		JS("override(override)      { return this.with(S.override(override)) }"),
		TS(`override(override: ((...args: Input) => Output) | null): S${commonGenericArguments} { return this.with(S.override(override)) }`)
	),
	D('instance.addNode(...nodes)',
		'Allows for the addition of new node types.',
		'Returns a new instance.',
		E.equals(() => {
			const specialSymbol = Symbol('My Symbol')
			class SpecialNode extends Node {
				static type = 'special'
				static typeof(object, objectType) { return Boolean(objectType === 'object' && object && specialSymbol in object)}
				static execute(){ return { [Return]: 'specialValue' } }
			}
			const instance = new S({ [specialSymbol]: true })
				.output(({ result, [Return]: output = result }) => output)
				.addNode(SpecialNode)
			return instance({ result: 'start' })
		}, 'specialValue'),
		E.equals(() => {
			const specialSymbol = Symbol('My Symbol')
			const instance = new S({ [specialSymbol]: true })
				.output(({ result, [Return]: output = result }) => output)
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
			]).adapt(function (process) {
				return S.traverse((node) => {
					if (node === replaceMe)
						return { [Return]: 'replaced' }
					return node
				})(this)
			})
			return instance()
		}, 'replaced'),
		JS("adapt(...adapters)      { return this.with(S.adapt(...adapters)) }"),
		TS(`adapt(...adapters: Array<(process: Process) => Process>): S${commonGenericArguments} { return this.with(S.adapt(...adapters)) }`)
	),
	D('instance.before(...adapters)',
		'Transforms the state before execution.',
		'Returns a new instance.',
		E.equals(() => {
			const instance = new S()
				.output(({ result }) => result)
				.before(state => ({
					...state,
					result: 'overridden'
				}))
			return instance({ result: 'input' })
		}, 'overridden'),
		JS("before(...adapters)     { return this.with(S.before(...adapters)) }"),
		TS(`before(...adapters: Array<(state: SystemState<State, Output>) => SystemState<State, Output>>): S${commonGenericArguments} { return this.with(S.before(...adapters)) }`)
	),
	
	D('instance.after(...adapters)',
		'Transforms the state after execution.',
		'Returns a new instance.',
		E.equals(() => {
			const instance = new S()
				.output(({ result }) => result)
				.after(state => ({
					...state,
					result: 'overridden'
				}))
			return instance({ result: 'start' })
		}, 'overridden'),
		JS("after(...adapters)      { return this.with(S.after(...adapters)) }"),
		TS(`after(...adapters: Array<(state: SystemState<State, Output>) => SystemState<State, Output>>): S${commonGenericArguments} { return this.with(S.after(...adapters)) }`)
	),
	D('instance.with(...adapters)',
		'Allows for the addition of predifined modules.',
		'Returns a new instance.',
		E.equals(() => {
			const instance = new S()
				.with(S.strict, asyncPlugin, S.for(10))
			return instance.config
		}, { strict: true, iterations: 10}),
		JS("with(...transformers)   { return S.with(...transformers)(this) }"),
		TS(`with<NewState extends InitialState = State, NewResult extends unknown = Output, NewInput extends Array<unknown> = Input, NewAction extends unknown = Action, NewProcess extends unknown = Process>(...transformers: Array<(instance: Instance${commonGenericArguments}) => Pick<S<NewState, NewResult, NewInput, NewAction, NewProcess>, 'process' | 'config'>>): S<NewState, NewResult, NewInput, NewAction, NewProcess> { return S.with<State, Output, Input, Action, Process, NewState, NewResult, NewInput, NewAction, NewProcess>(...transformers)(this) }`)
	),
	CS("}"),
	CS("export const StateMachine = S"),
	CS("export const SuperSmallStateMachine = S"),
	CS("export const NodeDefinition = Node"),
	CS("export const NodeDefinitions = Nodes"),
	D('The main class is exported as `{ StateMachine }`',
		E.exports('StateMachine', testModule, './index.js'),
	),
	D('The main class is exported as `{ SuperSmallStateMachine }`',
		E.exports('SuperSmallStateMachine', testModule, './index.js'),
	),
	D('The node class is exported as `{ NodeDefinition }`',
		E.exports('NodeDefinition', testModule, './index.js'),
	),
	D('The node collection class is exported as `{ NodeDefinitions }`',
		E.exports('NodeDefinitions', testModule, './index.js'),
	),
	D('The node class is exported as `{ Node }`',
		E.exports('Node', testModule, './index.js'),
	),
	D('The node collection class is exported as `{ Nodes }`',
		E.exports('Nodes', testModule, './index.js'),
	),
),

D('Requirements',
	D('Execution',
		D('Can execute function',
			E.is(() => {
				const instance = new S(({ input }) => ({ [Return]: (input + 5) * 47 }))
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
					.output(({ result }) => result)
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
					then: () => ({ [Return]: 44 }),
					else: () => ({ [Return]: 55 }),
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
					then: () => ({ [Return]: 44 }),
					else: () => ({ [Return]: 55 }),
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
						first: () => ({ [Return]: 1 }),
						second: () => ({ [Return]: 2 }),
						third: () => ({ [Return]: 3 }),
						default: () => ({ [Return]: -1 }),
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
						first: () => ({ [Return]: 1 }),
						second: () => ({ [Return]: 2 }),
						third: () => ({ [Return]: 3 }),
						default: () => ({ [Return]: -1 }),
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
							else: ({ result }) => ({ [Return]: result })
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
						else: ({ result }) => ({ [Return]: result })
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
					.output(({ result }) => result)
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
					initial: { [Goto]: ['second',0] },
					second: [
						({ input }) => ({ [Return]: input + 4 })
					]
				})
				return instance({
					input: 5,
				})
			}, 9)
		),
		D('Can use path object as relative path',
			E.is(() => {
				const instance = new S({
					initial: { [Goto]: 'second' },
					second: [
						({ input }) => ({ [Return]: input + 4 })
					]
				})
				return instance({
					input: 5,
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
							then: 'initial',
							else: ({ result }) => ({ [Return]: result })
						}
					]
				})
				return instance({
					result: 0,
				})
			}, 7)
		),
		D('Can use symbol as an intercept',
			E.is(() => {
				const testSymbol = Symbol('Test Symbol')
				const instance = new S({
					initial: [
						({ result }) => ({ result: result + 1 }),
						testSymbol,
					],
					[testSymbol]: [
						{
							if: ({ result }) => result < 7,
							then: 'initial',
							else: ({ result }) => ({ [Return]: result })
						}
					]
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
						then: 0,
						else: ({ result }) => ({ [Return]: result })
					}
				])
				return instance({
					result: 0,
				})
			}, 7)
		),
		D('Can use return as goto',
			E.is(() => {
				const instance = new S([
					({ result }) => ({ result: result - 1 }),
					{
						if: ({ result }) => result <= 0,
						then: ({ result }) => ({ [Return]: result }),
						else: 0
					}
				])
				return instance({
					result: 6,
				})
			}, 0)
		),
		D('Can use return object as goto',
			E.is(() => {
				const instance = new S([
					({ result }) => ({ result: result - 1 }),
					{
						if: ({ result }) => result <= 0,
						then: { [Return]: 66 },
						else: 0
					}
				])
					.defaults({
						result: -1,
					})
					.output(({ result, [Return]: output = result }) => output)
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
					.output(({ result }) => result)
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
						({ input }) => ({ [Return]: input + 4 })
					]
				})
				return instance({
					input: 5,
				})
			}, 9)
		),
		D('Can return path object as absolute path',
			E.is(() => {
				const instance = new S({
					initial: () => ({ [Goto]: ['second',0] }),
					second: [
						({ input }) => ({ [Return]: input + 4 })
					]
				})
				return instance({
					input: 5,
				})
			}, 9)
		),
		D('Can return path object as relative path',
			E.is(() => {
				const instance = new S({
					initial: () => ({ [Goto]: 'second' }),
					second: [
						({ input }) => ({ [Return]: input + 4 })
					]
				})
				return instance({
					input: 5,
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
							then: () => 'initial',
							else: ({ result }) => ({ [Return]: result })
						}
					]
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
							then: () => 'initial',
							else: ({ result }) => ({ [Return]: result })
						}
					]
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
						then: () => 0,
						else: ({ result }) => ({ [Return]: result })
					}
				])
				return instance({
					result: 0,
				})
			}, 7)
		),
		D('Can return return as goto',
			E.is(() => {
				const instance = new S([
					({ result }) => ({ result: result - 1 }),
					{
						if: ({ result }) => result <= 0,
						then: () => Return,
						else: 0
					}
				])
					.output(({ result }) => result)
					.defaults({
						result: -1,
					})
				return instance({
					result: 6,
				})
			}, 0)
		),
		D('Can return return object as goto',
			E.is(() => {
				const instance = new S([
					({ result }) => ({ result: result - 1 }),
					{
						if: ({ result }) => result <= 0,
						then: () => ({ [Return]: 66 }),
						else: 0
					}
				])
					.output(({ result, [Return]: output = result }) => output)
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
					.output(({ result }) => result)
				return instance({
					result: 99
				})
			}, 66)
		),
	),

	D('Continue',
		E.equals(() => {
			const instance = new S({
				while: ({ result }) => result < 100,
				do: [
					({ result }) => ({ result: result + 16 }),
					{
						if: ({ result }) => result === 60,
						then: Continue
					},
					({ result }) => ({ result: result + 1 }),
				]
			})
			.defaults({
				result: 0,
			})
			.output(({ result }) => result)
			return instance({
				result: 10
			})
		}, 111)
	),
	D('Break',
		E.equals(() => {
			const instance = new S([
				{
					while: ({ result }) => result < 100,
					do: [
						({ result }) => ({ result: result + 17 }),
						{
							if: ({ result }) => result === 61,
							then: Break
						}
					]
				},
				({ result }) => ({ result: result + 1 })
			])
			.defaults({
				result: 0,
			})
			.output(({ result }) => result)
			return instance({
				result: 10
			})
		}, 62)
	),
	
	D("Interrupts",
		D("Interrupts return to where they were after completing",
			E.equals(() => {
				const interrupt = Symbol('My Interrupt')
				const machine = new S({
					initial: [
						interrupt,
						({ order }) => ({
							order: [...order,'dos']
						})
					],
					[interrupt]: ({ order }) => ({
						order: [...order,'uno']
					})
				})
				.output(({ order }) => order)
				return machine({ order: [] })
			}, ['uno','dos'])
		),


		D("The return of an interrupt will be assigned to the context",
			E.equals(() => {
				const interrupt = Symbol('My Interrupt')
				const machine = new S({
					initial: [
						interrupt,
						({ order, [interrupt]: result }) => ({
							order: [...order,result]
						})
					],
					[interrupt]: [
						({ order }) => ({
							order: [...order,'uno']
						}),
						{ [Return]: 'dos' }
					]
				})
				.output(({ order }) => order)
				return machine({ order: [] })
			}, ['uno','dos'])
		),
		
		D("Interrupts can be sent to a child machine",
			E.equals(async () => {
				const interrupt = Symbol('My Interrupt')
				const countMachine = new S({
					initial: [
						{ num: 1 },
						'wait'
					],
					wait: [
						Wait,
						'wait'
					],
					[interrupt]: [
						({ num }) => ({ lastNum: num, num: num+1 }),
						({ lastNum }) => ({ [Return]: lastNum }),
					],
				}).with(asyncPlugin)
				const machine = new S({
					initial: [
						() => ({ countMachine: countMachine() }),
						{
							 while: ({ order }) => order.length < 3,
							 do: [
								() => wait_time(50),
								async ({ countMachine, order }) => ({ order: [ ...order, await countMachine.interrupt(interrupt) ] }),
							 ]
						}
					],
				}).with(asyncPlugin)
				.output(({ order }) => order)
				const interruptable = machine({ order: [] })
				return await interruptable
			}, [1,2,3], symbols)
		),
		D("Interrupts can be sent to a parent machine",
			E.equals(async () => {
				const interrupt = Symbol('My Interrupt')
				const countMachine = new S({
					initial: [
						{ num: 1 },
						{
							while: ({ num }) => num < 4,
							do: [
							   () => wait_time(50),
							   ({ sendParent, num }) => sendParent({ childEvent: num }, interrupt),
							   ({ num }) => ({ num: num + 1 })
							]
					   	},
					],
				}).with(asyncPlugin)
				const machine = new S({
					initial: [
						({ [Interrupt]: sendParent }) => ({ countMachine: countMachine({ sendParent }) }),
						'wait'
					],
					wait: [
						Wait,
						{
							if: ({ order }) => order.length < 3,
							then: 'wait',
							else: Return
						}
					],
					[interrupt]: [
						({ order, childEvent }) => ({ order: [...order,childEvent]})
					]
				}).with(asyncPlugin)
				.output(({ order }) => order)
				const interruptable = machine({ order: [] })
				return await interruptable
			}, [1,2,3], symbols)
		),
		
		D("Parents can wait for children to complete their interrupts",
			E.equals(async () => {
				const interrupt = Symbol('My Interrupt')
				const countMachine = new S({
					initial: [
						{ num: 1 },
						'wait'
					],
					wait: [
						Wait,
						'wait'
					],
					[interrupt]: [
						({ num }) => ({ lastNum: num, num: num+1 }),
						() => wait_time(10),
						({ lastNum }) => ({ [Return]: lastNum }),
					],
				}).with(asyncPlugin)
				const machine = new S({
					initial: [
						() => ({ countMachine: countMachine() }),
						{
							 while: ({ order }) => order.length < 3,
							 do: [
								() => wait_time(10),
								async ({ countMachine, order }) => ({ order: [ ...order, await countMachine.interrupt(interrupt) ] }),
							 ]
						}
					],
				}).with(asyncPlugin)
				.output(({ order }) => order)
				const interruptable = machine({ order: [] })
				return await interruptable
			}, [1,2,3], symbols)
		),
		D("Children can wait for parent interrupts to complete",
			E.equals(async () => {
				const interrupt = Symbol('My Interrupt')
				const countMachine = new S({
					initial: [
						{ num: 1, parOrder: [] },
						{
							while: ({ parOrder }) => parOrder.length < 3,
							do: [
							   () => wait_time(10),
							   async ({ sendParent, num, parOrder }) => ({ parOrder: await sendParent({ childEvent: num }, interrupt, ({ order }) => ({ [Return]: order })) }),
							   ({ num }) => ({ num: num + 1 })
							]
					   	},
					],
				}).with(asyncPlugin)
				const machine = new S({
					initial: [
						({ [Interrupt]: sendParent }) => ({ countMachine: countMachine({ sendParent }) }),
						'wait'
					],
					wait: [
						Wait,
						{
							if: ({ order }) => order.length < 3,
							then: 'wait',
							else: Return
						}
					],
					[interrupt]: [
						() => wait_time(10),
						({ order, childEvent }) => ({ order: [...order,childEvent]}),
						
					]
				}).with(asyncPlugin)
				.output(({ order }) => order)
				const interruptable = machine({ order: [] })
				return await interruptable
			}, [1,2,3], symbols)
		),


		D("Interrupts can be chained / nested",
			E.equals(() => {
				const interrupt1 = Symbol('My Interrupt 1')
				const interrupt2 = Symbol('My Interrupt 2')
				const machine = new S({
					initial: [
						interrupt1,
						({ order }) => ({
							order: [...order,'qua']
						})
					],
					[interrupt1]: [
						({ order }) => ({
							order: [...order,'uno']
						}),
						interrupt2,
						({ order }) => ({
							order: [...order,'tre']
						}),
					],
					[interrupt2]: ({ order }) => ({
						order: [...order,'dos']
					}),
				}).output(({ order }) => order)
				return machine({ order: [] })
			}, ['uno','dos','tre','qua'])
		),
		D("Interrupts can be executed from outside an async machine",
			E.equals(async () => {
				const interrupt = Symbol('My Interrupt')
				const machine = new S({
					initial: [
						() => wait_time(10),
						({ order }) => ({
							order: [...order,'uno']
						}),
						() => wait_time(10),
						({ order }) => ({
							order: [...order,'tre']
						}),
					],
					[interrupt]: ({ order }) => ({
						order: [...order,'dos']
					}),
				}).with(asyncPlugin)
				.output(({ order }) => order)
				const interruptable = machine({ order: [] })
				await wait_time(15)
				interruptable.interrupt(interrupt)
				return await interruptable
			}, ['uno','dos','tre'], symbols)
		),
		D("Complex interrupt will make a new interrupt process node",
			E.equals(async () => {
				const interrupt = Symbol('My Interrupt')
				const machine = new S({
					initial: [
						() => wait_time(10),
						({ order }) => ({
							order: [...order,'uno']
						}),
						() => wait_time(10),
						({ order }) => ({
							order: [...order,'tre']
						}),
					],
					[interrupt]: [
						() => wait_time(100),
						({ order }) => ({
							order: [...order,'dos']
						}),
					]
				}
				).with(asyncPlugin)
				.output(({ order }) => order)
				const interruptable = machine({ order: [] })
				await wait_time(15)
				interruptable.interrupt(
					{ order : ['one'] },
					interrupt,
				)
				return await interruptable
			}, ['one','dos','tre'])
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
						then: ({ stack }) => ({ [Return]: stack.join('_') }),
						else: 'nextBatch'
					},
					nextBatch: [
						(new S([
							({ result, input }) => ({ result: result * input }),
							({ input }) => ({ input: input-1 }),
							{
								if: ({ input }) => input > 1,
								then: 0
							},
						])
							.defaults({
								result: 1,
								input: 1,
							}))
							.input(({ realInput }) => ({ input: realInput, result: 1 }))
							.output(({ result }) => ({ result })),
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
					.output(({ result, [Return]: output = result }) => output)
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
						.until((state, runs) => Return in state || runs >= 1)
						.defaults({
							result: 1,
							input: 1,
							counter: 0,
						})
						.input(({ subState }) => ({
							...subState,
						}))
						.output(stepResult => {
							const { [Return]: subDone, ...subState } = stepResult
							return {
								subState, subDone: Return in stepResult
							}
						}),
						'final'
					],
					final: [
						{
							if: ({ subState, outputList }) => subState.result !== outputList[outputList.length-1],
							then: ({ outputList, subState }) => ({ outputList: [...outputList, subState.result]})
						},
						{
							if: ({ subDone }) => subDone,
							then: ({ outputList }) => ({ [Return]: outputList.join('_') }),
							else: 'cradle'
						}
					]
				})
					.defaults({
						input: 1,
						outputList: [],
						subState: {},
						subDone: false,
					}).output(({ result, [Return]: output = result }) => output)
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
					then: 0,
					else: ({ result }) => ({ [Return]: result })
				}
			])
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
					({ result, output2 }) => ({
						output2: result,
						result: result + output2
					}),
					'testEnd',
				],
				testEnd: [
					({ input }) => ({ input: input-1 }),
					{
						if: ({ input }) => input > 1,
						then: 'fib',
						else: ({ result }) => ({ [Return]: result })
					}
				]
			})
				.defaults({
					input: 1,
					result: 0,
					output2: 0,
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
					({ result }) => ({ [Return]: result.join('_') })
				])
					.defaults( {
						input: 0,
						result: []
					})
					.output(({ result, [Return]: output = result }) => output)
					.with(parallelPlugin)
				return instance({
					input: 10 
				})
			}, '9_7')
		),
	),
	D('Events (Async Interrupts)',
		D('Fibonacci numbers (events - delay between events)',
			E.is(async () => {
				const nextNumber = Symbol('Next Number')
				const getResult = Symbol('Get Result')
				const kill = Symbol('Kill')
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
						({ result, output2 }) => ({
							output2: result,
							result: result + output2
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
					waitForEvents: [
						Wait,
						{
							if: state => kill in state,
							then: Return
						},
						{
							if: ({ input }) => input > 0,
							then: 'fibb'
						},
						'waitForEvents'
					],
					[getResult]: ({ result, emit }) => emit(result),
					[nextNumber]: ({ input }) => ({ input: input+1 }),
					[kill]: null,
				})
					.defaults({
						input: 1,
						result: 0,
						output2: 0,
					})
					.with(asyncPlugin)
				const handler = (event) => {
					outputs.push(event)
				}
				const runningInstance = instance({ input:12, emit: handler })
				let outputs = []
				await wait_time(5)
				await runningInstance.interrupt(getResult)
				await runningInstance.interrupt(nextNumber)
				await wait_time(1)
				await runningInstance.interrupt(getResult)
				await runningInstance.interrupt(getResult)
				await runningInstance.interrupt(nextNumber)
				await wait_time(1)
				await runningInstance.interrupt(getResult)
				await runningInstance.interrupt(kill)
				await runningInstance
				return outputs.join('_')
			}, '144_233_233_377')
		),
		D('Fibonacci numbers (events - wait for each event)',
			E.is(async () => {
				const nextNumber = Symbol('Next Number')
				const getResult = Symbol('Get Result')
				const kill = Symbol('Kill')
				const instance = new S({
					initial: [
						{
							if: ({ result }) => result === 0,
							then: () => ({ result: 1 }),
						},
						'waitForEvents'
					],
					fibb: [
						({ result, output2 }) => ({
							output2: result,
							result: result + output2
						}),
						'testEnd',
					],
					testEnd: [
						({ input }) => ({ input: input-1 }),
						{
							if: ({ input }) => input > 1,
							then: 'fibb',
							else: Return,
						}
					],
					waitForEvents: [
						Wait,
						{
							if: state => kill in state,
							then: Return
						},
						'waitForEvents'
					],
					[getResult]: ({ result, emit }) => emit(result),
					[nextNumber]: [({ input }) => ({ input: input+1 }),'fibb'],
					[kill]: null,
				})
					.defaults({
						input: 1,
						result: 0,
						output2: 0,
					})
					.with(asyncPlugin)
				const handler = (event) => {
					outputs.push(event)
				}
				const runningInstance = instance({ input:11, emit: handler })
				let outputs = []
				await wait_time(5)
				await runningInstance.interrupt(nextNumber)
				await runningInstance.interrupt(getResult)
				await runningInstance.interrupt(nextNumber)
				await runningInstance.interrupt(getResult)
				await runningInstance.interrupt(getResult)
				await runningInstance.interrupt(nextNumber)
				await runningInstance.interrupt(getResult)
				await runningInstance.interrupt(kill)
				await runningInstance
				return outputs.join('_')
			}, '144_233_233_377')
		),
		D('Fibonacci numbers (events - no wait)',
			E.is(async () => {
				const nextNumber = Symbol('Next Number')
				const getResult = Symbol('Get Result')
				const kill = Symbol('Kill')
				const instance = new S({
					initial: [
						{
							if: ({ result }) => result === 0,
							then: () => ({ result: 1 }),
						},
						'waitForEvents'
					],
					fibb: [
						({ result, output2 }) => ({
							output2: result,
							result: result + output2
						}),
						'testEnd',
					],
					testEnd: [
						({ input }) => ({ input: input-1 }),
						{
							if: ({ input }) => input > 1,
							then: 'fibb',
							else: Return,
						}
					],
					waitForEvents: [
						Wait,
						{
							if: state => kill in state,
							then: Return
						},
						'waitForEvents'
					],
					[getResult]: ({ result, emit }) => emit(result),
					[nextNumber]: [({ input }) => ({ input: input+1 }),'fibb'],
					[kill]: null,
				})
					.defaults({
						input: 1,
						result: 0,
						output2: 0,
					})
					.with(asyncPlugin)
				const handler = (event) => {
					outputs.push(event)
				}
				const runningInstance = instance({ input:11, emit: handler })
				let outputs = []
				await wait_time(5)
				runningInstance.interrupt(nextNumber)
				runningInstance.interrupt(getResult)
				runningInstance.interrupt(nextNumber)
				runningInstance.interrupt(getResult)
				runningInstance.interrupt(getResult)
				runningInstance.interrupt(nextNumber)
				runningInstance.interrupt(getResult)
				runningInstance.interrupt(kill)
				await runningInstance
				return outputs.join('_')
			}, '144_233_233_377')
		),
	),
),
)

export default description
