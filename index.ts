export const clone_object = <T extends unknown = unknown>(obj: T): T => {
	if (Array.isArray(obj)) return obj.map(clone_object) as T
	if (obj === null) return null as T
	if (typeof obj !== 'object') return obj
	return Object.fromEntries(Object.entries(obj).map(([key,value]) => [ key, clone_object(value) ])) as T;
}
export const unique_list_strings = <T extends unknown = unknown>(list: Array<T>, getId: ((item: T) => string) = item => item as string): Array<T> => Object.values(Object.fromEntries(list.map(item=>[getId(item),item])));
const reduce_get_path_object = <T extends unknown = unknown, O extends unknown = unknown>(obj: T | O | undefined, step: PathUnit): T | undefined => obj ? ((obj as any)[step] as T) : undefined
export const get_path_object = <T extends unknown = unknown, O extends unknown = unknown>(object: O, path: Path = []): undefined | T => (path.reduce(reduce_get_path_object<T,O>, object) as (T | undefined))
export const set_path_object = <T extends unknown = unknown>(object: T, path: Path = [], value: unknown = undefined): T => {
	if (path.length === 0 || typeof object !== 'object' || !object) return value as T
	if (Array.isArray(object)) return [ ...object.slice(0, path[0] as number), set_path_object(object[path[0]], path.slice(1), value), ...object.slice(1 + (path[0] as number)) ] as T
	return { ...object, [path[0]]: set_path_object(object[path[0]], path.slice(1), value), }
}
export const update_path_object = <T extends unknown = unknown, O extends unknown = unknown>(object: O, path: Path = [], transformer = (original: T | undefined, path: Path, object: O): T => original as T) => set_path_object(object, path, transformer(get_path_object<T>(object, path), path, object))
const map_list_path_object = ([ key, value ]: [ string, unknown ]): Array<Path> => list_path_object(value).map(path => [ key, ...path ])
export const list_path_object = (object: unknown): Array<Path> => typeof object !== 'object' || !object ? [[]] : ([[]] as Array<Path>).concat(...Object.entries(object).map(map_list_path_object))
export const normalise_function = (functOrResult: Function | unknown): Function => (typeof functOrResult === 'function') ? functOrResult : () => functOrResult
const reduce_deep_merge_object = <T extends unknown = unknown>(base: T, override: unknown): T => {
	if (!((base && typeof base === 'object') && !Array.isArray(base) && (override && typeof override === 'object') && !Array.isArray(override)))
		return override as T;
	const allKeys = unique_list_strings(Object.keys(base).concat(Object.keys(override)));
	return Object.fromEntries(allKeys.map(key => [
		key, key in override ? deep_merge_object((base as Record<string,unknown>)[key], (override as Record<string,unknown>)[key]) : (base as Record<string,unknown>)[key]
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
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
> extends Error {
	public instance?: Partial<S<State, Output, Input, Action, Process>>
	public state?: SystemState<State, Output>
	public data?: any
	public path?: Path
	constructor(message: string, { instance, state, data, path }: Partial<SuperSmallStateMachineError<State, Output, Input, Action, Process>>) {
		super(message)
		Object.assign(this, { instance, state, data, path })
	}
}
export class SuperSmallStateMachineReferenceError<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
> extends SuperSmallStateMachineError<State, Output, Input, Action, Process> {}
export class SuperSmallStateMachineTypeError<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
> extends SuperSmallStateMachineError<State, Output, Input, Action, Process> {}
export class StateReferenceError<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
> extends SuperSmallStateMachineReferenceError<State, Output, Input, Action, Process> {}
export class StateTypeError<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
> extends SuperSmallStateMachineTypeError<State, Output, Input, Action, Process> {}
export class NodeTypeError<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
> extends SuperSmallStateMachineTypeError<State, Output, Input, Action, Process> {}
export class UndefinedNodeError<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
> extends SuperSmallStateMachineReferenceError<State, Output, Input, Action, Process> {}
export class MaxIterationsError<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
> extends SuperSmallStateMachineError<State, Output, Input, Action, Process> {}
export class PathReferenceError<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
> extends SuperSmallStateMachineReferenceError<State, Output, Input, Action, Process> {}
export enum NodeTypes {
	UN = 'undefined',
	EM = 'empty',
	RT = 'return',
	FN = 'function',
	SQ = 'sequence',
	CD = 'condition',
	SW = 'switch',
	WH = 'while',
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
	WH = 'while',
	DO = 'do',
}
export class NodeDefinitions<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
> extends Map<NodeDefinition['name'], NodeDefinition<Process, Action, State, Output, Input, Action, Process>> {
	constructor(...nodes: Array<NodeDefinition<Process, Action, State, Output, Input, Action, Process>>) { super(nodes.flat(Infinity).map(node => [node.name,node])) }
	typeof(object: unknown, objectType: (typeof object) = typeof object, isAction: boolean = false): false | NodeDefinition['name'] {
		const foundType = [...this.values()].reverse().find(current => current.typeof && current.typeof(object, objectType, isAction))
		return foundType ? foundType.name : false
	}
}
export class NodeDefinition<
	SelfType extends unknown = never,
	SelfActionType extends unknown = never,
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
> {
	public readonly name: string | symbol = Symbol('Unnamed node')
	public readonly typeof: ((object: unknown, objectType: typeof object, isAction: boolean) => object is SelfType) | null = null
	public readonly execute: ((node: SelfType, state: SystemState<State, Output>) => Action | Promise<Action>) | null = null
	public readonly proceed: ((parPath: Path, state: SystemState<State, Output>, path: Path) => undefined | null | Path) | null = null
	public readonly perform: ((action: SelfActionType, state: SystemState<State, Output>) => SystemState<State, Output>) | null = null
	public readonly traverse: ((item: SelfType, path: Path, iterate: ((path: Path) => SelfType), post: ((item: SelfType, path: Path) => SelfType)) => SelfType) | null = null
	constructor(name: NodeDefinition['name'], { execute = null, typeof: typeofMethod = null, proceed = null, perform = null, traverse = null }: Partial<Pick<NodeDefinition<SelfType, SelfActionType, State, Output, Input, Action, Process>, 'execute' | 'proceed' | 'typeof' | 'perform' | 'traverse'>>) {
		this.name = name
		this.execute = execute
		this.typeof = typeofMethod
		this.proceed = proceed
		this.perform = perform
		this.traverse = traverse
	}
}
export const N = NodeDefinition
const exitFindNext = function (this: S, _: ActionNode, state: SystemState) {
	const path = S._proceed(this, state)
	return path ? { ...state, [S.Path]: path } : { ...state, [S.Return]: undefined }
}
export interface InitialState {
	[key: string]: unknown,
}
export type SystemState<State extends InitialState = InitialState, Output extends unknown = undefined> = State & {
	[S.Path]: Path
	[S.Changes]: Partial<State>
	[S.Return]?: Output | undefined
}
export type InputSystemState<State extends InitialState = InitialState, Output extends unknown = undefined> = State & Partial<Pick<SystemState<State, Output>, typeof S.Path | typeof S.Return>>

export interface Config<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
> {
	defaults: State,
	iterations: number,
	until: (state: SystemState<State, Output>) => boolean,
	strict: boolean | typeof S.StrictTypes,
	override: null | ((...args: Input) => Output),
	adapt: Array<(process: Process) => Process>,
	before: Array<(state: SystemState<State, Output>) => SystemState<State, Output>>,
	after: Array<(state: SystemState<State, Output>) => SystemState<State, Output>>,
	input: (...input: Input) => Partial<InputSystemState<State, Output>>,
	output: (state: SystemState<State, Output>) => Output,
	nodes: NodeDefinitions<State, Output, Input, Action, Process>,
	async: boolean,
	pause: (state: SystemState<State, Output>, runs: number) => false | Promise<any>
}
	export type ChangesNode<State extends InitialState = InitialState> = Partial<State>
	const ChangesNode = new N<ChangesNode,ChangesNode>(NodeTypes.CH, {
		typeof(this: S, object, objectType): object is ChangesNode { return Boolean(object && objectType === 'object') },
		perform(this: S, action, state) { return exitFindNext.call(this, action, S._changes(this, state, action)) }
	})
	export type SequenceNode<State extends InitialState = InitialState, Output extends unknown = undefined, Action extends unknown = ActionNode<State, Output>> = Array<ProcessNode<State, Output, Action>>
	const SequenceNode = new N<SequenceNode, Path>(NodeTypes.SQ, {
		proceed(this: S, parPath, state, path) {
			const parActs = get_path_object<SequenceNode>(this.process, parPath)
			const childItem = path[parPath.length] as number
			if (parActs && childItem+1 < parActs.length) return [ ...parPath, childItem+1 ]
		},
		typeof(this: S, object, objectType, isAction): object is SequenceNode { return ((!isAction) && objectType === 'object' && Array.isArray(object)) },
		execute(this: S, node, state) { return node.length ? [ ...state[S.Path], 0 ] : null },
		traverse(this: S, item, path, iterate, post) { return item.map((_,i) => iterate([...path,i])) },
	})
	export type FunctionNode<State extends InitialState = InitialState, Output extends unknown = undefined, Action extends unknown = ActionNode<State, Output>> = (state: SystemState<State, Output>) => Action | Promise<Action>
	const FunctionNode = new N<FunctionNode>(NodeTypes.FN, {
		typeof(this: S, object, objectType, isAction): object is FunctionNode { return (!isAction) && objectType === 'function' },
		execute(this: S, node, state) { return node(state) },
	})
	const UndefinedNode = new N<undefined,undefined>(NodeTypes.UN, {
		typeof(this: S, object, objectType): object is undefined { return objectType === 'undefined' },
		execute(this: S, node, state) { throw new UndefinedNodeError(`There is nothing to execute at path [ ${state[S.Path].map(key => key.toString()).join(', ')} ]`, { instance: this, state, data: {node}, path: state[S.Path] }) },
		perform: exitFindNext
	})
	const EmptyNode = new N<null,null>(NodeTypes.EM, {
		typeof: (object, objectType): object is null => object === null,
		perform: exitFindNext
	})
	export interface ConditionNode<
			State extends InitialState = InitialState,
			Output extends unknown = undefined,
			Action extends unknown = ActionNode<State, Output>,
		> {
			[KeyWords.IF]: (state: SystemState<State, Output>) => boolean,
			[KeyWords.TN]?: ProcessNode<State, Output, Action>
			[KeyWords.EL]?: ProcessNode<State, Output, Action>
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
			...(KeyWords.TN in item ? { [KeyWords.TN]: iterate([...path,KeyWords.TN]) } : {}),
			...(KeyWords.EL in item ? { [KeyWords.EL]: iterate([...path,KeyWords.EL]) } : {})
		}, path) }
	})
	export interface SwitchNode<
			State extends InitialState = InitialState,
			Output extends unknown = undefined,
			Action extends unknown = ActionNode<State, Output>,
		> {
			[KeyWords.SW]: (state: SystemState<State, Output>) => string | number,
			[KeyWords.CS]: Record<string | number, ProcessNode<State, Output, Action>>
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
			[KeyWords.CS]: Object.fromEntries(Object.keys(item[KeyWords.CS]).map(key => [ key, iterate([...path,KeyWords.CS,key]) ])),
		}, path) }
	})
	export interface WhileNode<
			State extends InitialState = InitialState,
			Output extends unknown = undefined,
			Action extends unknown = ActionNode<State, Output>,
		> {
			[KeyWords.WH]: (state: SystemState<State, Output>) => boolean,
			[KeyWords.DO]: ProcessNode<State, Output, Action>
		}
	const WhileNode = new N<WhileNode>(NodeTypes.WH, {
		typeof: (object, objectType, isAction): object is WhileNode => Boolean((!isAction) && object && objectType === 'object' && (KeyWords.WH in (object as object))),
		execute: (node, state) => {
			if (normalise_function(node[KeyWords.WH])(state))
				return KeyWords.DO in node ? [ ...state[S.Path], KeyWords.DO ] : null
			return null
		},
		proceed: parPath => parPath,
		traverse: (item, path, iterate, post) => { return post({
			...item,
			...(KeyWords.DO in item ? { [KeyWords.DO]: iterate([...path,KeyWords.DO]) } : {}),
		}, path) }
	})
	export interface MachineNode<
			State extends InitialState = InitialState,
			Output extends unknown = undefined,
			Action extends unknown = ActionNode<State, Output>,
		> {
			[KeyWords.IT]: ProcessNode<State, Output, Action>
			[key: string | number | symbol]: ProcessNode<State, Output, Action>
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
		typeof(this: S, object, objectType, isAction): object is DirectiveNode { return Boolean(object && objectType === 'object' && (S.Path in (object as object))) },
		perform(this: S, action, state) { return S._perform(this, state, action[S.Path]) }
	})
	export type SequenceDirectiveNode = number
	const SequenceDirectiveNode = new N<SequenceDirectiveNode, SequenceDirectiveNode>(NodeTypes.SD, {
		typeof(this: S, object, objectType, isAction): object is SequenceDirectiveNode { return objectType === 'number' },
		perform(this: S, action, state) {
			const lastOf = S._closest(this, state[S.Path].slice(0,-1), NodeTypes.SQ)
			if (!lastOf) throw new PathReferenceError(`A relative directive has been provided as a number (${String(action)}), but no sequence exists that this number could be an index of from path [ ${state[S.Path].map(key => key.toString()).join(', ')} ].`, { instance: this, state, path: state[S.Path], data: { action } })
			return { ...state, [S.Path]: [...lastOf, action] }
		},
	})
	export type MachineDirectiveNode = string | symbol
	const MachineDirectiveNode = new N<MachineDirectiveNode, MachineDirectiveNode>(NodeTypes.MD, {
		typeof(this: S, object, objectType, isAction): object is MachineDirectiveNode { return objectType === 'string' || objectType === 'symbol' },
		perform(this: S, action, state) {
			const lastOf = S._closest(this, state[S.Path].slice(0,-1), NodeTypes.MC)
			if (!lastOf) throw new PathReferenceError(`A relative directive has been provided as a ${typeof action} (${String(action)}), but no state machine exists that this ${typeof action} could be a state of from path [ ${state[S.Path].map(key => key.toString()).join(', ')} ].`, { instance: this, state, path: state[S.Path], data: { action } })
			return { ...state, [S.Path]: [...lastOf, action] }
		}
	})
	export type AbsoluteDirectiveNode = Path
	const AbsoluteDirectiveNode = new N<AbsoluteDirectiveNode, AbsoluteDirectiveNode>(NodeTypes.AD, {
		typeof(this: S, object, objectType, isAction): object is AbsoluteDirectiveNode { return isAction && Array.isArray(object) },
		perform(this: S, action, state) { return { ...state, [S.Path]: action } }
	})
	export type ReturnNode<Output extends unknown = unknown> = { [S.Return]: Output } | typeof S.Return
	const ReturnNode = new N<ReturnNode,ReturnNode>(NodeTypes.RT, {
		typeof: (object, objectType): object is ReturnNode => object === S.Return || Boolean(object && objectType === 'object' && (S.Return in (object as object))),
		perform: (action, state) => ({
			...state,
			[S.Return]: !action || action === S.Return ? undefined : action[S.Return] as undefined,
		})
	})
export type PathUnit = SequenceDirectiveNode | MachineDirectiveNode
export type Path = Array<PathUnit>

export type ProcessNode<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Action extends unknown = ActionNode<State, Output>,
> =
| SequenceNode<State, Output, Action>
| MachineNode<State, Output, Action>
| ConditionNode<State, Output, Action>
| SwitchNode<State, Output, Action>
| WhileNode<State, Output, Action>
| FunctionNode<State, Output, Action>
| DirectiveNode | SequenceDirectiveNode | MachineDirectiveNode
| ReturnNode<Output>
| ChangesNode<State>
| null

export type ActionNode<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
> = DirectiveNode | AbsoluteDirectiveNode | SequenceDirectiveNode | MachineDirectiveNode | ReturnNode<Output>| ChangesNode<State> | null | undefined | void

export const nodes = [ ChangesNode, SequenceNode, FunctionNode, UndefinedNode, EmptyNode, ConditionNode, SwitchNode, WhileNode, MachineNode, DirectiveNode, AbsoluteDirectiveNode, MachineDirectiveNode, SequenceDirectiveNode, ReturnNode, ]
export class ExtensibleFunction extends Function { constructor(f: Function) { super(); return Object.setPrototypeOf(f, new.target.prototype); }; }
	export interface SuperSmallStateMachineCore<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
> { process: Process; (...args: Input): Output; }
export abstract class SuperSmallStateMachineCore<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
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
	defaults: {},
	input: (state = {}) => state,
	output:  state => state[S.Return],
	strict: false,
	iterations: 10000,
	until: state => S.Return in state,
	pause: () => false,
	async: false,
	override: null,
	nodes: new NodeDefinitions(...nodes as unknown as []),
	adapt: [],
	before: [],
	after: [],
}
public static _closest<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
>(instance: Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'>, path: Path, ...nodeTypes: Array<NodeDefinition['name'] | Array<NodeDefinition['name']>>): Path | null {
	const flatNodeTypes = nodeTypes.flat(Infinity)
	return get_closest_path(instance.process, path, i => {
		const nodeType = instance.config.nodes.typeof(i)
		return Boolean(nodeType && flatNodeTypes.includes(nodeType))
	})
}
public static _changes<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
>(instance: Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'>, state: SystemState<State, Output>, changes: Partial<State>): SystemState<State, Output> {
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
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
>(instance: Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'>, state: SystemState<State, Output>, path: Path = state[S.Path] || []): Path | null {
	if (path.length === 0) return null
	const parPath = this._closest(instance, path.slice(0,-1), [...instance.config.nodes.values()].filter(({ proceed }) => proceed).map(({ name }) => name))
	if (!parPath) return null
	const parActs = get_path_object(instance.process, parPath)
	const parType = instance.config.nodes.typeof(parActs)
	const nodeDefinition = parType && instance.config.nodes.get(parType)
	if (!(nodeDefinition && nodeDefinition.proceed)) return null
	const proceedResult = nodeDefinition.proceed.call(instance, parPath, state, path)
	if (proceedResult !== undefined) return proceedResult
	return this._proceed(instance, state, parPath)
}
public static _perform<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
>(instance: Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'>, state: SystemState<State, Output>, action: Action = null as Action): SystemState<State, Output> {
	const path = state[S.Path] || []
	const nodeType = instance.config.nodes.typeof(action, typeof action, true)
	const nodeDefinition = nodeType && instance.config.nodes.get(nodeType)
	if (nodeDefinition && nodeDefinition.perform)
		return nodeDefinition.perform.call(instance, action, state)
	throw new NodeTypeError(`Unknown action or action type: ${typeof action}${nodeType ? `, nodeType: ${String(nodeType)}` : ''} at [ ${path.map(key => key.toString()).join(', ')} ]`, { instance, state, path, data: { action } })
}
public static _execute<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
>(instance: Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'>, state: SystemState<State, Output>, path: Path = state[S.Path]): Action {
	const node = get_path_object<Process>(instance.process, path)!
	const nodeType = instance.config.nodes.typeof(node)
	const nodeDefinition = nodeType && instance.config.nodes.get(nodeType)
	if (nodeDefinition && nodeDefinition.execute)
		return nodeDefinition.execute.call(instance, node, state) as Action
	return node as Action
}
public static _traverse<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
> (instance: Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'>, iterator: ((item: Process, path: Path) => Process), post: ((item: Process, path: Path) => Process)): Process {
	const boundPost = post.bind(instance)
	const iterate = (path: Path = []) => {
		const item = get_path_object<Process>(instance.process, path)!
		const nodeType = instance.config.nodes.typeof(item)
		const nodeDefinition = nodeType && instance.config.nodes.get(nodeType)
		if (nodeDefinition && nodeDefinition.traverse)
			return nodeDefinition.traverse.call(instance, item, path, iterate, boundPost)
		return iterator.call(instance, item, path)
	}
	return iterate()
}
public static _run<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
>(instance: Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'>, ...input: Input): Output {
	if (instance.config.async) return this._runAsync(instance, ...input) as Output
	return this._runSync(instance, ...input)
}
public static _runSync<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
>(instance: Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'>, ...input: Input): Output {
	const { until, iterations, input: adaptInput, output: adaptOutput, before, after, defaults } = { ...this.config, ...instance.config }
	const modifiedInput = adaptInput.apply(instance, input) || {}
	let r = 0, currentState = before.reduce((prev, modifier) => modifier.call(instance, prev), this._changes(instance, {
		[S.Changes]: {},
		...defaults,
		[S.Path]: modifiedInput[S.Path] || [],
	} as SystemState<State, Output>, modifiedInput))
	while (r < iterations) {
		if (until(currentState)) break;
		if (++r >= iterations)
			throw new MaxIterationsError(`Maximim iterations of ${iterations} reached at path [ ${currentState[S.Path].map(key => key.toString()).join(', ')} ]`, { instance, state: currentState, path: currentState[S.Path], data: { iterations } })
		currentState = this._perform(instance, currentState, this._execute(instance, currentState))
	}
	return adaptOutput.call(instance, after.reduce((prev, modifier) => modifier.call(instance, prev), currentState))
}
public static async _runAsync<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
>(instance: Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'>, ...input: Input): Promise<Output> {
	const { pause, until, iterations, input: adaptInput, output: adaptOutput, before, after, defaults } = { ...this.config, ...instance.config }
	const modifiedInput = (await adaptInput.apply(instance, input)) || {}
	let r = 0, currentState = before.reduce((prev, modifier) => modifier.call(instance, prev), this._changes(instance, {
		[S.Changes]: {},
		...defaults,
		[S.Path]: modifiedInput[S.Path] || [],
	} as SystemState<State, Output>, modifiedInput))
	while (r < iterations) {
		const pauseExecution = pause.call(instance, currentState, r)
		if (pauseExecution) await pauseExecution;
		if (until(currentState)) break;
		if (++r >= iterations)
			throw new MaxIterationsError(`Maximim iterations of ${iterations} reached at path [ ${currentState[S.Path].map(key => key.toString()).join(', ')} ]`, { instance, state: currentState, path: currentState[S.Path], data: { iterations } })
		currentState = this._perform(instance, currentState, await this._execute(instance, currentState))
	}
	return adaptOutput.call(instance, after.reduce((prev, modifier) => modifier.call(instance, prev), currentState))
}
}
export abstract class SuperSmallStateMachineChain<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
> extends SuperSmallStateMachineCore<State, Output, Input, Action, Process> {
	static closest<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
>(path: Path, ...nodeTypes: Array<NodeDefinition['name'] | Array<NodeDefinition['name']>>) { return (instance: Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'>): Path | null => this._closest(instance, path, ...nodeTypes) }
	static changes<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
>(state: SystemState<State, Output>, changes: Partial<State>) { return (instance: Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'>): SystemState<State, Output> => this._changes(instance, state, changes) }
	static proceed<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
>(state: SystemState<State, Output>, path: Path) { return (instance: Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'>): Path | null => this._proceed(instance, state, path) }
	static perform<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
>(state: SystemState<State, Output>, action: Action) { return (instance: Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'>): SystemState<State, Output> => this._perform(instance, state, action) }
	static execute<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
>(state: SystemState<State, Output>, path?: Path) { return (instance: Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'>): Action => this._execute(instance, state, path) }
	static traverse<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
>(iterator: ((item: Process, path: Path) => Process), post: ((item: Process, path: Path) => Process)) { return (instance: Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'>) => this._traverse(instance, iterator, post) }
	static run<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
>(...input: Input) { return (instance: Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'>): Output => this._run(instance, ...input) }
	static runSync<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
>(...input: Input) { return (instance: Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'>): Output => this._runSync(instance, ...input) }
	static runAsync<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
>(...input: Input) { return (instance: Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'>): Promise<Output> => this._runAsync(instance, ...input) }
	static do<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
>(process: Process) { return (instance: Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'>): Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'> => ({ process: instance.config.adapt.reduce((prev, modifier) => modifier.call(instance, prev), process), config: instance.config }) }
	static defaults<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
	NewState extends InitialState = State,
>(defaults: NewState) { return (instance: Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'>): Pick<S<NewState, Output, [Partial<InputSystemState<NewState>>] | [], ActionNode<NewState, Output>, ProcessNode<NewState, Output, ActionNode<NewState, Output>>>, 'process' | 'config'> => ({ process: instance.process as unknown as ProcessNode<NewState, Output, ActionNode<NewState, Output>>, config: { ...instance.config, defaults } as unknown as Config<NewState, Output, [Partial<InputSystemState<NewState>>] | [], ActionNode<NewState, Output>, ProcessNode<NewState, Output, ActionNode<NewState, Output>>>, }) }
	static input<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
	NewInput extends Array<unknown> = Array<unknown>,
>(input: (...input: NewInput) => Partial<InputSystemState<State, Output>>) { return (instance: Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'>): Pick<S<State, Output, NewInput, Action, Process>, 'process' | 'config'> => ({ process: instance.process, config: { ...instance.config, input } as unknown as Config<State, Output, NewInput, Action, Process>, }) }
	static output<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
	NewResult extends unknown = Output,
>(output: (state: SystemState<State, Output>) => NewResult) { return (instance: Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'>): Pick<S<State, NewResult, Input, ActionNode<State, NewResult>, ProcessNode<State, NewResult, ActionNode<State, NewResult>>>, 'process' | 'config'> => ({ process: instance.process as unknown as ProcessNode<State, NewResult, ActionNode<State, NewResult>>, config: { ...instance.config, output } as unknown as Config<State, NewResult, Input, ActionNode<State, NewResult>, ProcessNode<State, NewResult, ActionNode<State, NewResult>>>, }) }
	static unstrict<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
>(instance: Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'>): Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'> { return ({ process: instance.process, config: { ...instance.config, strict: false }, }) }
	static strict<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
> (instance: Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'>): Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'> { return ({ process: instance.process, config: { ...instance.config, strict: true }, }) }
	static strictTypes<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
> (instance: Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'>): Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'> { return ({ process: instance.process, config: { ...instance.config, strict: S.StrictTypes }, }) }
	static for<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
>(iterations: number = 10000) { return (instance: Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'>): Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'> => ({ process: instance.process, config: { ...instance.config, iterations }, }) }
	static until<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
>(until: Config<State, Output, Input, Action, Process>['until']) { return (instance: Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'>): Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'> => ({ process: instance.process, config: { ...instance.config, until }, }) }
	static forever<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
> (instance: Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'>): Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'> { return ({ process: instance.process, config: { ...instance.config, iterations: Infinity }, }) }
	static sync<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
> (instance: Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'>): Pick<S<State, Awaited<Output>, Input, Action, Process>, 'process' | 'config'> { return ({ process: instance.process, config: { ...instance.config, async: false } as unknown as Config<State, Awaited<Output>, Input, Action, Process>, }) }
	static async<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
> (instance: Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'>): Pick<S<State, Promise<Output>, Input, Action, Process>, 'process' | 'config'> { return ({ process: instance.process, config: { ...instance.config, async: true } as unknown as Config<State, Promise<Output>, Input, Action, Process>, }) }
	static pause<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
>(pause: Config<State, Output, Input, Action, Process>['pause'] = (S.config.pause as Config<State, Output, Input, Action, Process>['pause'])) { return (instance: Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'>): Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'> => ({ process: instance.process, config: { ...instance.config, pause }, }) }
	static override<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
>(override: ((...args: Input) => Output) | null) { return (instance: Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'>): Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'> => ({ process: instance.process, config: { ...instance.config, override } }) }
	static addNode<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
>(...nodes: any[]) { return (instance: Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'>) => ({ process: instance.process, config: { ...instance.config, nodes: new NodeDefinitions(...instance.config.nodes.values(),...nodes) }, }) }
	static adapt<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
>(...adapters: Array<(process: Process) => Process>) { return (instance: Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'>): Pick< S<State, Output, Input, Action, Process>, 'process' | 'config'> => ({ process: adapters.reduce((prev, adapter) => adapter.call(instance, prev), instance.process), config: { ...instance.config, adapt: [ ...instance.config.adapt, ...adapters ] }, }) }
	static before<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
>(...adapters: Array<(state: SystemState<State, Output>) => SystemState<State, Output>>) { return (instance: Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'>): Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'> => ({ process: instance.process, config: { ...instance.config, before: [ ...instance.config.before, ...adapters ] }, }) }
	static after<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
>(...adapters: Array<(state: SystemState<State, Output>) => SystemState<State, Output>>) { return (instance: Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'>): Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'> => ({ process: instance.process, config: { ...instance.config, after: [ ...instance.config.after, ...adapters ] }, }) }
	static with<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,

	NewState extends InitialState = State,
	NewResult extends unknown = Output,
	NewInput extends Array<unknown> = Input,
	NewAction extends unknown = Action,
	NewProcess extends unknown = Process
>(...adapters: Array<((instance: Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'>) => Pick<S<NewState, NewResult, NewInput, NewAction, NewProcess>, 'process' | 'config'>)>) {
		const flatAdapters = adapters.flat(Infinity)
		return (instance: Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'>): S<NewState, NewResult, NewInput, NewAction, NewProcess> => {
			const adapted = flatAdapters.reduce((prev, adapter) => adapter.call(instance, prev) as unknown as Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'>, instance) as unknown as Pick<S<NewState, NewResult, NewInput, NewAction, NewProcess>, 'process' | 'config'>
			return adapted instanceof S ? adapted : new S<NewState, NewResult, NewInput, NewAction, NewProcess>(adapted.process, adapted.config)
		}
	}
}
export default class S<
	State extends InitialState = InitialState,
	Output extends unknown = undefined,
	Input extends Array<unknown> = [Partial<InputSystemState<State, Output>>] | [],
	Action extends unknown = ActionNode<State, Output>,
	Process extends unknown = ProcessNode<State, Output, Action>,
> extends SuperSmallStateMachineChain<State, Output, Input, Action, Process> {
	process = null as Process
	#config: Config<State, Output, Input, Action, Process> = S.config as unknown as Config<State, Output, Input, Action, Process>
	get config(): Config<State, Output, Input, Action, Process> { return { ...this.#config } }
	constructor(process: Process = (null as Process), config: Config<State, Output, Input, Action, Process> = (S.config as unknown as Config<State, Output, Input, Action, Process>)) {
		super((...input: Input): Output => (config.override || this.run).apply(this, input))
		this.#config = { ...this.#config, ...config } as unknown as Config<State, Output, Input, Action, Process>
		this.process = process
	}
	closest(path: Path, ...nodeTypes: Array<NodeDefinition['name'] | Array<NodeDefinition['name']>>): Path | null { return S._closest(this, path, ...nodeTypes) }
	changes(state: SystemState<State, Output>, changes: Partial<State>): SystemState<State, Output> { return S._changes(this, state, changes) }
	proceed(state: SystemState<State, Output>, path: Path) { return S._proceed(this, state, path) }
	perform(state: SystemState<State, Output>, action: Action) { return S._perform(this, state, action) }
	execute(state: SystemState<State, Output>, path?: Path) { return S._execute(this, state, path) }
	traverse(iterator: ((item: Process, path: Path) => Process), post: ((item: Process, path: Path) => Process)){ return S._traverse(this, iterator, post) }
	run (...input: Input): Output { return S._run(this, ...input) }
	runSync (...input: Input): Output { return S._runSync(this, ...input) }
	runAsync(...input: Input): Promise<Output> { return S._runAsync(this, ...input) }
	do(process: Process): S<State, Output, Input, Action, Process> { return this.with(S.do(process)) }
	defaults<NewState extends InitialState = State>(defaults: NewState): S<NewState, Output, [Partial<InputSystemState<NewState>>] | [], ActionNode<NewState, Output>, ProcessNode<NewState, Output, ActionNode<NewState, Output>>> { return this.with(S.defaults(defaults)) }
	input<NewInput extends Array<unknown> = Array<unknown>>(input: (...input: NewInput) => Partial<InputSystemState<State, Output>>): S<State, Output, NewInput, Action, Process> { return this.with(S.input(input)) }
	output<NewResult extends unknown = Output>(output: (state: SystemState<State, Output>) => NewResult): S<State, NewResult, Input, ActionNode<State, NewResult>, ProcessNode<State, NewResult, ActionNode<State, NewResult>>> { return this.with(S.output(output)) }
	get unstrict(): S<State, Output, Input, Action, Process> { return this.with(S.unstrict) }
	get strict(): S<State, Output, Input, Action, Process> { return this.with(S.strict) }
	get strictTypes(): S<State, Output, Input, Action, Process> { return this.with(S.strictTypes) }
	for(iterations: number): S<State, Output, Input, Action, Process> { return this.with(S.for(iterations)) }
	until(until: Config<State, Output, Input, Action, Process>['until']): S<State, Output, Input, Action, Process> { return this.with(S.until(until)) }
	get forever(): S<State, Output, Input, Action, Process> { return this.with(S.forever) }
	get sync(): S<State, Awaited<Output>, Input, Action, Process> { return this.with(S.sync) }
	get async(): S<State, Promise<Output>, Input, Action, Process> { return this.with(S.async) }
	pause(pause: Config<State, Output, Input, Action, Process>['pause']): S<State, Output, Input, Action, Process> { return this.with(S.pause(pause)) }
	override(override: ((...args: Input) => Output) | null): S<State, Output, Input, Action, Process> { return this.with(S.override(override)) }
	addNode(...nodes: any[]) { return this.with(S.addNode(...nodes)) }
	adapt(...adapters: Array<(process: Process) => Process>): S<State, Output, Input, Action, Process> { return this.with(S.adapt(...adapters)) }
	before(...adapters: Array<(state: SystemState<State, Output>) => SystemState<State, Output>>): S<State, Output, Input, Action, Process> { return this.with(S.before(...adapters)) }
	after(...adapters: Array<(state: SystemState<State, Output>) => SystemState<State, Output>>): S<State, Output, Input, Action, Process> { return this.with(S.after(...adapters)) }
	with<NewState extends InitialState = State, NewResult extends unknown = Output, NewInput extends Array<unknown> = Input, NewAction extends unknown = Action, NewProcess extends unknown = Process>(...transformers: Array<(instance: Pick<S<State, Output, Input, Action, Process>, 'process' | 'config'>) => Pick<S<NewState, NewResult, NewInput, NewAction, NewProcess>, 'process' | 'config'>>): S<NewState, NewResult, NewInput, NewAction, NewProcess> { return S.with<State, Output, Input, Action, Process, NewState, NewResult, NewInput, NewAction, NewProcess>(...transformers)(this) }
}
export const StateMachine = S
export const SuperSmallStateMachine = S
