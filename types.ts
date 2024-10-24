export class PathReferenceError extends ReferenceError {}
export class ContextReferenceError extends ReferenceError {}
export class ContextTypeError extends TypeError {}
export class ActionTypeError extends TypeError {}
export class UndefinedActionError extends ReferenceError {}
export class MaxIterationsError extends Error {}

export const returnSymbol      = Symbol('Super Small State Machine Return')
export const changesSymbol     = Symbol('Super Small State Machine Changes')
export const pathSymbol        = Symbol('Super Small State Machine Path')
export const strictSymbol      = Symbol('Super Small State Machine Strict')
export const strictTypesSymbol = Symbol('Super Small State Machine Strict Types')
export const parallelSymbol    = Symbol('Super Small State Machine Parallel')

export enum Keywords {
	IF = 'if',
	TN = 'then',
	EL = 'else',
	SW = 'switch',
	CS = 'case',
	DF = 'default',
	IT = 'initial',
	RS = 'result',
}

export class NodeDefinition<
	SelfType extends unknown = never,
	UserState extends InitialState = InitialState,
	Return extends unknown = UserState[Keywords.RS],
	Arguments extends Array<unknown> = Array<unknown>,
	Process extends unknown = ProcessNode<UserState>,
> {
	public readonly name: string | symbol = Symbol('Unnamed node')
	public readonly isNode:   ((object: unknown, objectType: typeof object, last: NodeDefinition['name'] | false) => object is SelfType) | null = null
	public readonly execute:  ((node: SelfType,  instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Process>, 'process' | 'nodes' | 'runConfig'>, state: SystemState<UserState>) => Process | Promise<Process>) | null = null
	public readonly nextPath: ((parPath: Path,   instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Process>, 'process' | 'nodes'>, state: SystemState<UserState>, path: Path) => undefined | null | Path) | null = null
	public readonly advance:  ((output: SelfType,  instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Process>, 'process' | 'nodes'>, state: SystemState<UserState>) => SystemState<UserState>) | null = null
	public readonly traverse: ((
		item: SelfType,
		path: Path,
		instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Process>, 'process' | 'nodes'>,
		iterate: ((instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Process>, 'process' | 'nodes'>, path: Path) => SelfType),
		post: ((item: SelfType, path: Path, instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Process>, 'process' | 'nodes'>) => SelfType)
	) => SelfType) | null = null

	constructor(name: NodeDefinition['name'], { execute = null, isNode = null, nextPath = null, advance = null, traverse = null }: Partial<Pick<NodeDefinition<SelfType, UserState, Return, Arguments, Process>, 'execute' | 'nextPath' | 'isNode' | 'advance' | 'traverse'>>) {
		this.name = name
		this.execute = execute
		this.isNode = isNode
		this.nextPath = nextPath
		this.advance = advance
		this.traverse = traverse
	}
}
export class NodeDefinitions<
	UserState extends InitialState = InitialState,
	Return extends unknown = UserState[Keywords.RS],
	Arguments extends Array<unknown> = Array<unknown>,
	Process extends unknown = ProcessNode<UserState>,
> extends Map<NodeDefinition<Process>['name'], NodeDefinition<Process, UserState, Return, Arguments, Process>>  {
	isNode(object: unknown, objectType: (typeof object) = typeof object): false | NodeDefinition['name'] {
		return [...this.values()].reduce((last: false | NodeDefinition['name'], current): false | NodeDefinition['name'] => {
			if (current.isNode && current.isNode(object, objectType, last))
				return current.name
			return last
		}, false)
	}
}
export const N = NodeDefinition


export class ExtensibleFunction extends Function {
	constructor(f: Function) {
		super()
		return Object.setPrototypeOf(f, new.target.prototype);
	};
}


export interface InitialState {
	[Keywords.RS]: unknown,
	[key: string]: unknown,
}
export type SystemState<UserState extends InitialState = InitialState> = UserState & {
	[strictSymbol]: boolean | typeof strictTypesSymbol
	[pathSymbol]: Path
	[changesSymbol]: Partial<UserState>
	[returnSymbol]?: boolean
}
export type InputSystemState<UserState extends InitialState = InitialState> = UserState & Partial<Pick<SystemState<UserState>, typeof pathSymbol | typeof returnSymbol>>


export interface RunConfig<
	UserState extends InitialState = InitialState,
	Return extends unknown = UserState[Keywords.RS],
	Arguments extends Array<unknown> = Array<unknown>,
	Process extends unknown = ProcessNode<UserState>,
> {
	initialState: UserState,
	iterations: number,
	until: (state: SystemState<UserState>) => boolean,
	strictContext: boolean | typeof strictTypesSymbol,
	runMethod: null,
	inputModifier: (...input: Arguments) => Partial<InputSystemState<UserState>>,
	outputModifier: (state: SystemState<UserState>) => Return,
	async: boolean,
	nodes: NodeDefinitions<UserState, Return, Arguments, Process>,
	// Special settings for async
	delay: number,
	allow: number,
	wait: number,
}

// Process types
export type StateChanges<UserState extends InitialState = InitialState> = Partial<UserState>
export type Path = Array<RelativeGOTOUnit>
	
export type ActionNode<UserState extends InitialState = InitialState> = (state: SystemState<UserState>) => Output | Promise<Output>
export type SequenceNode<UserState extends InitialState = InitialState> = Array<ProcessNode<UserState>>
export interface MachineNode<UserState extends InitialState = InitialState> {
	[Keywords.IT]: ProcessNode<UserState>
	[key: string | number | symbol]: ProcessNode<UserState>
}
export interface ConditionNode<UserState extends InitialState = InitialState> {
	[Keywords.IF]: (state: SystemState<UserState>) => boolean,
	[Keywords.TN]?: ProcessNode<UserState>
	[Keywords.EL]?: ProcessNode<UserState>
}
export interface SwitchNode<UserState extends InitialState = InitialState> {
	[Keywords.SW]: (state: SystemState<UserState>) => string | number,
	[Keywords.CS]: Record<string|number, ProcessNode<UserState>>
}
export type RelativeGOTOUnit = string | number | symbol
export type Directive = RelativeGOTOUnit | typeof returnSymbol
export type ProcessNode<UserState extends InitialState = InitialState> =  SequenceNode<UserState> | MachineNode<UserState> | ConditionNode<UserState> | SwitchNode<UserState> | Directive | Return | Path | ActionNode<UserState> | null | undefined |void | StateChanges<UserState>
export type ParallelNode<UserState extends InitialState = InitialState> = SequenceNode<UserState> & {[parallelSymbol]:true}
export type AbsoluteGOTO = Record<typeof pathSymbol, Path>
export type RelativeGOTO = Record<typeof pathSymbol, RelativeGOTOUnit>
export type Return = { [returnSymbol]: any }
export type Output<UserState extends InitialState = InitialState> = StateChanges<UserState> | OutputDirective | undefined | null | void
export type OutputDirective =  AbsoluteGOTO | RelativeGOTO | Directive | Path | Return

export type Plugin<
	UserState extends InitialState = InitialState,
	Return extends unknown = UserState[Keywords.RS],
	Arguments extends Array<unknown> = Array<unknown>,
	Process extends unknown = ProcessNode<UserState>,
> = ((current: TransformerContext<UserState, Return, Arguments, Process>) => Partial<TransformerContext<UserState, Return, Arguments, Process>>) | {
	state?: (current: TransformerContext<UserState, Return, Arguments, Process>) => InitialState,
	process?: (current: TransformerContext<UserState, Return, Arguments, Process>) => Process,
	runConfig?: (current: TransformerContext<UserState, Return, Arguments, Process>) => RunConfig<UserState, Return, Arguments, Process>,
}
export interface TransformerContext<
	UserState extends InitialState = InitialState,
	Return extends unknown = UserState[Keywords.RS],
	Arguments extends Array<unknown> = Array<unknown>,
	Process extends unknown = ProcessNode<UserState>,
> {
	process: Process,
	runConfig: RunConfig<UserState, Return, Arguments, Process>,
}


export interface SuperSmallStateMachine<
	UserState extends InitialState = InitialState,
	Return extends unknown = UserState[Keywords.RS],
	Arguments extends Array<unknown> = Array<unknown>,
	Process extends unknown = ProcessNode<UserState>,
> {
	process: Process
	(...args: Arguments): Return;
}
export abstract class SuperSmallStateMachine<
	UserState extends InitialState = InitialState,
	Return extends unknown = UserState[Keywords.RS],
	Arguments extends Array<unknown> = Array<unknown>,
	Process extends unknown = ProcessNode<UserState>,
> extends ExtensibleFunction {
	public static readonly return:      typeof returnSymbol      = returnSymbol
	public static readonly changes:     typeof changesSymbol     = changesSymbol
	public static readonly path:        typeof pathSymbol        = pathSymbol
	public static readonly strict:      typeof strictSymbol      = strictSymbol
	public static readonly strictTypes: typeof strictTypesSymbol = strictTypesSymbol

	public static readonly runConfig: RunConfig

	public static readonly keywords: typeof Keywords = Keywords
	public static readonly kw:       typeof Keywords = Keywords

	public static readonly applyChanges:<UserState extends InitialState = InitialState>(state: SystemState<UserState>, changes: Partial<UserState>) => SystemState<UserState>

	public static readonly actionName:<Process extends unknown = ProcessNode>(process: Process, path: Path) => string | undefined
	public static readonly lastOf:    <Process extends unknown = ProcessNode>(process: Process, path: Path, condition: ((item: Process, path: Path, process: Process) => boolean)) => Path | null
	
	public static readonly lastNode:<
		UserState extends InitialState = InitialState,
		Return extends unknown = UserState[Keywords.RS],
		Arguments extends Array<unknown> = Array<unknown>,
		Process extends unknown = ProcessNode<UserState>,
	>(instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Process>, 'process' | 'nodes'>, path: Path, ...nodeTypes: Array<NodeDefinition['name'] | Array<NodeDefinition['name']>>) => Path | null
	public static readonly nextPath:<
		UserState extends InitialState = InitialState,
		Return extends unknown = UserState[Keywords.RS],
		Arguments extends Array<unknown> = Array<unknown>,
		Process extends unknown = ProcessNode<UserState>,
	>(instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Process>, 'process' | 'nodes'>, state: SystemState<UserState>, path: Path) => Path | null
	public static readonly advance:<
		UserState extends InitialState = InitialState,
		Return extends unknown = UserState[Keywords.RS],
		Arguments extends Array<unknown> = Array<unknown>,
		Process extends unknown = ProcessNode<UserState>,
	>(instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Process>, 'process' | 'nodes'>, state: SystemState<UserState>, output: Process) => SystemState<UserState>
	public static readonly execute:<
		UserState extends InitialState = InitialState,
		Return extends unknown = UserState[Keywords.RS],
		Arguments extends Array<unknown> = Array<unknown>,
		Process extends unknown = ProcessNode<UserState>,
	>(instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Process>, 'process' | 'nodes' | 'runConfig'>, state: SystemState<UserState>) => Process
	public static readonly traverse:<
		UserState extends InitialState = InitialState,
		Return extends unknown = UserState[Keywords.RS],
		Arguments extends Array<unknown> = Array<unknown>,
		Process extends unknown = ProcessNode<UserState>,
	> (
		iterator: ((item: Process, path: Path, instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Process>, 'process' | 'nodes'>) => Process),
		post: ((item: Process, path: Path, instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Process>, 'process' | 'nodes'>) => Process)
	) => ((instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Process>, 'process' | 'nodes'>, path?: Path) => Process)

	public static readonly exec:<
		UserState extends InitialState = InitialState,
		Return extends unknown = UserState[Keywords.RS],
		Arguments extends Array<unknown> = Array<unknown>,
		Process extends unknown = ProcessNode<UserState>,
	>(instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Process>, 'process' | 'nodes' | 'runConfig'>, ...input: Arguments) => Return
	public static readonly execAsync:<
		UserState extends InitialState = InitialState,
		Return extends unknown = UserState[Keywords.RS],
		Arguments extends Array<unknown> = Array<unknown>,
		Process extends unknown = ProcessNode<UserState>,
	>(instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Process>, 'process' | 'nodes' | 'runConfig'>, ...input: Arguments) => Promise<Return>
	public static readonly run:<
		UserState extends InitialState = InitialState,
		Return extends unknown = UserState[Keywords.RS],
		Arguments extends Array<unknown> = Array<unknown>,
		Process extends unknown = ProcessNode<UserState>,
	>(instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Process>, 'process' | 'nodes' | 'runConfig'>, ...input: Arguments) => Return

	public abstract nodes: NodeDefinitions<UserState, Return, Arguments, Process>
	public abstract runConfig: RunConfig<UserState, Return, Arguments, Process>
	public abstract initialState: UserState

	public abstract isNode(object: unknown, objectType: (typeof object)): false | NodeDefinition['name']
	public abstract applyChanges(state: SystemState<UserState>, changes: Partial<SystemState<UserState>>): SystemState<UserState>

	public abstract actionName(path: Path): string | undefined
	public abstract lastOf(path: Path, condition: ((item: Process, path: Path, process: Process) => boolean)): Path | null
	
	public abstract lastNode(path: Path, ...nodeTypes: Array<NodeDefinition['name'] | Array<NodeDefinition['name']>>): Path | null
	public abstract nextPath(state: SystemState<UserState>, path: Path):  Path | null
	public abstract advance (state: SystemState<UserState>, output: Process): SystemState<UserState>
	public abstract execute (state: SystemState<UserState>): Process

	public abstract exec     (...input: Arguments): Return
	public abstract execAsync(...input: Arguments): Promise<Return>
	public abstract run      (...input: Arguments): Return

	// These are effectively runConfig "setters"
	public abstract plugin(...plugins: Array<Plugin<UserState, Return, Arguments, Process>>): SuperSmallStateMachine<UserState, Return, Arguments, Process>
	public abstract config(runConfig: Partial<RunConfig<UserState, Return, Arguments, Process>>): SuperSmallStateMachine<UserState, Return, Arguments, Process>
	public abstract unstrict: SuperSmallStateMachine<UserState, Return, Arguments, Process>
	public abstract strict: SuperSmallStateMachine<UserState, Return, Arguments, Process>
	public abstract strictTypes: SuperSmallStateMachine<UserState, Return, Arguments, Process>
	public abstract async: SuperSmallStateMachine<UserState, Promise<Return>, Arguments, Process>
	public abstract sync: SuperSmallStateMachine<UserState, Awaited<Return>, Arguments, Process>
	public abstract step: SuperSmallStateMachine<UserState, SystemState<UserState>, Arguments, Process>
	public abstract until(until: RunConfig<UserState, Return, Arguments, Process>['until']): SuperSmallStateMachine<UserState, Return, Arguments, Process>
	public abstract input<NewArguments extends Array<unknown> = Array<unknown>>(inputModifier: (...input: NewArguments) => Partial<InputSystemState<UserState>>): SuperSmallStateMachine<UserState, Return, NewArguments, Process>
	public abstract output<NewReturn extends unknown = Return>(outputModifier: (state: SystemState<UserState>) => NewReturn): SuperSmallStateMachine<UserState, NewReturn, Arguments, Process>
	public abstract addNode(...nodes: Array<NodeDefinition>): SuperSmallStateMachine<UserState, Return, Arguments, Process>
	public abstract defaults<NewUserState extends UserState = UserState>(initialState: NewUserState): SuperSmallStateMachine<NewUserState, NewUserState[Keywords.RS], Arguments, Process>
}

