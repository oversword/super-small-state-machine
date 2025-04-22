export const clone_object = <T extends unknown = unknown>(obj: T): T => {
	if (Array.isArray(obj)) return obj.map(clone_object) as T
	if (obj === null) return null as T
	if (typeof obj !== 'object') return obj
	return { ...obj, ...Object.fromEntries(Object.entries(obj).concat(Symbols in obj ? (obj[Symbols] as Array<string>).map(key => [key,obj[key]]) : []).map(([key,value]) => [ key, clone_object(value) ])) }
}
const reduce_get_path_object = <T extends unknown = unknown, O extends unknown = unknown>(obj: T | O | undefined, step: PathUnit): T | undefined => obj ? ((obj as any)[step] as T) : undefined
export const get_path_object = <T extends unknown = unknown, O extends unknown = unknown>(object: O, path: Path = []): undefined | T => (path.reduce(reduce_get_path_object<T,O>, object) as (T | undefined))
export const set_path_object = <T extends unknown = unknown>(object: T, path: Path = [], value: unknown = undefined): T => {
if (path.length === 0 || typeof object !== 'object' || !object) return value as T
if (Array.isArray(object)) return [ ...object.slice(0, path[0] as number), set_path_object(object[path[0] as number], path.slice(1), value), ...object.slice(1 + (path[0] as number)) ] as T
return { ...object, [path[0]]: set_path_object((object as Record<string,unknown>)[path[0] as string], path.slice(1), value), }
}
export const update_path_object = <T extends unknown = unknown, O extends unknown = unknown>(object: O, path: Path = [], transformer: ((original: T, path: Path, object: O) => T) = ident) => set_path_object(object, path, transformer(get_path_object<T>(object, path)!, path, object))
const map_list_path_object = ([ key, value ]: [ string, unknown ]): Array<Path> => list_path_object(value).map(path => [ key, ...path ])
export const list_path_object = (object: unknown): Array<Path> => typeof object !== 'object' || !object ? [[]] : ([[]] as Array<Path>).concat(...Object.entries(object).map(map_list_path_object))
export const normalise_function = (functOrReturn: Function | unknown): Function => ((functOrReturn instanceof Function) || (typeof functOrReturn === 'function')) ? functOrReturn : () => functOrReturn
const reduce_deep_merge_object = <T extends unknown = unknown>(base: T, override: unknown): T => {
if (!((base && typeof base === 'object') && !Array.isArray(base) && (override && typeof override === 'object') && !Array.isArray(override)))
	return override as T
const allKeys = [ ...new Set((Object.keys(base) as Array<string | symbol>).concat(Symbols in base ? (base[Symbols] as Array<symbol>) : [], Object.keys(override), Symbols in override ? (override[Symbols] as Array<symbol>) : [])) ]
return { ...base, ...override, ...Object.fromEntries(allKeys.map(key => [ key, key in override ? deep_merge_object((base as Record<string|symbol,unknown>)[key], (override as Record<string|symbol,unknown>)[key]) : (base as Record<string|symbol,unknown>)[key] ])) }
}
export const deep_merge_object = <T extends unknown = unknown>(base: T, ...overrides: Array<unknown>): T => overrides.reduce(reduce_deep_merge_object<T>, base)
export const shallow_merge_object = <T extends unknown = unknown>(a: T, ...objects: Array<Partial<T>>): T => Object.assign({}, a, ...objects) as T
export const get_closest_path = <T extends unknown = unknown, O extends unknown = unknown>(object: O, path: Path = [], condition: ((item: T, path: Path, object: O) => boolean) = () => true): Path | null => {
	const item = get_path_object<T>(object, path)!
	if (condition(item, path, object)) return path
	if (path.length === 0) return null
	return get_closest_path(object, path.slice(0,-1), condition)
}
export const wait_time = (delay: number): Promise<void> => (delay ? new Promise(resolve => setTimeout(resolve, delay)) : Promise.resolve())
export const name = (obj: Function | { name?: string } | (Array<unknown> & { name?: string })): string | undefined => obj.name
export const named = <T extends unknown = unknown>(name: string, obj: T): T & { name: string } => {
const type = typeof obj
if (typeof obj === 'function') return ({ [name]: (...args: Array<unknown>) => obj(...args) })[name] as T & { name: string }
if (typeof obj === 'object' && !Array.isArray(obj)) return { ...obj, name }
const ret = Array.isArray(obj) ? [...obj] : obj;
(ret as T & { name: string }).name = name
return (ret as T & { name: string })
}
export const noop = () => {}
export const ident = <T extends unknown = unknown>(original: T): T => original
export const inc = <State extends InitialState = InitialState>(property: keyof State, by: number = 1): ((state: SystemState<State>) => ChangesType<State>) => named(`${by === 1 ? 'increment ':''}${by === -1 ? 'decrement ':''}${String(property)}${Math.sign(by) === 1 && by !== 1 ? ` plus ${by}`:''}${Math.sign(by) === -1 && by !== -1 ? ` minus ${Math.abs(by)}`:''}`, ({ [property]: i }) => ({ [property]: (i as number) + by } as ChangesType<State>))
export const and = <Args extends Array<unknown> = Array<unknown>>(...methods: Array<(...args: Args) => boolean>): ((...args: Args) => boolean) => named(methods.map(name).join(' and '), (...args) => methods.every(method => method(...args)))
export const or = <Args extends Array<unknown> = Array<unknown>>(...methods: Array<(...args: Args) => boolean>): ((...args: Args) => boolean) => named(methods.map(name).join(' or '), (...args) => methods.some(method => method(...args)))
export const not = <Args extends Array<unknown> = Array<unknown>>(method: ((...args: Args) => boolean)): ((...args: Args) => boolean) => named(`not ${method.name}`, (...args) => !method(...args))
export const forIn = <
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
>(list: string, index: string, ...methods: Array<Process>): Process => named(`for ${index} in ${list}`, [ named(`reset ${index}`, () => ({ [index]: 0 })), { while: named(`${index} is within ${list}`, ({ [index]: i, [list]: l }: State) => (i as number) < (l as Array<unknown>).length), do: [ methods, inc(index) ] } ]) as Process
export class SuperSmallStateMachineError<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
> extends Error {
public instance?: Partial<S<State, Output, Input, Action, Process>>
public state?: SystemState<State, Output>
public data?: any
constructor(message: string, { instance, state, data }: Partial<SuperSmallStateMachineError<State, Output, Input, Action, Process>> = {}) {
	super(message)
	Object.assign(this, { instance, state, data })
}
}
export class SuperSmallStateMachineReferenceError<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
> extends SuperSmallStateMachineError<State, Output, Input, Action, Process> {}
export class SuperSmallStateMachineTypeError<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
> extends SuperSmallStateMachineError<State, Output, Input, Action, Process> {}
export class StateReferenceError<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
> extends SuperSmallStateMachineReferenceError<State, Output, Input, Action, Process> {}
export class StateTypeError<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
> extends SuperSmallStateMachineTypeError<State, Output, Input, Action, Process> {}
export class NodeTypeError<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
> extends SuperSmallStateMachineTypeError<State, Output, Input, Action, Process> {}
export class NodeReferenceError<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
> extends SuperSmallStateMachineReferenceError<State, Output, Input, Action, Process> {}
export class MaxIterationsError<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
> extends SuperSmallStateMachineError<State, Output, Input, Action, Process> {}
export class PathReferenceError<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
> extends SuperSmallStateMachineReferenceError<State, Output, Input, Action, Process> {}
export const Stack       = Symbol('SSSM Stack')
export const Symbols     = Symbol('SSSM Symbols')
export const Trace       = Symbol('SSSM Trace')
export const StrictTypes = Symbol('SSSM Strict Types')
export class Nodes<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
> extends Map<string | symbol, typeof Node> {
	constructor(...nodes: Array<typeof Node>) { super(nodes.flat(Infinity).map(node => [node.type,node])) }
	typeof(object: unknown, objectType: (typeof object) = typeof object, isAction: boolean = false): false | string | symbol {
		if (object instanceof Node) return (object.constructor as typeof Node).type
		const foundType = [...this.values()].reverse().find(current => current.typeof(object, objectType, isAction))
		return foundType ? foundType.type : false
	}
	get keywords() { return [...this.values()].flatMap(({ keywords }) => keywords) }
}
export class Node {
	static type: string | symbol = Symbol('SSSM Unnamed')
	static typeof<SelfType extends unknown = never>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType { return false };
	static keywords: Array<string> = []
	static execute<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
SelfType extends unknown = never,>(this: Instance<State, Output, Input, Action, Process>, node: SelfType, state: SystemState<State, Output>): Action | Promise<Action> { return node as unknown as Action }
	static proceed<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
SelfType extends unknown = never,>(this: Instance<State, Output, Input, Action, Process>, node: SelfType, state: SystemState<State, Output>): SystemState<State, Output> | Promise<SystemState<State, Output>> {
		if (state[Stack][0].point === 0) return ReturnNode.proceed.call(this, null, { ...state, [Return]: state[Return] })
		return S._proceed(this, { ...state, [Stack]: [{ ...state[Stack][0], point: state[Stack][0].point-1 }, ...state[Stack].slice(1)] }, get_path_object(this.process, state[Stack][0].path.slice(0,state[Stack][0].point-1)))
	}
	static perform<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
SelfType extends unknown = never,>(this: Instance<State, Output, Input, Action, Process>, action: SelfType, state: SystemState<State, Output>): SystemState<State, Output> | Promise<SystemState<State, Output>> { return state }
	static traverse<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
SelfType extends unknown = never,>(this: Instance<State, Output, Input, Action, Process>, node: SelfType, path: Path, iterate: ((path: Path) => SelfType)): SelfType { return node }
	value = undefined
	constructor(node) { this.value = node }
}
export interface Instance<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
> {
	config: Config<State, Output, Input, Action, Process>,
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
	until: (this: Instance<State, Output, Input, Action, Process>, state: SystemState<State, Output>, runs: number) => boolean,
	strict: boolean | typeof StrictTypes,
	override: null | ((...args: Input) => Output),
	adapt: Array<(process: Process) => Process>,
	before: Array<(state: SystemState<State, Output>) => SystemState<State, Output>>,
	after: Array<(state: SystemState<State, Output>) => SystemState<State, Output>>,
	input: (...input: Input) => Partial<InputSystemState<State, Output>>,
	output: (state: SystemState<State, Output>) => Output,
	nodes: Nodes<State, Output, Input, Action, Process>,
	trace: boolean,
	deep: boolean,
}
	export const ErrorN = Symbol('SSSM Error')
	export type ErrorType = Error | ErrorConstructor
	export class ErrorNode extends Node {
		static type = ErrorN
		static typeof<SelfType = ErrorType>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType { return (objectType === 'object' && object instanceof Error) || (objectType === 'function' && (object === Error || (object as Function).prototype instanceof Error)) }
		static perform<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
SelfType = ErrorType,>(this: Instance<State, Output, Input, Action, Process>, action: SelfType, state: SystemState<State, Output>): SystemState<State, Output> | Promise< SystemState<State, Output>> {
			if (typeof action === 'function') throw new (action as unknown as ErrorConstructor)()
			throw action
		}
	}
	export const Changes = Symbol('SSSM Changes')
	export type ChangesType<State extends InitialState = InitialState> = Partial<State>
	export class ChangesNode extends Node {
		static type = Changes
		static typeof<SelfType = ChangesType>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType { return Boolean(object && objectType === 'object') }
		static perform<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
SelfType = ChangesType<State>,>(this: Instance<State, Output, Input, Action, Process>, action: SelfType, state: SystemState<State, Output>): SystemState<State, Output> | Promise< SystemState<State, Output>> { return S._changes(this, state, action as ChangesType<State>) as SystemState<State, Output> }
	}
	export const Sequence = Symbol('SSSM Sequence')
	export type SequenceType<State extends InitialState = InitialState, Output extends unknown = undefined, Action extends unknown = ActionType<State, Output>> = Array<ProcessType<State, Output, Action>>
	export class SequenceNode extends Node {
		static type = Sequence
		static proceed<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
SelfType = SequenceType<State, Output, Action>,>(this: Instance<State, Output, Input, Action, Process>, node: SelfType, state: SystemState<State, Output>): SystemState<State, Output> | Promise<SystemState<State, Output>> {
			const index = state[Stack][0].path[state[Stack][0].point]
			if (node && (typeof index === 'number') && (index+1 < (node as SequenceType<State, Output, Action>).length))
				return { ...state, [Stack]: [{ ...state[Stack][0], path: [...state[Stack][0].path.slice(0,state[Stack][0].point), index+1], point: state[Stack][0].point + 1 }, ...state[Stack].slice(1)] }
			return Node.proceed.call(this as any, node, state) as SystemState<State, Output>
		}
		static typeof<SelfType = SequenceType>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType { return ((!isAction) && objectType === 'object' && Array.isArray(object)) }
		static execute<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
SelfType = SequenceType<State, Output, Action>,>(this: Instance<State, Output, Input, Action, Process>, node: SelfType, state: SystemState<State, Output>): Action | Promise<Action> { return ((node as SequenceType<State, Output, Action>).length ? [ ...state[Stack][0].path.slice(0,state[Stack][0].point), 0 ] : null) as Action }
		static traverse<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
SelfType = SequenceType<State, Output, Action>,>(this: Instance<State, Output, Input, Action, Process>, node: SelfType, path: Path, iterate: ((path: Path) => SelfType)): SelfType { return (node as SequenceType<State, Output, Action>).map((_,i) => iterate([...path,i])) as SelfType }
	}
	export const FunctionN = Symbol('SSSM Function')
	export type FunctionType<State extends InitialState = InitialState, Output extends unknown = undefined, Action extends unknown = ActionType<State, Output>> = (state: SystemState<State, Output>) => Action | Promise<Action>
	export class FunctionNode extends Node {
		static type = FunctionN
		static typeof<SelfType = FunctionType>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType { return (!isAction) && objectType === 'function' }
		static execute<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
SelfType = FunctionType<State, Output, Action>,>(this: Instance<State, Output, Input, Action, Process>, node: SelfType, state: SystemState<State, Output>): Action | Promise<Action> { return (node as FunctionType<State, Output, Action>)(state) }
	}
	export const Undefined = Symbol('SSSM Undefined')
	export class UndefinedNode extends Node {
		static type = Undefined
		static typeof<SelfType = undefined>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType { return objectType === 'undefined' }
		static execute<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
SelfType = undefined>(this: Instance<State, Output, Input, Action, Process>, node: SelfType, state: SystemState<State, Output>): Action | Promise<Action> { throw new NodeReferenceError(`There is nothing to execute at path [ ${state[Stack][0].path.slice(0,state[Stack][0].point).map(key => key.toString()).join(', ')} ]`, { instance: this, state, data: { node } }) }
	}
	export const Empty = Symbol('SSSM Empty')
	export class EmptyNode extends Node {
		static type = Empty
		static typeof<SelfType = null>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType { return object === null }
	}
	export const Condition = Symbol('SSSM Condition')
	export interface ConditionType<
			State extends InitialState = InitialState,
			Output extends unknown = undefined,
			Action extends unknown = ActionType<State, Output>,
		> {
			if: (state: SystemState<State, Output>) => boolean,
			then?: ProcessType<State, Output, Action>
			else?: ProcessType<State, Output, Action>
		}
	export class ConditionNode extends Node {
		static type = Condition
		static typeof<SelfType = ConditionType>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType { return Boolean((!isAction) && object && objectType === 'object' && ('if' in (object as object))) }
		static keywords = ['if','then','else']
		static execute<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
SelfType = ConditionType<State, Output, Action>,>(this: Instance<State, Output, Input, Action, Process>, node: SelfType, state: SystemState<State, Output>): Action | Promise<Action> {
			if (normalise_function((node as ConditionType<State, Output, Action>).if)(state))
			return ('then' in (node as ConditionType<State, Output, Action>) ? [ ...state[Stack][0].path.slice(0,state[Stack][0].point), 'then' ] : null) as Action
			return ('else' in (node as ConditionType<State, Output, Action>) ? [ ...state[Stack][0].path.slice(0,state[Stack][0].point), 'else' ] : null) as Action
		}
		static traverse<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
SelfType = ConditionType<State, Output, Action>,>(this: Instance<State, Output, Input, Action, Process>, node: SelfType, path: Path, iterate: ((path: Path) => SelfType)): SelfType { return {
			...node,
			...('then' in (node as ConditionType<State, Output, Action>) ? { then: iterate([...path,'then']) } : {}),
			...('else' in (node as ConditionType<State, Output, Action>) ? { else: iterate([...path,'else']) } : {}),
			...(Symbols in (node as ConditionType<State, Output, Action>) ? Object.fromEntries((node[Symbols] as Array<symbol>).map(key => [key, iterate([...path,key])])) : {}),
		} }
	}
	export const Switch = Symbol('SSSM Switch')
	export interface SwitchType<
			State extends InitialState = InitialState,
			Output extends unknown = undefined,
			Action extends unknown = ActionType<State, Output>,
		> {
			switch: (state: SystemState<State, Output>) => string | number,
			case: Record<string | number, ProcessType<State, Output, Action>>
		}
	export class SwitchNode extends Node {
		static type = Switch
		static typeof<SelfType = SwitchType>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType { return Boolean((!isAction) && object && objectType === 'object' && ('switch' in (object as object))) }
		static keywords = ['switch','case','default']
		static execute<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
SelfType = SwitchType<State, Output, Action>,>(this: Instance<State, Output, Input, Action, Process>, node: SelfType, state: SystemState<State, Output>): Action | Promise<Action> {
			const key = normalise_function((node as SwitchType<State, Output, Action>).switch)(state)
			const fallbackKey = (key in (node as SwitchType<State, Output, Action>).case) ? key : 'default'
			return ((fallbackKey in (node as SwitchType<State, Output, Action>).case) ? [ ...state[Stack][0].path.slice(0,state[Stack][0].point), 'case', fallbackKey ] : null) as Action
		}
		static traverse<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
SelfType = SwitchType<State, Output, Action>,>(this: Instance<State, Output, Input, Action, Process>, node: SelfType, path: Path, iterate: ((path: Path) => SelfType)): SelfType { return { ...node, case: Object.fromEntries(Object.keys((node as SwitchType<State, Output, Action>).case).map(key => [ key, iterate([...path,'case',key]) ])), ...(Symbols in (node as SwitchType<State, Output, Action>) ? Object.fromEntries((node[Symbols] as Array<symbol>).map(key => [key, iterate([...path,key])])) : {}) } }
	}
	export const While = Symbol('SSSM While')
	export interface WhileType<
			State extends InitialState = InitialState,
			Output extends unknown = undefined,
			Action extends unknown = ActionType<State, Output>,
		> {
			while: (state: SystemState<State, Output>) => boolean,
			do: ProcessType<State, Output, Action>
		}
	export class WhileNode extends Node {
		static type = While
		static typeof<SelfType = WhileType>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType { return Boolean((!isAction) && object && objectType === 'object' && ('while' in (object as object))) }
		static keywords = ['while','do']
		static execute<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
SelfType = WhileType<State, Output, Action>,>(this: Instance<State, Output, Input, Action, Process>, node: SelfType, state: SystemState<State, Output>): Action | Promise<Action> {
				if (!(('do' in (node as WhileType<State, Output, Action>)) && normalise_function((node as WhileType<State, Output, Action>).while)(state))) return null as Action
				return [ ...state[Stack][0].path.slice(0,state[Stack][0].point), 'do' ] as Action
		}
		static proceed<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
SelfType = WhileType<State, Output, Action>,>(this: Instance<State, Output, Input, Action, Process>, node: SelfType, state: SystemState<State, Output>): SystemState<State, Output> | Promise<SystemState<State, Output>> { return { ...state, [Stack]: [ { ...state[Stack][0], path: state[Stack][0].path.slice(0,state[Stack][0].point) }, ...state[Stack].slice(1) ] } }
		static traverse<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
SelfType = WhileType<State, Output, Action>,>(this: Instance<State, Output, Input, Action, Process>, node: SelfType, path: Path, iterate: ((path: Path) => SelfType)): SelfType { return { ...node, ...('do' in (node as WhileType<State, Output, Action>) ? { do: iterate([ ...path, 'do' ]) } : {}), ...(Symbols in (node as WhileType<State, Output, Action>) ? Object.fromEntries((node[Symbols] as Array<symbol>).map(key => [key, iterate([...path,key])])) : {}), } }
	}
	export const Machine = Symbol('SSSM Machine')
	export interface MachineType<
			State extends InitialState = InitialState,
			Output extends unknown = undefined,
			Action extends unknown = ActionType<State, Output>,
		> {
			initial: ProcessType<State, Output, Action>
			[key: string | number]: ProcessType<State, Output, Action>
			[Symbols]?: Array<InterruptGotoType>
		}
	export class MachineNode extends Node {
		static type = Machine
		static typeof<SelfType = MachineType>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType { return Boolean((!isAction) && object && objectType === 'object' && ('initial' in (object as object))) }
		static keywords = ['initial']
		static execute<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
SelfType = MachineType<State, Output, Action>,>(this: Instance<State, Output, Input, Action, Process>, node: SelfType, state: SystemState<State, Output>): Action | Promise<Action> { return [ ...state[Stack][0].path.slice(0,state[Stack][0].point), 'initial' ] as Action }
		static traverse<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
SelfType = MachineType<State, Output, Action>,>(this: Instance<State, Output, Input, Action, Process>, node: SelfType, path: Path, iterate: ((path: Path) => SelfType)): SelfType { return { ...node, ...Object.fromEntries(Object.keys(node as object).concat((Symbols in (node as object)) ? (node as SelfType)[Symbols]: []).map(key => [ key, iterate([...path,key]) ])) } }
	}
	export const Goto = Symbol('SSSM Goto')
	export type GotoType = { [Goto]: AbsoluteGotoType | SequenceGotoType | MachineGotoType }
	export class GotoNode extends Node {
		static type = Goto
		static typeof<SelfType = GotoType>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType  { return Boolean(object && objectType === 'object' && (Goto in (object as object))) }
		static perform<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
SelfType = GotoType,>(this: Instance<State, Output, Input, Action, Process>, action: SelfType, state: SystemState<State, Output>): SystemState<State, Output> | Promise< SystemState<State, Output>> { return S._perform(this, state, (action as GotoType)[Goto] as Action) }
		static proceed(node, state) { return state }
	}
	export const SequenceGoto = Symbol('SSSM Sequence Goto')
	export type SequenceGotoType = number
	export class SequenceGotoNode extends GotoNode {
		static type = SequenceGoto
		static typeof<SelfType = SequenceGotoType>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType { return objectType === 'number' }
		static perform<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
SelfType = SequenceGotoType,>(this: Instance<State, Output, Input, Action, Process>, action: SelfType, state: SystemState<State, Output>): SystemState<State, Output> | Promise< SystemState<State, Output>> {
			const lastOf = S._closest(this, state[Stack][0].path.slice(0,state[Stack][0].point-1), SequenceNode.type)
			if (!lastOf) throw new PathReferenceError(`A relative goto has been provided as a number (${String(action)}), but no sequence exists that this number could be an index of from path [ ${state[Stack][0].path.slice(0,state[Stack][0].point).map(key => key.toString()).join(', ')} ].`, { instance: this, state, data: { action } })
			return { ...state, [Stack]: [ { ...state[Stack][0], path: [...lastOf, action as SequenceGotoType], point: lastOf.length + 1 }, ...state[Stack].slice(1) ] }
		}
	}
	export const MachineGoto = Symbol('SSSM Machine Goto')
	export type MachineGotoType = string
	export class MachineGotoNode extends GotoNode {
		static type = MachineGoto
		static typeof<SelfType = MachineGotoType>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType { return objectType === 'string' }
		static perform<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
SelfType = MachineGotoType,>(this: Instance<State, Output, Input, Action, Process>, action: SelfType, state: SystemState<State, Output>): SystemState<State, Output> | Promise< SystemState<State, Output>> {
			const lastOf = S._closest(this, state[Stack][0].path.slice(0,state[Stack][0].point-1), MachineNode.type)
			if (!lastOf) throw new PathReferenceError(`A relative goto has been provided as a string (${String(action)}), but no state machine exists that this string could be a state of. From path [ ${state[Stack][0].path.slice(0,state[Stack][0].point).map(key => key.toString()).join(', ')} ].`, { instance: this, state, data: { action } })
			return { ...state, [Stack]: [ { ...state[Stack][0], path: [...lastOf, action as MachineGotoType], point: lastOf.length + 1 }, ...state[Stack].slice(1) ] }
		}
	}
	export const InterruptGoto = Symbol('SSSM Interrupt Goto')
	export type InterruptGotoType = symbol
	export class InterruptGotoNode extends GotoNode {
		static type = InterruptGoto
		static typeof<SelfType = InterruptGotoType>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType { return objectType === 'symbol' }
		static perform<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
SelfType = InterruptGotoType,>(this: Instance<State, Output, Input, Action, Process>, action: SelfType, state: SystemState<State, Output>): SystemState<State, Output> | Promise< SystemState<State, Output>> {
			const lastOf = get_closest_path(this.process, state[Stack][state[Stack].length-1].path.slice(0,state[Stack][state[Stack].length-1].point-1), parentNode => Boolean(parentNode && (typeof parentNode === 'object') && ((action as InterruptGotoType) in (parentNode as object))))
			if (!lastOf) return { ...state, [Return]: action } as SystemState<State, Output>
			return { ...state, [Stack]: [ { origin: action as InterruptGotoType, path: [...lastOf, action as InterruptGotoType], point: lastOf.length + 1 }, ...state[Stack] ] }
		}
		static proceed<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
SelfType = InterruptGotoType,>(this: Instance<State, Output, Input, Action, Process>, node: SelfType, state: SystemState<State, Output>): SystemState<State, Output> | Promise< SystemState<State, Output>> {
			if (state[Return] === node) return ReturnNode.proceed.call(this, undefined, state)
			const { [Stack]: stack, [Return]: interruptReturn, ...proceedPrevious } = S._proceed(this, { ...state, [Stack]: state[Stack].slice(1) }, undefined)
			return { ...proceedPrevious, [Stack]: [ state[Stack][0], ...stack ] } as SystemState<State, Output>
		}
	}
	export const AbsoluteGoto = Symbol('SSSM Absolute Goto')
	export type AbsoluteGotoType = Path
	export class AbsoluteGotoNode extends GotoNode {
		static type = AbsoluteGoto
		static typeof<SelfType = AbsoluteGotoType>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType  { return isAction && Array.isArray(object) }
		static perform<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
SelfType = AbsoluteGotoType,>(this: Instance<State, Output, Input, Action, Process>, action: SelfType, state: SystemState<State, Output>): SystemState<State, Output> | Promise< SystemState<State, Output>> { return { ...state, [Stack]: [ { ...state[Stack][0], path: (action as AbsoluteGotoType), point: (action as AbsoluteGotoType).length }, ...state[Stack].slice(1) ] } }
	}
	export const Return = Symbol('SSSM Return')
	export type ReturnObjectType<Output extends unknown = unknown> = { [Return]: Output }
	export type ReturnType<Output extends unknown = unknown> = ReturnObjectType<Output> | typeof Return
	export class ReturnNode extends GotoNode {
		static type = Return
		static typeof<SelfType = ReturnType>(object: unknown, objectType: typeof object, isAction: boolean): object is SelfType  { return object === Return || Boolean(object && objectType === 'object' && (Return in (object as object))) }
		static perform<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
SelfType = ReturnType<Output>,>(this: Instance<State, Output, Input, Action, Process>, action: SelfType, state: SystemState<State, Output>): SystemState<State, Output> | Promise<SystemState<State, Output>> { return { ...state, [Return]: !action || action === Return ? undefined : (action as unknown as ReturnObjectType<Output>)[Return] as Output, } }
		static proceed<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
SelfType = ReturnType<Output>,>(this: Instance<State, Output, Input, Action, Process>, action: SelfType, state: SystemState<State, Output>): SystemState<State, Output> | Promise<SystemState<State, Output>> {
			if (state[Stack].length === 1) return { ...(state[Stack][0].point === 0 ? { ...state, [Stack]: [] } : S._proceed(this, state, undefined)), [Return]: state[Return] }
			const { [Return]: interruptReturn, ...cleanState } = state
			return { ...cleanState, [Stack]: state[Stack].slice(1), [state[Stack][0].origin]: interruptReturn } as SystemState<State, Output>
		}
	}
	export const Continue = Symbol('SSSM Continue')
	export type ContinueType = typeof Continue
	export class ContinueNode extends GotoNode {
		static type = Continue
		static typeof<SelfType = ContinueType>(object: unknown, objectType: typeof object): object is SelfType { return object === Continue }
		static perform<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
SelfType = ContinueType,>(this: Instance<State, Output, Input, Action, Process>, action: SelfType, state: SystemState<State, Output>): SystemState<State, Output> | Promise< SystemState<State, Output>> {
			const lastOf = S._closest(this, state[Stack][0].path.slice(0,state[Stack][0].point-1), WhileNode.type)
			if (!lastOf) throw new PathReferenceError(`A Continue has been used, but no While exists that this Continue could refer to. From path [ ${state[Stack][0].path.slice(0,state[Stack][0].point).map(key => key.toString()).join(', ')} ].`, { instance: this, state, data: { action } })
			return { ...state, [Stack]: [ { ...state[Stack][0], path: lastOf, point: lastOf.length }, ...state[Stack].slice(1) ] }
		}
	}
	export const Break = Symbol('SSSM Break')
	export type BreakType = typeof Break
	export class BreakNode extends GotoNode {
		static type = Break
		static typeof<SelfType = BreakType>(object: unknown, objectType: typeof object): object is SelfType { return object === Break }
		static proceed<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
SelfType = BreakType,>(this: Instance<State, Output, Input, Action, Process>, node: SelfType, state: SystemState<State, Output>): SystemState<State, Output> | Promise< SystemState<State, Output>> {
			const lastOf = S._closest(this, state[Stack][0].path.slice(0,state[Stack][0].point-1), WhileNode.type)
			if (!lastOf) throw new PathReferenceError(`A Break has been used, but no While exists that this Break could refer to. From path [ ${state[Stack][0].path.slice(0,state[Stack][0].point).map(key => key.toString()).join(', ')} ].`, { instance: this, state, data: { node } })
			return S._proceed(this, { ...state, [Stack]: [{ ...state[Stack][0], point: lastOf.length-1 }, ...state[Stack].slice(1)] }, get_path_object(this.process, lastOf.slice(0,-1)))
		}
		static perform = Node.perform
	}
export type PathUnit = SequenceGotoType | MachineGotoType | InterruptGotoType
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

export class ExtensibleFunction extends Function {
	constructor(f: Function) { super(); return Object.setPrototypeOf(f, new.target.prototype) }
}
export interface SuperSmallStateMachineCore<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
> { process: Process; (...args: Input): Output; }
export abstract class SuperSmallStateMachineCore<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
> extends ExtensibleFunction {
	public static readonly config: Config = {
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
	public static _closest<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
>(instance: Instance<State, Output, Input, Action, Process>, path: Path, ...nodeTypes: Array<string | symbol | Array<string | symbol>>): Path | null {
		const flatTypes = nodeTypes.flat(Infinity)
		return get_closest_path(instance.process, path, node => {
			const nodeType = instance.config.nodes.typeof(node)
			return Boolean(nodeType && flatTypes.includes(nodeType))
		})
	}
	public static _changes<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
>(instance: Instance<State, Output, Input, Action, Process>, state: SystemState<State, Output>, changes: Partial<State>): SystemState<State, Output> {
		if (instance.config.strict && Object.entries(changes).some(([property]) => !(property in state)))
			throw new StateReferenceError(`Only properties that exist on the initial context may be updated.\nYou changed [ ${Object.keys(changes).filter(property => !(property in state)).map(key => key.toString()).join(', ')} ], which ${Object.keys(changes).filter(property => !(property in state)).length === 1 ? 'is' : 'are'} not in: [ ${Object.keys(state).map(key => key.toString()).join(', ')} ].\nPath: [ ${state[Stack][0].path.slice(0,state[Stack][0].point).map(key => key.toString()).join(' / ')} ]`, { instance, state, data: { changes } })
		if (instance.config.strict === StrictTypes && Object.entries(changes).some(([property,value]) => typeof value !== typeof state[property]))
			throw new StateTypeError(`Properties must have the same type as their initial value. ${Object.entries(changes).filter(([property,value]) => typeof value !== typeof state[property]).map(([property,value]) => `${typeof value} given for '${property}', should be ${typeof state[property]}`).join('. ')}.`, { instance, state, data: { changes } })
		const merge = instance.config.deep ? deep_merge_object : shallow_merge_object
		const allChanges = merge(state[Changes] || {}, changes)
		return { ...merge(state, allChanges), [Changes]: allChanges } as SystemState<State, Output>
	}
	public static _proceed<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
>(instance: Instance<State, Output, Input, Action, Process>, state: SystemState<State, Output>, node: Process | Action = undefined as unknown as Action): SystemState<State, Output> {
		const nodeType = instance.config.nodes.typeof(node, typeof node, state[Stack][0].point === state[Stack][0].path.length)
		if (!nodeType) throw new NodeTypeError(`Unknown action type: ${typeof node}${nodeType ? `, nodeType: ${String(nodeType)}` : ''}`, { instance, state, data: { node } })
		return instance.config.nodes.get(nodeType)!.proceed.call(instance as any, node instanceof Node ? node.value : node, state) as SystemState<State, Output>
	}
	public static _perform<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
>(instance: Instance<State, Output, Input, Action, Process>, state: SystemState<State, Output>, action: Action = null as Action): SystemState<State, Output> {
		const nodeType = instance.config.nodes.typeof(action, typeof action, true)
		if (!nodeType) throw new NodeTypeError(`Unknown action type: ${typeof action}${nodeType ? `, nodeType: ${String(nodeType)}` : ''}.`, { instance, state, data: { action } })
		return instance.config.nodes.get(nodeType)!.perform.call(instance as any, action instanceof Node ? action.value : action, state) as SystemState<State, Output>
	}
	public static _execute<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
>(instance: Instance<State, Output, Input, Action, Process>, state: SystemState<State, Output>, node: Process = get_path_object(instance.process, state[Stack][0].path.slice(0,state[Stack][0].point)) as Process): Action {
		const nodeType = instance.config.nodes.typeof(node)
		if (!nodeType) throw new NodeTypeError(`Unknown node type: ${typeof node}${nodeType ? `, nodeType: ${String(nodeType)}` : ''}.`, { instance, state, data: { node } })
		return instance.config.nodes.get(nodeType)!.execute.call(instance as any, node instanceof Node ? node.value : node, state) as Action
	}
	public static _traverse<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
> (instance: Instance<State, Output, Input, Action, Process>, iterator: ((node: Process, path: Path, process: Process, nodeType: string | symbol) => Process) = ident): Process {
		const iterate = (path: Path = []): Process => {
			const node = get_path_object<Process>(instance.process, path)!
			const nodeType = instance.config.nodes.typeof(node)
			if (!nodeType) throw new NodeTypeError(`Unknown node type: ${typeof node}${nodeType ? `, nodeType: ${String(nodeType)}` : ''} at [ ${path.map(key => key.toString()).join(', ')} ]`, { instance, data: { node } })
			return iterator.call(instance, instance.config.nodes.get(nodeType)!.traverse.call(instance as any, node instanceof Node ? node.value : node, path, iterate) as Process, path, instance.process, nodeType)
		}
		return iterate()
	}
	public static _run<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
>(instance: Instance<State, Output, Input, Action, Process>, ...input: Input): Output {
		const { until, iterations, input: adaptInput, output: adaptOutput, before, after, defaults, trace } = { ...this.config, ...instance.config }
		const modifiedInput = adaptInput.apply(instance, input) || {}
		let r = 0, currentState = { ...before.reduce((prev, modifier) => modifier.call(instance, prev), this._changes(instance, {
			[Changes]: {},
			...defaults,
			[Stack]: modifiedInput[Stack] || [{path:[],origin:Return,point:0}], [Trace]: modifiedInput[Trace] || [],
			...(Return in modifiedInput ? {[Return]: modifiedInput[Return]} : {})
		} as SystemState<State, Output>, modifiedInput)), [Changes]: modifiedInput[Changes] || {} }
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
export abstract class SuperSmallStateMachineChain<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
> extends SuperSmallStateMachineCore<State, Output, Input, Action, Process> {
	static closest<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
>(path: Path, ...nodeTypes: Array<string | symbol | Array<string | symbol>>) { return (instance: Instance<State, Output, Input, Action, Process>): Path | null => this._closest(instance, path, ...nodeTypes) }
	static changes<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
>(state: SystemState<State, Output>, changes: Partial<State>) { return (instance: Instance<State, Output, Input, Action, Process>): SystemState<State, Output> => this._changes(instance, state, changes) }
	static proceed<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
>(state: SystemState<State, Output>, node: Process | Action) { return (instance: Instance<State, Output, Input, Action, Process>): SystemState<State, Output> => this._proceed(instance, state, node) }
	static perform<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
>(state: SystemState<State, Output>, action: Action) { return (instance: Instance<State, Output, Input, Action, Process>): SystemState<State, Output> => this._perform(instance, state, action) }
	static execute<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
>(state: SystemState<State, Output>, node: Process) { return (instance: Instance<State, Output, Input, Action, Process>): Action => this._execute(instance, state, node) }
	static traverse<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
>(iterator: ((node: Process, path: Path, process: Process, nodeType: string | symbol) => Process)) { return (instance: Instance<State, Output, Input, Action, Process>) => this._traverse(instance, iterator) }
	static run<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
>(...input: Input) { return (instance: Instance<State, Output, Input, Action, Process>): Output => this._run(instance, ...input) }
	static do<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
>(process: Process) { return (instance: Instance<State, Output, Input, Action, Process>): Instance<State, Output, Input, Action, Process> => ({ process: instance.config.adapt.reduce((prev, modifier) => modifier.call(instance, prev), process), config: instance.config }) }
	static defaults<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
	NewState extends InitialState = State,
>(defaults: NewState) { return (instance: Instance<State, Output, Input, Action, Process>): Pick<S<NewState, Output, [Partial<InputSystemState<NewState>>] | [], ActionType<NewState, Output>, ProcessType<NewState, Output, ActionType<NewState, Output>>>, 'process' | 'config'> => ({ process: instance.process as unknown as ProcessType<NewState, Output, ActionType<NewState, Output>>, config: { ...instance.config, defaults } as unknown as Config<NewState, Output, [Partial<InputSystemState<NewState>>] | [], ActionType<NewState, Output>, ProcessType<NewState, Output, ActionType<NewState, Output>>>, }) }
	static input<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
	NewInput extends Array<unknown> = Array<unknown>,
>(input: (...input: NewInput) => Partial<InputSystemState<State, Output>>) { return (instance: Instance<State, Output, Input, Action, Process>): Pick<S<State, Output, NewInput, Action, Process>, 'process' | 'config'> => ({ process: instance.process, config: { ...instance.config, input } as unknown as Config<State, Output, NewInput, Action, Process>, }) }
	static output<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
	NewResult extends unknown = Output,
>(output: (state: SystemState<State, Output>) => NewResult) { return (instance: Instance<State, Output, Input, Action, Process>): Pick<S<State, NewResult, Input, ActionType<State, NewResult>, ProcessType<State, NewResult, ActionType<State, NewResult>>>, 'process' | 'config'> => ({ process: instance.process as unknown as ProcessType<State, NewResult, ActionType<State, NewResult>>, config: { ...instance.config, output } as unknown as Config<State, NewResult, Input, ActionType<State, NewResult>, ProcessType<State, NewResult, ActionType<State, NewResult>>>, }) }
	static untrace<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
>(instance: Instance<State, Output, Input, Action, Process>): Instance<State, Output, Input, Action, Process> { return ({ process: instance.process, config: { ...instance.config, trace: false }, }) }
	static trace<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
>(instance: Instance<State, Output, Input, Action, Process>): Instance<State, Output, Input, Action, Process> { return ({ process: instance.process, config: { ...instance.config, trace: true }, }) }
	static shallow<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
>(instance: Instance<State, Output, Input, Action, Process>): Instance<State, Output, Input, Action, Process> { return ({ process: instance.process, config: { ...instance.config, deep: false }, }) }
	static deep<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
>(instance: Instance<State, Output, Input, Action, Process>): Instance<State, Output, Input, Action, Process> { return ({ process: instance.process, config: { ...instance.config, deep: true }, }) }
	static unstrict<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
>(instance: Instance<State, Output, Input, Action, Process>): Instance<State, Output, Input, Action, Process> { return ({ process: instance.process, config: { ...instance.config, strict: false }, }) }
	static strict<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
> (instance: Instance<State, Output, Input, Action, Process>): Instance<State, Output, Input, Action, Process> { return ({ process: instance.process, config: { ...instance.config, strict: true }, }) }
	static strictTypes<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
> (instance: Instance<State, Output, Input, Action, Process>): Instance<State, Output, Input, Action, Process> { return ({ process: instance.process, config: { ...instance.config, strict: StrictTypes }, }) }
	static for<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
>(iterations: number = 10000) { return (instance: Instance<State, Output, Input, Action, Process>): Instance<State, Output, Input, Action, Process> => ({ process: instance.process, config: { ...instance.config, iterations }, }) }
	static until<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
>(until: Config<State, Output, Input, Action, Process>['until']) { return (instance: Instance<State, Output, Input, Action, Process>): Instance<State, Output, Input, Action, Process> => ({ process: instance.process, config: { ...instance.config, until }, }) }
	static forever<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
> (instance: Instance<State, Output, Input, Action, Process>): Instance<State, Output, Input, Action, Process> { return ({ process: instance.process, config: { ...instance.config, iterations: Infinity }, }) }
	static override<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
>(override: ((...args: Input) => Output) | null) { return (instance: Instance<State, Output, Input, Action, Process>): Instance<State, Output, Input, Action, Process> => ({ process: instance.process, config: { ...instance.config, override } }) }
	static addNode<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
>(...nodes: any[]) { return (instance: Instance<State, Output, Input, Action, Process>) => ({ process: instance.process, config: { ...instance.config, nodes: new Nodes(...instance.config.nodes.values(),...nodes) }, }) }
	static adapt<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
>(...adapters: Array<(process: Process) => Process>) { return (instance: Instance<State, Output, Input, Action, Process>): Pick< S<State, Output, Input, Action, Process>, 'process' | 'config'> => ({ process: adapters.reduce((prev, adapter) => adapter.call(instance, prev), instance.process), config: { ...instance.config, adapt: [ ...instance.config.adapt, ...adapters ] }, }) }
	static before<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
>(...adapters: Array<(state: SystemState<State, Output>) => SystemState<State, Output>>) { return (instance: Instance<State, Output, Input, Action, Process>): Instance<State, Output, Input, Action, Process> => ({ process: instance.process, config: { ...instance.config, before: [ ...instance.config.before, ...adapters ] }, }) }
	static after<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
>(...adapters: Array<(state: SystemState<State, Output>) => SystemState<State, Output>>) { return (instance: Instance<State, Output, Input, Action, Process>): Instance<State, Output, Input, Action, Process> => ({ process: instance.process, config: { ...instance.config, after: [ ...instance.config.after, ...adapters ] }, }) }
	static with<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,

	NewState extends InitialState = State,
	NewResult extends unknown = Output,
	NewInput extends Array<unknown> = Input,
	NewAction extends unknown = Action,
	NewProcess extends unknown = Process
>(...adapters: Array<((instance: Instance<State, Output, Input, Action, Process>) => Pick<S<NewState, NewResult, NewInput, NewAction, NewProcess>, 'process' | 'config'>)>) {
		const flatAdapters = adapters.flat(Infinity)
		return (instance: Instance<State, Output, Input, Action, Process>): S<NewState, NewResult, NewInput, NewAction, NewProcess> => {
			const adapted = flatAdapters.reduce((prev, adapter) => adapter.call(instance, prev) as unknown as Instance<State, Output, Input, Action, Process>, instance) as unknown as Pick<S<NewState, NewResult, NewInput, NewAction, NewProcess>, 'process' | 'config'>
			return adapted instanceof S ? adapted : new S<NewState, NewResult, NewInput, NewAction, NewProcess>(adapted.process, adapted.config)
		}
	}
}
export default class S<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionType<State, Output>,
	Process extends unknown = ProcessType<State, Output, Action>,
> extends SuperSmallStateMachineChain<State, Output, Input, Action, Process> {
	process = null as Process
	#config: Config<State, Output, Input, Action, Process> = S.config as unknown as Config<State, Output, Input, Action, Process>
	get config(): Config<State, Output, Input, Action, Process> { return { ...this.#config } }
	constructor(process: Process = (null as Process), config: Config<State, Output, Input, Action, Process> = (S.config as unknown as Config<State, Output, Input, Action, Process>)) {
		super((...input: Input): Output => (config.override || this.run).apply(this, input))
		this.#config = { ...this.#config, ...config } as unknown as Config<State, Output, Input, Action, Process>
		this.process = process
	}
	closest(path: Path, ...nodeTypes: Array<string | symbol | Array<string | symbol>>): Path | null { return S._closest(this, path, ...nodeTypes) }
	changes(state: SystemState<State, Output>, changes: Partial<State>): SystemState<State, Output> { return S._changes(this, state, changes) }
	proceed(state: SystemState<State, Output>, node: Process | Action) { return S._proceed(this, state, node) }
	perform(state: SystemState<State, Output>, action: Action) { return S._perform(this, state, action) }
	execute(state: SystemState<State, Output>, node: Process) { return S._execute(this, state, node) }
	traverse(iterator: ((node: Process, path: Path, process: Process, nodeType: string | symbol) => Process)){ return S._traverse(this, iterator) }
	run (...input: Input): Output { return S._run(this, ...input) }
	do(process: Process): S<State, Output, Input, Action, Process> { return this.with(S.do(process)) }
	defaults<NewState extends InitialState = State>(defaults: NewState): S<NewState, Output, [Partial<InputSystemState<NewState>>] | [], ActionType<NewState, Output>, ProcessType<NewState, Output, ActionType<NewState, Output>>> { return this.with(S.defaults(defaults)) }
	input<NewInput extends Array<unknown> = Array<unknown>>(input: (...input: NewInput) => Partial<InputSystemState<State, Output>>): S<State, Output, NewInput, Action, Process> { return this.with(S.input(input)) }
	output<NewResult extends unknown = Output>(output: (state: SystemState<State, Output>) => NewResult): S<State, NewResult, Input, ActionType<State, NewResult>, ProcessType<State, NewResult, ActionType<State, NewResult>>> { return this.with(S.output(output)) }
	get untrace(): S<State, Output, Input, Action, Process> { return this.with(S.untrace) }
	get trace(): S<State, Output, Input, Action, Process> { return this.with(S.trace) }
	get shallow(): S<State, Output, Input, Action, Process> { return this.with(S.shallow) }
	get deep(): S<State, Output, Input, Action, Process> { return this.with(S.deep) }
	get unstrict(): S<State, Output, Input, Action, Process> { return this.with(S.unstrict) }
	get strict(): S<State, Output, Input, Action, Process> { return this.with(S.strict) }
	get strictTypes(): S<State, Output, Input, Action, Process> { return this.with(S.strictTypes) }
	for(iterations: number): S<State, Output, Input, Action, Process> { return this.with(S.for(iterations)) }
	until(until: Config<State, Output, Input, Action, Process>['until']): S<State, Output, Input, Action, Process> { return this.with(S.until(until)) }
	get forever(): S<State, Output, Input, Action, Process> { return this.with(S.forever) }
	override(override: ((...args: Input) => Output) | null): S<State, Output, Input, Action, Process> { return this.with(S.override(override)) }
	addNode(...nodes: any[]) { return this.with(S.addNode(...nodes)) }
	adapt(...adapters: Array<(process: Process) => Process>): S<State, Output, Input, Action, Process> { return this.with(S.adapt(...adapters)) }
	before(...adapters: Array<(state: SystemState<State, Output>) => SystemState<State, Output>>): S<State, Output, Input, Action, Process> { return this.with(S.before(...adapters)) }
	after(...adapters: Array<(state: SystemState<State, Output>) => SystemState<State, Output>>): S<State, Output, Input, Action, Process> { return this.with(S.after(...adapters)) }
	with<NewState extends InitialState = State, NewResult extends unknown = Output, NewInput extends Array<unknown> = Input, NewAction extends unknown = Action, NewProcess extends unknown = Process>(...transformers: Array<(instance: Instance<State, Output, Input, Action, Process>) => Pick<S<NewState, NewResult, NewInput, NewAction, NewProcess>, 'process' | 'config'>>): S<NewState, NewResult, NewInput, NewAction, NewProcess> { return S.with<State, Output, Input, Action, Process, NewState, NewResult, NewInput, NewAction, NewProcess>(...transformers)(this) }
}
export const StateMachine = S
export const SuperSmallStateMachine = S
export const NodeDefinition = Node
export const NodeDefinitions = Nodes
