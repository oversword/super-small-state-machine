<img alt="Super Small State Machine" src="./logo.svg" width=800 />

# Language

A process is made of nodes

Nodes are executables or actions

Actions are performed on the state

It then proceeds to the next node

The state is made of properties

The state may be given special system symbols containing execution information

Machines have multiple stages, refered to by strings or symbols

Sequences have multiple indexes, refered to by numbers

Conditions (including switch) have clauses

# Instance

Process

```javascript
const instance = new S({ result: 'value' })
return instance.process // { result: 'value' }
```

Config

```javascript
const instance = new S()
return instance.config // { defaults: { result: undefined }, iterations: 10000, strict: false, async: false }
```

```javascript
const instance = new S()
const modifiedInstance = instance
	.async
	.for(10)
	.defaults({ result: 'other' })
	.strict
return modifiedInstance.config // { defaults: { result: 'other' }, iterations: 10, strict: true, async: true }
```

## Instance Constructor

### Basics

The primary way of interacting with this library is to create a new instance

```javascript
const instance = new S() // Succeeds
```

Instances are executable, like functions

```javascript
const instance = new S()
return instance() === undefined // Succeeds
```

The constructor takes two arguments, the `process` and the `config`

```javascript
const instance = new S({}, {})
return instance() // Succeeds
```

Neither of these arguments are required, and it is not recommended to configure them config via the constructor. Instead you should update the config using the various chainable methods and properties.

```javascript
const instance = new S(process)
	.defaults({})
	.input()
	.output() // Succeeds
```

Create an ExtensibleFunction that can execute the `run` or `override` method in scope of the new SuperSmallStateMachine instance.

### Create the config by merging the passed config with the defaults.

This is private so it cannot be mutated at runtime

The process must be public, it cannot be deep merged or cloned as it may contain symbols.

## instance.closest (path = [], ...nodeTypes)

Returns the path of the closest ancestor to the node at the given `path` that matches one of the given `nodeTypes`.

Returns `null` if no ancestor matches the one of the given `nodeTypes`.

```javascript
const instance = new S([
	{
		if: ({ result }) => result === 'start',
		then: [
			{ result: 'second' },
			S.Return,
		]
	}
])
return instance.closest([0, 'then', 1], 'sequence') // [ 0, 'then' ]
```

## instance.changes (state = {}, changes = {})

Safely apply the given `changes` to the given `state`.

Merges the `changes` with the given `state` and returns it.

This will ignore any symbols in `changes`, and forward the important symbols of the given `state`.

```javascript
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
return result // { common: 'changed', preserved: 'value', [S.Path]: [ 'preserved' ], [S.Changes]: { ignored: undefined, common: 'changed' } }
```

## instance.proceed (state = {}, path = state[S.Path] || [])

Proceed to the next execution path.

Performs fallback logic when a node exits.

## instance.perform (state = {}, action = null)

Perform actions on the state.

Applies any changes in the given `action` to the given `state`.

Proceeds to the next node if the action is not itself a directive or return.

## instance.execute (state = {}, path = state[S.Path] || [])

Execute a node in the process, return an action.

Executes the node in the process at the state's current path and returns it's action.

If the node is not executable it will be returned as the action.

## instance.traverse(iterator = a => a, post = b => b)

TODO: traverse and adapt same thing?

## instance.run (...input)

Execute the entire process either synchronously or asynchronously depending on the config.

## instance.runSync (...input)

Execute the entire process synchronously.

## instance.runAsync (...input)

Execute the entire process asynchronously. Always returns a promise.

## instance.do(process) <default: null>

Defines a process to execute, overrides the existing process.

Returns a new instance.

```javascript
const instance = new S({ [S.Return]: 'old' })
	.do({ [S.Return]: 'new' })
return instance() // 'new'
```

## instance.defaults(defaults) <default: {}>

Defines the initial state to be used for all executions.

Returns a new instance.

```javascript
const instance = new S(({ result }) => ({ [S.Return]: result }))
	.defaults({ result: 'default' })
return instance() // 'default'
```

## instance.input(input) <default: (state => state)>

Allows the definition of the arguments the executable will use, and how they will be applied to the initial state.

Returns a new instance.

```javascript
const instance = new S(({ first, second }) => ({ [S.Return]: `${first} then ${second}` }))
	.defaults({ first: '', second: '' })
	.input((first, second) => ({ first, second }))
return instance('this', 'that') // 'this then that'
```

## instance.output(output) <default: (state => state.output)>

Allows the modification of the value the executable will return.

Returns a new instance.

```javascript
const instance = new S(({ myReturnValue }) => ({ myReturnValue: myReturnValue + ' extra' }))
	.output(state => state.myReturnValue)
return instance({ myReturnValue: 'start' }) // 'start extra'
```

## instance.unstrict <default>

Execute without checking state properties when a state change is made.

Creates a new instance.

```javascript
const instance = new S(() => ({ unknownVariable: false}))
	.defaults({ knownVariable: true })
	.strict
return instance() // StateReferenceError
```

```javascript
const instance = new S(() => ({ unknownVariable: false}))
	.defaults({ knownVariable: true })
	.strict
	.unstrict
return instance() // Succeeds
```

## instance.strict

Checks state properties when an state change is made.

Creates a new instance.

```javascript
const instance = new S(() => ({ unknownVariable: false}))
	.defaults({ knownVariable: true })
return instance() // Succeeds
```

```javascript
const instance = new S(() => ({ unknownVariable: false}))
	.defaults({ knownVariable: true })
	.strict
return instance() // StateReferenceError
```

## instance.strictTypes

Checking state property types when an state change is made.

Creates a new instance.

```javascript
const instance = new S([
	() => ({ knownVariable: 45 }),
	({ knownVariable }) => ({ [S.Return]: knownVariable })
])
	.defaults({ knownVariable: true })
	.strictTypes
return instance() // StateTypeError
```

## instance.for(iterations = 10000) <default: 10000>

Defines the maximum iteration limit.

Returns a new instance.

```javascript
const instance = new S([
	({ result }) => ({ result: result + 1}),
	0
])
	.defaults({ result: 0 })
	.for(10)
return instance() // MaxIterationsError
```

## instance.until(until) <default: (state => S.Return in state)>

Stops execution of the machine once the given condition is met, and attempts to return.

```javascript
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
return instance({ result: 0 }) // 'exit'
```

## instance.forever

Removes the max iteration limit.

Creates a new instance.

```javascript
const instance = new S().forever
return instance.config.iterations // Infinity
```

## instance.sync <default>

Execute synchronously and not allow for asynchronous actions.

Creates a new instance.

```javascript
const instance = new S(async () => ({ [S.Return]: 'returned' }))
	.async
	.sync
return instance() // undefined
```

## instance.async

Execute asynchronously and allow for asynchronous actions.

Creates a new instance.

```javascript
const instance = new S(async () => ({ [S.Return]: 'returned' }))
return instance() // undefined
```

```javascript
const instance = new S(async () => ({ [S.Return]: 'returned' }))
	.async
return await instance() // 'returned'
```

## instance.pause(pause) <default: (() => false)>

Allows an async execution to be paused between steps.

Returns a new instance.

## instance.override(override) <default: instance.run>

Overrides the method that will be used when the executable is called.

Returns a new instance.

```javascript
const instance = new S({ [S.Return]: 'definedResult' })
	.override(function (a, b, c) {
		// console.log({ scope: this, args }) // { scope: { process: { result: 'definedResult' } }, args: [1, 2, 3] }
		return `customResult. a: ${a}, b: ${b}, c: ${c}`
	})
return instance(1, 2, 3) // 'customResult. a: 1, b: 2, c: 3'
```

## instance.addNode(...nodes)

Allows for the addition of new node types.

Returns a new instance.

```javascript
const specialSymbol = Symbol('My Symbol')
class SpecialNode extends NodeDefinition {
	static name = 'special'
	static typeof(object, objectType) { return Boolean(objectType === 'object' && object && specialSymbol in object)}
	static execute(){ return { [S.Return]: 'specialValue' } }
}
const instance = new S({ [specialSymbol]: true })
	.output(({ result, [S.Return]: output = result }) => output)
	.addNode(SpecialNode)
return instance({ result: 'start' }) // 'specialValue'
```

```javascript
const specialSymbol = Symbol('My Symbol')
const instance = new S({ [specialSymbol]: true })
	.output(({ result, [S.Return]: output = result }) => output)
return instance({ result: 'start' }) // 'start'
```

## instance.adapt(...adapters)

Transforms the process before usage, allowing for temporary nodes.

```javascript
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
return instance() // 'replaced'
```

## instance.before(...adapters)

Transforms the state before execution.

Returns a new instance.

```javascript
const instance = new S()
	.output(({ result }) => result)
	.before(state => ({
		...state,
		result: 'overridden'
	}))
return instance({ result: 'input' }) // 'overridden'
```

## instance.after(...adapters)

Transforms the state after execution.

Returns a new instance.

```javascript
const instance = new S()
	.output(({ result }) => result)
	.after(state => ({
		...state,
		result: 'overridden'
	}))
return instance({ result: 'start' }) // 'overridden'
```

## instance.with(...adapters)

Allows for the addition of predifined modules.

Returns a new instance.

```javascript
const instance = new S()
	.with(S.strict, S.async, S.for(10))
return instance.config // { async: true, strict: true, iterations: 10 }
```

# Chain

## S.closest (path = [], ...nodeTypes)

Returns the path of the closest ancestor to the node at the given `path` that matches one of the given `nodeTypes`.

Returns `null` if no ancestor matches the one of the given `nodeTypes`.

```javascript
const instance = new S([
	{
		if: ({ result }) => result === 'start',
		then: [
			{ result: 'second' },
			S.Return,
		]
	}
])
return S.closest([0, 'then', 1], 'sequence')(instance) // [ 0, 'then' ]
```

## S.changes (state = {}, changes = {})

Safely apply the given `changes` to the given `state`.

Merges the `changes` with the given `state` and returns it.

This will ignore any symbols in `changes`, and forward the important symbols of the given `state`.

```javascript
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
return result // { common: 'changed', preserved: 'value', [S.Path]: [ 'preserved' ], [S.Changes]: { ignored: undefined, common: 'changed' } }
```

## S.proceed (state = {}, path = state[S.Path] || [])

Proceed to the next execution path.

Performs fallback logic when a node exits.

## S.perform (state = {}, action = null)

Perform actions on the state.

Applies any changes in the given `action` to the given `state`.

Proceeds to the next node if the action is not itself a directive or return.

## S.execute (state = {}, path = state[S.Path] || [])

Execute a node in the process, return an action.

Executes the node in the process at the state's current path and returns it's action.

If the node is not executable it will be returned as the action.

## S.traverse(iterator = a => a, post = b => b)

TODO: traverse and adapt same thing?

## S.run (...input)

Execute the entire process either synchronously or asynchronously depending on the config.

## S.runSync (...input)

Execute the entire process synchronously.

## S.runAsync (...input)

Execute the entire process asynchronously. Always returns a promise.

## S.do(process) <default: null>

Defines a process to execute, overrides the existing process.

Returns a function that will modify a given instance.

```javascript
const instance = new S({ [S.Return]: 'old' })
const newInstance = instance.with(S.do({ [S.Return]: 'new' }))
return newInstance() // 'new'
```

## S.defaults(defaults) <default: {}>

Defines the initial state to be used for all executions.

Returns a function that will modify a given instance.

```javascript
const instance = new S(({ result }) => ({ [S.Return]: result }))
const newInstance = instance.with(S.defaults({ result: 'default' }))
return newInstance() // 'default'
```

## S.input(input) <default: (state => state)>

Allows the definition of the arguments the executable will use, and how they will be applied to the initial state.

Returns a function that will modify a given instance.

```javascript
const instance = new S(({ first, second }) => ({ [S.Return]: `${first} then ${second}` }))
.with(
	S.defaults({ first: '', second: '' }),
	S.input((first, second) => ({ first, second }))
)
return instance('this', 'that') // 'this then that'
```

## S.output(output) <default: (state => state[S.Return])>

Allows the modification of the value the executable will return.

Returns a function that will modify a given instance.

```javascript
const instance = new S(({ myReturnValue }) => ({ myReturnValue: myReturnValue + ' extra' }))
	.with(S.output(state => state.myReturnValue))
return instance({ myReturnValue: 'start' }) // 'start extra'
```

## S.unstrict <default>

Execute without checking state properties when a state change is made.

Will modify the given instance.

With the strict flag, an unknown property cannot be set on the state.

```javascript
const instance = new S(() => ({ unknownVariable: false}))
.with(
	S.defaults({ knownVariable: true }),
	S.strict
)
return instance() // StateReferenceError
```

The unstrict flag will override strict behaviour, so that an unknown property can be set on the state.

```javascript
const instance = new S(() => ({ unknownVariable: false}))
.with(
	S.defaults({ knownVariable: true }),
	S.strict,
	S.unstrict
)
return instance() // Succeeds
```

## S.strict

Checks state properties when an state change is made.

Will modify the given instance.

Without the strict flag, unknown properties can be set on the state by a state change action.

```javascript
const instance = new S(() => ({ unknownVariable: false}))
	.with(S.defaults({ knownVariable: true }))
return instance() // Succeeds
```

With the strict flag, unknown properties cannot be set on the state by a state change action.

```javascript
const instance = new S(() => ({ unknownVariable: false}))
.with(
	S.defaults({ knownVariable: true }),
	S.strict
)
return instance() // StateReferenceError
```

## S.strictTypes

Checking state property types when an state change is made.

Will modify the given instance.

With the strict types flag, known properties cannot have their type changed by a state change action

```javascript
const instance = new S(() => ({ knownVariable: 45 }))
.with(
	S.defaults({ knownVariable: true }),
	S.strictTypes
)
return instance() // StateTypeError
```

## S.for(iterations = 10000) <default: 10000>

Defines the maximum iteration limit.

Returns a function that will modify a given instance.

A limited number of iterations will cause the machine to exit early

```javascript
const instance = new S([
	({ result }) => ({ result: result + 1}),
	0
])
.with(
	S.defaults({ result: 0 }),
	S.for(10)
)
return instance() // MaxIterationsError
```

## S.until(until) <default: (state => S.Return in state)>

Stops execution of the machine once the given condition is met, and attempts to return.

Returns a function that will modify a given instance.

```javascript
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
return instance({ result: 0 }) // 'exit'
```

## S.forever

Removes the max iteration limit.

Will modify the given instance.

```javascript
const instance = new S().with(S.forever)
return instance.config.iterations // Infinity
```

## S.sync <default>

Execute synchronously and not allow for asynchronous actions.

Will modify the given instance.

```javascript
const instance = new S(async () => ({ [S.Return]: 'returned' }))
.with(
	S.async,
	S.sync,
)
return instance() // undefined
```

## S.async

Execute asynchronously and allow for asynchronous actions.

Will modify the given instance.

```javascript
const instance = new S(async () => ({ [S.Return]: 'returned' }))
return instance() // undefined
```

```javascript
const instance = new S(async () => ({ [S.Return]: 'returned' }))
.with(
	S.async
)
return await instance() // 'returned'
```

## S.pause(pause) <default: (() => false)>

Allows an async execution to be paused between steps.

Returns a function that will modify a given instance.

## S.override(override) <default: instance.run>

Overrides the method that will be used when the executable is called.

Returns a function that will modify a given instance.

```javascript
const instance = new S({ [S.Return]: 'definedResult' })
	.with(
		S.override(function (a, b, c) {
			// console.log({ scope: this, args }) // { scope: { process: { result: 'definedResult' } }, args: [1, 2, 3] }
			return `customResult. a: ${a}, b: ${b}, c: ${c}`
		})
	)
return instance(1, 2, 3) // 'customResult. a: 1, b: 2, c: 3'
```

## S.addNode(...nodes)

Allows for the addition of new node types.

Returns a function that will modify a given instance.

```javascript
const specialSymbol = Symbol('My Symbol')
class SpecialNode extends NodeDefinition {
	static name = 'special'
	static typeof(object, objectType) { return Boolean(objectType === 'object' && object && specialSymbol in object)}
	static execute(){ return { [S.Return]: 'specialValue' } }
}
const instance = new S({ [specialSymbol]: true })
	.with(
		S.output(({ result, [S.Return]: output = result }) => output),
		S.addNode(SpecialNode)
	)
return instance({ result: 'start' }) // 'specialValue'
```

```javascript
const specialSymbol = Symbol('My Symbol')
const instance = new S({ [specialSymbol]: true })
	.with(
		S.output(({ result, [S.Return]: output = result }) => output)
	)
return instance({ result: 'start' }) // 'start'
```

## S.adapt(...adapters)

Transforms the process before usage, allowing for temporary nodes.

Returns a function that will modify a given instance.

```javascript
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
return instance() // 'replaced'
```

## S.before(...adapters)

Transforms the state before execution.

Returns a function that will modify a given instance.

```javascript
const instance = new S()
.with(
	S.output(({ result }) => result),
	S.before(state => ({
		...state,
		result: 'overridden'
	}))
)
return instance({ result: 'input' }) // 'overridden'
```

## S.after(...adapters)

Transforms the state after execution.

Returns a function that will modify a given instance.

```javascript
const instance = new S()
.with(
	S.output(({ result }) => result),
	S.after(state => ({
		...state,
		result: 'overridden'
	}))
)
return instance({ result: 'input' }) // 'overridden'
```

## S.with(...adapters)

Allows for the addition of predifined modules.

Returns a function that will modify a given instance.

```javascript
const plugin = S.with(S.strict, S.async, S.for(10))
const instance = new S().with(plugin)
return instance.config // { async: true, strict: true, iterations: 10 }
```

Allow the input of a list or a list of lists, etc.

### Return a function that takes a specific instance.

Pass each state through the adapters sequentially.

Make sure an instance is returned.

# Core

Every instance must have a process and be callable.

## Symbols

### Return

Use for intentionally exiting the entire process, can be used in an object to return a specific value

```javascript
return { [S.Return]: "value" } // Succeeds
```

### Changes

Returned in the state. Should not be passed in.

```javascript
return { [S.Changes]: {} } // Succeeds
```

### Path

Returned in the state to indicate the next action path, or passed in with the state to direct the machine. This can also be used as a node on its own to change the executing path.

```javascript
return { [S.Path]: [] } // Succeeds
```

### StrictTypes

Possible value of `config.strict`, used to indicate strict types as well as values.

Key Words

Node Types

## Config

Initialise an empty state by default

Input the initial state by default

Return the `S.Return` property by default

Do not perform strict state checking by default

Allow 1000 iterations by default

Run util the return symbol is present by default.

Do not allow for asynchronous actions by default

Do not allow for asynchronous actions by default

Do not override the execution method by default

Use the provided nodes by default.

Initialise with an empty adapters list.

Initialise with an empty start adapters list.

Initialise with an empty end adapters list.

## S._closest (instance, path = [], ...nodeTypes)

Returns the path of the closest ancestor to the node at the given `path` that matches one of the given `nodeTypes`.

Returns `null` if no ancestor matches the one of the given `nodeTypes`.

```javascript
const instance = new S([
	{
		if: ({ result }) => result === 'start',
		then: [
			{ result: 'second' },
			S.Return,
		]
	}
])
return S._closest(instance, [0, 'then', 1], 'sequence') // [ 0, 'then' ]
```

Node types can be passed in as arrays of strings, or arrays of arrays of strings...

### Use get_closest_path to find the closest path.

Get the type of the node

Pick this node if it matches any of the given types

## S._changes (instance, state = {}, changes = {})

Safely apply the given `changes` to the given `state`.

Merges the `changes` with the given `state` and returns it.

This will ignore any symbols in `changes`, and forward the important symbols of the given `state`.

```javascript
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
return result // { common: 'changed', preserved: 'value', [S.Path]: [ 'preserved' ], [S.Changes]: { ignored: undefined, common: 'changed' } }
```

### If the strict state flag is truthy, perform state checking logic

#### Go through each property in the changes and check they all already exist

Throw a StateReferenceError if a property is referenced that did not previosly exist.

#### If the strict state flag is set to the Strict Types Symbol, perform type checking logic.

##### Go through each property and check the JS type is the same as the initial values.

Collect all the errors, using the same logic as above.

Throw a StateTypeError if a property changes types.

Collect all the changes in the changes object.

### Return a new object

Deep merge the current state with the new changes

Carry over the original path.

Update the changes to the new changes

## S._proceed (instance, state = {}, path = state[S.Path] || [])

Proceed to the next execution path.

```javascript
const instance = new S([
	'firstAction',
	'secondAction'
])
return S._proceed(instance, {
	[S.Path]: [0]
}) // { [S.Path]: [ 1 ] }
```

Performs fallback logic when a node exits.

```javascript
const instance = new S([
	[
		'firstAction',
		'secondAction',
	],
	'thirdAction'
])
return S._proceed(instance, {
	[S.Path]: [0,1]
}) // { [S.Path]: [ 1 ] }
```

Return `null` (unsuccessful) if the root node is reached

Get the next closest ancestor that can be proceeded

If no such node exists, return `null` (unsuccessful)

Get this closest ancestor

Determine what type of node the ancestor is

Get the node defintion for the ancestor

If the node definition cannot be proceeded, return `null` (unsuccessful)

Call the `proceed` method of the ancestor node to get the next path.

If there a next path, return it

Proceed updwards through the tree and try again.

## S._perform (instance, state = {}, action = null)

Perform actions on the state.

```javascript
const instance = new S([
	'firstAction',
	'secondAction',
	'thirdAction'
])
return S._perform(instance, { [S.Path]: [0], prop: 'value' }, { prop: 'newValue' }) // { prop: 'newValue', [S.Path]: [ 1 ] }
```

Applies any changes in the given `action` to the given `state`.

```javascript
const instance = new S([
	'firstAction',
	'secondAction',
	'thirdAction'
])
return S._perform(instance, { [S.Path]: [0], prop: 'value' }, { [S.Path]: [2] }) // { prop: 'value', [S.Path]: [ 2 ] }
```

Proceeds to the next node if the action is not itself a directive or return.

```javascript
const instance = new S([
	'firstAction',
	'secondAction'
])
return S._perform(instance, { [S.Path]: [0] }, null) // { [S.Path]: [ 1 ] }
```

Get the current path, default to the root node.

Get the node type of the given `action`

Gets the node definition for the action

### If the action can be performed

Perform the action on the state

Throw a NodeTypeError if the action cannot be performed

## S._execute (instance, state = {}, path = state[S.Path] || [])

Executes the node in the process at the state's current path and returns it's action.

```javascript
const instance = new S([
	() => ({ result: 'first' }),
	() => ({ result: 'second' }),
	() => ({ result: 'third' }),
])
return S._execute(instance, { [S.Path]: [1] }) // { result: 'second' }
```

If the node is not executable it will be returned as the action.

```javascript
const instance = new S([
	({ result: 'first' }),
	({ result: 'second' }),
	({ result: 'third' }),
])
return S._execute(instance, { [S.Path]: [1] }) // { result: 'second' }
```

Get the node at the given `path`

Get the type of that node

Get the definition of the node

### If the node can be executed

Execute the node and return its resulting action

If it cannot be executed, return the node to be used as an action

## S._traverse(instance, iterator = a => a, post = b => b)

Traverses a process, mapping each node to a new value, effectively cloning the process.

You can customise how each leaf node is mapped by supplying the `iterator` method

You can also customise how branch nodes are mapped by supplying the `post` method

The post method will be called after child nodes have been processed by the `iterator`

Make sure the post functions is scoped to the given instance

### Create an interation function to be used recursively

Get the node at the given `path`

Get the type of the node

Get the definition of the node

#### If the node can be traversed

Traverse it

If it cannot be traversed, it is a leaf node

Call the primary method

## S._run (instance, ...input)

Execute the entire process either synchronously or asynchronously depending on the config.

If the process is asynchronous, execute use `runAsync`

If the process is asynchronous, execute use `runSync`

## S._runSync (instance, ...input)

Execute the entire process synchronously.

Extract the useful parts of the config

Turn the arguments into an initial condition

### Merge the initial condition with the default initial state

Default to an empty change object

Use the defaults as an initial state

Use the path from the initial state - allows for starting at arbitrary positions

### Repeat for a limited number of iterations.

This should be fine for most finite machines, but may be too little for some constantly running machines.

#### Check the configured `until` condition to see if we should exit.

Do it first to catch starting with a `S.Return` in place.

#### If the interations are exceeded, Error

Throw new MaxIterationsError

Execute the current node on the process and perform any required actions. Updating the currentState

When returning, run the ends state adapters, then the output adapter to complete execution.

## S._runAsync (instance, ...input)

Execute the entire process asynchronously. Always returns a promise.

Extract the useful parts of the config

Turn the arguments into an initial condition

### Merge the initial condition with the default initial state

Default to an empty change object

Use the defaults as an initial state

Use the path from the initial state - allows for starting at arbitrary positions

### Repeat for a limited number of iterations.

This should be fine for most finite machines, but may be too little for some constantly running machines.

Pause execution based on the pause customisation method

Check the configured `until` condition to see if we should exit.

#### If the interaction are exceeded, Error

Throw new MaxIterationsError

Execute the current node on the process and perform any required actions. Updating the currentState

When returning, run the ends state adapters, then the output adapter to complete execution.

# Default Nodes

## Changes Node

Updates the state by deep-merging the properties. Arrays will not be deep merged.

Overrides existing properties when provided

```javascript
const instance = new S({ result: 'overridden' })
	.output(({ result }) => result)
return instance({ result: 'start' }) // 'overridden'
```

Adds new properties while preserving existing properties

```javascript
const instance = new S({ result: { newValue: true } })
	.output(({ result }) => result)
return instance({ result: { existingValue: true } }) // { existingValue: true, newValue: true }
```

This definition is exported by the library as `{ ChangesNode }`

```javascript
import { ChangesNode } from './index.js'
	
return ChangesNode; // success
```

Use the `NodeTypes.CH` (changes) value as the name.

Any object not caught by other conditions should qualify as a state change.

Apply the changes to the state and step forward to the next node

## Sequence Node

Sequences are lists of nodes and executables, they will visit each node in order and exit when done.

Sequences will execute each index in order

```javascript
const instance = new S([
	({ result }) => ({ result: result + ' addition1' }),
	({ result }) => ({ result: result + ' addition2' }),
]).output(({ result }) => result)
return instance({ result: 'start' }) // 'start addition1 addition2'
```

This definition is exported by the library as `{ SequenceNode }`

```javascript
import { SequenceNode } from './index.js'
	
return SequenceNode; // success
```

Use the `NodeTypes.SQ` (sequence) value as the name.

### Proceed by running the next item in the sequence

Get the sequence at the path

Get the current index in this sequence from the path

Increment the index, unless the end has been reached

A sequence is an array. A sequence cannot be an action, that will be interpreted as an absolute-directive.

Execute a sequence by directing to the first node (so long as it has nodes)

Traverse a sequence by iterating through each item in the array.

## Function Node

The only argument to the function will be the state.

You can return any of the previously mentioned action types from a function, or return nothing at all for a set-and-forget action.

A function can return a state change

```javascript
const instance = new S(({ result }) => ({ result: result + ' addition' }))
	.output(({ result }) => result)
return instance({ result: 'start' }) // 'start addition'
```

A function can return a directive

```javascript
const instance = new S([
	{ result: 'first' },
	() => 4,
	{ result: 'skipped' },
	S.Return,
	{ result: 'second' },
]).output(({ result }) => result)
return instance({ result: 'start' }) // 'second'
```

A function can return a return statement

```javascript
const instance = new S(() => ({ [S.Return]: 'changed' }))
return instance() // 'changed'
```

A function can do anything without needing to return (set and forget)

```javascript
const instance = new S(() => {
	// Arbitrary code
}).output(({ result }) => result)
return instance({ result: 'start' }) // 'start'
```

This definition is exported by the library as `{ FunctionNode }`

```javascript
import { FunctionNode } from './index.js'
	
return FunctionNode; // success
```

Use the `NodeTypes.FN` (function) value as the name.

A function is a JS function. A function cannot be an action.

Exectute a functon by running it, passing in the state.

## Undefined Node

This definition is exported by the library as `{ UndefinedNode }`

```javascript
import { UndefinedNode } from './index.js'
	
return UndefinedNode; // success
```

Use the `NodeTypes.UN` (undefined) value as the name.

Undefined is the `undefined` keyword.

Un undefined node cannot be executed, throw an error to help catch incorrect configuration.

```javascript
const instance = new S([undefined])
return instance() // UndefinedNodeError
```

When used as an action, undefined only moves to the next node.

```javascript
const instance = new S([
	() => undefined,
	{ [S.Return]: 'second' }
])
return instance() // 'second'
```

## Empty Node

This definition is exported by the library as `{ EmptyNode }`

```javascript
import { EmptyNode } from './index.js'
	
return EmptyNode; // success
```

Use the `NodeTypes.EM` (empty) value as the name.

Empty is the `null` keyword.

Empty is a no-op, and will do nothing except move to the next node

```javascript
const instance = new S([null, { result: 'second' }, () => null])
	.output(({ result }) => result)
return instance({ result: 'start' }) // 'second'
```

## Condition Node

This definition is exported by the library as `{ ConditionNode }`

```javascript
import { ConditionNode } from './index.js'
	
return ConditionNode; // success
```

Use the `NodeTypes.CD` (condition) value as the name.

A condition is an object with the `'if'` property. A condition cannot be an action.

### Execute a condition by evaluating the `'if'` property and directing to the `'then'` or `'else'` clauses

Evaluate the `'if'` property as a function that depends on the state.

If truthy, direct to the `'then'` clause if it exists

```javascript
const instance = new S({
	if: ({ input }) => input === 'the same',
	then: { [S.Return]: 'truthy' },
	else: { [S.Return]: 'falsey' },
})
return instance({ input: 'the same' }) // 'truthy'
```

Otherwise, direct to the `'else'` clause if it exists

```javascript
const instance = new S({
	if: ({ input }) => input === 'the same',
	then: { [S.Return]: 'truthy' },
	else: { [S.Return]: 'falsey' },
})
return instance({ input: 'NOT the same' }) // 'falsey'
```

### Traverse a condition by iterating on the then and else clauses.

Run `post` on the output to allow the interception of the condition method.

Copy over the original properties to preserve any custom symbols.

Iterate on the `'then'` clause if it exists

Iterate on the `'else'` clause if it exists

## Switch Node

```javascript
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
return { output1, output2, output3 } // { output1: 'first', output2: 'second', output3: 'none' }
```

This definition is exported by the library as `{ SwitchNode }`

```javascript
import { SwitchNode } from './index.js'
	
return SwitchNode; // success
```

Use the `NodeTypes.SW` (switch) value as the name.

A switch node is an object with the `'switch'` property.

### Execute a switch by evaluating the `'switch'` property and directing to the approprtate `'case'` clause.

Evaluate the `'switch'` property as a function that returns a key.

If the key exists in the `'case'` caluses, use the key, otherwise use the `'default'` clause

Check again if the key exists (`'default'` clause may not be defined), if it does, redirect to the case, otherwise do nothing.

### Traverse a switch by iterating over the `'case'` clauses

Copy over the original properties to preserve any custom symbols.

Iterate over each of the `'case'` clauses.

## While Node

This definition is exported by the library as `{ WhileNode }`

```javascript
import { WhileNode } from './index.js'
	
return WhileNode; // success
```

Use the `NodeTypes.WH` (switch) value as the name.

A while node is an object with the `'while'` property.

### Execute a while by evaluating the `'while'` property and directing to the `'do'` clause if `true`.

#### Evaluate the `'while'` property as a function that returns a boolean.

If `true`, execute the `'do'` clause

If the condition is false, exit the while loop.

Proceed by re-entering the while loop.

### Traverse a while by iterating over the `'do'` clause

Copy over the original properties to preserve any custom symbols.

Iterate over the `'do'` clause.

## Machine Node

```javascript
const instance = new S({
	initial: [
		() => ({ result: 'first' }),
		'next',
	],
	next: { result: 'second' }
}).output(({ result }) => result)
return instance({ result: 'start' }) // 'second'
```

This definition is exported by the library as `{ MachineNode }`

```javascript
import { MachineNode } from './index.js'
	
return MachineNode; // success
```

Use the `NodeTypes.MC` (machine) value as the name.

A machine is an object with the `'initial'` property. A machine cannot be used as an action.

Execute a machine by directing to the `'initial'` stages.

### Traverse a machine by iterating over all the stages

Copy over the original properties to preserve any custom symbols.

Iterate over each of the stages.

## Directive Node

Transitioning is also possible by using and object with the `S.Path` key set to a relative or absolute path. This is not recommended as it is almost never required, it should be considered system-only.

```javascript
const instance = new S({
	initial: [
		{ result: 'first' },
		{ [S.Path]: 'next' }
	],
	next: { result: 'second' }
}).output(({ result }) => result)
return instance({ result: 'start' }) // 'second'
```

It is not possible to send any other information in this object, such as a state change.

```javascript
const instance = new S({
	initial: [
		{ result: 'first' },
		{ [S.Path]: 'next', result: 'ignored' }
	],
	next: S.Return
}).output(({ result }) => result)
return instance({ result: 'start' }) // 'first'
```

This definition is exported by the library as `{ DirectiveNode }`

```javascript
import { DirectiveNode } from './index.js'
	
return DirectiveNode; // success
```

Use the `NodeTypes.DR` (directive) value as the name.

A directive is an object with the `S.Path` property.

A directive is performed by performing the value of the `S.Path` property to allow for using absolute or relative directives

## Sequence Directive Node

Numbers indicate a goto for a sequence. It is not recommended to use this as it may be unclear, but it must be possible, and should be considered system-only.

```javascript
const instance = new S([
	2,
	{ [S.Return]: 'skipped' },
	{ [S.Return]: 'second' },
])
return instance() // 'second'
```

Slightly less not recommended is transitioning in a sequence conditonally. If you're making an incredibly basic state machine this is acceptable.

```javascript
const instance = new S([
	{
		if: ({ input }) => input === 'skip',
		then: 2,
		else: 1
	},
	{ [S.Return]: 'skipped' },
	{ [S.Return]: 'second' },
])
return instance({ input: 'skip' }) // 'second'
```

This definition is exported by the library as `{ SequenceDirectiveNode }`

```javascript
import { SequenceDirectiveNode } from './index.js'
	
return SequenceDirectiveNode; // success
```

Use the `NodeTypes.SD` (sequence-directive) value as the name.

A sequence directive is a number.

### A sequence directive is performed by finding the last sequence and setting the index to the given value.

Get the closest ancestor that is a sequence.

If there is no such ancestor, throw a `PathReferenceError`

Update the path to the parent>index

## Machine Directive Node

Directives are effectively `goto` commands, or `transitions` if you prefer.

Directives are the natural way of proceeding in state machines, using the name of a neighboring state as a string you can direct flow through a state machine.

```javascript
const instance = new S({
	initial: [
		{ result: 'first' },
		'next'
	],
	next: { result: 'second' }
}).output(({ result }) => result)
return instance({ result: 'start' }) // 'second'
```

You can also use symbols as state names.

```javascript
const myState = Symbol('MyState')
const instance = new S({
	initial: [
		{ result: 'first' },
		myState
	],
	[myState]: { result: 'second' }
}).output(({ result }) => result)
return instance({ result: 'start' }) // 'second'
```

This definition is exported by the library as `{ MachineDirectiveNode }`

```javascript
import { MachineDirectiveNode } from './index.js'
	
return MachineDirectiveNode; // success
```

Use the `NodeTypes.MD` (machine-directive) value as the name.

A machine directive is a string or a symbol.

### A machine directive is performed by directing to the given stage.

Get the closest ancestor that is a machine.

If no machine ancestor is foun, throw a `PathReferenceError`

Update the path to parent>stage

## Absolute Directive Node

Arrays can be used to perform absolute redirects. This is not recommended as it may make your transition logic unclear.

Arrays cannot be used on their own, because they would be interpreted as sequences. For this reason they must be contained in an object with the `S.Path` symbol as a ky, with the array as the value, or returned by an action.

Using an absolute directive in a directive object works

```javascript
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
return instance({ result: 'start' }) // 'first'
```

Using an absolute directive as a return value works

```javascript
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
return instance({ result: 'start' }) // 'first'
```

Using an absolute directive as an action does NOT work.

```javascript
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
return instance({ result: 'start' }) // 'not skipped'
```

This definition is exported by the library as `{ AbsoluteDirectiveNode }`

```javascript
import { AbsoluteDirectiveNode } from './index.js'
	
return AbsoluteDirectiveNode; // success
```

Use the `NodeTypes.AD` (absolute-directive) value as the name.

An absolute directive is a list of strings, symbols, and numbers. It can only be used as an action as it would otherwise be interpreted as a sequence.

An absolute directive is performed by setting `S.Path` to the path

## Return Node

Causes the entire process to terminate immediately and return, setting `S.Return` to `true` on the state.

If the symbol is used with a `.output` configuration, then it will return according to the given method.

```javascript
const instance = new S(S.Return)
	.output(({ result }) => result)
return instance({ result: 'start' }) // 'start'
```

If the symbol is used on its own, then it will simply return `undefined`.

```javascript
const instance = new S(S.Return)
return instance({ result: 'start' }) // undefined
```

Using the return symbol as the key to an object will set the return property to that value before returning.

```javascript
const instance = new S({ [S.Return]: 'custom' })
return instance() // 'custom'
```

```javascript
const instance = new S({ [S.Return]: 'custom' })
return instance.output(state => state)({ result: 'start' }) // { result: 'start', [S.Return]: 'custom' }
```

This definition is exported by the library as `{ ReturnNode }`

```javascript
import { ReturnNode } from './index.js'
	
return ReturnNode; // success
```

Use the `NodeTypes.RT` (return) value as the name.

A return node is the `S.Return` symbol itself, or an object with an `S.Return` property.

### Perform a return by setting the `S.Return` property on the state to the return value

Copy the original properties from the state

Set `S.Return` to undefined or the given return value

## Export all the defaults nodes together in one list.

This list is exported by the library as `{ nodes }`

```javascript
import { nodes } from './index.js'
	
return nodes; // success
```

# Errors

## SuperSmallStateMachineError

All Super Small State Machine Errors will inherit from this class.

Allows for contextual information to be provided with the error

This class is exported by the library as `{ SuperSmallStateMachineError }`

```javascript
import { SuperSmallStateMachineError } from './index.js'
	
return SuperSmallStateMachineError; // success
```

Declare contextual properties on the class

### Take in the message, followed by an object conatining the properties

Create a normal error with the message

Assign the given properties to the instance

## SuperSmallStateMachineReferenceError

All Super Small State Machine Reference Errors will inherit from this class

This class is exported by the library as `{ SuperSmallStateMachineReferenceError }`

```javascript
import { SuperSmallStateMachineReferenceError } from './index.js'
	
return SuperSmallStateMachineReferenceError; // success
```

## SuperSmallStateMachineTypeError

All Super Small State Machine Type Errors will inherit from this class

This class is exported by the library as `{ SuperSmallStateMachineTypeError }`

```javascript
import { SuperSmallStateMachineTypeError } from './index.js'
	
return SuperSmallStateMachineTypeError; // success
```

## StateReferenceError

A state change has set a property that was not defined in the original state defaults.

This is likely intentional, as this is not default behaviour.

This class is exported by the library as `{ StateReferenceError }`

```javascript
import { StateReferenceError } from './index.js'
	
return StateReferenceError; // success
```

## StateTypeError

A state change has updated a property that was defined as a different type in the original state defaults.

This is likely intentional, as this is not default behaviour.

This class is exported by the library as `{ StateTypeError }`

```javascript
import { StateTypeError } from './index.js'
	
return StateTypeError; // success
```

## NodeTypeError

A node of an unknown type was used in a process.

This was probably caused by a custom node definition

This class is exported by the library as `{ NodeTypeError }`

```javascript
import { NodeTypeError } from './index.js'
	
return NodeTypeError; // success
```

## UndefinedNodeError

An undefined node was used in a process.

This is probably caused by a missing variable.

If you wish to perform an intentional no-op, use `null`

This class is exported by the library as `{ UndefinedNodeError }`

```javascript
import { UndefinedNodeError } from './index.js'
	
return UndefinedNodeError; // success
```

## MaxIterationsError

The execution of the process took more iterations than was allowed.

This can be configured using `.for` or `.forever`

This class is exported by the library as `{ MaxIterationsError }`

```javascript
import { MaxIterationsError } from './index.js'
	
return MaxIterationsError; // success
```

## PathReferenceError

A path was referenced which could not be found in the given process.

This class is exported by the library as `{ PathReferenceError }`

```javascript
import { PathReferenceError } from './index.js'
	
return PathReferenceError; // success
```

