import D, { E, JS, TS, CS } from './d/index.js'
import S, { clone_object, N, normalise_function, StateReferenceError, StateTypeError, unique_list_strings, wait_time, get_path_object, deep_merge_object, NodeReferenceError, MaxIterationsError } from './index.js'
import * as testModule from './index.js'
import { list_path_object } from './index.js'
import { get_closest_path } from './index.js'
import { named } from './index.js'
import { inc } from './index.js'
import { or } from './index.js'
import { forIn } from './index.js'
import { SuperSmallStateMachineReferenceError } from './index.js'
import { NodeTypeError } from './index.js'
import { PathReferenceError } from './index.js'
import { SuperSmallStateMachineTypeError } from './index.js'
import { SuperSmallStateMachineError } from './index.js'
import { not } from './index.js'
import { and } from './index.js'
import { ident } from './index.js'
import { name } from './index.js'
import { shallow_merge_object } from './index.js'
import { update_path_object } from './index.js'
import { set_path_object } from './index.js'
import describedPlugin, { a, c, t } from './plugin/described.js'
import eventsPlugin, { emit } from './plugin/events.js'
import parallelPlugin, { parallel } from './plugin/parallel.js'

const symbols = {
	'S.Path': S.Path,
	'S.Trace': S.Trace,
	'S.Changes': S.Changes,
	'S.Return': S.Return,
	'S.StrictTypes': S.StrictTypes,
}
const testSymbol = Symbol()

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
*/
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
		JS("export const unique_list_strings = (list, getId = ident) => Object.values(Object.fromEntries(list.map(item=>[getId(item),item])));"),
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
			JS("return Object.fromEntries(allKeys.map(key => [ key, key in override ? deep_merge_object(base[key], override[key]) : base[key] ]));"),
			TS("return Object.fromEntries(allKeys.map(key => [ key, key in override ? deep_merge_object((base as Record<string,unknown>)[key], (override as Record<string,unknown>)[key]) : (base as Record<string,unknown>)[key] ])) as T;"),
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
		TS('export const shallow_merge_object = <T extends unknown = unknown>(a: T, ...objects: Array<Partial<T>>): T => Object.fromEntries(([] as Array<[string, unknown]>).concat(...[a,...objects].map(object => Object.entries(object)))) as T'),
		JS('export const shallow_merge_object = (...objects) => Object.fromEntries([].concat(...objects.map(object => Object.entries(object))))')
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
					({ result }) => ({ [S.Return]: result }) 
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
		D('Passing a state, instance, data, and/or path with make those properties available in the error',
			E.equals(() => {
				return new SuperSmallStateMachineError('', {
					instance: 'something',
					path: 'something else',
					state: 'my state',
					data: 'special data'
				})
			}, {
				instance: 'something',
				path: 'something else',
				state: 'my state',
				data: 'special data'
			})
		),
		JS("export class SuperSmallStateMachineError extends Error {"),
		TS(`export class SuperSmallStateMachineError${commonGenericDefinition} extends Error {`),
		D('Declare contextual properties on the class',
			JS("instance; state; data; path;"),
			TS(`public instance?: Partial<S${commonGenericArguments}>`),
			TS("public state?: SystemState<State, Output>"),
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
D('Node NodeTypes',
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
	D('While Node',
		JS("WH: 'while',"),
		TS("WH = 'while',")
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
	D("`'while'` used by While Node",
		JS("WH: 'while',"),
		TS("WH = 'while',")
	),
	D("`'do'` used by While Node",
		JS("DO: 'do',"),
		TS("DO = 'do',")
	),
	CS("}"),
),
D('Node Definitions',
	'Extends the Map class.',
	D('This class is exported by the library as `{ NS }`',
		E.exports('NS', testModule, './index.js'),
	),
	JS("export class NS extends Map {"),
	TS(`export class NS${commonGenericDefinition} extends Map<string | symbol, typeof N> {`),
	D('Takes in a list of nodes and acts as a collection-object for them',
		JS("constructor(...nodes) { super(nodes.flat(Infinity).map(node => [node.type,node])) }"),
		TS("constructor(...nodes: Array<typeof N>) { super(nodes.flat(Infinity).map(node => [node.type,node])) }")
	),
	D('Provides a typeof method that checks the given `object` against the node definitions and returns the type of the node.',
		JS("typeof(object, objectType = typeof object, isAction = false) {"),
		TS("typeof(object: unknown, objectType: (typeof object) = typeof object, isAction: boolean = false): false | string | symbol {"),
		D('Search from last to first to allow easy overriding',
			'Newer types override older types',
			JS("const foundType = [...this.values()].findLast(current => current.typeof(object, objectType, isAction))"),
			TS("const foundType = [...this.values()].reverse().find(current => current.typeof(object, objectType, isAction))")
		),
		D('Return the name of the type if the type is found, otherwise return false',
			CS("return foundType ? foundType.type : false"),
		),
		CS("}"),
	),
	CS("}"),
),
D('Node Definition',
	D('This class is exported by the library as `{ N }`',
		E.exports('N', testModule, './index.js'),
	),
	CS("export class N {"),
	D('The type will deafault to "Unnamed node", but will be a unique symbol each time',
		JS("static type = Symbol('Unnamed node')"),
		TS("static type: string | symbol = Symbol('Unnamed node')"),
	),
	D('The typeof method will return false by default.',
		JS("static typeof = () => false;"),
		TS("static typeof<SelfType extends unknown = never>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType { return false };"),
	),
	D('The execute method will return the node as an action by default.',
		JS("static execute = ident;"),
		TS(`static execute<${commonGenericDefinitionInner}SelfType extends unknown = never,>(this: Instance${commonGenericArguments}, node: SelfType, state: SystemState<State, Output>): Action | Promise<Action> { return node as unknown as Action }`)
	),
	D('The proceed method will return undefined by default.',
		JS("static proceed = () => undefined;"),
		TS(`static proceed${commonGenericDefinition}(this: Instance${commonGenericArguments}, path: Path, state: SystemState<State, Output>, originalPath: Path): undefined | null | Path { return undefined }`)
	),
	D('The perform method will proceed or exit by default.',
		JS(`static perform(action, state) {
			const path = S._proceed(this, state)
			return path ? { ...state, [S.Path]: path } : { ...state, [S.Return]: undefined }
		}`),
		TS(`static perform<${commonGenericDefinitionInner}SelfType extends unknown = never,>(this: Instance${commonGenericArguments}, action: SelfType, state: SystemState<State, Output>): SystemState<State, Output> | Promise< SystemState<State, Output>> {
		const path = S._proceed(this, state)
		return path ? { ...state, [S.Path]: path } : { ...state, [S.Return]: undefined }
	}`)
	),
	D('The traverse method will return the node by default.',
		JS("static traverse = ident;"),
		TS(`static traverse<${commonGenericDefinitionInner}SelfType extends unknown = never,>(this: Instance${commonGenericArguments}, node: SelfType, path: Path, iterate: ((path: Path) => SelfType)): SelfType { return node }`)
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
	[S.Path]: Path
	[S.Trace]: Array<Path>
	[S.Changes]: Partial<State>
	[S.Return]?: Output | undefined
}
export type InputSystemState<State extends InitialState = InitialState, Output extends unknown = undefined> = State & Partial<Pick<SystemState<State, Output>, typeof S.Path | typeof S.Return | typeof S.Trace>>

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
	strict: boolean | typeof S.StrictTypes,
	override: null | ((...args: Input) => Output),
	adapt: Array<(process: Process) => Process>,
	before: Array<(state: SystemState<State, Output>) => SystemState<State, Output>>,
	after: Array<(state: SystemState<State, Output>) => SystemState<State, Output>>,
	input: (...input: Input) => Partial<InputSystemState<State, Output>>,
	output: (state: SystemState<State, Output>) => Output,
	nodes: NS${commonGenericArguments},
	trace: boolean,
	deep: boolean,
	async: boolean,
	pause: (this: Instance${commonGenericArguments}, state: SystemState<State, Output>, runs: number) => false | Promise<any>
}`)
),

D('Default Nodes',
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
		D('This definition is exported by the library as `{ Changes }`',
			E.exports('Changes', testModule, './index.js'),
		),
		TS("export type ChangesType<State extends InitialState = InitialState> = Partial<State>"),
		CS("export class Changes extends N {"),
		D('Use the `NodeTypes.CH` (changes) value as the type.',
			CS("static type = NodeTypes.CH")
		),
		D('Any object not caught by other conditions should qualify as a state change.',
			JS("static typeof(object, objectType) { return Boolean(object && objectType === 'object') }"),
			TS("static typeof<SelfType = ChangesType>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType { return Boolean(object && objectType === 'object') }")
		),
		D('Apply the changes to the state and step forward to the next node',
			JS("static perform(action, state) { return N.perform.call(this, action, S._changes(this, state, action)) }"),
			TS(`static perform<${commonGenericDefinitionInner}SelfType = ChangesType<State>,>(this: Instance${commonGenericArguments}, action: SelfType, state: SystemState<State, Output>): SystemState<State, Output> | Promise< SystemState<State, Output>> { return N.perform.call(this as any, action, S._changes(this, state, action as ChangesType<State>)) as SystemState<State, Output> }`),
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
		D('This definition is exported by the library as `{ Sequence }`',
			E.exports('Sequence', testModule, './index.js'),
		),
		TS("export type SequenceType<State extends InitialState = InitialState, Output extends unknown = undefined, Action extends unknown = ActionType<State, Output>> = Array<ProcessType<State, Output, Action>>"),
		CS("export class Sequence extends N {"),
		D('Use the `NodeTypes.SQ` (sequence) value as the type.',
			CS("static type = NodeTypes.SQ")
		),
		D('Proceed by running the next node in the sequence',
			JS("static proceed(path, state, originalPath) {"),
			TS(`static proceed${commonGenericDefinition}(this: Instance${commonGenericArguments}, path: Path, state: SystemState<State, Output>, originalPath: Path): undefined | null | Path {`),
			D('Get the sequence at the path',
				JS("const parNode = get_path_object(this.process, path)"),
				TS("const parNode = get_path_object<SequenceType<State, Output, Action>>(this.process, path)!"),
			),
			D('Get the current index in this sequence from the path',
				JS("const childItem = originalPath[path.length]"),
				TS("const childItem = originalPath[path.length] as number"),
			),
			D('Increment the index, unless the end has been reached',
				CS("if (parNode && childItem+1 < parNode.length) return [ ...path, childItem+1 ]"),
			),
			CS("}"),
		),
		D('A sequence is an array. A sequence cannot be an action, that will be interpreted as an absolute-directive.',
			JS("static typeof(object, objectType, isAction) { return ((!isAction) && objectType === 'object' && Array.isArray(object)) }"),
			TS("static typeof<SelfType = SequenceType>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType { return ((!isAction) && objectType === 'object' && Array.isArray(object)) }")
		),
		D('Execute a sequence by directing to the first node (so long as it has nodes)',
			JS("static execute(node, state) { return node.length ? [ ...state[S.Path], 0 ] : null }"),
			TS(`static execute<${commonGenericDefinitionInner}SelfType = SequenceType<State, Output, Action>,>(this: Instance${commonGenericArguments}, node: SelfType, state: SystemState<State, Output>): Action | Promise<Action> { return ((node as SequenceType<State, Output, Action>).length ? [ ...state[S.Path], 0 ] : null) as Action }`),
		),
		D('Traverse a sequence by iterating through each node in the array.',
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
		D('A function can return a directive',
			E.is(() => {
				const instance = new S([
					{ result: 'first' },
					() => 4,
					{ result: 'skipped' },
					S.Return,
					{ result: 'second' },
				]).output(({ result }) => result)
				return instance({ result: 'start' })
			}, 'second'),
		),
		D('A function can return a return statement',
			E.is(() => {
				const instance = new S(() => ({ [S.Return]: 'changed' }))
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

		D('This definition is exported by the library as `{ FunctionN }`',
			E.exports('FunctionN', testModule, './index.js'),
		),
		TS("export type FunctionType<State extends InitialState = InitialState, Output extends unknown = undefined, Action extends unknown = ActionType<State, Output>> = (state: SystemState<State, Output>) => Action | Promise<Action>"),
		CS("export class FunctionN extends N {"),
		D('Use the `NodeTypes.FN` (function) value as the type.',
			CS("static type = NodeTypes.FN")
		),
		D('A function is a JS function. A function cannot be an action.',
			JS("static typeof(object, objectType, isAction) { return (!isAction) && objectType === 'function' }"),
			TS("static typeof<SelfType = FunctionType>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType { return (!isAction) && objectType === 'function' }")
		),
		D('Exectute a functon by running it, passing in the state.',
			JS("static execute(node, state) { return node(state) }"),
			TS(`static execute<${commonGenericDefinitionInner}SelfType = FunctionType<State, Output, Action>,>(this: Instance${commonGenericArguments}, node: SelfType, state: SystemState<State, Output>): Action | Promise<Action> { return (node as FunctionType<State, Output, Action>)(state) }`)
		),
		CS("}"),
	),
	D('Undefined Node',
		D('This definition is exported by the library as `{ Undefined }`',
			E.exports('Undefined', testModule, './index.js'),
		),
		CS("export class Undefined extends N {"),
		D('Use the `NodeTypes.UN` (undefined) value as the type.',
			CS("static type = NodeTypes.UN")
		),
		D('Undefined is the `undefined` keyword.',
			JS("static typeof(object, objectType) { return objectType === 'undefined' }"),
			TS("static typeof<SelfType = undefined>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType { return objectType === 'undefined' }")
		),
		D('Un undefined node cannot be executed, throw an error to help catch incorrect configuration.',
			E.error(() => {
				const instance = new S([undefined])
				return instance()
			}, NodeReferenceError),
			JS("static execute(node, state) { throw new NodeReferenceError(`There is nothing to execute at path [ ${state[S.Path].map(key => key.toString()).join(', ')} ]`, { instance: this, state, path: state[S.Path], data: { node } }) }"),
			TS(`static execute<${commonGenericDefinitionInner}SelfType = undefined>(this: Instance${commonGenericArguments}, node: SelfType, state: SystemState<State, Output>): Action | Promise<Action> { throw new NodeReferenceError(\`There is nothing to execute at path [ \${state[S.Path].map(key => key.toString()).join(', ')} ]\`, { instance: this, state, path: state[S.Path], data: { node } }) }`)
		),
		D('When used as an action, undefined only moves to the next node.',
			E.equals(() => {
				const instance = new S([
					() => undefined,
					{ [S.Return]: 'second' }
				])
				return instance()
			}, 'second'),
		),
		CS("}"),
	),
	D('Empty Node',
		D('This definition is exported by the library as `{ Empty }`',
			E.exports('Empty', testModule, './index.js'),
		),
		CS("export class Empty extends N {"),
		D('Use the `NodeTypes.EM` (empty) value as the type.',
			CS("static type = NodeTypes.EM")
		),
		D('Empty is the `null` keyword.',
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
		TS(`export interface ConditionType<
			State extends InitialState = InitialState,
			Output extends unknown = undefined,
			Action extends unknown = ActionType<State, Output>,
		> {
			[KeyWords.IF]: (state: SystemState<State, Output>) => boolean,
			[KeyWords.TN]?: ProcessType<State, Output, Action>
			[KeyWords.EL]?: ProcessType<State, Output, Action>
		}`),
		D('This definition is exported by the library as `{ Condition }`',
			E.exports('Condition', testModule, './index.js'),
		),
		CS("export class Condition extends N {"),
		D('Use the `NodeTypes.CD` (condition) value as the type.',
			CS("static type = NodeTypes.CD")
		),
		D("A condition is an object with the `'if'` property. A condition cannot be an action.",
			JS("static typeof(object, objectType, isAction) { return Boolean((!isAction) && object && objectType === 'object' && (KeyWords.IF in object)) }"),
			TS("static typeof<SelfType = ConditionType>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType { return Boolean((!isAction) && object && objectType === 'object' && (KeyWords.IF in (object as object))) }")
		),
		D("Execute a condition by evaluating the `'if'` property and directing to the `'then'` or `'else'` clauses",
			JS("static execute(node, state) {"),
			TS(`static execute<${commonGenericDefinitionInner}SelfType = ConditionType<State, Output, Action>,>(this: Instance${commonGenericArguments}, node: SelfType, state: SystemState<State, Output>): Action | Promise<Action> {`),
			D("Evaluate the `'if'` property as a function that depends on the state.",
				JS("if (normalise_function(node[KeyWords.IF])(state))"),
				TS(`if (normalise_function((node as ConditionType<State, Output, Action>)[KeyWords.IF])(state))`)
			),
			D("If truthy, direct to the `'then'` clause if it exists",
				E.is(() => {
					const instance = new S({
						if: ({ input }) => input === 'the same',
						then: { [S.Return]: 'truthy' },
						else: { [S.Return]: 'falsey' },
					})
					return instance({ input: 'the same' })
				}, 'truthy'),
				JS("return KeyWords.TN in node ? [ ...state[S.Path], KeyWords.TN ] : null"),
				TS(`return (KeyWords.TN in (node as ConditionType<State, Output, Action>) ? [ ...state[S.Path], KeyWords.TN ] : null) as Action`)
			),
			D("Otherwise, direct to the `'else'` clause if it exists",
				E.is(() => {
					const instance = new S({
						if: ({ input }) => input === 'the same',
						then: { [S.Return]: 'truthy' },
						else: { [S.Return]: 'falsey' },
					})
					return instance({ input: 'NOT the same' })
				}, 'falsey'),
				JS("return KeyWords.EL in node ? [ ...state[S.Path], KeyWords.EL ] : null"),
				TS(`return (KeyWords.EL in (node as ConditionType<State, Output, Action>) ? [ ...state[S.Path], KeyWords.EL ] : null) as Action`)
			),
			CS("}"),
		),
		D('Traverse a condition by iterating on the then and else clauses.',
			JS("static traverse(node, path, iterate) { return {"),
			TS(`static traverse<${commonGenericDefinitionInner}SelfType = ConditionType<State, Output, Action>,>(this: Instance${commonGenericArguments}, node: SelfType, path: Path, iterate: ((path: Path) => SelfType)): SelfType { return {`),
			D('Copy over the original properties to preserve any custom symbols.',
				CS("...node,"),
			),
			D("Iterate on the `'then'` clause if it exists",
				JS("...(KeyWords.TN in node ? { [KeyWords.TN]: iterate([...path,KeyWords.TN]) } : {}),"),
				TS(`...(KeyWords.TN in (node as ConditionType<State, Output, Action>) ? { [KeyWords.TN]: iterate([...path,KeyWords.TN]) } : {}),`)
			),
			D("Iterate on the `'else'` clause if it exists",
				JS("...(KeyWords.EL in node ? { [KeyWords.EL]: iterate([...path,KeyWords.EL]) } : {})"),
				TS(`...(KeyWords.EL in (node as ConditionType<State, Output, Action>) ? { [KeyWords.EL]: iterate([...path,KeyWords.EL]) } : {})`)
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
					start: { [S.Return]: 'first' },
					two: { [S.Return]: 'second' },
					default: { [S.Return]: 'none' },
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
		D('This definition is exported by the library as `{ Switch }`',
			E.exports('Switch', testModule, './index.js'),
		),
		TS(`export interface SwitchType<
			State extends InitialState = InitialState,
			Output extends unknown = undefined,
			Action extends unknown = ActionType<State, Output>,
		> {
			[KeyWords.SW]: (state: SystemState<State, Output>) => string | number,
			[KeyWords.CS]: Record<string | number, ProcessType<State, Output, Action>>
		}`),
		CS("export class Switch extends N {"),
		D('Use the `NodeTypes.SW` (switch) value as the type.',
			CS("static type = NodeTypes.SW")
		),
		D("A switch node is an object with the `'switch'` property.",
			JS("static typeof(object, objectType, isAction) { return Boolean((!isAction) && object && objectType === 'object' && (KeyWords.SW in object)) }"),
			TS("static typeof<SelfType = SwitchType>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType { return Boolean((!isAction) && object && objectType === 'object' && (KeyWords.SW in (object as object))) }")
		),
		D("Execute a switch by evaluating the `'switch'` property and directing to the approprtate `'case'` clause.",
			JS("static execute(node, state) {"),
			TS(`static execute<${commonGenericDefinitionInner}SelfType = SwitchType<State, Output, Action>,>(this: Instance${commonGenericArguments}, node: SelfType, state: SystemState<State, Output>): Action | Promise<Action> {`),
			D("Evaluate the `'switch'` property as a function that returns a key.",
				JS("const key = normalise_function(node[KeyWords.SW])(state)"),
				TS(`const key = normalise_function((node as SwitchType<State, Output, Action>)[KeyWords.SW])(state)`)
			),
			D("If the key exists in the `'case'` caluses, use the key, otherwise use the `'default'` clause",
				JS("const fallbackKey = (key in node[KeyWords.CS]) ? key : KeyWords.DF"),
				TS(`const fallbackKey = (key in (node as SwitchType<State, Output, Action>)[KeyWords.CS]) ? key : KeyWords.DF`)
			),
			D("Check again if the key exists (`'default'` clause may not be defined), if it does, redirect to the case, otherwise do nothing.",
				JS("return (fallbackKey in node[KeyWords.CS]) ? [ ...state[S.Path], KeyWords.CS, fallbackKey ] : null"),
				TS(`return ((fallbackKey in (node as SwitchType<State, Output, Action>)[KeyWords.CS]) ? [ ...state[S.Path], KeyWords.CS, fallbackKey ] : null) as Action`)
			),
			CS("}"),
		),
		D("Traverse a switch by iterating over the `'case'` clauses",
			JS("static traverse(node, path, iterate) { return { ...node, [KeyWords.CS]: Object.fromEntries(Object.keys(node[KeyWords.CS]).map(key => [ key, iterate([...path,KeyWords.CS,key]) ])), } }"),
			TS(`static traverse<${commonGenericDefinitionInner}SelfType = SwitchType<State, Output, Action>,>(this: Instance${commonGenericArguments}, node: SelfType, path: Path, iterate: ((path: Path) => SelfType)): SelfType { return { ...node, [KeyWords.CS]: Object.fromEntries(Object.keys((node as SwitchType<State, Output, Action>)[KeyWords.CS]).map(key => [ key, iterate([...path,KeyWords.CS,key]) ])), } }`),
		),
		CS("}"),
	),
	D('While Node',
		D('This definition is exported by the library as `{ While }`',
			E.exports('While', testModule, './index.js'),
		),
		TS(`export interface WhileType<
			State extends InitialState = InitialState,
			Output extends unknown = undefined,
			Action extends unknown = ActionType<State, Output>,
		> {
			[KeyWords.WH]: (state: SystemState<State, Output>) => boolean,
			[KeyWords.DO]: ProcessType<State, Output, Action>
		}`),
		CS("export class While extends N {"),
		D('Use the `NodeTypes.WH` (switch) value as the type.',
			CS("static type = NodeTypes.WH")
		),
		D("A while node is an object with the `'while'` property.",
			JS("static typeof(object, objectType, isAction) { return Boolean((!isAction) && object && objectType === 'object' && (KeyWords.WH in object)) }"),
			TS("static typeof<SelfType = WhileType>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType { return Boolean((!isAction) && object && objectType === 'object' && (KeyWords.WH in (object as object))) }")
		),
		D("Execute a while by evaluating the `'while'` property and directing to the `'do'` clause if `true`.",
			JS("static execute(node, state) {"),
			TS(`static execute<${commonGenericDefinitionInner}SelfType = WhileType<State, Output, Action>,>(this: Instance${commonGenericArguments}, node: SelfType, state: SystemState<State, Output>): Action | Promise<Action> {`),
			D("Evaluate the `'while'` property as a function that returns a boolean.",
				"If the condition is false, exit the while loop.",
				JS("if (!((KeyWords.DO in node) && normalise_function(node[KeyWords.WH])(state))) return null"),
				TS(`if (!((KeyWords.DO in (node as WhileType<State, Output, Action>)) && normalise_function((node as WhileType<State, Output, Action>)[KeyWords.WH])(state))) return null as Action`),
				"If `true`, execute the `'do'` clause",
				JS("return [ ...state[S.Path], KeyWords.DO ]"),
				TS(`return [ ...state[S.Path], KeyWords.DO ] as Action`)
			),
			CS("}"),
		),
		D("Proceed by re-entering the while loop.",
			JS("static proceed(path) { return path }"),
			TS(`static proceed${commonGenericDefinition}(this: Instance${commonGenericArguments}, path: Path, state: SystemState<State, Output>, originalPath: Path): undefined | null | Path { return path }`),
		),
		D("Traverse a while by iterating over the `'do'` clause",
			JS("static traverse(node, path, iterate) { return { ...node, ...(KeyWords.DO in node ? { [KeyWords.DO]: iterate([...path,KeyWords.DO]) } : {}), } }"),
			TS(`static traverse<${commonGenericDefinitionInner}SelfType = WhileType<State, Output, Action>,>(this: Instance${commonGenericArguments}, node: SelfType, path: Path, iterate: ((path: Path) => SelfType)): SelfType { return { ...node, ...(KeyWords.DO in (node as object) ? { [KeyWords.DO]: iterate([...path,KeyWords.DO]) } : {}), } }`),
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
		D('This definition is exported by the library as `{ Machine }`',
			E.exports('Machine', testModule, './index.js'),
		),
		TS(`export interface MachineType<
			State extends InitialState = InitialState,
			Output extends unknown = undefined,
			Action extends unknown = ActionType<State, Output>,
		> {
			[KeyWords.IT]: ProcessType<State, Output, Action>
			[key: string | number | symbol]: ProcessType<State, Output, Action>
		}`),
		CS("export class Machine extends N {"),
		D('Use the `NodeTypes.MC` (machine) value as the type.',
			CS("static type = NodeTypes.MC")
		),
		D("A machine is an object with the `'initial'` property. A machine cannot be used as an action.",
			JS("static typeof(object, objectType, isAction) { return Boolean((!isAction) && object && objectType === 'object' && (KeyWords.IT in object)) }"),
			TS("static typeof<SelfType = MachineType>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType { return Boolean((!isAction) && object && objectType === 'object' && (KeyWords.IT in (object as object))) }")
		),
		D("Execute a machine by directing to the `'initial'` stages.",
			JS("static execute(node, state) { return [ ...state[S.Path], KeyWords.IT ] }"),
			TS(`static execute<${commonGenericDefinitionInner}SelfType = MachineType<State, Output, Action>,>(this: Instance${commonGenericArguments}, node: SelfType, state: SystemState<State, Output>): Action | Promise<Action> { return [ ...state[S.Path], KeyWords.IT ] as Action }`),
		),
		D('Traverse a machine by iterating over all the stages',
			JS("static traverse(node, path, iterate) { return { ...node, ...Object.fromEntries(Object.keys(node).map(key => [ key, iterate([...path,key]) ])) } }"),
			TS(`static traverse<${commonGenericDefinitionInner}SelfType = MachineType<State, Output, Action>,>(this: Instance${commonGenericArguments}, node: SelfType, path: Path, iterate: ((path: Path) => SelfType)): SelfType { return { ...node, ...Object.fromEntries(Object.keys(node as object).map(key => [ key, iterate([...path,key]) ])) } }`),
		),
		CS("}"),
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
				}).output(({ result }) => result)
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
				}).output(({ result }) => result)
				return instance({ result: 'start' })
			}, 'first'),
		),
		D('This definition is exported by the library as `{ Directive }`',
			E.exports('Directive', testModule, './index.js'),
		),
		TS("export type DirectiveType = { [S.Path]: AbsoluteDirectiveType | SequenceDirectiveType | MachineDirectiveType }"),
		CS("export class Directive extends N {"),
		D('Use the `NodeTypes.DR` (directive) value as the type.',
			CS("static type = NodeTypes.DR")
		),
		D('A directive is an object with the `S.Path` property.',
			JS("static typeof(object, objectType, isAction) { return Boolean(object && objectType === 'object' && (S.Path in object)) }"),
			TS("static typeof<SelfType = DirectiveType>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType  { return Boolean(object && objectType === 'object' && (S.Path in (object as object))) }")
		),
		D('A directive is performed by performing the value of the `S.Path` property to allow for using absolute or relative directives',
			JS("static perform(action, state) { return S._perform(this, state, action[S.Path]) }"),
			TS(`static perform<${commonGenericDefinitionInner}SelfType = DirectiveType,>(this: Instance${commonGenericArguments}, action: SelfType, state: SystemState<State, Output>): SystemState<State, Output> | Promise< SystemState<State, Output>> { return S._perform(this, state, (action as DirectiveType)[S.Path] as Action) }`)
		),
		CS("}"),
	),
	D('Sequence Directive Node',
		D('Numbers indicate a goto for a sequence. It is not recommended to use this as it may be unclear, but it must be possible, and should be considered system-only.',
			E.is(() => {
				const instance = new S([
					2,
					{ [S.Return]: 'skipped' },
					{ [S.Return]: 'second' },
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
					{ [S.Return]: 'skipped' },
					{ [S.Return]: 'second' },
				])
				return instance({ input: 'skip' })
			}, 'second'),
		),
		D('This definition is exported by the library as `{ SequenceDirective }`',
			E.exports('SequenceDirective', testModule, './index.js'),
		),
		TS("export type SequenceDirectiveType = number"),
		CS("export class SequenceDirective extends Directive {"),
		D('Use the `NodeTypes.SD` (sequence-directive) value as the type.',
			CS("static type = NodeTypes.SD"),
		),
		D('A sequence directive is a number.',
			JS("static typeof(object, objectType, isAction) { return objectType === 'number' }"),
			TS("static typeof<SelfType = SequenceDirectiveType>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType { return objectType === 'number' }")
		),
		D('A sequence directive is performed by finding the last sequence and setting the index to the given value.',
			JS("static perform(action, state) {"),
			TS(`static perform<${commonGenericDefinitionInner}SelfType = SequenceDirectiveType,>(this: Instance${commonGenericArguments}, action: SelfType, state: SystemState<State, Output>): SystemState<State, Output> | Promise< SystemState<State, Output>> {`),
			D('Get the closest ancestor that is a sequence.',
				CS("const lastOf = S._closest(this, state[S.Path].slice(0,-1), NodeTypes.SQ)"),
			),
			D('If there is no such ancestor, throw a `PathReferenceError`',
				CS("if (!lastOf) throw new PathReferenceError(`A relative directive has been provided as a number (${String(action)}), but no sequence exists that this number could be an index of from path [ ${state[S.Path].map(key => key.toString()).join(', ')} ].`, { instance: this, state, path: state[S.Path], data: { action } })"),
			),
			D('Update the path to the parent>index',
				JS("return { ...state, [S.Path]: [...lastOf, action] }"),
				TS("return { ...state, [S.Path]: [...lastOf, action as SequenceDirectiveType] }"),
			),
			CS("}"),
		),
		CS("}"),
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
				}).output(({ result }) => result)
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
				}).output(({ result }) => result)
				return instance({ result: 'start' })
			}, 'second'),
		),
		D('This definition is exported by the library as `{ MachineDirective }`',
			E.exports('MachineDirective', testModule, './index.js'),
		),
		TS("export type MachineDirectiveType = string | symbol"),
		CS("export class MachineDirective extends Directive {"),
		D('Use the `NodeTypes.MD` (machine-directive) value as the type.',
			CS("static type = NodeTypes.MD")
		),
		D('A machine directive is a string or a symbol.',
			JS("static typeof(object, objectType, isAction) { return objectType === 'string' || objectType === 'symbol' }"),
			TS("static typeof<SelfType = MachineDirectiveType>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType { return objectType === 'string' || objectType === 'symbol' }")
		),
		D('A machine directive is performed by directing to the given stage.',
			JS("static perform(action, state) {"),
			TS(`static perform<${commonGenericDefinitionInner}SelfType = MachineDirectiveType,>(this: Instance${commonGenericArguments}, action: SelfType, state: SystemState<State, Output>): SystemState<State, Output> | Promise< SystemState<State, Output>> {`),
			D('Get the closest ancestor that is a machine.',
				CS("const lastOf = S._closest(this, state[S.Path].slice(0,-1), NodeTypes.MC)"),
			),
			D('If no machine ancestor is found, throw a `PathReferenceError`',
				CS("if (!lastOf) throw new PathReferenceError(`A relative directive has been provided as a ${typeof action} (${String(action)}), but no state machine exists that this ${typeof action} could be a state of from path [ ${state[S.Path].map(key => key.toString()).join(', ')} ].`, { instance: this, state, path: state[S.Path], data: { action } })"),
			),
			D('Update the path to parent>stage',
				JS("return { ...state, [S.Path]: [...lastOf, action] }"),
				TS("return { ...state, [S.Path]: [...lastOf, action as MachineDirectiveType] }"),
			),
			CS("}"),
		),
		CS("}"),
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
						({ result }) => ({ [S.Return]: result }),
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
						({ result }) => ({ [S.Return]: result }),
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
						({ result }) => ({ [S.Return]: result }),
					]
				})
				return instance({ result: 'start' })
			}, 'not skipped'),
		),
		D('This definition is exported by the library as `{ AbsoluteDirective }`',
			E.exports('AbsoluteDirective', testModule, './index.js'),
		),
		TS("export type AbsoluteDirectiveType = Path"),
		CS("export class AbsoluteDirective extends Directive {"),
		D('Use the `NodeTypes.AD` (absolute-directive) value as the type.',
			CS("static type = NodeTypes.AD")
		),
		D('An absolute directive is a list of strings, symbols, and numbers. It can only be used as an action as it would otherwise be interpreted as a sequence.',
			JS("static typeof(object, objectType, isAction) { return isAction && Array.isArray(object) }"),
			TS("static typeof<SelfType = AbsoluteDirectiveType>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType  { return isAction && Array.isArray(object) }")
		),
		D('An absolute directive is performed by setting `S.Path` to the path',
			JS("static perform(action, state) { return { ...state, [S.Path]: action } }"),
			TS(`static perform<${commonGenericDefinitionInner}SelfType = AbsoluteDirectiveType,>(this: Instance${commonGenericArguments}, action: SelfType, state: SystemState<State, Output>): SystemState<State, Output> | Promise< SystemState<State, Output>> { return { ...state, [S.Path]: action as AbsoluteDirectiveType } }`)
		),
		CS("}"),
	),
	D('Return Node',
		'Causes the entire process to terminate immediately and return, setting `S.Return` to `true` on the state.',
		D('If the symbol is used with a `.output` configuration, then it will return according to the given method.',
			E.is(() => {
				const instance = new S(S.Return)
					.output(({ result }) => result)
				return instance({ result: 'start' })
			}, 'start')
		),
		D('If the symbol is used on its own, then it will simply return `undefined`.',
			E.is(() => {
				const instance = new S(S.Return)
				return instance({ result: 'start' })
			}, undefined)
		),
		D('Using the return symbol as the key to an object will set the return property to that value before returning.',
			E.equals(() => {
				const instance = new S({ [S.Return]: 'custom' })
				return instance()
			}, 'custom'),
			E.equals(() => {
				const instance = new S({ [S.Return]: 'custom' })
				return instance.output(state => state)({ result: 'start' })
			}, { result: 'start', [S.Return]: 'custom' }, symbols),
		),
		D('This definition is exported by the library as `{ Return }`',
			E.exports('Return', testModule, './index.js'),
		),
		TS("export type ReturnObjectType<Output extends unknown = unknown> = { [S.Return]: Output }"),
		TS("export type ReturnType<Output extends unknown = unknown> = ReturnObjectType<Output> | typeof S.Return"),
		CS("export class Return extends N {"),
		D('Use the `NodeTypes.RT` (return) value as the type.',
			CS("static type = NodeTypes.RT")
		),
		D('A return node is the `S.Return` symbol itself, or an object with an `S.Return` property.',
			JS("static typeof(object, objectType) { return object === S.Return || Boolean(object && objectType === 'object' && (S.Return in object)) }"),
			TS("static typeof<SelfType = ReturnType>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType  { return object === S.Return || Boolean(object && objectType === 'object' && (S.Return in (object as object))) }")
		),
		D('Perform a return by setting the `S.Return` property on the state to the return value',
			JS("static perform(action, state) { return { ...state, [S.Return]: !action || action === S.Return ? undefined : action[S.Return], } }"),
			TS(`static perform<${commonGenericDefinitionInner}SelfType = ReturnType<Output>,>(this: Instance${commonGenericArguments}, action: SelfType, state: SystemState<State, Output>): SystemState<State, Output> | Promise< SystemState<State, Output>> { return { ...state, [S.Return]: !action || action === S.Return ? undefined : (action as unknown as ReturnObjectType<Output>)[S.Return] as Output, } }`),
		),
		CS("}"),
	),
	TS(`export type PathUnit = SequenceDirectiveType | MachineDirectiveType
export type Path = Array<PathUnit>

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
| DirectiveType | SequenceDirectiveType | MachineDirectiveType
| ReturnType<Output>
| ChangesType<State>
| null

export type ActionType<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
> = DirectiveType | AbsoluteDirectiveType | SequenceDirectiveType | MachineDirectiveType | ReturnType<Output>| ChangesType<State> | null | undefined | void
`),
),

D('Extensible Function',
	CS("export class ExtensibleFunction extends Function {"),
	D('Some prototype magic to make it work',
		JS("constructor(f) { super(); return Object.setPrototypeOf(f, new.target.prototype); };"),
		TS("constructor(f: Function) { super(); return Object.setPrototypeOf(f, new.target.prototype); };")
	),
	CS("}")
),
D('Core',
	D('Every instance must have a process and be callable.',
		TS(`export interface SuperSmallStateMachineCore${commonGenericDefinition} { process: Process; (...args: Input): Output; }`),
	),
	JS("export class SuperSmallStateMachineCore extends ExtensibleFunction {"),
	TS(`export abstract class SuperSmallStateMachineCore${commonGenericDefinition} extends ExtensibleFunction {`),
	D('Symbols',
		D('Return',
			'Use for intentionally exiting the entire process, can be used in an object to return a specific value',
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
		D('Trace',
			'Returned in the state when the trace flag is on, will contain every path that was executed during the run.',
			E.success(() => {
				return { [S.Trace]: [] }
			}),
			JS("static Trace       = Symbol('Super Small State Machine Trace')"),
			TS("public static readonly Trace = Symbol('Super Small State Machine Trace')"),
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
	D('Node NodeTypes',
		JS("static nodeTypes   = NodeTypes"),
		JS("static types       = NodeTypes"),
		TS("public static readonly nodeTypes:typeof NodeTypes = NodeTypes"),
		TS("public static readonly types:    typeof NodeTypes = NodeTypes")
	),
	D('All the defaults nodes together in one list.',
		CS("static nodes = [ Changes, Sequence, FunctionN, Undefined, Empty, Condition, Switch, While, Machine, Directive, AbsoluteDirective, MachineDirective, SequenceDirective, Return, ]"),
	),
	D('Config',
		JS("static config = {"),
		TS("public static readonly config: Config = {"),
		E.equals(() => {
			return S.config
		}, { async: false, deep: false, strict: false, trace: false, iterations: 10000, override: null, adapt: [], before: [], after: [], defaults: {} }),
		D('Initialise an empty state by default',
			CS("defaults: {},")
		),
		D('Input the initial state by default',
			CS("input: (state = {}) => state,"),
		),
		D('Return the `S.Return` property by default',
			CS("output:  state => state[S.Return],")
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
		D('Do not keep the stack trace by default',
			CS("trace: false,"),
		),
		D('Shallow merge changes by default',
			CS("deep: false,"),
		),
		D('Do not override the execution method by default',
			CS("override: null,"),
		),
		D('Use the provided nodes by default.',
			JS("nodes: new NS(...SuperSmallStateMachineCore.nodes),"),
			TS("nodes: new NS(...SuperSmallStateMachineCore.nodes as unknown as []),")
		),
		D('Initialise with an empty adapters list.',
			CS("adapt: [],"),
		),
		D('Initialise with an empty start adapters list.',
			CS("before: [],"),
		),
		D('Initialise with an empty end adapters list.',
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
						S.Return,
					]
				}
			])
			return S._closest(instance, [0, 'then', 1], 'sequence')
		}, [0, 'then']),
		JS("static _closest (instance, path = [], ...nodeTypes) {"),
		TS(`public static _closest${commonGenericDefinition}(instance: Instance${commonGenericArguments}, path: Path, ...nodeTypes: Array<string | symbol | Array<string | symbol>>): Path | null {`),
		D('Node types can be passed in as arrays of strings, or arrays of arrays of strings...',
			CS("const flatTypes = nodeTypes.flat(Infinity)"),
		),
		D('Use get_closest_path to find the closest path.',
			CS("return get_closest_path(instance.process, path, i => {"),
			D('Get the type of the node',
				CS("const nodeType = instance.config.nodes.typeof(i)"),
			),
			D('Pick this node if it matches any of the given types',
				CS("return Boolean(nodeType && flatTypes.includes(nodeType))"),
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
		TS(`public static _changes${commonGenericDefinition}(instance: Instance${commonGenericArguments}, state: SystemState<State, Output>, changes: Partial<State>): SystemState<State, Output> {`),
		D('If the strict state flag is truthy, perform state checking logic',
			'Go through each property in the changes and check they all already exist',
			CS("if (instance.config.strict && Object.entries(changes).some(([property]) => !(property in state)))"),
			D('Throw a StateReferenceError if a property is referenced that did not previosly exist.',
				CS("throw new StateReferenceError(`Only properties that exist on the initial context may be updated.\\nYou changed [ ${Object.keys(changes).filter(property => !(property in state)).map(key => key.toString()).join(', ')} ], which ${Object.keys(changes).filter(property => !(property in state)).length === 1 ? 'is' : 'are'} not in: [ ${Object.keys(state).map(key => key.toString()).join(', ')} ].\\nPath: [ ${state[S.Path].map(key => key.toString()).join(' / ')} ]`, { instance, state, path: state[S.Path], data: { changes } })"),
			),
		),
		D('If the strict state flag is set to the Strict Types Symbol, perform type checking logic.',
			'Go through each property and check the JS type is the same as the initial values.',
			CS("if (instance.config.strict === this.StrictTypes && Object.entries(changes).some(([property,value]) => typeof value !== typeof state[property]))"),
			D('Throw a StateTypeError if a property changes types.',
				CS("throw new StateTypeError(`Properties must have the same type as their initial value. ${Object.entries(changes).filter(([property,value]) => typeof value !== typeof state[property]).map(([property,value]) => `${typeof value} given for '${property}', should be ${typeof state[property]}`).join('. ')}.`, { instance, state, path: state[S.Path], data: { changes } })"),
			),
		),
		D('Collect all the changes in the changes object.',
			CS("const merge = instance.config.deep ? deep_merge_object : shallow_merge_object"),
			CS("const allChanges = merge(state[S.Changes] || {}, changes)"),
		),
		D('Return a new object',
			CS("return {"),
			D('Deep merge the current state with the new changes',
				CS("...state,"),
			),
			D('Deep merge the current state with the new changes',
				CS("...merge(state, allChanges),"),
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
		TS(`public static _proceed${commonGenericDefinition}(instance: Instance${commonGenericArguments}, state: SystemState<State, Output>, path: Path = state[S.Path] || []): Path | null {`),
		D('Return `null` (unsuccessful) if the root node is reached',
			CS("if (path.length === 0) return null"),
		),
		D('Get the next closest ancestor that can be proceeded',
			CS("const parPath = path.slice(0,-1)"),
		),
		D('Determine what type of node the ancestor is',
			CS("const parType = instance.config.nodes.typeof(get_path_object(instance.process, parPath))"),
		),
		D('If the node is unrecognised, throw a TypeEror',
			CS("if (!parType) throw new NodeTypeError(`Unknown node type: ${typeof get_path_object(instance.process, parPath)}${parType ? `, nodeType: ${String(parType)}` : ''} at [ ${parPath.map(key => key.toString()).join(', ')} ]`, { instance, state, path: parPath, data: { node: get_path_object(instance.process, parPath) } })"),
		),
		D('Call the `proceed` method of the ancestor node to get the next path.',
			JS("const proceedResult = instance.config.nodes.get(parType).proceed.call(instance, parPath, state, path)"),
			TS("const proceedResult = instance.config.nodes.get(parType)!.proceed.call(instance as any, parPath, state, path)"),
		),
		D('If there a next path, return it',
			CS("if (proceedResult !== undefined) return proceedResult"),
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
		TS(`public static _perform${commonGenericDefinition}(instance: Instance${commonGenericArguments}, state: SystemState<State, Output>, action: Action = null as Action): SystemState<State, Output> {`),
		D('Get the node type of the given `action`',
			CS("const nodeType = instance.config.nodes.typeof(action, typeof action, true)"),
		),
		D('Gets the node definition for the action',
			CS("if (!nodeType) throw new NodeTypeError(`Unknown action type: ${typeof action}${nodeType ? `, nodeType: ${String(nodeType)}` : ''} at [ ${(state[S.Path] || []).map(key => key.toString()).join(', ')} ]`, { instance, state, path: state[S.Path] || [], data: { action } })"),
		),
		D('Perform the action on the state',
			JS("return instance.config.nodes.get(nodeType).perform.call(instance, action, state)"),
			TS("return instance.config.nodes.get(nodeType)!.perform.call(instance as any, action, state) as SystemState<State, Output>"),
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
		TS(`public static _execute${commonGenericDefinition}(instance: Instance${commonGenericArguments}, state: SystemState<State, Output>, path: Path = state[S.Path]): Action {`),
		D('Get the node at the given `path`',
			JS("const node = get_path_object(instance.process, path)"),
			TS("const node = get_path_object<Process>(instance.process, path)!"),
		),
		D('Get the type of that node',
			CS("const nodeType = instance.config.nodes.typeof(node)"),
		),
		D('If the node is not recognised, throw a NodeTypeError',
			CS("if (!nodeType) throw new NodeTypeError(`Unknown node type: ${typeof node}${nodeType ? `, nodeType: ${String(nodeType)}` : ''} at [ ${path.map(key => key.toString()).join(', ')} ]`, { instance, state, path, data: { node } })"),
		),
		D('Execute the node and return an action',
			JS("return instance.config.nodes.get(nodeType).execute.call(instance, node, state)"),
			TS("return instance.config.nodes.get(nodeType)!.execute.call(instance as any, node, state) as Action")
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
				if (nodeType === 'condition' && node.if === 'swap this too')
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
		D('Create an interation function to be used recursively',
			JS("const iterate = (path = []) => {"),
			TS("const iterate = (path: Path = []): Process => {"),
			D('Get the node at the given `path`',
				JS("const node = get_path_object(instance.process, path)"),
				TS("const node = get_path_object<Process>(instance.process, path)!"),
			),
			D('Get the type of the node',
				CS("const nodeType = instance.config.nodes.typeof(node)"),
			),
			D('If the node is not recognised, throw a NodeTypeError',
				CS("if (!nodeType) throw new NodeTypeError(`Unknown node type: ${typeof node}${nodeType ? `, nodeType: ${String(nodeType)}` : ''} at [ ${path.map(key => key.toString()).join(', ')} ]`, { instance, path, data: { node } })"),
			),
			D('Call the iterator for all nodes as a transformer',
				JS("return iterator.call(instance, instance.config.nodes.get(nodeType).traverse.call(instance, node, path, iterate), path, instance.process, nodeType)"),
				TS("return iterator.call(instance, instance.config.nodes.get(nodeType)!.traverse.call(instance as any, node, path, iterate) as Process, path, instance.process, nodeType)"),
			),
			CS("}")
		),
		D('Call the primary method',
			CS("return iterate()")
		),
		CS("}")
	),
	D('S._run (instance, ...input)',
		'Execute the entire process either synchronously or asynchronously depending on the config.',
		D('Will execute the process',
			E.equals(() => {
				const instance = new S({ [S.Return]: 'return value' })
				return S._run(instance)
			}, 'return value'),
		),
		D('Will execute the process in async mode if it is configured',
			E.equals(() => {
				const instance = new S(() => Promise.resolve({ [S.Return]: 'return value' }))
					.async
				return S._run(instance)
			}, 'return value'),
		),
		D('Will not handle promises in sync mode',
			E.equals(() => {
				const instance = new S(() => Promise.resolve({ [S.Return]: 'return value' }))
					.sync
				return S._run(instance)
			}, undefined),
		),
		D('Is the same as running the executable instance itself',
			E.equals(() => {
				const instance = new S({ [S.Return]: 'return value' })
				return S._run(instance) === instance()
			}, true),
		),
		D('Takes the same arguments as the executable instance itself',
			E.equals(() => {
				const instance = new S(({ a, b, c }) => ({ [S.Return]: `${a} + ${b} - ${c}` }))
					.input((a, b, c) => ({ a, b, c }))
				return S._run(instance, 1, 2, 3) === instance(1, 2, 3)
			}, true),
		),
		JS("static _run (instance, ...input) {"),
		TS(`public static _run${commonGenericDefinition}(instance: Instance${commonGenericArguments}, ...input: Input): Output {`),
		D('If the process is asynchronous, execute use `runAsync`',
			JS("if (instance.config.async) return this._runAsync(instance, ...input)"),
			TS("if (instance.config.async) return this._runAsync(instance, ...input) as Output"),
		),
		D('If the process is asynchronous, execute use `runSync`',
			CS("return this._runSync(instance, ...input)"),
		),
		CS("}"),
	),
	D('S._runSync (instance, ...input)',
		'Execute the entire process synchronously.',

		D('Will execute the process',
			E.equals(() => {
				const instance = new S({ [S.Return]: 'return value' })
				return S._runSync(instance)
			}, 'return value'),
		),
		D('Will not handle promises even if it is configured',
			E.equals(() => {
				const instance = new S(() => Promise.resolve({ [S.Return]: 'return value' }))
					.async
				return S._runSync(instance)
			}, undefined),
		),
		D('Will not handle promises in sync mode',
			E.equals(() => {
				const instance = new S(() => Promise.resolve({ [S.Return]: 'return value' }))
					.sync
				return S._runSync(instance)
			}, undefined),
		),
		D('Is the same as running the executable instance itself',
			E.equals(() => {
				const instance = new S({ [S.Return]: 'return value' })
				return S._runSync(instance) === instance()
			}, true),
		),
		D('Takes the same arguments as the executable instance itself',
			E.equals(() => {
				const instance = new S(({ a, b, c }) => ({ [S.Return]: `${a} + ${b} - ${c}` }))
					.input((a, b, c) => ({ a, b, c }))
				return S._runSync(instance, 1, 2, 3) === instance(1, 2, 3)
			}, true),
		),
		JS("static _runSync (instance, ...input) {"),
		TS(`public static _runSync${commonGenericDefinition}(instance: Instance${commonGenericArguments}, ...input: Input): Output {`),
		D('Extract the useful parts of the config',
			CS("const { until, iterations, input: adaptInput, output: adaptOutput, before, after, defaults, trace } = { ...this.config, ...instance.config }")
		),
		D('Turn the arguments into an initial condition',
			CS("const modifiedInput = adaptInput.apply(instance, input) || {}")
		),
		D('Merge the initial condition with the default initial state',
			CS("let r = 0, currentState = before.reduce((prev, modifier) => modifier.call(instance, prev), this._changes(instance, {"),
			D('Default to an empty change object',
				CS("[S.Changes]: {},")
			),
			D('Use the defaults as an initial state',
				CS("...defaults,")
			),
			D('Use the path from the initial state - allows for starting at arbitrary positions',
				CS("[S.Path]: modifiedInput[S.Path] || [], [S.Trace]: modifiedInput[S.Trace] || [],")
			),
			D('Use the path from the initial state - allows for starting at arbitrary positions',
				CS("...(S.Return in modifiedInput ? {[S.Return]: modifiedInput[S.Return]} : {})"),
			),
			JS("}, modifiedInput))"),
			TS("} as SystemState<State, Output>, modifiedInput))")
		),
		D('Repeat for a limited number of iterations.',
			'This should be fine for most finite machines, but may be too little for some constantly running machines.',
			CS("while (r < iterations) {"),
			D('Check the configured `until` condition to see if we should exit.',
				'Do it first to catch starting with a `S.Return` in place.',
				CS("if (until.call(instance, currentState, r)) break;")
			),
			D('If the interations are exceeded, Error',
				CS("if (++r >= iterations) throw new MaxIterationsError(`Maximum iterations of ${iterations} reached at path [ ${currentState[S.Path].map(key => key.toString()).join(', ')} ]`, { instance, state: currentState, path: currentState[S.Path], data: { iterations } })"),
			),
			D('If stack trace is enabled, push the current path to the stack',
				CS("if (trace) currentState = { ...currentState, [S.Trace]: [ ...currentState[S.Trace], currentState[S.Path] ] }")
			),
			D('Execute the current node on the process and perform any required actions. Updating the currentState',
				CS("currentState = this._perform(instance, currentState, this._execute(instance, currentState))")
			),
			CS("}")
		),
		D('When returning, run the ends state adapters, then the output adapter to complete execution.',
			CS("return adaptOutput.call(instance, after.reduce((prev, modifier) => modifier.call(instance, prev), currentState))")
		),
		CS("}")
	),
	D('S._runAsync (instance, ...input)',
		'Execute the entire process asynchronously. Always returns a promise.',
		D('Will execute the process',
			E.equals(() => {
				const instance = new S({ [S.Return]: 'return value' })
				return S._runAsync(instance)
			}, 'return value'),
		),
		D('Will execute the process in async mode',
			E.equals(() => {
				const instance = new S(() => Promise.resolve({ [S.Return]: 'return value' }))
					.async
				return S._runAsync(instance)
			}, 'return value'),
		),
		D('Will still handle promises even in sync mode',
			E.equals(() => {
				const instance = new S(() => Promise.resolve({ [S.Return]: 'return value' }))
					.sync
				return S._runAsync(instance)
			}, 'return value'),
		),
		D('Is the same as running the executable instance itself',
			E.equals(async () => {
				const instance = new S({ [S.Return]: 'return value' })
				return await S._runAsync(instance) === instance()
			}, true),
		),
		D('Takes the same arguments as the executable instance itself',
			E.equals(async () => {
				const instance = new S(({ a, b, c }) => ({ [S.Return]: `${a} + ${b} - ${c}` }))
					.input((a, b, c) => ({ a, b, c }))
				return await S._runAsync(instance, 1, 2, 3) === instance(1, 2, 3)
			}, true),
		),
		JS("static async _runAsync (instance, ...input) {"),
		TS(`public static async _runAsync${commonGenericDefinition}(instance: Instance${commonGenericArguments}, ...input: Input): Promise<Output> {`),
		D('Extract the useful parts of the config',
			CS("const { pause, until, iterations, input: adaptInput, output: adaptOutput, before, after, defaults, trace } = { ...this.config, ...instance.config }"),
		),
		D('Turn the arguments into an initial condition',
			CS("const modifiedInput = (await adaptInput.apply(instance, input)) || {}"),
		),
		D('Merge the initial condition with the default initial state',
			CS("let r = 0, currentState = before.reduce((prev, modifier) => modifier.call(instance, prev), this._changes(instance, {"),
			D('Default to an empty change object',
				CS("[S.Changes]: {},"),
			),
			D('Use the defaults as an initial state',
				CS("...defaults,"),
			),
			D('Use the path from the initial state - allows for starting at arbitrary positions',
				CS("[S.Path]: modifiedInput[S.Path] || [], [S.Trace]: modifiedInput[S.Trace] || [],"),
			),
			D('Use the path from the initial state - allows for starting at arbitrary positions',
				CS("...(S.Return in modifiedInput ? {[S.Return]: modifiedInput[S.Return]} : {})"),
			),
			JS("}, modifiedInput))"),
			TS("} as SystemState<State, Output>, modifiedInput))")
		),
		D('Repeat for a limited number of iterations.',
			CS("while (r < iterations) {"),
			'This should be fine for most finite machines, but may be too little for some constantly running machines.',
			D('Pause execution based on the pause customisation method',
				CS(`const pauseExecution = pause.call(instance, currentState, r)`),
				CS(`if (pauseExecution) await pauseExecution;`),
			),
			D('Check the configured `until` condition to see if we should exit.',
				CS("if (until.call(instance, currentState, r)) break;"),
			),
			D('If the interaction are exceeded, throw MaxIterationsError',
				CS("if (++r >= iterations) throw new MaxIterationsError(`Maximum iterations of ${iterations} reached at path [ ${currentState[S.Path].map(key => key.toString()).join(', ')} ]`, { instance, state: currentState, path: currentState[S.Path], data: { iterations } })"),
			),
			D('If stack trace is enabled, push the current path to the stack',
				CS("if (trace) currentState = { ...currentState, [S.Trace]: [ ...currentState[S.Trace], currentState[S.Path] ] }")
			),
			D('Execute the current node on the process and perform any required actions. Updating the currentState',
				CS("currentState = await this._perform(instance, currentState, await this._execute(instance, currentState))"),
			),
			CS("}"),
		),
		D('When returning, run the ends state adapters, then the output adapter to complete execution.',
			CS("return adaptOutput.call(instance, after.reduce((prev, modifier) => modifier.call(instance, prev), currentState))"),
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
		TS(`static closest${commonGenericDefinition}(path: Path, ...nodeTypes: Array<string | symbol | Array<string | symbol>>) { return (instance: Instance${commonGenericArguments}): Path | null => this._closest(instance, path, ...nodeTypes) }`)
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
		TS(`static changes${commonGenericDefinition}(state: SystemState<State, Output>, changes: Partial<State>) { return (instance: Instance${commonGenericArguments}): SystemState<State, Output> => this._changes(instance, state, changes) }`)
	),
	D('S.proceed (state = {}, path = state[S.Path] || [])',
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
			const proceeder = S.proceed({ [S.Path]: [ 2, 1 ] })
			return proceeder(instance)
		}, { [S.Path]: [ 3 ] }, symbols),
		JS("static proceed(state, path)        { return instance => this._proceed(instance, state, path) }"),
		TS(`static proceed${commonGenericDefinition}(state: SystemState<State, Output>, path: Path) { return (instance: Instance${commonGenericArguments}): Path | null => this._proceed(instance, state, path) }`)
	),
	D('S.perform (state = {}, action = null)',
		'Perform actions on the state.',
		'Applies any changes in the given `action` to the given `state`.',
		'Proceeds to the next node if the action is not itself a directive or return.',
		E.equals(() => {
			const instance = new S()
			const performer = S.perform({ myProperty: 'start value' }, { myProperty: 'new value' })
			return performer(instance)
		}, { myProperty: 'new value' }),
		JS("static perform(state, action)      { return instance => this._perform(instance, state, action) }"),
		TS(`static perform${commonGenericDefinition}(state: SystemState<State, Output>, action: Action) { return (instance: Instance${commonGenericArguments}): SystemState<State, Output> => this._perform(instance, state, action) }`)
	),
	D('S.execute (state = {}, path = state[S.Path] || [])',
		'Execute a node in the process, return an action.',
		"Executes the node in the process at the state's current path and returns it's action.",
		'If the node is not executable it will be returned as the action.',
		E.equals(() => {
			const instance = new S([
				{ myProperty: 'this value' },
				{ myProperty: 'that value' },
				{ myProperty: 'the other value' },
			])
			const executor = S.execute({ [S.Path]: [1], myProperty: 'start value' })
			return executor(instance)
		}, { [S.Path]: [2], myProperty: 'that value' }, symbols),
		JS("static execute(state, path)        { return instance => this._execute(instance, state, path) }"),
		TS(`static execute${commonGenericDefinition}(state: SystemState<State, Output>, path?: Path) { return (instance: Instance${commonGenericArguments}): Action => this._execute(instance, state, path) }`)
	),
	D('S.traverse(iterator = a => a)',
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
				if (nodeType === 'condition' && node.if === 'swap this too')
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
		'Execute the entire process either synchronously or asynchronously depending on the config.',
		D('Will execute the process',
			E.equals(() => {
				const instance = new S({ [S.Return]: 'return value' })
				return S.run()(instance)
			}, 'return value'),
		),
		D('Will execute the process in async mode if it is configured',
			E.equals(() => {
				const instance = new S(() => Promise.resolve({ [S.Return]: 'return value' }))
					.async
				return S.run()(instance)
			}, 'return value'),
		),
		D('Will not handle promises in sync mode',
			E.equals(() => {
				const instance = new S(() => Promise.resolve({ [S.Return]: 'return value' }))
					.sync
				return S.run()(instance)
			}, undefined),
		),
		D('Is the same as running the executable instance itself',
			E.equals(() => {
				const instance = new S({ [S.Return]: 'return value' })
				return S.run()(instance) === instance()
			}, true),
		),
		D('Takes the same arguments as the executable instance itself',
			E.equals(() => {
				const instance = new S(({ a, b, c }) => ({ [S.Return]: `${a} + ${b} - ${c}` }))
					.input((a, b, c) => ({ a, b, c }))
				return S.run(1, 2, 3)(instance) === instance(1, 2, 3)
			}, true),
		),
		JS("static run(...input)               { return instance => this._run(instance, ...input) }"),
		TS(`static run${commonGenericDefinition}(...input: Input) { return (instance: Instance${commonGenericArguments}): Output => this._run(instance, ...input) }`)
	),
	D('S.runSync (...input)',
		'Execute the entire process synchronously.',
		D('Will execute the process',
			E.equals(() => {
				const instance = new S({ [S.Return]: 'return value' })
				return S.runSync()(instance)
			}, 'return value'),
		),
		D('Will not handle promises even if it is configured',
			E.equals(() => {
				const instance = new S(() => Promise.resolve({ [S.Return]: 'return value' }))
					.async
				return S.runSync()(instance)
			}, undefined),
		),
		D('Will not handle promises in sync mode',
			E.equals(() => {
				const instance = new S(() => Promise.resolve({ [S.Return]: 'return value' }))
					.sync
				return S.runSync()(instance)
			}, undefined),
		),
		D('Is the same as running the executable instance itself',
			E.equals(() => {
				const instance = new S({ [S.Return]: 'return value' })
				return S.runSync()(instance) === instance()
			}, true),
		),
		D('Takes the same arguments as the executable instance itself',
			E.equals(() => {
				const instance = new S(({ a, b, c }) => ({ [S.Return]: `${a} + ${b} - ${c}` }))
					.input((a, b, c) => ({ a, b, c }))
				return S.runSync(1, 2, 3)(instance) === instance(1, 2, 3)
			}, true),
		),
		JS("static runSync(...input)           { return instance => this._runSync(instance, ...input) }"),
		TS(`static runSync${commonGenericDefinition}(...input: Input) { return (instance: Instance${commonGenericArguments}): Output => this._runSync(instance, ...input) }`)
	),
	D('S.runAsync (...input)',
		'Execute the entire process asynchronously. Always returns a promise.',
		D('Will execute the process',
			E.equals(() => {
				const instance = new S({ [S.Return]: 'return value' })
				return S.runAsync()(instance)
			}, 'return value'),
		),
		D('Will execute the process in async mode',
			E.equals(() => {
				const instance = new S(() => Promise.resolve({ [S.Return]: 'return value' }))
					.async
				return S.runAsync()(instance)
			}, 'return value'),
		),
		D('Will still handle promises even in sync mode',
			E.equals(() => {
				const instance = new S(() => Promise.resolve({ [S.Return]: 'return value' }))
					.sync
				return S.runAsync()(instance)
			}, 'return value'),
		),
		D('Is the same as running the executable instance itself',
			E.equals(async () => {
				const instance = new S({ [S.Return]: 'return value' })
				return await S.runAsync()(instance) === instance()
			}, true),
		),
		D('Takes the same arguments as the executable instance itself',
			E.equals(async () => {
				const instance = new S(({ a, b, c }) => ({ [S.Return]: `${a} + ${b} - ${c}` }))
					.input((a, b, c) => ({ a, b, c }))
				return await S.runAsync(1, 2, 3)(instance) === instance(1, 2, 3)
			}, true),
		),
		JS("static runAsync(...input)          { return instance => this._runAsync(instance, ...input) }"),
		TS(`static runAsync${commonGenericDefinition}(...input: Input) { return (instance: Instance${commonGenericArguments}): Promise<Output> => this._runAsync(instance, ...input) }`)
	),
	D('S.do(process) <default: null>',
		'Defines a process to execute, overrides the existing process.',
		'Returns a function that will modify a given instance.',
		E.is(() => {
			const instance = new S({ [S.Return]: 'old' })
			const newInstance = instance.with(S.do({ [S.Return]: 'new' }))
			return newInstance()
		}, 'new'),
		JS("static do(process = null)                    { return instance => ({ process: instance.config.adapt.reduce((prev, modifier) => modifier.call(instance, prev), process), config: instance.config }) }"),
		TS(`static do${commonGenericDefinition}(process: Process) { return (instance: Instance${commonGenericArguments}): Instance${commonGenericArguments} => ({ process: instance.config.adapt.reduce((prev, modifier) => modifier.call(instance, prev), process), config: instance.config }) }`)
	),
	D('S.defaults(defaults) <default: {}>',
		'Defines the initial state to be used for all executions.',
		'Returns a function that will modify a given instance.',
		E.is(() => {
			const instance = new S(({ result }) => ({ [S.Return]: result }))
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
			const instance = new S(({ first, second }) => ({ [S.Return]: `${first} then ${second}` }))
			.with(
				S.defaults({ first: '', second: '' }),
				S.input((first, second) => ({ first, second }))
			)
			return instance('this', 'that')
		}, 'this then that'),
		JS("static input(input = S.config.input)         { return instance => ({ process: instance.process, config: { ...instance.config, input }, }) }"),
		TS(`static input<${commonGenericDefinitionInner}	NewInput extends Array<unknown> = Array<unknown>,\n>(input: (...input: NewInput) => Partial<InputSystemState<State, Output>>) { return (instance: Instance${commonGenericArguments}): Pick<S<State, Output, NewInput, Action, Process>, 'process' | 'config'> => ({ process: instance.process, config: { ...instance.config, input } as unknown as Config<State, Output, NewInput, Action, Process>, }) }`)
	),
	D('S.output(output) <default: (state => state[S.Return])>',
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
		'Shallow merges the state every time a state change in made.',
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
			.output(({ [S.Trace]: trace }) => trace)
			return instance()
		}, []),
		JS("static untrace                                (instance) { return ({ process: instance.process, config: { ...instance.config, trace: false }, }) }"),
		TS(`static untrace${commonGenericDefinition}(instance: Instance${commonGenericArguments}): Instance${commonGenericArguments} { return ({ process: instance.process, config: { ...instance.config, trace: false }, }) }`)
	),
	D('S.trace',
		'Deep merges the all properties in the state every time a state change in made.',
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
			.output(({ [S.Trace]: trace }) => trace)
			return instance()
		}, [
			[],
			['initial'],
			['other'],
			['oneMore'],
			['oneMore', 0],
			['oneMore', 1]
		]),
		JS("static trace                                  (instance) { return ({ process: instance.process, config: { ...instance.config, trace: true }, }) }"),
		TS(`static trace${commonGenericDefinition}(instance: Instance${commonGenericArguments}): Instance${commonGenericArguments} { return ({ process: instance.process, config: { ...instance.config, trace: true }, }) }`)
	),
	D('S.shallow <default>',
		'Shallow merges the state every time a state change in made.',
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
		'Deep merges the all properties in the state every time a state change in made.',
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
		JS("static strictTypes                            (instance) { return ({ process: instance.process, config: { ...instance.config, strict: S.StrictTypes }, }) }"),
		TS(`static strictTypes${commonGenericDefinition} (instance: Instance${commonGenericArguments}): Instance${commonGenericArguments} { return ({ process: instance.process, config: { ...instance.config, strict: S.StrictTypes }, }) }`),
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
	D('S.sync <default>',
		'Execute synchronously and not allow for asynchronous actions.',
		'Will modify the given instance.',
		E.is(() => {
			const instance = new S(async () => ({ [S.Return]: 'returned' }))
			.with(
				S.async,
				S.sync,
			)
			return instance()
		}, undefined),
		JS("static sync                                   (instance) { return ({ process: instance.process, config: { ...instance.config, async: false }, }) }"),
		TS(`static sync${commonGenericDefinition} (instance: Instance${commonGenericArguments}): Pick<S<State, Awaited<Output>, Input, Action, Process>, 'process' | 'config'> { return ({ process: instance.process, config: { ...instance.config, async: false } as unknown as Config<State, Awaited<Output>, Input, Action, Process>, }) }`)
	),
	D('S.async',
		'Execute asynchronously and allow for asynchronous actions.',
		'Will modify the given instance.',
		E.is(() => {
			const instance = new S(async () => ({ [S.Return]: 'returned' }))
			return instance()
		}, undefined),
		E.is(async () => {
			const instance = new S(async () => ({ [S.Return]: 'returned' }))
			.with(
				S.async
			)
			return await instance()
		}, 'returned'),
		JS("static async                                  (instance) { return ({ process: instance.process, config: { ...instance.config, async: true }, }) }"),
		TS(`static async${commonGenericDefinition} (instance: Instance${commonGenericArguments}): Pick<S<State, Promise<Output>, Input, Action, Process>, 'process' | 'config'> { return ({ process: instance.process, config: { ...instance.config, async: true } as unknown as Config<State, Promise<Output>, Input, Action, Process>, }) }`),
	),
	D('S.pause(pause) <default: (() => false)>',
		'Allows an async execution to be paused between steps.',
		'Returns a function that will modify a given instance.',
		JS("static pause(pause = S.config.pause)         { return instance => ({ process: instance.process, config: { ...instance.config, pause }, }) }"),
		TS(`static pause${commonGenericDefinition}(pause: Config${commonGenericArguments}['pause']) { return (instance: Instance${commonGenericArguments}): Instance${commonGenericArguments} => ({ process: instance.process, config: { ...instance.config, pause }, }) }`)
	),
	D('S.override(override) <default: instance.run>',
		'Overrides the method that will be used when the executable is called.',
		'Returns a function that will modify a given instance.',
		E.is(() => {
			const instance = new S({ [S.Return]: 'definedResult' })
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
			class SpecialNode extends N {
				static type = 'special'
				static typeof(object, objectType) { return Boolean(objectType === 'object' && object && specialSymbol in object)}
				static execute(){ return { [S.Return]: 'specialValue' } }
			}
			const instance = new S({ [specialSymbol]: true })
				.with(
					S.output(({ result, [S.Return]: output = result }) => output),
					S.addNode(SpecialNode)
				)
			return instance({ result: 'start' })
		}, 'specialValue'),
		E.equals(() => {
			const specialSymbol = Symbol('My Symbol')
			const instance = new S({ [specialSymbol]: true })
				.with(
					S.output(({ result, [S.Return]: output = result }) => output)
				)
			return instance({ result: 'start' })
		}, 'start'),
		JS("static addNode(...nodes)                     { return instance => ({ process: instance.process, config: { ...instance.config, nodes: new NS(...instance.config.nodes.values(),...nodes) }, }) }"),
		TS(`static addNode${commonGenericDefinition}(...nodes: any[]) { return (instance: Instance${commonGenericArguments}) => ({ process: instance.process, config: { ...instance.config, nodes: new NS(...instance.config.nodes.values(),...nodes) }, }) }`)
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
							return { [S.Return]: 'replaced' }
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
			const plugin = S.with(S.strict, S.async, S.for(10))
			const instance = new S().with(plugin)
			return instance.config
		}, { async: true, strict: true, iterations: 10}),
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
						.output()
				})
			),
		),
		JS("constructor(process = null, config = S.config) {"),
		TS(`constructor(process: Process = (null as Process), config: Config${commonGenericArguments} = (S.config as unknown as Config${commonGenericArguments})) {`),
		D('Create an ExtensibleFunction that can execute the `run` or `override` method in scope of the new SuperSmallStateMachine instance.',
			JS("super((...input) => (config.override || this.run).apply(this, input))"),
			TS("super((...input: Input): Output => (config.override || this.run).apply(this, input))")
		),
		D('Create the config by merging the passed config with the defaults.',
			'This is private so it cannot be mutated at runtime',
			E.equals(() => {
				const myConfig = { async: false }
				const instance = new S(null, myConfig)
				const retrievedConfig = instance.config
				return retrievedConfig !== myConfig && retrievedConfig !== instance.config
			}, true),
			E.equals(() => {
				const myConfig = { async: 'original' }
				const instance = new S(null, myConfig)
				instance.config.async = 'new value'
				return instance.config.async
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
						S.Return,
					]
				}
			])
			return instance.closest([0, 'then', 1], 'sequence')
		}, [0, 'then']),
		JS("closest(path, ...nodeTypes) { return S._closest(this, path, ...nodeTypes) }"),
		TS("closest(path: Path, ...nodeTypes: Array<string | symbol | Array<string | symbol>>): Path | null { return S._closest(this, path, ...nodeTypes) }")
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
		TS("changes(state: SystemState<State, Output>, changes: Partial<State>): SystemState<State, Output> { return S._changes(this, state, changes) }")
	),
	D('instance.proceed (state = {}, path = state[S.Path] || [])',
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
			return instance.proceed({ [S.Path]: [ 2, 1 ] })
		}, { [S.Path]: [ 3 ] }, symbols),
		JS("proceed(state, path)    { return S._proceed(this, state, path) }"),
		TS("proceed(state: SystemState<State, Output>, path: Path) { return S._proceed(this, state, path) }")
	),
	D('instance.perform (state = {}, action = null)',
		'Perform actions on the state.',
		'Applies any changes in the given `action` to the given `state`.',
		'Proceeds to the next node if the action is not itself a directive or return.',
		E.equals(() => {
			const instance = new S()
			return instance.perform({ myProperty: 'start value' }, { myProperty: 'new value' })
		}, { myProperty: 'new value' }),
		JS("perform(state, action)  { return S._perform(this, state, action) }"),
		TS("perform(state: SystemState<State, Output>, action: Action) { return S._perform(this, state, action) }")
	),
	D('instance.execute (state = {}, path = state[S.Path] || [])',
		'Execute a node in the process, return an action.',
		"Executes the node in the process at the state's current path and returns it's action.",
		'If the node is not executable it will be returned as the action.',
		E.equals(() => {
			const instance = new S([
				{ myProperty: 'this value' },
				{ myProperty: 'that value' },
				{ myProperty: 'the other value' },
			])
			return instance.execute({ [S.Path]: [1], myProperty: 'start value' })
		}, { [S.Path]: [2], myProperty: 'that value' }, symbols),
		JS("execute(state, path)    { return S._execute(this, state, path) }"),
		TS("execute(state: SystemState<State, Output>, path?: Path) { return S._execute(this, state, path) }")
	),
	D('instance.traverse(iterator = a => a)',
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
				if (nodeType === 'condition' && node.if === 'swap this too')
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
		'Execute the entire process either synchronously or asynchronously depending on the config.',
		D('Will execute the process',
			E.equals(() => {
				const instance = new S({ [S.Return]: 'return value' })
				return instance.run()
			}, 'return value'),
		),
		D('Will execute the process in async mode if it is configured',
			E.equals(() => {
				const instance = new S(() => Promise.resolve({ [S.Return]: 'return value' }))
					.async
				return instance.run()
			}, 'return value'),
		),
		D('Will not handle promises in sync mode',
			E.equals(() => {
				const instance = new S(() => Promise.resolve({ [S.Return]: 'return value' }))
					.sync
				return instance.run()
			}, undefined),
		),
		D('Is the same as running the executable instance itself',
			E.equals(() => {
				const instance = new S({ [S.Return]: 'return value' })
				return instance.run() === instance()
			}, true),
		),
		D('Takes the same arguments as the executable instance itself',
			E.equals(() => {
				const instance = new S(({ a, b, c }) => ({ [S.Return]: `${a} + ${b} - ${c}` }))
					.input((a, b, c) => ({ a, b, c }))
				return instance.run(1, 2, 3) === instance(1, 2, 3)
			}, true),
		),
		JS("run     (...input)      { return S._run(this, ...input) }"),
		TS("run (...input: Input): Output { return S._run(this, ...input) }")
	),
	D('instance.runSync (...input)',
		'Execute the entire process synchronously.',
		D('Will execute the process',
			E.equals(() => {
				const instance = new S({ [S.Return]: 'return value' })
				return instance.runSync()
			}, 'return value'),
		),
		D('Will not handle promises even if it is configured',
			E.equals(() => {
				const instance = new S(() => Promise.resolve({ [S.Return]: 'return value' }))
					.async
				return instance.runSync()
			}, undefined),
		),
		D('Will not handle promises in sync mode',
			E.equals(() => {
				const instance = new S(() => Promise.resolve({ [S.Return]: 'return value' }))
					.sync
				return instance.runSync()
			}, undefined),
		),
		D('Is the same as running the executable instance itself',
			E.equals(() => {
				const instance = new S({ [S.Return]: 'return value' })
				return instance.runSync() === instance()
			}, true),
		),
		D('Takes the same arguments as the executable instance itself',
			E.equals(() => {
				const instance = new S(({ a, b, c }) => ({ [S.Return]: `${a} + ${b} - ${c}` }))
					.input((a, b, c) => ({ a, b, c }))
				return instance.runSync(1, 2, 3) === instance(1, 2, 3)
			}, true),
		),
		JS("runSync (...input)      { return S._runSync(this, ...input) }"),
		TS("runSync (...input: Input): Output { return S._runSync(this, ...input) }")
	),
	D('instance.runAsync (...input)',
		'Execute the entire process asynchronously. Always returns a promise.',
		D('Will execute the process',
			E.equals(() => {
				const instance = new S({ [S.Return]: 'return value' })
				return instance.runAsync()
			}, 'return value'),
		),
		D('Will execute the process in async mode',
			E.equals(() => {
				const instance = new S(() => Promise.resolve({ [S.Return]: 'return value' }))
					.async
				return instance.runAsync()
			}, 'return value'),
		),
		D('Will still handle promises even in sync mode',
			E.equals(() => {
				const instance = new S(() => Promise.resolve({ [S.Return]: 'return value' }))
					.sync
				return instance.runAsync()
			}, 'return value'),
		),
		D('Is the same as running the executable instance itself',
			E.equals(async () => {
				const instance = new S({ [S.Return]: 'return value' })
				return await instance.runAsync() === instance()
			}, true),
		),
		D('Takes the same arguments as the executable instance itself',
			E.equals(async () => {
				const instance = new S(({ a, b, c }) => ({ [S.Return]: `${a} + ${b} - ${c}` }))
					.input((a, b, c) => ({ a, b, c }))
				return await instance.runAsync(1, 2, 3) === instance(1, 2, 3)
			}, true),
		),
		JS("runAsync(...input)      { return S._runAsync(this, ...input) }"),
		TS("runAsync(...input: Input): Promise<Output> { return S._runAsync(this, ...input) }")
	),
	D('instance.do(process) <default: null>',
		'Defines a process to execute, overrides the existing process.',
		'Returns a new instance.',
		E.is(() => {
			const instance = new S({ [S.Return]: 'old' })
				.do({ [S.Return]: 'new' })
			return instance()
		}, 'new'),
		JS("do(process)             { return this.with(S.do(process)) }"),
		TS(`do(process: Process): S${commonGenericArguments} { return this.with(S.do(process)) }`)
	),
	D('instance.defaults(defaults) <default: {}>',
		'Defines the initial state to be used for all executions.',
		'Returns a new instance.',
		E.is(() => {
			const instance = new S(({ result }) => ({ [S.Return]: result }))
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
			const instance = new S(({ first, second }) => ({ [S.Return]: `${first} then ${second}` }))
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
			.output(({ [S.Trace]: trace }) => trace)
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
			.output(({ [S.Trace]: trace }) => trace)
			return instance()
		}, [
			[],
			['initial'],
			['other'],
			['oneMore'],
			['oneMore', 0],
			['oneMore', 1]
		]),
		JS("get trace()             { return this.with(S.trace) }"),
		TS(`get trace(): S${commonGenericArguments} { return this.with(S.trace) }`)
	),
	D('instance.shallow <default>',
		'Shallow merges the state every time a state change in made.',
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
		'Deep merges the all properties in the state every time a state change in made.',
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
				({ knownVariable }) => ({ [S.Return]: knownVariable })
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
	D('instance.sync <default>',
		'Execute synchronously and not allow for asynchronous actions.',
		'Creates a new instance.',
		E.is(() => {
			const instance = new S(async () => ({ [S.Return]: 'returned' }))
				.async
				.sync
			return instance()
		}, undefined),
		JS("get sync()              { return this.with(S.sync) }"),
		TS("get sync(): S<State, Awaited<Output>, Input, Action, Process> { return this.with(S.sync) }"),
	),
	D('instance.async',
		'Execute asynchronously and allow for asynchronous actions.',
		'Creates a new instance.',
		E.is(() => {
			const instance = new S(async () => ({ [S.Return]: 'returned' }))
			return instance()
		}, undefined),
		E.is(async () => {
			const instance = new S(async () => ({ [S.Return]: 'returned' }))
				.async
			return await instance()
		}, 'returned'),
		JS("get async()             { return this.with(S.async) }"),
		TS("get async(): S<State, Promise<Output>, Input, Action, Process> { return this.with(S.async) }")
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
			const instance = new S({ [S.Return]: 'definedResult' })
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
			class SpecialNode extends N {
				static type = 'special'
				static typeof(object, objectType) { return Boolean(objectType === 'object' && object && specialSymbol in object)}
				static execute(){ return { [S.Return]: 'specialValue' } }
			}
			const instance = new S({ [specialSymbol]: true })
				.output(({ result, [S.Return]: output = result }) => output)
				.addNode(SpecialNode)
			return instance({ result: 'start' })
		}, 'specialValue'),
		E.equals(() => {
			const specialSymbol = Symbol('My Symbol')
			const instance = new S({ [specialSymbol]: true })
				.output(({ result, [S.Return]: output = result }) => output)
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
						return { [S.Return]: 'replaced' }
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
				.with(S.strict, S.async, S.for(10))
			return instance.config
		}, { async: true, strict: true, iterations: 10}),
		JS("with(...transformers)   { return S.with(...transformers)(this) }"),
		TS(`with<NewState extends InitialState = State, NewResult extends unknown = Output, NewInput extends Array<unknown> = Input, NewAction extends unknown = Action, NewProcess extends unknown = Process>(...transformers: Array<(instance: Instance${commonGenericArguments}) => Pick<S<NewState, NewResult, NewInput, NewAction, NewProcess>, 'process' | 'config'>>): S<NewState, NewResult, NewInput, NewAction, NewProcess> { return S.with<State, Output, Input, Action, Process, NewState, NewResult, NewInput, NewAction, NewProcess>(...transformers)(this) }`)
	),
	CS("}"),
	CS("export const StateMachine = S"),
	CS("export const SuperSmallStateMachine = S"),
	CS("export const NodeDefinition = N"),
	CS("export const NodeDefinitions = NS"),
	D('The main class is exported as `{ StateMachine }`',
		E.exports('StateMachine', testModule, './index.js'),
	),
	D('The main class is exported as `{ SuperSmallStateMachine }`',
		E.exports('SuperSmallStateMachine', testModule, './index.js'),
	),
	D('The node class is exported as `{ NodeDefinition }`',
		E.exports('NodeDefinitions', testModule, './index.js'),
	),
	D('The node collection class is exported as `{ NodeDefinitions }`',
		E.exports('NodeDefinitions', testModule, './index.js'),
	),
	D('The node class is exported as `{ N }`',
		E.exports('N', testModule, './index.js'),
	),
	D('The node collection class is exported as `{ NS }`',
		E.exports('NS', testModule, './index.js'),
	),
),

D('Requirements',
	D('Execution',
		D('Can execute function',
			E.is(() => {
				const instance = new S(({ input }) => ({ [S.Return]: (input + 5) * 47 }))
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
					then: () => ({ [S.Return]: 44 }),
					else: () => ({ [S.Return]: 55 }),
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
					then: () => ({ [S.Return]: 44 }),
					else: () => ({ [S.Return]: 55 }),
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
						first: () => ({ [S.Return]: 1 }),
						second: () => ({ [S.Return]: 2 }),
						third: () => ({ [S.Return]: 3 }),
						default: () => ({ [S.Return]: -1 }),
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
						first: () => ({ [S.Return]: 1 }),
						second: () => ({ [S.Return]: 2 }),
						third: () => ({ [S.Return]: 3 }),
						default: () => ({ [S.Return]: -1 }),
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
							else: ({ result }) => ({ [S.Return]: result })
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
						else: ({ result }) => ({ [S.Return]: result })
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
					initial: { [S.Path]: ['second',0] },
					second: [
						({ input }) => ({ [S.Return]: input + 4 })
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
					initial: { [S.Path]: 'second' },
					second: [
						({ input }) => ({ [S.Return]: input + 4 })
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
							else: ({ result }) => ({ [S.Return]: result })
						}
					]
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
							then: 'initial',
							else: ({ result }) => ({ [S.Return]: result })
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
						else: ({ result }) => ({ [S.Return]: result })
					}
				])
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
						then: ({ result }) => ({ [S.Return]: result }),
						else: 0
					}
				])
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
					.output(({ result, [S.Return]: output = result }) => output)
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
						({ input }) => ({ [S.Return]: input + 4 })
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
					initial: () => ({ [S.Path]: ['second',0] }),
					second: [
						({ input }) => ({ [S.Return]: input + 4 })
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
					initial: () => ({ [S.Path]: 'second' }),
					second: [
						({ input }) => ({ [S.Return]: input + 4 })
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
							else: ({ result }) => ({ [S.Return]: result })
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
							else: ({ result }) => ({ [S.Return]: result })
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
						else: ({ result }) => ({ [S.Return]: result })
					}
				])
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
					.output(({ result }) => result)
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
					.output(({ result, [S.Return]: output = result }) => output)
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
					.output(({ result, [S.Return]: output = result }) => output)
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
							if: ({ subState, outputList }) => subState.result !== outputList[outputList.length-1],
							then: ({ outputList, subState }) => ({ outputList: [...outputList, subState.result]})
						},
						{
							if: ({ subDone }) => subDone,
							then: ({ outputList }) => ({ [S.Return]: outputList.join('_') }),
							else: 'cradle'
						}
					]
				})
					.defaults({
						input: 1,
						outputList: [],
						subState: {},
						subPath: [],
						subDone: false,
					}).output(({ result, [S.Return]: output = result }) => output)
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
					else: ({ result }) => ({ [S.Return]: result })
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
						else: ({ result }) => ({ [S.Return]: result })
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
							else: ({ result }) => ({ [S.Return]: result })
						}
					},
					actions: {
						startAtOne: () => ({ result: 1 }),
						decrementCounter: ({ input }) => ({ input: input-1 }),
						fibonacci: ({ result, output2 }) => ({
							output2: result,
							result: result + output2
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
					({ result }) => ({ [S.Return]: result.join('_') })
				])
					.defaults( {
						input: 0,
						result: []
					})
					.output(({ result, [S.Return]: output = result }) => output)
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
					})
					.with(parallelPlugin)
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
						output2: 0,
					})
					.async
					.with(eventsPlugin({
						nextNumber: {},
						getResult: {},
						kill: {},
					}))
				const runningInstance = instance({input:12})
				let outputs = []
				runningInstance.subscribe((event) => {
					if (event.name === 'result') {
						outputs.push(event.data)
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
				return outputs.join('_')
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
						output2: 0,
					})
					.async
					.with(describedPlugin({
						actions:{
							startAtOne: () => ({ result: 1 }),
							fibb: ({ result, output2 }) => ({
								output2: result,
								result: result + output2
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
				let outputs = []
				runningInstance.subscribe((event) => {
					if (event.name === 'result') {
						outputs.push(event.data)
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
				return outputs.join('_')
			}, '144_233_233_377')
		),
	),
),
)

export default description
