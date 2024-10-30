export class PathReferenceError extends ReferenceError {}
export class ContextReferenceError extends ReferenceError {}
export class ContextTypeError extends TypeError {}
export class NodeTypeError extends TypeError {}
export class UndefinedNodeError extends ReferenceError {}
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
	SelfOutputType extends unknown = never,
	UserState extends InitialState = InitialState,
	Return extends unknown = UserState[Keywords.RS],
	Arguments extends Array<unknown> = [Partial<InputSystemState<UserState>>] | [],
	Output extends unknown = OutputNode<UserState, Return>,
	Process extends unknown = ProcessNode<UserState, Return, Output>,
> {
	public readonly name: string | symbol = Symbol('Unnamed node')
	public readonly isNode:   ((object: unknown, objectType: typeof object, last: NodeDefinition['name'] | false) => object is SelfType) | null = null
	public readonly execute:  ((node: SelfType,  instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>, 'process' | 'nodes' | 'config'>, state: SystemState<UserState>) => Output | Promise<Output>) | null = null
	public readonly nextPath: ((parPath: Path,   instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>, 'process' | 'nodes'>, state: SystemState<UserState>, path: Path) => undefined | null | Path) | null = null
	public readonly advance:  ((output: SelfOutputType,  instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>, 'process' | 'nodes'>, state: SystemState<UserState>) => SystemState<UserState>) | null = null
	public readonly traverse: ((
		item: SelfType,
		path: Path,
		instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>, 'process' | 'nodes'>,
		iterate: ((instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>, 'process' | 'nodes'>, path: Path) => SelfType),
		post: ((item: SelfType, path: Path, instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>, 'process' | 'nodes'>) => SelfType)
	) => SelfType) | null = null

	constructor(name: NodeDefinition['name'], { execute = null, isNode = null, nextPath = null, advance = null, traverse = null }: Partial<Pick<NodeDefinition<SelfType, SelfOutputType, UserState, Return, Arguments, Output, Process>, 'execute' | 'nextPath' | 'isNode' | 'advance' | 'traverse'>>) {
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
	Arguments extends Array<unknown> = [Partial<InputSystemState<UserState>>] | [],
	Output extends unknown = OutputNode<UserState, Return>,
	Process extends unknown = ProcessNode<UserState, Return, Output>,
> extends Map<NodeDefinition['name'], NodeDefinition<Process, Output, UserState, Return, Arguments, Output, Process>>  {
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


export interface Config<
	UserState extends InitialState = InitialState,
	Return extends unknown = UserState[Keywords.RS],
	Arguments extends Array<unknown> = [Partial<InputSystemState<UserState>>] | [],
	Output extends unknown = OutputNode<UserState, Return>,
	Process extends unknown = ProcessNode<UserState, Return, Output>,
> {
	initialState: UserState,
	iterations: number,
	until: (state: SystemState<UserState>) => boolean,
	strictContext: boolean | typeof strictTypesSymbol,
	method: null | ((...args: Arguments) => Return),
	processModifiers: Array<(process: Process) => Process>,
	inputModifiers: Array<(state: SystemState<UserState>) => SystemState<UserState>>,
	outputModifiers: Array<(process: SystemState<UserState>) => SystemState<UserState>>,
	input: (...input: Arguments) => Partial<InputSystemState<UserState>>,
	output: (state: SystemState<UserState>) => Return,
	async: boolean,
	nodes: NodeDefinitions<UserState, Return, Arguments, Output, Process>,
	// Special settings for async
	delay: number,
	allow: number,
	wait: number,
}

export type StateChanges<UserState extends InitialState = InitialState> = Partial<UserState>
	
export type ActionNode<
	UserState extends InitialState = InitialState,
	Return extends unknown = UserState[Keywords.RS],
	Output extends unknown = OutputNode<UserState, Return>,
> = (state: SystemState<UserState>) => Output | Promise<Output>

export type SequenceNode<
	UserState extends InitialState = InitialState,
	Return extends unknown = UserState[Keywords.RS],
	Output extends unknown = OutputNode<UserState, Return>,
> = Array<ProcessNode<UserState, Return, Output>>
export interface MachineNode<
	UserState extends InitialState = InitialState,
	Return extends unknown = UserState[Keywords.RS],
	Output extends unknown = OutputNode<UserState, Return>,
> {
	[Keywords.IT]: ProcessNode<UserState, Return, Output>
	[key: string | number | symbol]: ProcessNode<UserState, Return, Output>
}
export interface ConditionNode<
	UserState extends InitialState = InitialState,
	Return extends unknown = UserState[Keywords.RS],
	Output extends unknown = OutputNode<UserState, Return>,
> {
	[Keywords.IF]: (state: SystemState<UserState>) => boolean,
	[Keywords.TN]?: ProcessNode<UserState, Return, Output>
	[Keywords.EL]?: ProcessNode<UserState, Return, Output>
}
export interface SwitchNode<
	UserState extends InitialState = InitialState,
	Return extends unknown = UserState[Keywords.RS],
	Output extends unknown = OutputNode<UserState, Return>,
> {
	[Keywords.SW]: (state: SystemState<UserState>) => string | number,
	[Keywords.CS]: Record<string | number, ProcessNode<UserState, Return, Output>>
}
export type PathUnit = string | number | symbol
export type Path = Array<PathUnit>
export type ParallelNode<
	UserState extends InitialState = InitialState,
	Return extends unknown = UserState[Keywords.RS],
	Output extends unknown = OutputNode<UserState, Return>,
> = SequenceNode<UserState, Return, Output> & {[parallelSymbol]:true}

export type DirectiveNode = PathUnit | Path | { [pathSymbol]: PathUnit | Path }
export type ReturnNode<Return extends unknown = unknown> = { [returnSymbol]: Return } | typeof returnSymbol


export type ProcessNode<
	UserState extends InitialState = InitialState,
	Return extends unknown = UserState[Keywords.RS],
	Output extends unknown = OutputNode<UserState, Return>,
> =
| SequenceNode<UserState, Return, Output>
| MachineNode<UserState, Return, Output>
| ConditionNode<UserState, Return, Output>
| SwitchNode<UserState, Return, Output>
| ActionNode<UserState, Return, Output>
| DirectiveNode
| ReturnNode<Return>
| StateChanges<UserState>
| null

export type OutputNode<
	UserState extends InitialState = InitialState,
	Return extends unknown = UserState[Keywords.RS],
> =  DirectiveNode | ReturnNode<Return> | Path | StateChanges<UserState> | null | undefined | void

export interface SuperSmallStateMachine<
	UserState extends InitialState = InitialState,
	Return extends unknown = UserState[Keywords.RS],
	Arguments extends Array<unknown> = [Partial<InputSystemState<UserState>>] | [],
	Output extends unknown = OutputNode<UserState, Return>,
	Process extends unknown = ProcessNode<UserState, Return, Output>,
> {
	process: Process
	(...args: Arguments): Return;
}
export abstract class SuperSmallStateMachine<
	UserState extends InitialState = InitialState,
	Return extends unknown = UserState[Keywords.RS],
	Arguments extends Array<unknown> = [Partial<InputSystemState<UserState>>] | [],
	Output extends unknown = OutputNode<UserState, Return>,
	Process extends unknown = ProcessNode<UserState, Return, Output>,
> extends ExtensibleFunction {
	public static readonly return:      typeof returnSymbol      = returnSymbol
	public static readonly changes:     typeof changesSymbol     = changesSymbol
	public static readonly path:        typeof pathSymbol        = pathSymbol
	public static readonly strict:      typeof strictSymbol      = strictSymbol
	public static readonly strictTypes: typeof strictTypesSymbol = strictTypesSymbol

	public static readonly config: Config

	public static readonly keywords: typeof Keywords = Keywords
	public static readonly kw:       typeof Keywords = Keywords

	public static readonly applyChanges:<UserState extends InitialState = InitialState>(state: SystemState<UserState>, changes: Partial<UserState>) => SystemState<UserState>
	public static readonly actionName:<Process extends unknown = ProcessNode>(process: Process, path: Path) => string | undefined

	public static readonly lastOf:    <Process extends unknown = ProcessNode>(process: Process, path: Path, condition: ((item: Process, path: Path, process: Process) => boolean)) => Path | null

	public static readonly lastNode:<
		UserState extends InitialState = InitialState,
		Return extends unknown = UserState[Keywords.RS],
		Arguments extends Array<unknown> = [Partial<InputSystemState<UserState>>] | [],
		Output extends unknown = OutputNode<UserState, Return>,
		Process extends unknown = ProcessNode<UserState, Return, Output>,
	>(instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>, 'process' | 'nodes'>, path: Path, ...nodeTypes: Array<NodeDefinition['name'] | Array<NodeDefinition['name']>>) => Path | null
	public static readonly nextPath:<
		UserState extends InitialState = InitialState,
		Return extends unknown = UserState[Keywords.RS],
		Arguments extends Array<unknown> = [Partial<InputSystemState<UserState>>] | [],
		Output extends unknown = OutputNode<UserState, Return>,
		Process extends unknown = ProcessNode<UserState, Return, Output>,
	>(instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>, 'process' | 'nodes'>, state: SystemState<UserState>, path: Path) => Path | null
	public static readonly advance:<
		UserState extends InitialState = InitialState,
		Return extends unknown = UserState[Keywords.RS],
		Arguments extends Array<unknown> = [Partial<InputSystemState<UserState>>] | [],
		Output extends unknown = OutputNode<UserState, Return>,
		Process extends unknown = ProcessNode<UserState, Return, Output>,
	>(instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>, 'process' | 'nodes'>, state: SystemState<UserState>, output: Output) => SystemState<UserState>
	public static readonly execute:<
		UserState extends InitialState = InitialState,
		Return extends unknown = UserState[Keywords.RS],
		Arguments extends Array<unknown> = [Partial<InputSystemState<UserState>>] | [],
		Output extends unknown = OutputNode<UserState, Return>,
		Process extends unknown = ProcessNode<UserState, Return, Output>,
	>(instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>, 'process' | 'nodes' | 'config'>, state: SystemState<UserState>) => Output
	public static readonly traverse:<
		UserState extends InitialState = InitialState,
		Return extends unknown = UserState[Keywords.RS],
		Arguments extends Array<unknown> = [Partial<InputSystemState<UserState>>] | [],
		Output extends unknown = OutputNode<UserState, Return>,
		Process extends unknown = ProcessNode<UserState, Return, Output>,
	> (
		iterator: ((item: Process, path: Path, instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>, 'process' | 'nodes'>) => Process),
		post: ((item: Process, path: Path, instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>, 'process' | 'nodes'>) => Process)
	) => ((instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>, 'process' | 'nodes'>, path?: Path) => Process)

	public static readonly exec:<
		UserState extends InitialState = InitialState,
		Return extends unknown = UserState[Keywords.RS],
		Arguments extends Array<unknown> = [Partial<InputSystemState<UserState>>] | [],
		Output extends unknown = OutputNode<UserState, Return>,
		Process extends unknown = ProcessNode<UserState, Return, Output>,
	>(instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>, 'process' | 'nodes' | 'config'>, ...input: Arguments) => Return
	public static readonly execAsync:<
		UserState extends InitialState = InitialState,
		Return extends unknown = UserState[Keywords.RS],
		Arguments extends Array<unknown> = [Partial<InputSystemState<UserState>>] | [],
		Output extends unknown = OutputNode<UserState, Return>,
		Process extends unknown = ProcessNode<UserState, Return, Output>,
	>(instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>, 'process' | 'nodes' | 'config'>, ...input: Arguments) => Promise<Return>
	public static readonly run:<
		UserState extends InitialState = InitialState,
		Return extends unknown = UserState[Keywords.RS],
		Arguments extends Array<unknown> = [Partial<InputSystemState<UserState>>] | [],
		Output extends unknown = OutputNode<UserState, Return>,
		Process extends unknown = ProcessNode<UserState, Return, Output>,
	>(instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>, 'process' | 'nodes' | 'config'>, ...input: Arguments) => Return

	public abstract nodes: NodeDefinitions<UserState, Return, Arguments, Output, Process>
	public abstract config: Config<UserState, Return, Arguments, Output, Process>
	public abstract initialState: UserState

	public abstract isNode(object: unknown, objectType: (typeof object)): false | NodeDefinition['name']
	public abstract applyChanges(state: SystemState<UserState>, changes: Partial<UserState>): SystemState<UserState>

	public abstract actionName(path: Path): string | undefined
	public abstract lastOf(path: Path, condition: ((item: Process, path: Path, process: Process) => boolean)): Path | null
	
	public abstract lastNode(path: Path, ...nodeTypes: Array<NodeDefinition['name'] | Array<NodeDefinition['name']>>): Path | null
	public abstract nextPath(state: SystemState<UserState>, path: Path):  Path | null
	public abstract advance (state: SystemState<UserState>, output: Output): SystemState<UserState>
	public abstract execute (state: SystemState<UserState>): Output

	public abstract exec     (...input: Arguments): Return
	public abstract execAsync(...input: Arguments): Promise<Return>
	public abstract run      (...input: Arguments): Return

	// These are effectively config "setters"
	public abstract unstrict: SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>
	public abstract strict: SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>
	public abstract strictTypes: SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>
	public abstract async: SuperSmallStateMachine<UserState, Promise<Return>, Arguments, Output, Process>
	public abstract sync: SuperSmallStateMachine<UserState, Awaited<Return>, Arguments, Output, Process>
	public abstract step: SuperSmallStateMachine<UserState, SystemState<UserState>, Arguments, Output, Process>
	public abstract until(until: Config<UserState, Return, Arguments, Output, Process>['until']):
		SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>
	public abstract input<NewArguments extends Array<unknown> = Array<unknown>>(input: (...input: NewArguments) => Partial<InputSystemState<UserState>>):
		SuperSmallStateMachine<UserState, Return, NewArguments, Output, Process>
	public abstract output<NewReturn extends unknown = Return>(output: (state: SystemState<UserState>) =>
		NewReturn): SuperSmallStateMachine<UserState, NewReturn, Arguments, OutputNode<UserState, NewReturn>, ProcessNode<UserState, NewReturn, OutputNode<UserState, NewReturn>>>
	public abstract defaults<NewUserState extends InitialState = UserState>(initialState: NewUserState):
		SuperSmallStateMachine<NewUserState, NewUserState[Keywords.RS], Arguments, OutputNode<NewUserState, Return>, ProcessNode<NewUserState, Return, OutputNode<NewUserState, Return>>>
	public abstract forever: SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>
	public abstract for(iterations: number): SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>
	public abstract delay(delay: number): SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>
	public abstract allow(allow: number): SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>
	public abstract wait(wait: number): SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>
	public abstract override(method: ((...args: Arguments) => Return) | null): SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>
	public abstract do(process: Process): SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>
	public abstract adapt(adapter: (process: Process) => Process): SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>
	public abstract adaptInput(inputModifier: (state: Partial<InputSystemState<UserState>>) => Partial<InputSystemState<UserState>>): SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>
	public abstract adaptOutput(outputModifier: (state: SystemState<UserState>) => SystemState<UserState>): SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>
	public abstract with<NewUserState extends UserState = UserState, NewReturn extends Return = Return, NewArguments extends Arguments = Arguments, NewOutput extends Output = Output, NewProcess extends Process = Process>(transformer: ((instance: SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>) => SuperSmallStateMachine<NewUserState, NewReturn, NewArguments, NewOutput, NewProcess>)): SuperSmallStateMachine<NewUserState, NewReturn, NewArguments, NewOutput, NewProcess>
}