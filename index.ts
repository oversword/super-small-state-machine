export const clone_object = <T extends unknown = unknown>(obj: T): T => {
	if (Array.isArray(obj)) return obj.map(clone_object) as T
	if (obj === null) return null as T
	if (typeof obj !== 'object') return obj
	return Object.fromEntries(Object.entries(obj).map(([key,value]) => [ key, clone_object(value) ])) as T;
}
export const unique_list_strings = <T extends unknown = unknown>(list: Array<T>, getId: ((item: T) => string) = item => item as string): Array<T> => Object.values(Object.fromEntries(list.map(item=>[getId(item),item])));
const reduce_get_path_object = <T extends unknown = unknown, O extends unknown = unknown>(obj: T | O | undefined, step: PathUnit): T | undefined => obj ? obj[step] : undefined
export const get_path_object = <T extends unknown = unknown, O extends unknown = unknown>(object: O, path: Path): undefined | T => (path.reduce(reduce_get_path_object<T,O>, object) as (T | undefined))
export const normalise_function = (functOrResult: Function | unknown): Function => (typeof functOrResult === 'function') ? functOrResult : () => functOrResult
const reduce_deep_merge_object = <T extends unknown = unknown>(base: T, override: unknown): T => {
	if (!((base && typeof base === 'object') && !Array.isArray(base) && (override && typeof override === 'object') && !Array.isArray(override)))
		return override as T;
	const allKeys = unique_list_strings(Object.keys(base).concat(Object.keys(override)));
	return Object.fromEntries(allKeys.map(key => [
		key, key in override ? deep_merge_object(base[key], override[key]) : base[key]
	])) as T;
}
export const deep_merge_object = <T extends unknown = unknown>(base: T, ...overrides: Array<unknown>): T => overrides.reduce(reduce_deep_merge_object<T>, base)
export const get_closest_path = <T extends unknown = unknown, O extends unknown = unknown>(object: O, path: Path = [], condition: ((item: T, path: Path, object: O) => boolean) = () => true): Path | null => {
	const item = get_path_object<T>(object, path)!
	if (condition(item, path, object)) return path
	if (path.length === 0) return null
	return get_closest_path(object, path.slice(0,-1), condition)
}
export const wait_time = (delay: number): Promise<void> => (delay ? new Promise(resolve => setTimeout(resolve, delay)) : Promise.resolve())
export class SuperSmallStateMachineError<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
> extends Error {
	public instance?: Partial<S<State, Result, Input, Action, Process>>
	public state?: SystemState<State>
	public data?: any
	public path?: Path
	constructor(message: string, { instance, state, data, path }: Partial<SuperSmallStateMachineError<State, Result, Input, Action, Process>>) {
		super(message)
		Object.assign(this, { instance, state, data, path })
	}
}
export class SuperSmallStateMachineReferenceError<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
> extends SuperSmallStateMachineError<State, Result, Input, Action, Process> {}
export class SuperSmallStateMachineTypeError<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
> extends SuperSmallStateMachineError<State, Result, Input, Action, Process> {}
export class StateReferenceError<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
> extends SuperSmallStateMachineReferenceError<State, Result, Input, Action, Process> {}
export class StateTypeError<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
> extends SuperSmallStateMachineTypeError<State, Result, Input, Action, Process> {}
export class NodeTypeError<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
> extends SuperSmallStateMachineTypeError<State, Result, Input, Action, Process> {}
export class UndefinedNodeError<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
> extends SuperSmallStateMachineReferenceError<State, Result, Input, Action, Process> {}
export class MaxIterationsError<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
> extends SuperSmallStateMachineError<State, Result, Input, Action, Process> {}
export class PathReferenceError<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
> extends SuperSmallStateMachineReferenceError<State, Result, Input, Action, Process> {}
export enum NodeTypes {
	UN = 'undefined',
	EM = 'empty',
	RT = 'return',
	FN = 'function',
	SQ = 'sequence',
	CD = 'condition',
	SW = 'switch',
	MC = 'machine',
	CH = 'changes',
	DR = 'directive',
	AD = 'absolute-directive',
	MD = 'machine-directive',
	SD = 'sequence-directive',
}
export enum KeyWords {
	IF = 'if',
	TN = 'then',
	EL = 'else',
	SW = 'switch',
	CS = 'case',
	DF = 'default',
	IT = 'initial',
	RS = 'result',
}
export class NodeDefinitions<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
> extends Map<NodeDefinition['name'], NodeDefinition<Process, Action, State, Result, Input, Action, Process>> {
	constructor(...nodes: Array<NodeDefinition<Process, Action, State, Result, Input, Action, Process>>) { super(nodes.flat(Infinity).map(node => [node.name,node])) }
	typeof(object: unknown, objectType: (typeof object) = typeof object, isAction: boolean = false): false | NodeDefinition['name'] {
		const foundType = [...this.values()].reverse().find(current => current.typeof && current.typeof(object, objectType, isAction))
		return foundType ? foundType.name : false
	}
}
export class NodeDefinition<
	SelfType extends unknown = never,
	SelfActionType extends unknown = never,
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
> {
	public readonly name: string | symbol = Symbol('Unnamed node')
	public readonly typeof: ((object: unknown, objectType: typeof object, isAction: boolean) => object is SelfType) | null = null
	public readonly execute: ((node: SelfType, state: SystemState<State>) => Action | Promise<Action>) | null = null
	public readonly proceed: ((parPath: Path, state: SystemState<State>, path: Path) => undefined | null | Path) | null = null
	public readonly perform: ((action: SelfActionType, state: SystemState<State>) => SystemState<State>) | null = null
	public readonly traverse: ((item: SelfType, path: Path, iterate: ((path: Path) => SelfType), post: ((item: SelfType, path: Path) => SelfType)) => SelfType) | null = null
	constructor(name: NodeDefinition['name'], { execute = null, typeof: typeofMethod = null, proceed = null, perform = null, traverse = null }: Partial<Pick<NodeDefinition<SelfType, SelfActionType, State, Result, Input, Action, Process>, 'execute' | 'proceed' | 'typeof' | 'perform' | 'traverse'>>) {
		this.name = name
		this.execute = execute
		this.typeof = typeofMethod
		this.proceed = proceed
		this.perform = perform
		this.traverse = traverse
	}
}
export const N = NodeDefinition
const exitFindNext = function (action, state) {
	const path = S._proceed(this, state)
	return path ? { ...state, [S.Path]: path } : { ...state, [S.Return]: true }
}
export interface InitialState {
	[KeyWords.RS]: unknown,
	[key: string]: unknown,
}
export type SystemState<State extends InitialState = { [KeyWords.RS]: null }> = State & {
	[S.Path]: Path
	[S.Changes]: Partial<State>
	[S.Return]?: boolean
}
export type InputSystemState<State extends InitialState = { [KeyWords.RS]: null }> = State & Partial<Pick<SystemState<State>, typeof S.Path | typeof S.Return>>

export interface Config<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
> {
	defaults: State,
	iterations: number,
	until: (state: SystemState<State>) => boolean,
	strict: boolean | typeof S.StrictTypes,
	override: null | ((...args: Input) => Result),
	adapt: Array<(process: Process) => Process>,
	adaptStart: Array<(state: SystemState<State>) => SystemState<State>>,
	adaptEnd: Array<(state: SystemState<State>) => SystemState<State>>,
	input: (...input: Input) => Partial<InputSystemState<State>>,
	result: (state: SystemState<State>) => Result,
	nodes: NodeDefinitions<State, Result, Input, Action, Process>,
	async: boolean,
	pause: (state: SystemState<State>, runs: number) => false | Promise<any>
}
	export type ChangesNode<State extends InitialState = { [KeyWords.RS]: null }> = Partial<State>
	const ChangesNode = new N<ChangesNode,ChangesNode>(NodeTypes.CH, {
		typeof(object, objectType): object is ChangesNode { return Boolean(object && objectType === 'object') },
		perform(action, state) { return exitFindNext.call(this, action, S._changes(this, state, action)) }
	})
	export type SequenceNode<State extends InitialState = { [KeyWords.RS]: null }, Result extends unknown = State[KeyWords.RS], Action extends unknown = ActionNode<State, Result>> = Array<ProcessNode<State, Result, Action>>
	const SequenceNode = new N<SequenceNode, Path>(NodeTypes.SQ, {
		proceed(parPath, state, path) {
			const parActs = get_path_object<SequenceNode>(this.process, parPath)
			const childItem = path[parPath.length] as number
			if (parActs && childItem+1 < parActs.length) return [ ...parPath, childItem+1 ]
		},
		typeof(object, objectType, isAction): object is SequenceNode { return ((!isAction) && objectType === 'object' && Array.isArray(object)) },
		execute(node, state) { return node.length ? [ ...state[S.Path], 0 ] : null },
		traverse(item, path, iterate, post) { return item.map((_,i) => iterate([...path,i])) },
	})
	export type FunctionNode<State extends InitialState = { [KeyWords.RS]: null }, Result extends unknown = State[KeyWords.RS], Action extends unknown = ActionNode<State, Result>> = (state: SystemState<State>) => Action | Promise<Action>
	const FunctionNode = new N<FunctionNode>(NodeTypes.FN, {
		typeof(object, objectType, isAction): object is FunctionNode { return (!isAction) && objectType === 'function' },
		execute(node, state) { return node(state) },
	})
	const UndefinedNode = new N<undefined,undefined>(NodeTypes.UN, {
		typeof(object, objectType): object is undefined { return objectType === 'undefined' },
		execute(node, state) { throw new UndefinedNodeError(`There is nothing to execute at path [ ${state[S.Path].map(key => key.toString()).join(', ')} ]`, { instance: this, state, data: {node}, path: state[S.Path] }) },
		perform: exitFindNext
	})
	const EmptyNode = new N<null,null>(NodeTypes.EM, {
		typeof: (object, objectType): object is null => object === null,
		perform: exitFindNext
	})
	export interface ConditionNode<
			State extends InitialState = { [KeyWords.RS]: null },
			Result extends unknown = State[KeyWords.RS],
			Action extends unknown = ActionNode<State, Result>,
		> {
			[KeyWords.IF]: (state: SystemState<State>) => boolean,
			[KeyWords.TN]?: ProcessNode<State, Result, Action>
			[KeyWords.EL]?: ProcessNode<State, Result, Action>
		}
	const ConditionNode = new N<ConditionNode>(NodeTypes.CD, {
		typeof: (object, objectType, isAction): object is ConditionNode => Boolean((!isAction) && object && objectType === 'object' && (KeyWords.IF in (object as object))),
		execute: (node, state) => {
			if (normalise_function(node[KeyWords.IF])(state))
			return KeyWords.TN in node ? [ ...state[S.Path], KeyWords.TN ] : null
			return KeyWords.EL in node ? [ ...state[S.Path], KeyWords.EL ] : null
		},
		traverse: (item, path, iterate, post) => { return post({
			...item,
			[KeyWords.IF]: item[KeyWords.IF],
			...(KeyWords.TN in item ? { [KeyWords.TN]: iterate([...path,KeyWords.TN]) } : {}),
			...(KeyWords.EL in item ? { [KeyWords.EL]: iterate([...path,KeyWords.EL]) } : {})
		}, path) }
	})
	export interface SwitchNode<
			State extends InitialState = { [KeyWords.RS]: null },
			Result extends unknown = State[KeyWords.RS],
			Action extends unknown = ActionNode<State, Result>,
		> {
			[KeyWords.SW]: (state: SystemState<State>) => string | number,
			[KeyWords.CS]: Record<string | number, ProcessNode<State, Result, Action>>
		}
	const SwitchNode = new N<SwitchNode>(NodeTypes.SW, {
		typeof: (object, objectType, isAction): object is SwitchNode => Boolean((!isAction) && object && objectType === 'object' && (KeyWords.SW in (object as object))),
		execute: (node, state) => {
			const key = normalise_function(node[KeyWords.SW])(state)
			const fallbackKey = (key in node[KeyWords.CS]) ? key : KeyWords.DF
			return (fallbackKey in node[KeyWords.CS]) ? [ ...state[S.Path], KeyWords.CS, fallbackKey ] : null
		},
		traverse: (item, path, iterate, post) => { return post({
			...item,
			[KeyWords.SW]: item[KeyWords.SW],
			[KeyWords.CS]: Object.fromEntries(Object.keys(item[KeyWords.CS]).map(key => [ key, iterate([...path,KeyWords.CS,key]) ])),
		}, path) }
	})
	export interface MachineNode<
			State extends InitialState = { [KeyWords.RS]: null },
			Result extends unknown = State[KeyWords.RS],
			Action extends unknown = ActionNode<State, Result>,
		> {
			[KeyWords.IT]: ProcessNode<State, Result, Action>
			[key: string | number | symbol]: ProcessNode<State, Result, Action>
		}
	const MachineNode = new N<MachineNode>(NodeTypes.MC, {
		typeof: (object, objectType, isAction): object is MachineNode => Boolean((!isAction) && object && objectType === 'object' && (KeyWords.IT in (object as object))),
		execute: (node, state) => [ ...state[S.Path], KeyWords.IT ],
		traverse: (item, path, iterate, post) => { return post({
			...item,
			...Object.fromEntries(Object.keys(item).map(key => [ key, iterate([...path,key]) ]))
		}, path) }
	})
	export type DirectiveNode = { [S.Path]: AbsoluteDirectiveNode | SequenceDirectiveNode | MachineDirectiveNode }
	const DirectiveNode = new N<DirectiveNode, DirectiveNode>(NodeTypes.DR, {
		typeof(object, objectType, isAction): object is DirectiveNode { return Boolean(object && objectType === 'object' && (S.Path in (object as object))) },
		perform(action, state) { return S._perform(this, state, action[S.Path]) }
	})
	export type SequenceDirectiveNode = number
	const SequenceDirectiveNode = new N<SequenceDirectiveNode, SequenceDirectiveNode>(NodeTypes.SD, {
		typeof(object, objectType, isAction): object is SequenceDirectiveNode { return objectType === 'number' },
		perform(action, state) {
			const lastOf = S._closest(this, state[S.Path].slice(0,-1), NodeTypes.SQ)
			if (!lastOf) throw new PathReferenceError(`A relative directive has been provided as a number (${String(action)}), but no sequence exists that this number could be an index of from path [ ${state[S.Path].map(key => key.toString()).join(', ')} ].`, { instance: this, state, path: state[S.Path], data: { action } })
			return { ...state, [S.Path]: [...lastOf, action] }
		},
	})
	export type MachineDirectiveNode = string | symbol
	const MachineDirectiveNode = new N<MachineDirectiveNode, MachineDirectiveNode>(NodeTypes.MD, {
		typeof(object, objectType, isAction): object is MachineDirectiveNode { return objectType === 'string' || objectType === 'symbol' },
		perform(action, state) {
			const lastOf = S._closest(this, state[S.Path].slice(0,-1), NodeTypes.MC)
			if (!lastOf) throw new PathReferenceError(`A relative directive has been provided as a ${typeof action} (${String(action)}), but no state machine exists that this ${typeof action} could be a state of from path [ ${state[S.Path].map(key => key.toString()).join(', ')} ].`, { instance: this, state, path: state[S.Path], data: { action } })
			return { ...state, [S.Path]: [...lastOf, action] }
		}
	})
	export type AbsoluteDirectiveNode = Path
	const AbsoluteDirectiveNode = new N<AbsoluteDirectiveNode, AbsoluteDirectiveNode>(NodeTypes.AD, {
		typeof(object, objectType, isAction): object is AbsoluteDirectiveNode { return isAction && Array.isArray(object) },
		perform(action, state) { return { ...state, [S.Path]: action } }
	})
	export type ReturnNode<Result extends unknown = unknown> = { [S.Return]: Result } | typeof S.Return
	const ReturnNode = new N<ReturnNode,ReturnNode>(NodeTypes.RT, {
		typeof: (object, objectType): object is ReturnNode => object === S.Return || Boolean(object && objectType === 'object' && (S.Return in (object as object))),
		perform: (action, state) => ({
			...state,
			[S.Return]: true,
			[S.Path]: state[S.Path],
			...(!action || action === S.Return ? {} : { [KeyWords.RS]: action[S.Return] as null })
		})
	})
export type PathUnit = SequenceDirectiveNode | MachineDirectiveNode
export type Path = Array<PathUnit>

export type ProcessNode<
	State extends InitialState = { [KeyWords.RS]: null },
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
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
> = DirectiveNode | AbsoluteDirectiveNode | SequenceDirectiveNode | MachineDirectiveNode | ReturnNode<Result>| ChangesNode<State> | null | undefined | void

export const nodes = [ ChangesNode, SequenceNode, FunctionNode, UndefinedNode, EmptyNode, ConditionNode, SwitchNode, MachineNode, DirectiveNode, AbsoluteDirectiveNode, MachineDirectiveNode, SequenceDirectiveNode, ReturnNode, ]
export class ExtensibleFunction extends Function { constructor(f: Function) { super(); return Object.setPrototypeOf(f, new.target.prototype); }; }
	export interface SuperSmallStateMachineCore<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
> { process: Process; (...args: Input): Result; }
export abstract class SuperSmallStateMachineCore<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
> extends ExtensibleFunction {
public static readonly Return = Symbol('Super Small State Machine Return')
public static readonly Changes = Symbol('Super Small State Machine Changes')
public static readonly Path = Symbol('Super Small State Machine Path')
public static readonly StrictTypes = Symbol('Super Small State Machine Strict Types')
public static readonly keyWords: typeof KeyWords = KeyWords
public static readonly kw:       typeof KeyWords = KeyWords
public static readonly nodeTypes:typeof NodeTypes = NodeTypes
public static readonly types:    typeof NodeTypes = NodeTypes
public static readonly config: Config = {
	defaults: { [KeyWords.RS]: null },
	input: (a = {}) => a,
	result: a => a[KeyWords.RS],
	strict: false,
	iterations: 10000,
	until: state => S.Return in state,
	pause: () => false,
	async: false,
	override: null,
	nodes: new NodeDefinitions(...nodes as unknown as []),
	adapt: [],
	adaptStart: [],
	adaptEnd: [],
}
public static _closest<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
>(instance: Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'>, path: Path, ...nodeTypes: Array<NodeDefinition['name'] | Array<NodeDefinition['name']>>): Path | null {
	const flatNodeTypes = nodeTypes.flat(Infinity)
	return get_closest_path(instance.process, path, i => {
		const nodeType = instance.config.nodes.typeof(i)
		return Boolean(nodeType && flatNodeTypes.includes(nodeType))
	})
}
public static _changes<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
>(instance: Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'>, state: SystemState<State>, changes: Partial<State>): SystemState<State> {
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
public static _proceed<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
>(instance: Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'>, state: SystemState<State>, path: Path = state[S.Path] || []): Path | null {
	if (path.length === 0) return null
	const parPath = this._closest(instance, path.slice(0,-1), [...instance.config.nodes.values()].filter(({ proceed }) => proceed).map(({ name }) => name))
	if (!parPath) return null
	const parActs = get_path_object(instance.process, parPath)
	const parType = instance.config.nodes.typeof(parActs)
	const nodeDefinition = parType && instance.config.nodes.get(parType)
	if (!(nodeDefinition && nodeDefinition.proceed)) return null
	const result = nodeDefinition.proceed.call(instance, parPath, state, path)
	if (result !== undefined) return result
	return this._proceed(instance, state, parPath)
}
public static _perform<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
>(instance: Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'>, state: SystemState<State>, action: Action = null as Action): SystemState<State> {
	const path = state[S.Path] || []
	const nodeType = instance.config.nodes.typeof(action, typeof action, true)
	const nodeDefinition = nodeType && instance.config.nodes.get(nodeType)
	if (nodeDefinition && nodeDefinition.perform)
		return nodeDefinition.perform.call(instance, action, state)
	throw new NodeTypeError(`Unknown action or action type: ${typeof action}${nodeType ? `, nodeType: ${String(nodeType)}` : ''} at [ ${path.map(key => key.toString()).join(', ')} ]`, { instance, state, path, data: { action } })
}
public static _execute<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
>(instance: Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'>, state: SystemState<State>, path: Path = state[S.Path]): Action {
	const node = get_path_object(instance.process, path)
	const nodeType = instance.config.nodes.typeof(node)
	const nodeDefinition = nodeType && instance.config.nodes.get(nodeType)
	if (nodeDefinition && nodeDefinition.execute)
		return nodeDefinition.execute.call(instance, node, state)
	return node as Action
}
public static _traverse<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
> (instance: Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'>, iterator: ((item: Process, path: Path) => Process), post: ((item: Process, path: Path) => Process)): ((path?: Path) => Process) {
	const boundPost = post.bind(instance)
	const iterate = (path: Path = []) => {
		const item = get_path_object(instance.process, path)
		const nodeType = instance.config.nodes.typeof(item)
		const nodeDefinition = nodeType && instance.config.nodes.get(nodeType)
		if (nodeDefinition && nodeDefinition.traverse)
			return nodeDefinition.traverse.call(instance, item, path, iterate, boundPost)
		return iterator.call(instance, item, path)
	}
	return iterate()
}
public static _run<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
>(instance: Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'>, ...input: Input): Result {
	if (instance.config.async) return this._runAsync(instance, ...input) as Result
	return this._runSync(instance, ...input)
}
public static _runSync<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
>(instance: Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'>, ...input: Input): Result {
	const { until, iterations, input: inputModifier, result: adaptResult, adaptStart, adaptEnd, defaults } = { ...this.config, ...instance.config }
	const modifiedInput = inputModifier.apply(instance, input) || {}
	let r = 0, currentState = adaptStart.reduce((prev, modifier) => modifier.call(instance, prev), this._changes(instance, {
		[S.Changes]: {},
		...defaults,
		[S.Path]: modifiedInput[S.Path] || [],
	} as SystemState<State>, modifiedInput))
	while (r < iterations) {
		if (until(currentState)) break;
		if (++r >= iterations)
			throw new MaxIterationsError(`Maximim iterations of ${iterations} reached at path [ ${currentState[S.Path].map(key => key.toString()).join(', ')} ]`, { instance, state: currentState, path: currentState[S.Path], data: { iterations } })
		currentState = this._perform(instance, currentState, this._execute(instance, currentState))
	}
	return adaptResult.call(instance, adaptEnd.reduce((prev, modifier) => modifier.call(instance, prev), currentState))
}
public static async _runAsync<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
>(instance: Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'>, ...input: Input): Promise<Result> {
	const { pause, until, iterations, input: inputModifier, result: adaptResult, adaptStart, adaptEnd, defaults } = { ...this.config, ...instance.config }
	const modifiedInput = (await inputModifier.apply(instance, input)) || {}
	let r = 0, currentState = adaptStart.reduce((prev, modifier) => modifier.call(instance, prev), this._changes(instance, {
		[S.Changes]: {},
		...defaults,
		[S.Path]: modifiedInput[S.Path] || [],
	} as SystemState<State>, modifiedInput))
	while (r < iterations) {
		const pauseExecution = pause.call(instance, currentState, r)
		if (pauseExecution) await pauseExecution;
		if (until(currentState)) break;
		if (++r >= iterations)
			throw new MaxIterationsError(`Maximim iterations of ${iterations} reached at path [ ${currentState[S.Path].map(key => key.toString()).join(', ')} ]`, { instance, state: currentState, path: currentState[S.Path], data: { iterations } })
		currentState = this._perform(instance, currentState, await this._execute(instance, currentState))
	}
	return adaptResult.call(instance, adaptEnd.reduce((prev, modifier) => modifier.call(instance, prev), currentState))
}
}
export abstract class SuperSmallStateMachineChain<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
> extends SuperSmallStateMachineCore<State, Result, Input, Action, Process> {
	static closest<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
>(path: Path, ...nodeTypes: Array<NodeDefinition['name'] | Array<NodeDefinition['name']>>) { return (instance: Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'>): Path | null => this._closest(instance, path, ...nodeTypes) }
	static changes<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
>(state: SystemState<State>, changes: Partial<State>) { return (instance: Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'>): SystemState<State> => this._changes(instance, state, changes) }
	static proceed<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
>(state: SystemState<State>, path: Path) { return (instance: Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'>): Path | null => this._proceed(instance, state, path) }
	static perform<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
>(state: SystemState<State>, action: Action) { return (instance: Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'>): SystemState<State> => this._perform(instance, state, action) }
	static execute<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
>(state: SystemState<State>, path?: Path) { return (instance: Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'>): Action => this._execute(instance, state, path) }
	static traverse<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
>(iterator: ((item: Process, path: Path) => Process), post: ((item: Process, path: Path) => Process)) { return (instance: Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'>) => this._traverse(instance, iterator, post) }
	static run<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
>(...input: Input) { return (instance: Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'>): Result => this._run(instance, ...input) }
	static runSync<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
>(...input: Input) { return (instance: Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'>): Result => this._runSync(instance, ...input) }
	static runAsync<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
>(...input: Input) { return (instance: Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'>): Promise<Result> => this._runAsync(instance, ...input) }
	static do<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
>(process: Process) { return (instance: Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'>): Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'> => ({ process: instance.config.adapt.reduce((prev, modifier) => modifier.call(instance, prev), process), config: instance.config }) }
	static defaults<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
	NewState extends InitialState = State,
>(defaults: NewState) { return (instance: Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'>): Pick<S<NewState, NewState[KeyWords.RS], Input, ActionNode<NewState, Result>, ProcessNode<NewState, Result, ActionNode<NewState, Result>>>, 'process' | 'config'> => ({ process: instance.process as unknown as ProcessNode<NewState, Result, ActionNode<NewState, Result>>, config: { ...instance.config, defaults } as unknown as Config<NewState, NewState[KeyWords.RS], Input, ActionNode<NewState, Result>, ProcessNode<NewState, Result, ActionNode<NewState, Result>>>, }) }
	static input<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
	NewInput extends Array<unknown> = Array<unknown>,
>(input: (...input: NewInput) => Partial<InputSystemState<State>>) { return (instance: Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'>): Pick<S<State, Result, NewInput, Action, Process>, 'process' | 'config'> => ({ process: instance.process, config: { ...instance.config, input } as unknown as Config<State, Result, NewInput, Action, Process>, }) }
	static result<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
	NewResult extends unknown = Result,
>(result: (state: SystemState<State>) => NewResult) { return (instance: Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'>): Pick<S<State, NewResult, Input, ActionNode<State, NewResult>, ProcessNode<State, NewResult, ActionNode<State, NewResult>>>, 'process' | 'config'> => ({ process: instance.process as unknown as ProcessNode<State, NewResult, ActionNode<State, NewResult>>, config: { ...instance.config, result } as unknown as Config<State, NewResult, Input, ActionNode<State, NewResult>, ProcessNode<State, NewResult, ActionNode<State, NewResult>>>, }) }
	static unstrict<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
>(instance: Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'>): Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'> { return ({ process: instance.process, config: { ...instance.config, strict: false }, }) }
	static strict<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
> (instance: Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'>): Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'> { return ({ process: instance.process, config: { ...instance.config, strict: true }, }) }
	static strictTypes<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
> (instance: Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'>): Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'> { return ({ process: instance.process, config: { ...instance.config, strict: S.StrictTypes }, }) }
	static for<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
>(iterations: number = 10000) { return (instance: Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'>): Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'> => ({ process: instance.process, config: { ...instance.config, iterations }, }) }
	static until<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
>(until: Config<State, Result, Input, Action, Process>['until']) { return (instance: Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'>): Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'> => ({ process: instance.process, config: { ...instance.config, until }, }) }
	static forever<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
> (instance: Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'>): Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'> { return ({ process: instance.process, config: { ...instance.config, iterations: Infinity }, }) }
	static sync<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
> (instance: Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'>): Pick<S<State, Awaited<Result>, Input, Action, Process>, 'process' | 'config'> { return ({ process: instance.process, config: { ...instance.config, async: false } as unknown as Config<State, Awaited<Result>, Input, Action, Process>, }) }
	static async<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
> (instance: Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'>): Pick<S<State, Promise<Result>, Input, Action, Process>, 'process' | 'config'> { return ({ process: instance.process, config: { ...instance.config, async: true } as unknown as Config<State, Promise<Result>, Input, Action, Process>, }) }
	static pause<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
>(pause: Config<State, Result, Input, Action, Process>['pause'] = (S.config.pause as Config<State, Result, Input, Action, Process>['pause'])) { return (instance: Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'>): Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'> => ({ process: instance.process, config: { ...instance.config, pause }, }) }
	static override<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
>(override: ((...args: Input) => Result) | null) { return (instance: Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'>): Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'> => ({ process: instance.process, config: { ...instance.config, override } }) }
	static addNode<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
>(...nodes) { return (instance: Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'>) => ({ process: instance.process, config: { ...instance.config, nodes: new NodeDefinitions(...instance.config.nodes.values(),...nodes) }, }) }
	static adapt<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
>(...adapters: Array<(process: Process) => Process>) { return (instance: Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'>): Pick< S<State, Result, Input, Action, Process>, 'process' | 'config'> => ({ process: adapters.reduce((prev, adapter) => adapter.call(instance, prev), instance.process), config: { ...instance.config, adapt: [ ...instance.config.adapt, ...adapters ] }, }) }
	static adaptStart<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
>(...adapters: Array<(state: SystemState<State>) => SystemState<State>>) { return (instance: Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'>): Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'> => ({ process: instance.process, config: { ...instance.config, adaptStart: [ ...instance.config.adaptStart, ...adapters ] }, }) }
	static adaptEnd<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
>(...adapters: Array<(state: SystemState<State>) => SystemState<State>>) { return (instance: Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'>): Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'> => ({ process: instance.process, config: { ...instance.config, adaptEnd: [ ...instance.config.adaptEnd, ...adapters ] }, }) }
	static with<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,

	NewState extends InitialState = State,
	NewResult extends unknown = Result,
	NewInput extends Array<unknown> = Input,
	NewAction extends unknown = Action,
	NewProcess extends unknown = Process
>(...adapters: Array<((instance: Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'>) => Pick<S<NewState, NewResult, NewInput, NewAction, NewProcess>, 'process' | 'config'>)>) {
		const flatAdapters = adapters.flat(Infinity)
		return (instance: Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'>): S<NewState, NewResult, NewInput, NewAction, NewProcess> => {
			const result = flatAdapters.reduce((prev, adapter) => adapter.call(instance, prev), instance) as unknown as Pick<S<NewState, NewResult, NewInput, NewAction, NewProcess>, 'process' | 'config'>
			return result instanceof S ? result : new S<NewState, NewResult, NewInput, NewAction, NewProcess>(result.process, result.config)
		}
	}
}
export default class S<
	State extends InitialState = { [KeyWords.RS]: null },
	Result extends unknown = State[KeyWords.RS],
	Input extends Array<unknown> = [Partial<InputSystemState<State>>] | [],
	Action extends unknown = ActionNode<State, Result>,
	Process extends unknown = ProcessNode<State, Result, Action>,
> extends SuperSmallStateMachineChain<State, Result, Input, Action, Process> {
	process = null as Process
	#config: Config<State, Result, Input, Action, Process> = S.config as unknown as Config<State, Result, Input, Action, Process>
	get config(): Config<State, Result, Input, Action, Process> { return { ...this.#config } }
	constructor(process: Process = (null as Process), config: Config<State, Result, Input, Action, Process> = (S.config as unknown as Config<State, Result, Input, Action, Process>)) {
		super((...input: Input): Result => (config.override || this.run).apply(this, input))
		this.#config = { ...this.#config, ...config } as unknown as Config<State, Result, Input, Action, Process>
		this.process = process
	}
	closest(path: Path, ...nodeTypes: Array<NodeDefinition['name'] | Array<NodeDefinition['name']>>): Path | null { return S._closest(this, path, ...nodeTypes) }
	changes(state: SystemState<State>, changes: Partial<State>): SystemState<State> { return S._changes(this, state, changes) }
	proceed(state: SystemState<State>, path: Path) { return S._proceed(this, state, path) }
	perform(state: SystemState<State>, action: Action) { return S._perform(this, state, action) }
	execute(state: SystemState<State>, path?: Path) { return S._execute(this, state, path) }
	traverse(iterator: ((item: Process, path: Path) => Process), post: ((item: Process, path: Path) => Process)){ return S._traverse(this, iterator, post) }
	run (...input: Input): Result { return S._run(this, ...input) }
	runSync (...input: Input): Result { return S._runSync(this, ...input) }
	runAsync(...input: Input): Promise<Result> { return S._runAsync(this, ...input) }
	do(process: Process): S<State, Result, Input, Action, Process> { return this.with(S.do(process)) }
	defaults<NewState extends InitialState = State>(defaults: NewState): S<NewState, NewState[KeyWords.RS], Input, ActionNode<NewState, Result>, ProcessNode<NewState, Result, ActionNode<NewState, Result>>> { return this.with(S.defaults(defaults)) }
	input<NewInput extends Array<unknown> = Array<unknown>>(input: (...input: NewInput) => Partial<InputSystemState<State>>): S<State, Result, NewInput, Action, Process> { return this.with(S.input(input)) }
	result<NewResult extends unknown = Result>(result: (state: SystemState<State>) => NewResult): S<State, NewResult, Input, ActionNode<State, NewResult>, ProcessNode<State, NewResult, ActionNode<State, NewResult>>> { return this.with(S.result(result)) }
	get unstrict(): S<State, Result, Input, Action, Process> { return this.with(S.unstrict) }
	get strict(): S<State, Result, Input, Action, Process> { return this.with(S.strict) }
	get strictTypes(): S<State, Result, Input, Action, Process> { return this.with(S.strictTypes) }
	for(iterations: number): S<State, Result, Input, Action, Process> { return this.with(S.for(iterations)) }
	until(until: Config<State, Result, Input, Action, Process>['until']): S<State, Result, Input, Action, Process> { return this.with(S.until(until)) }
	get forever(): S<State, Result, Input, Action, Process> { return this.with(S.forever) }
	get sync(): S<State, Awaited<Result>, Input, Action, Process> { return this.with(S.sync) }
	get async(): S<State, Promise<Result>, Input, Action, Process> { return this.with(S.async) }
	pause(pause: Config<State, Result, Input, Action, Process>['pause']): S<State, Result, Input, Action, Process> { return this.with(S.pause(pause)) }
	override(override: ((...args: Input) => Result) | null): S<State, Result, Input, Action, Process> { return this.with(S.override(override)) }
	addNode(...nodes) { return this.with(S.addNode(...nodes)) }
	adapt(...adapters: Array<(process: Process) => Process>): S<State, Result, Input, Action, Process> { return this.with(S.adapt(...adapters)) }
	adaptStart(...adapters: Array<(state: SystemState<State>) => SystemState<State>>): S<State, Result, Input, Action, Process> { return this.with(S.adaptStart(...adapters)) }
	adaptEnd(...adapters: Array<(state: SystemState<State>) => SystemState<State>>): S<State, Result, Input, Action, Process> { return this.with(S.adaptEnd(...adapters)) }
	with<NewState extends InitialState = State, NewResult extends unknown = Result, NewInput extends Array<unknown> = Input, NewAction extends unknown = Action, NewProcess extends unknown = Process>(...transformers: Array<(instance: Pick<S<State, Result, Input, Action, Process>, 'process' | 'config'>) => Pick<S<NewState, NewResult, NewInput, NewAction, NewProcess>, 'process' | 'config'>>): S<NewState, NewResult, NewInput, NewAction, NewProcess> { return S.with<State, Result, Input, Action, Process, NewState, NewResult, NewInput, NewAction, NewProcess>(...transformers)(this) }
}
export const StateMachine = S
export const SuperSmallStateMachine = S
