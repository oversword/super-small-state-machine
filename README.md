

The primary way of interacting with this library is to create a new instance:
```javascript
const executable = new S()
```

Instances are executable, like functions:
```javascript
const executable = new S()
const result = executable()
```

The constructor takes two arguments, the `process` and the `config`:
```javascript
const executable = new S(process, config)
```

Neither of these arguments are required, and it is not recommended to configure the config via the constructor. Instead you should update the config using the various chainable methods and properties.




 Instance
	executable.nodes: NodeDefinitions<UserState, Return, Arguments, Output, Process>
	executable.config: Config<UserState, Return, Arguments, Output, Process>
	executable.initialState: UserState

	executable.isNode(object: unknown, objectType: (typeof object)): false | NodeDefinition['name']
	executable.applyChanges(state: SystemState<UserState>, changes: Partial<UserState>): SystemState<UserState>

	executable.actionName(path: Path): string | undefined
	executable.lastOf(path: Path, condition: ((item: Process, path: Path, process: Process) => boolean)): Path | null
	
	executable.lastNode(path: Path, ...nodeTypes: Array<NodeDefinition['name'] | Array<NodeDefinition['name']>>): Path | null
	executable.nextPath(state: SystemState<UserState>, path: Path):  Path | null
	executable.advance (state: SystemState<UserState>, output: Output): SystemState<UserState>
	executable.execute (state: SystemState<UserState>): Output

	executable.exec     (...input: Arguments): Return
	executable.execAsync(...input: Arguments): Promise<Return>
	executable.run      (...input: Arguments): Return



// These are effectively config "setters"
executable.unstrict
Returns a new instance that will execute without checking state properties when an state change is made

executable.strict <default>
Returns a new instance that will execute while checking state properties when an state change is made

executable.strictTypes
Returns a new instance that will execute while checking state property types when an state change is made

executable.async
Returns a new instance that will execute asynchronously and allow for asynchronous actions.

executable.sync <default>
Returns a new instance that will execute synchronously and not allow for asynchronous actions.

executable.step
Returns a new instance that will only execute one action or directive at a time and will always return the full state (ignoring previous `executable.ouput` calls)

executable.until(condition) <default: (state => S.return in state)>
Stops execution of the machine once the given condition is met, and attempts to return 

executable.input(input) <default: (state => state)>
Allows the definition of the arguments the executable will use, and how they will be applied to the initial state
```javascript
const executable = new S().input((a, b, c) => ({ a, b, c }))
executable(aValue, bValue, cValue)
```

executable.output(output) <default: (state => state.result)>
Allows the modification of the value the executable will return
```javascript
const executable = new S().output(state => state.myReturnValue)
executable({ myReturnValue: 7 })
```

executable.defaults(initialState: NewUserState) <default: {}>
Defines the initial state to be used for all executions

executable.forever
Removes the max iteration limit

executable.for(iterations: number) <default: 10000>
Defines the max iteration limit

executable.override(method: ((...args: Arguments) => Return) | null) <default: executable.run>
Overrides the method that will be used when the executable is called

executable.do(process: Process) <default: null>
Defines a process to execute

executable.adapt(adapter: (process: Process) => Process)
Transforms the process before usage, allowing for temporary nodes. 

executable.adaptInput(inputModifier: (state: Partial<InputSystemState<UserState>>) => Partial<InputSystemState<UserState>>)
Transforms the state before execution

executable.adaptOutput(outputModifier: (state: SystemState<UserState>) => SystemState<UserState>)
Transforms the state after execution

executable.with(...transformers)
Allows for the addition of predifined modules

executable.addNode(...nodes)
Allows for the addition of new node types

Async Only

executable.delay(delay: number) <default: 0>
Defines an initial delay before starting to execute the process.

executable.allow(allow: number) <default: 1000>
Defines the amount of time the process is allowed to run for before pausing

executable.wait(wait: number) <default: 0>
Defines the amount of time the process will pause for when the allowed time is exceeded



S.return:      typeof returnSymbol      = returnSymbol
S.changes:     typeof changesSymbol     = changesSymbol
S.path:        typeof pathSymbol        = pathSymbol
S.strict:      typeof strictSymbol      = strictSymbol
S.strictTypes: typeof strictTypesSymbol = strictTypesSymbol

S.config: Config

S.keywords: typeof Keywords = Keywords
S.kw:       typeof Keywords = Keywords

S.applyChanges:<UserState extends InitialState = InitialState>(state: SystemState<UserState>, changes: Partial<UserState>) => SystemState<UserState>
S.actionName:<Process extends unknown = ProcessNode>(process: Process, path: Path) => string | undefined

S.lastOf:    <Process extends unknown = ProcessNode>(process: Process, path: Path, condition: ((item: Process, path: Path, process: Process) => boolean)) => Path | null

S.lastNode:<
		UserState extends InitialState = InitialState,
		Return extends unknown = UserState[Keywords.RS],
		Arguments extends Array<unknown> = [Partial<InputSystemState<UserState>>] | [],
		Output extends unknown = OutputNode<UserState, Return>,
		Process extends unknown = ProcessNode<UserState, Return, Output>,
	>(instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>, 'process' | 'nodes'>, path: Path, ...nodeTypes: Array<NodeDefinition['name'] | Array<NodeDefinition['name']>>) => Path | null
	S.nextPath:<
		UserState extends InitialState = InitialState,
		Return extends unknown = UserState[Keywords.RS],
		Arguments extends Array<unknown> = [Partial<InputSystemState<UserState>>] | [],
		Output extends unknown = OutputNode<UserState, Return>,
		Process extends unknown = ProcessNode<UserState, Return, Output>,
	>(instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>, 'process' | 'nodes'>, state: SystemState<UserState>, path: Path) => Path | null
	S.advance:<
		UserState extends InitialState = InitialState,
		Return extends unknown = UserState[Keywords.RS],
		Arguments extends Array<unknown> = [Partial<InputSystemState<UserState>>] | [],
		Output extends unknown = OutputNode<UserState, Return>,
		Process extends unknown = ProcessNode<UserState, Return, Output>,
	>(instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>, 'process' | 'nodes'>, state: SystemState<UserState>, output: Output) => SystemState<UserState>
	S.execute:<
		UserState extends InitialState = InitialState,
		Return extends unknown = UserState[Keywords.RS],
		Arguments extends Array<unknown> = [Partial<InputSystemState<UserState>>] | [],
		Output extends unknown = OutputNode<UserState, Return>,
		Process extends unknown = ProcessNode<UserState, Return, Output>,
	>(instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>, 'process' | 'nodes' | 'config'>, state: SystemState<UserState>) => Output
	S.traverse:<
		UserState extends InitialState = InitialState,
		Return extends unknown = UserState[Keywords.RS],
		Arguments extends Array<unknown> = [Partial<InputSystemState<UserState>>] | [],
		Output extends unknown = OutputNode<UserState, Return>,
		Process extends unknown = ProcessNode<UserState, Return, Output>,
	> (
		iterator: ((item: Process, path: Path, instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>, 'process' | 'nodes'>) => Process),
		post: ((item: Process, path: Path, instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>, 'process' | 'nodes'>) => Process)
	) => ((instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>, 'process' | 'nodes'>, path?: Path) => Process)

	S.exec:<
		UserState extends InitialState = InitialState,
		Return extends unknown = UserState[Keywords.RS],
		Arguments extends Array<unknown> = [Partial<InputSystemState<UserState>>] | [],
		Output extends unknown = OutputNode<UserState, Return>,
		Process extends unknown = ProcessNode<UserState, Return, Output>,
	>(instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>, 'process' | 'nodes' | 'config'>, ...input: Arguments) => Return
	S.execAsync:<
		UserState extends InitialState = InitialState,
		Return extends unknown = UserState[Keywords.RS],
		Arguments extends Array<unknown> = [Partial<InputSystemState<UserState>>] | [],
		Output extends unknown = OutputNode<UserState, Return>,
		Process extends unknown = ProcessNode<UserState, Return, Output>,
	>(instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>, 'process' | 'nodes' | 'config'>, ...input: Arguments) => Promise<Return>
	S.run:<
		UserState extends InitialState = InitialState,
		Return extends unknown = UserState[Keywords.RS],
		Arguments extends Array<unknown> = [Partial<InputSystemState<UserState>>] | [],
		Output extends unknown = OutputNode<UserState, Return>,
		Process extends unknown = ProcessNode<UserState, Return, Output>,
	>(instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>, 'process' | 'nodes' | 'config'>, ...input: Arguments) => Return










PathReferenceError
You have referenced a relative path as a string or symbol when there is no MachineNode it could be referencing, or a number when there is no SequenceNode it could be referencing. It will look at the ancestors of the directive node to find a relevant MachineNode or SequenceNode.

ContextReferenceError
You have trid to update a variable that was not predefined in the context using `executable.defaults(initialContext)`. You can use `executable.unstrict` to stop all context checking.

ContextTypeError
You have tried to set an existing variable to a different type than it started. This was likely intentionally restricted using `executable.strictTypes` as it is not default behaviour.

NodeTypeError
You have used or returned a node that could not be executed or processed. This is likely a configuration error with a custom node.

UndefinedNodeError
A node in your process is undefined, this is probably a variable that has not been defined. If you are intentionally trying to perfrom a no-op, then use `null` instead of `undefined`.

MaxIterationsError
The execution has exeeded the limit for operations performed. If you are sure you want to run for longer, use `executable.for` or `executable.forever`.


returnSymbol
Use for intentionally exiting the entire process, can be used in an object to override the result value before returning
`{ [S.return]: 'value' }`

changesSymbol
Returned in the context. Should not be passed in


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
