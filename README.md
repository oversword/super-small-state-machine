# Symbols

## S.return
Use for intentionally exiting the entire process, can be used in an object to override the result value before returning
`{ [S.return]: 'value' }`

## S.changes
Returned in the state. Should not be passed in

## S.path
Returned in the state to indicate the next action path, or passed in with the state to direct the machine. This can also be used as a node on its own to change the executing path.

## S.strict
Returned in the state and used to maintain the stricteness of the state.

## S.strictTypes
Potential value for `S.strict`

# Keywords
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


# Basics

The primary way of interacting with this library is to create a new instance:
```javascript
const executable = new S()
```

Instances are executable, like functions:
```javascript
const executable = new S()
const result = executable() // undefined
```

The constructor takes two arguments, the `process` and the `config`:
```javascript
const executable = new S(process, config)
```

Neither of these arguments are required, and it is not recommended to configure them config via the constructor. Instead you should update the config using the various chainable methods and properties.
```javascript
const executable = new S(process)
	.defaults({ ... })
	.input(...)
	.output(...)
```

# Quirks
## Result
All executables created using this library will have a `'result'` variable in their state by default.
This `'result'` variable will be the default return value of the executable, unless otherwise configured.
It is also suggested that you use the result to "pass arguments" into actions, as there is no way of passing in more arguments to an action than just the state.

## Path
The path of a state will always point to the next action that has yet to be executed.
This will be `[]` by default, indicating the root node.

## Return
This library has no built-in ability to handle events or other complex asynchronous behaviour, however it is possible to take complete control over the system, running in a step-wise fashion.
Because of this, you should attempt to model complex behaviours as always returning, yielding control over to external logic.
```javascript
	const waitForEvents = Symbol('Wait for events')

	const executable = new S({
		initial: [
			({ value }) => ({ value: value + 1 }),
			'waitForEvents'
		],
		waitForEvents: [
			{ event: null },
			{ [S.return]: waitForEvents },
			{ result: null },
			{
				switch: ({ event }) => event.type,
				case: {
					multiply: [
						({ value, event }) => ({ value: value * event.data }),
						'waitForEvents',
					],
					increment: [
						{ event: null },
						'initial'
					],
					exit: ({ value }) => ({ [S.return]: value }),
					default: 'waitForEvents'
				}
			}
		]
	}).output(state => state)

	const exec = async (initialState, yieldEvent) => {
		let currentState = initialState
		let runs = 0
		while (++runs < 100) {
			currentState = executable(currentState)
			if (currentState.result === waitForEvents) {
				currentState = S.advance(executable, currentState, { event: await yieldEvent() })
			} else break;
		}
		return { runs, result: currentState.result }
	}
	const currentState = { value: 0 }
	const eventStack = [
		{ type: 'increment' },
		{ type: 'multiply', data: 5 },
		{ type: 'increment' },
		{ type: 'exit' }
	]
	const yieldEvent = events => {
		let eventStack = [...events].reverse()
		return () => new Promise(resolve => {
			setTimeout(() => resolve(eventStack.pop()), 100)
		})
	}

	const result = await exec(currentState, yieldEvent(eventStack)) // { result: 11, runs: 5 }
```

## StateChanges
### Keywords
Certain keywords cannot be used as variable names in the state, or it may be inconvenient to update them.
These keywords are:
```javascript
'initial'
'if'
'switch'
'try'
```
These will be used to detect certain nodes and so are effectively reserved

You will always be able to update these names by returning a state change from a function instead of using the state change directly, because it is impossible to return an executable - this ensures predictability.
```javascript
const executable = new S({ initial: 'changed' })
const result = executable({ initial: 'original' }) // Error

const executable = new S(() => ({ initial: 'changed' }))
const result = executable({ initial: 'original' }) // 'changed'
```

### Arrays
Arrays will not be merged, if you wish to merge an array you must do it manually.
E.g. Adding an element to the end of a stack:
```javascript
const executable = new S(({ result }) => ({ result: [...result,4] }))
const result = executable({ result: [1,2,3] }) // [1,2,3,4]
```
## Typescript
### Adding Nodes
You cannot add nodes with the typescript version because it cannot infer the types properly.
However, it will still be possible to set the nodes manually through the config.

```javascript
const executable = new S(null, { nodes: customNodes })
```
### Chain Ordering
.defaults()


# Node types:

## Return
Causes the entire process to terminate immediately and return, setting `S.return` to `true` on the state.

If the symbol is used on its own, the it will simply return whatever value is in the "result".
It is reccomended you use the result variable for this purpose.
```javascript
const executable = new S(S.return)
const result = executable({ result: 44 }) // 44
```

Using the return symbol as the key to an object will override the result variable with that value before returning.
```javascript
const executable = new S({ [S.return]: 456 })
const result = executable({ result: 44 }) // 456
const endState = executable.output(state => state)({ result: 44 }) // { result: 465, [S.return]: true }
```

## Directives
Directives are effectively `goto` commands, or `transitions` if you prefer.

Directives are the natural way of proceeding in state machines, using the name of a neighboring state as a string you can direct flow through a state machine.
```javascript
const executable = new S({
	initial: [
		{ result: 'first' },
		'next'
	],
	next: { result: 'second' }
})
const result = executable({ result: 'start' }) // 'second'
```

You can also use symbols as state names.
```javascript
const myState = Symbol('MyState')
const executable = new S({
	initial: [
		{ result: 'first' },
		myState
	],
	[myState]: { result: 'second' }
})
const result = executable({ result: 'start' }) // 'second'
```

Numbers indicate a goto for a sequence. It is not recommended to use this as it may be unclear, but it must be possible, and should be considered system-only.
```javascript
const executable = new S([
	{ result: 'first' },
	4,
	{ result: 'skip' },
	S.return,
	{ result: 'second' },
])
const result = executable({ result: 'start' }) // 'second'
```

Slightly less not recommended is transitioning in a sequence conditonally. If you're making an incredibly basic state machine this is acceptable.
```javascript
const executable = new S([
	{
		if: ({ result }) => result === 'start',
		then: 3,
		else: 1,
	},
	{ result: 'skip' },
	S.return,
	{ result: 'second' },
])
const result = executable({ result: 'start' }) // 'second'
```

Transitioning is also possible by using and object with the `S.path` key set to a relative or absolute path. This is not recommended as it is almost never required, it should be considered system-only.
```javascript
const executable = new S({
	initial: [
		{ result: 55 },
		{ [S.path]: 'next' }
	],
	next: { result: 66 }
})
const result = executable({ result: 44 }) // 66
```

It is not possible to send any other information in this object, such as a state change.
```javascript
const executable = new S({
	initial: [
		{ result: 'first' },
		{ [S.path]: 'next', result: 'ignored' }
	],
	next: S.return
})
const result = executable({ result: 'start' }) // 'first'
```

Arrays can be used to perform absolute redirects. This is not recommended as it may make your transition logic unclear.
Arrays cannot be used on their own, because they would be interpreted as sequences. For this reason they must be contained in an object with the `S.path` symbol as a ky, with the array as the value, or returned by an action.
```javascript
const executable = new S({
	initial: [
		{ result: 'first' },
		{ [S.path]: ['next',1] }
	],
	next: [
		{ result: 'skipped' },
		S.return,
	]
})

const result = executable({ result: 'start' }) // 'first'

const executable = new S({
	initial: [
		{ result: 'first' },
		() => ['next',1]
	],
	next: [
		{ result: 'skipped' },
		S.return,
	]
})
const result = executable({ result: 'start' }) // 'first'

const executable = new S({
	initial: [
		{ result: 'first' },
		['next',1]
	],
	next: [
		{ result: 'not skipped' },
		S.return,
	]
})
const result = executable({ result: 'start' }) // 'not skipped'
```

## State Change
Updates the state by deep-merging the values. Arrays will not be deep merged.
```javascript
const executable = new S({ result: 89 })
const result = executable({ result: 44 }) // 89

const executable = new S({ result: { newValue: 89 } })
const result = executable({ result: { existingValue: 3 } }) // { existingValue: 3, newValue: 89 }
```

# Executable types:

## Action
Actions are functions. The only argument will be the state.
You can return any of the previously mentioned node types (state changes, directives, return) from an action, or return nothing at all for a set-and-forget action.
```javascript
const executable = new S(({ result }) => ({ result: result + ' addition' }))
const result = executable({ result: 'start' }) // 'start addition'

const executable = new S([
	{ result: 'first' },
	() => 4,
	{ result: 'skipped' },
	S.return,
	{ result: 'second' },
])
const result = executable({ result: 'start' }) // 'second'

const executable = new S(() => ({ [S.return]: 'changed' }))
const result = executable({ result: 'start' }) // 'changed'

const executable = new S(() => {
	// Arbitrary code
})
const result = executable({ result: 'start' }) // 'start'
```

## Sequence
Sequences are lists of nodes and executables, they will visit each node in order and exit when done.

```javascript
const executable = new S([
	({ result }) => ({ result: result + ' addition1' }),
	({ result }) => ({ result: result + ' addition2' }),
])
const result = executable({ result: 'start' }) // 'start addition1 addition2'
```

## Condition
```javascript
const executable = new S({
	if: ({ result }) => result === 'start',
	then: { result: 'truthy' },
	else: { result: 'falsey' },
})
const result = executable({ result: 'start' }) // 'truthy'

const executable = new S({
	if: ({ result }) => result === 'start',
	then: { result: 'truthy' },
	else: { result: 'falsey' },
})
const result = executable({ result: 'other' }) // 'falsey'
```

## Switch
```javascript
const executable = new S({
	switch: ({ result }) => result,
	case: {
		start: { result: 'first' },
		two: { result: 'second' },
		default: { result: 'none' },
	}
})
const result1 = executable({ result: 'start' }) // 'first'
const result2 = executable({ result: 'two' }) // 'second'
const result3 = executable({ result: 'other' }) // 'none'
```

## Machine
```javascript
const executable = new S({
	initial: [
		() => { result: 'first' },
		'next',
	],
	next: { result: 'second' }
})
const result = executable({ result: 'start' }) // 'second'
```


# Chaining Config
These are effectively config "setters", it is reccomended to use these, especially is using typescript as there is type inferece when executed in the correct order.
All of these will create a new instance, and as such will create a chainable set of modifications, much like promises.


## executable.defaults(initialState: NewUserState) <default: {}>
Defines the initial state to be used for all executions.
Returns a new instance.

```javascript
const executable = new S()
	.defaults({ result: 99 })
const result = executable() // 99
```

## executable.strict
Checks state properties when an state change is made.
Creates a new instance.

```javascript
const executable = new S(() => ({ unknownVariable: false}))
	.defaults({ knownVariable: true })
const result = executable() // undefined (succeeds)

const executable = new S(() => ({ unknownVariable: false}))
	.defaults({ knownVariable: true })
	.strict
const result = executable() // Error
```

## executable.unstrict <default>
Execute without checking state properties when an state change is made.
Creates a new instance.

```javascript
const executable = new S(() => ({ unknownVariable: false}))
	.defaults({ knownVariable: true })
	.strict
const result = executable() // Error

const executable = new S(() => ({ unknownVariable: false}))
	.defaults({ knownVariable: true })
	.strict
	.unstrict
const result = executable() // undefined (succeeds)
```

## executable.strictTypes
Checking state property types when an state change is made.
Creates a new instance.

```javascript
const executable = new S(() => ({ knownVariable: 45 }))
	.defaults({ knownVariable: true })
	.strictTypes
const result = executable() // Error
```

## executable.async
Execute asynchronously and allow for asynchronous actions.
Creates a new instance.

```javascript
const executable = new S(async () => ({ result: 45 }))
	.defaults({ result: 22 })
const result = executable() // 22

const executable = new S(async () => ({ result: 45 }))
	.defaults({ result: 22 })
	.async
const result = await executable() // 45
```


## executable.sync <default>
Execute synchronously and not allow for asynchronous actions.
Creates a new instance.
```javascript
const executable = new S(async () => ({ result: 45 }))
	.async
	.sync
	.defaults({ result: 22 })
const result = executable() // 22
```

## executable.step
Execute one action or directive at a time, and always return the full state (ignoring previous `executable.ouput` calls)
Creates a new instance.
```javascript
const executable = new S([{ result: 45 }, { result: 66 }])
	.defaults({ result: 22 })
	.step
const result1 = executable() // { result: 22 }
const result2 = executable(result1) // { result: 45 }
const result3 = executable(result2) // { result: 66 }
```


## executable.input(inputModifer) <default: (state => state)>
Allows the definition of the arguments the executable will use, and how they will be applied to the initial state.
Returns a new instance.

```javascript
const executable = new S(({ a, b, c }) => ({ [S.return]: a * b * c }))
	.defaults({ a: 0, b: 0, c: 0 })
	.input((a, b, c) => ({ a, b, c }))
const result = executable(1, 2, 3) // 6
```

## executable.output(outputModifer) <default: (state => state.result)>
Allows the modification of the value the executable will return.
Returns a new instance.
```javascript
const executable = new S(({ myReturnValue }) => ({ myReturnValue: myReturnValue + 1}))
	.defaults({ myReturnvalue: 0 })
	.output(state => state.myReturnValue)
const result = executable({ myReturnValue: 7 }) // 8
```


## executable.forever
Removes the max iteration limit.
Creates a new instance.
```javascript
const executable = new S(({ result }) => ({ result: result + 1 }))
	.defaults({ result: 0 })
	.forever
const result = executable() // Infinity
```

## executable.for(iterations: number) <default: 10000>
Defines the max iteration limit.
Returns a new instance.
```javascript
const executable = new S(({ result }) => ({ result: result + 1}))
	.defaults({ result: 0 })
	.for(10)
const result = executable() // ??
```

## executable.do(process: Process) <default: null>
Defines a process to execute, overrides the existing process.
Returns a new instance.
```javascript
const executable = new S({ result: 'old' })
	.do({ result: 'new' })
const result = executable() // 'new'
```

## executable.until(condition) <default: (state => S.return in state)>
Stops execution of the machine once the given condition is met, and attempts to return 
```javascript
const executable = new S([
	({ result }) => ({ result: result + 1 }),
	{
		if: ({ result }) => result > 4,
		then: [{ result: 'exit' }, { result:'ignored' }],
		else: 0
	}
])
	.until(({ result }) => result === 'exit')
const result = executable({ result: 0 }) // 'exit'
```

## executable.override(method: ((...args: Arguments) => Return) | null) <default: executable.run>
Overrides the method that will be used when the executable is called.
Returns a new instance.
```javascript
const executable = new S({ result: 'definedResult' }).override(function (...args) {
	console.log({ scope: this, args }) // { scope: { process: { result: 'definedResult' } }, args: [1, 2, 3] }
	return 'customReturn'
})
const result = executable(1, 2, 3) // 'customReturn'
```


## executable.adapt(adapter: (process: Process) => Process)
Transforms the process before usage, allowing for temporary nodes.
```javascript
const replaceMe = Symobl('replace me')
const executable = new S([
	replaceMe,
	S.return,
])
.adapt(function (process) {
	return S.traverse((node) => {
		if (node === replaceMe)
			return { result: 'changed' }
		return node
	})(this) })
const result = executable({ result: 'unchanged' }) // 'changed'
```

## executable.adaptInput(inputModifier: (state: Partial<InputSystemState<UserState>>) => Partial<InputSystemState<UserState>>)
Transforms the state before execution.
Returns a new instance.
```javascript
const executable = new S()
.adaptInput(state => ({
	...state,
	addedValue: 'new'
}))
const result = executable({ })
```

## executable.adaptOutput(outputModifier: (state: SystemState<UserState>) => SystemState<UserState>)
Transforms the state after execution.
Returns a new instance.
```javascript
const executable = new S()
const result = executable()
```

## executable.with(...transformers)
Allows for the addition of predifined modules.
Returns a new instance.
```javascript
const executable = new S()
const result = executable()
```

## executable.addNode(...nodes)
Allows for the addition of new node types.
Returns a new instance.
```javascript
const executable = new S()
const result = executable()
```

## Async Only

### executable.delay(delay: number) <default: 0>
Defines an initial delay before starting to execute the process.
Returns a new instance.

### executable.allow(allow: number) <default: 1000>
Defines the amount of time the process is allowed to run for before pausing.
Returns a new instance.

### executable.wait(wait: number) <default: 0>
Defines the amount of time the process will pause for when the allowed time is exceeded.
Returns a new instance.


# Instance Properties
## Process
```javascript
const executable = new S({ result: 'value' })
const result = executable.process // { result: 'value' }
```

## executable.config: Config<UserState, Return, Arguments, Output, Process>
```javascript
const executable = new S({ result: 'value' })
const modifiedExecutable = executable
	.async
	.for(10)
	.defaults({ result: 'other' })
	.strict
	.delay(20)
	.allow(100)
	.wait(100)

const result1 = executable.config /* { 
	initialState: { result: null },
	iterations: 10000,
	strictContext: false,
	async: false,
	delay: 0,
	allow: 1000,
	wait: 0,
} */
const result2 = modifiedExecutable.config /* { 
	initialState: { result: 'other' }
	iterations: 10,
	strictContext: true,
	async: true,
	delay: 20,
	allow: 100,
	wait: 100,
} */
```

## executable.nodes: NodeDefinitions<UserState, Return, Arguments, Output, Process>

## executable.initialState: UserState

# Instance Methods

## executable.isNode(object, objectType = typeof object, isOutput = false)
Detect the node type of the object passed, will return `false` if no match, or the name of the node type as a string.
Possible node types are:
```javascript
'undefined'
'empty'
'directive'
'return'
'action'
'sequence'
'condition'
'switch'
'machine'
'changes'
```

## executable.applyChanges(state, changes)
Merges the `changes` with the given `state` and returns it.
This will ignore any symbols in `changes`, and forward the important symbols of the given `state`.

## executable.actionName(path: Path): string | undefined
Returns the name of the action at the given `path` in the executable's process.

## executable.lastOf(path, condition: state => boolean)
Returns the path of the closest ancestor to the node at the given `path` that matches the given `condition`.
Returns `null` if no ancestor matches the condition.

## executable.lastNode(path: Path, ...nodeTypes)
Returns the path of the closest ancestor to the node at the given `path` that matches one of the given `nodeTypes`.
Returns `null` if no ancestor matches the one of the given `nodeTypes`.

## executable.nextPath(state: SystemState<UserState>, path: Path):  Path | null
Performs fallback logic when a node exits.

## executable.advance (state: SystemState<UserState>, output: Output): SystemState<UserState>
Applies any changes in the given `output` to the given `state`

## executable.execute (state: SystemState<UserState>): Output
Executes the node in the process at the state's current path and returns it's output.
If the node is not executable it will be returned as the output.

## executable.exec(...input)
Execute the entire state machine synchronously.

## executable.execAsync(...input)
Execute the entire state machine asynchronously. Always returns a promise.

## executable.run(...input)
Execute the entire state machine either synchronously or asynchronously depending on the config.



# Class Methods

## S.applyChanges(state, changes)
Merges the `changes` with the given `state` and returns it.
This will ignore any symbols in `changes`, and forward the important symbols of the given `state`.

## S.actionName(process: Process, path: Path) => string | undefined
Returns the name of the action at the given `path` in the executable's process.

## S.lastOf(process, path, condition: ((item: Process, path: Path, process: Process) => boolean)) => Path | null
Returns the path of the closest ancestor to the node at the given `path` that matches the given `condition`.
Returns `null` if no ancestor matches the condition.

## S.lastNode(instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>, 'process' | 'nodes'>, path: Path, ...nodeTypes: Array<NodeDefinition['name'] | Array<NodeDefinition['name']>>) => Path | null
Returns the path of the closest ancestor to the node at the given `path` that matches one of the given `nodeTypes`.
Returns `null` if no ancestor matches the one of the given `nodeTypes`.

## S.nextPath(instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>, 'process' | 'nodes'>, state: SystemState<UserState>, path: Path) => Path | null
Performs fallback logic when a node exits.

## S.advance(instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>, 'process' | 'nodes'>, state: SystemState<UserState>, output: Output) => SystemState<UserState>
Applies any changes in the given `output` to the given `state`

## S.execute(instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>, 'process' | 'nodes' | 'config'>, state: SystemState<UserState>) => Output
Executes the node in the process at the state's current path and returns it's output.
If the node is not executable it will be returned as the output.

## S.traverse(
		iterator: ((item: Process, path: Path, instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>, 'process' | 'nodes'>) => Process),
		post: ((item: Process, path: Path, instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>, 'process' | 'nodes'>) => Process)
	) => ((instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>, 'process' | 'nodes'>, path?: Path) => Process)

## S.exec(instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>, 'process' | 'nodes' | 'config'>, ...input: Arguments) => Return
Execute the entire state machine synchronously.

## S.execAsync(instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>, 'process' | 'nodes' | 'config'>, ...input: Arguments) => Promise<Return>
Execute the entire state machine asynchronously. Always returns a promise.

## S.run(instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>, 'process' | 'nodes' | 'config'>, ...input: Arguments) => Return
Execute the entire state machine either synchronously or asynchronously depending on the config.








# Errors

## PathReferenceError
You have referenced a relative path as a string or symbol when there is no MachineNode it could be referencing, or a number when there is no SequenceNode it could be referencing. It will look at the ancestors of the directive node to find a relevant MachineNode or SequenceNode.

## ContextReferenceError
You have trid to update a variable that was not predefined in the context using `executable.defaults(initialContext)`. You can use `executable.unstrict` to stop all context checking.

## ContextTypeError
You have tried to set an existing variable to a different type than it started. This was likely intentionally restricted using `executable.strictTypes` as it is not default behaviour.

## NodeTypeError
You have used or returned a node that could not be executed or processed. This is likely a configuration error with a custom node.

## UndefinedNodeError
A node in your process is undefined, this is probably a variable that has not been defined. If you are intentionally trying to perfrom a no-op, then use `null` instead of `undefined`.

## MaxIterationsError
The execution has exeeded the limit for operations performed. If you are sure you want to run for longer, use `executable.for` or `executable.forever`.


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












// TODO: add try catch?

Decide boolean:
Conditional for next line
Exit but continue === true?
Reserve for something with events, e.g. preventDefault?