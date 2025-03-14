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
	return instance.config // {
 defaults: { result: undefined },
 iterations: 10000,
 strict: false,
 async: false,
}
```

```javascript
	const instance = new S()
	const modifiedInstance = instance
		.async
		.for(10)
		.defaults({ result: 'other' })
		.strict
	return modifiedInstance.config // {
 defaults: { result: 'other' },
 iterations: 10,
 strict: true,
 async: true,
}
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

```javascript
const myConfig = { async: false }
const instance = new S(null, myConfig)
const retrievedConfig = instance.config
return retrievedConfig !== myConfig && retrievedConfig !== instance.config // true
```

```javascript
const myConfig = { async: 'original' }
const instance = new S(null, myConfig)
instance.config.async = 'new value'
return instance.config.async // 'original'
```

The process must be public, it cannot be deep merged or cloned as it may contain symbols.

```javascript
const myProcess = { mySpecialKey: 23864 }
const instance = new S(myProcess)
return instance.process === myProcess // true
```

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
		[S.Stack]: [['preserved']],
		[S.Changes]: {},
		preserved: 'value',
		common: 'initial',
	}, {
		[S.Stack]: [['ignored']],
		[S.Changes]: { ignored: true },
		common: 'changed',
	})
	return result // {
 common: 'changed',
 preserved: 'value',
 [S.Stack]: [ 'preserved' ],
 [S.Changes]: { ignored: undefined, common: 'changed' },
}
```

## instance.proceed (state = {}, node = undefined)

Proceed to the next execution path.

Performs fallback logic when a node exits.

```javascript
const instance = new S([
	null,
	null,
	[
		null,
		null,
	],
	null
])
return instance.proceed({ [S.Stack]: [[ 2, 1 ]] }) // { [S.Stack]: [ [ 3 ] ] }
```

## instance.perform (state = {}, action = null)

Perform actions on the state.

Applies any changes in the given `action` to the given `state`.

Proceeds to the next node if the action is not itself a directive or return.

```javascript
const instance = new S()
return instance.perform({ myProperty: 'start value' }, { myProperty: 'new value' }) // { myProperty: 'new value' }
```

## instance.execute (state = {}, node = undefined)

Execute a node in the process, return an action.

Executes the node in the process at the state's current path and returns it's action.

If the node is not executable it will be returned as the action.

```javascript
	const instance = new S([
		{ myProperty: 'this value' },
		{ myProperty: 'that value' },
		{ myProperty: 'the other value' },
	])
	return instance.execute({ [S.Stack]: [[1]], myProperty: 'start value' }, get_path_object(instance.process, [1])) // {
 myProperty: 'that value',
 [S.Stack]: [ [ 2 ] ],
}
```

instance.traverse(iterator = a => a)

```javascript
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
	}) // {
 initial: 'with this',
 other: [
  { if: 'with another thing', then: 'with that' },
 ],
}
```

## instance.run (...input)

Execute the entire process either synchronously or asynchronously depending on the config.

Will execute the process

```javascript
const instance = new S({ [S.Return]: 'return value' })
return instance.run() // 'return value'
```

Will execute the process in async mode if it is configured

```javascript
const instance = new S(() => Promise.resolve({ [S.Return]: 'return value' }))
	.async
return instance.run() // 'return value'
```

Will not handle promises in sync mode

```javascript
const instance = new S(() => Promise.resolve({ [S.Return]: 'return value' }))
	.sync
return instance.run() // undefined
```

Is the same as running the executable instance itself

```javascript
const instance = new S({ [S.Return]: 'return value' })
return instance.run() === instance() // true
```

Takes the same arguments as the executable instance itself

```javascript
const instance = new S(({ a, b, c }) => ({ [S.Return]: `${a} + ${b} - ${c}` }))
	.input((a, b, c) => ({ a, b, c }))
return instance.run(1, 2, 3) === instance(1, 2, 3) // true
```

## instance.runSync (...input)

Execute the entire process synchronously.

Will execute the process

```javascript
const instance = new S({ [S.Return]: 'return value' })
return instance.runSync() // 'return value'
```

Will not handle promises even if it is configured

```javascript
const instance = new S(() => Promise.resolve({ [S.Return]: 'return value' }))
	.async
return instance.runSync() // undefined
```

Will not handle promises in sync mode

```javascript
const instance = new S(() => Promise.resolve({ [S.Return]: 'return value' }))
	.sync
return instance.runSync() // undefined
```

Is the same as running the executable instance itself

```javascript
const instance = new S({ [S.Return]: 'return value' })
return instance.runSync() === instance() // true
```

Takes the same arguments as the executable instance itself

```javascript
const instance = new S(({ a, b, c }) => ({ [S.Return]: `${a} + ${b} - ${c}` }))
	.input((a, b, c) => ({ a, b, c }))
return instance.runSync(1, 2, 3) === instance(1, 2, 3) // true
```

## instance.runAsync (...input)

Execute the entire process asynchronously. Always returns a promise.

Will execute the process

```javascript
const instance = new S({ [S.Return]: 'return value' })
return instance.runAsync() // 'return value'
```

Will execute the process in async mode

```javascript
const instance = new S(() => Promise.resolve({ [S.Return]: 'return value' }))
	.async
return instance.runAsync() // 'return value'
```

Will still handle promises even in sync mode

```javascript
const instance = new S(() => Promise.resolve({ [S.Return]: 'return value' }))
	.sync
return instance.runAsync() // 'return value'
```

Is the same as running the executable instance itself

```javascript
const instance = new S({ [S.Return]: 'return value' })
return await instance.runAsync() === instance() // true
```

Takes the same arguments as the executable instance itself

```javascript
const instance = new S(({ a, b, c }) => ({ [S.Return]: `${a} + ${b} - ${c}` }))
	.input((a, b, c) => ({ a, b, c }))
return await instance.runAsync(1, 2, 3) === instance(1, 2, 3) // true
```

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

## instance.untrace <default>

Disables the stack trace.

Creates a new instance.

```javascript
const instance = new S({
	initial: 'other',
	other: 'oneMore',
	oneMore: [
		null,
		null
	]
}).untrace
.output(({ [S.Trace]: trace }) => trace)
return instance() // [  ]
```

## instance.trace

Enables the stack trace.

Creates a new instance.

```javascript
	const instance = new S({
		initial: 'other',
		other: 'oneMore',
		oneMore: [
			null,
			null
		]
	}).trace
	.output(({ [S.Trace]: trace }) => trace)
	return instance() // [
 [ [  ] ],
 [ [ 'initial' ] ],
 [ [ 'other' ] ],
 [ [ 'oneMore' ] ],
 [ [ 'oneMore', 0 ] ],
 [ [ 'oneMore', 1 ] ],
]
```

## instance.shallow <default>

Shallow merges the state every time a state change in made.

Creates a new instance.

```javascript
	const instance = new S({ myProperty: { existingKey: 'newValue', deepKey: { deepValue2: 7 } } })
		.shallow
		.output(ident)
	return instance({ myProperty: { existingKey: 'existingValue', anotherKey: 'anotherValue', deepKey: { deepVaue: 6 } } }) // {
 myProperty: {
  existingKey: 'newValue',
  anotherKey: undefined,
  deepKey: { deepVaue: undefined, deepValue2: 7 },
 },
}
```

## instance.deep

Deep merges the all properties in the state every time a state change in made.

Creates a new instance.

```javascript
	const instance = new S({ myProperty: { existingKey: 'newValue', deepKey: { deepValue2: 7 } } })
		.deep
		.output(ident)
	return instance({ myProperty: { existingKey: 'existingValue', anotherKey: 'anotherValue', deepKey: { deepVaue: 6 } } }) // {
 myProperty: {
  existingKey: 'newValue',
  anotherKey: 'anotherValue',
  deepKey: { deepVaue: 6, deepValue2: 7 },
 },
}
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
class SpecialNode extends N {
	static type = 'special'
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

The main class is exported as `{ StateMachine }`

```javascript
import { StateMachine } from './index.js'
	
return StateMachine; // success
```

The main class is exported as `{ SuperSmallStateMachine }`

```javascript
import { SuperSmallStateMachine } from './index.js'
	
return SuperSmallStateMachine; // success
```

The node class is exported as `{ NodeDefinition }`

```javascript
import { NodeDefinitions } from './index.js'
	
return NodeDefinitions; // success
```

The node collection class is exported as `{ NodeDefinitions }`

```javascript
import { NodeDefinitions } from './index.js'
	
return NodeDefinitions; // success
```

The node class is exported as `{ N }`

```javascript
import { N } from './index.js'
	
return N; // success
```

The node collection class is exported as `{ NS }`

```javascript
import { NS } from './index.js'
	
return NS; // success
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
		[S.Stack]: ['preserved'],
		[S.Changes]: {},
		preserved: 'value',
		common: 'initial',
	}, {
		[S.Stack]: ['ignored'],
		[S.Changes]: { ignored: true },
		common: 'changed',
	})(instance)
	return result // {
 common: 'changed',
 preserved: 'value',
 [S.Stack]: [ 'preserved' ],
 [S.Changes]: { ignored: undefined, common: 'changed' },
}
```

## S.proceed (state = {}, action = undefined)

Proceed to the next execution path.

Performs fallback logic when a node exits.

```javascript
const instance = new S([
	null,
	null,
[
		null,
		null,
	],
	null
])
const proceeder = S.proceed({ [S.Stack]: [[ 2, 1 ]] })
return proceeder(instance) // { [S.Stack]: [ [ 3 ] ] }
```

## S.perform (state = {}, action = null)

Perform actions on the state.

Applies any changes in the given `action` to the given `state`.

Proceeds to the next node if the action is not itself a directive or return.

```javascript
const instance = new S()
const performer = S.perform({ myProperty: 'start value' }, { myProperty: 'new value' })
return performer(instance) // { myProperty: 'new value' }
```

## S.execute (state = {}, node = undefined)

Execute a node in the process, return an action.

Executes the node in the process at the state's current path and returns it's action.

If the node is not executable it will be returned as the action.

```javascript
	const instance = new S([
		{ myProperty: 'this value' },
		{ myProperty: 'that value' },
		{ myProperty: 'the other value' },
	])
	const executor = S.execute({ [S.Stack]: [[1]], myProperty: 'start value' })
	return executor(instance) // {
 myProperty: 'that value',
 [S.Stack]: [ [ 2 ] ],
}
```

S.traverse(iterator = a => a)

```javascript
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
	return traverser(instance) // {
 initial: 'with this',
 other: [
  { if: 'with another thing', then: 'with that' },
 ],
}
```

## S.run (...input)

Execute the entire process either synchronously or asynchronously depending on the config.

Will execute the process

```javascript
const instance = new S({ [S.Return]: 'return value' })
return S.run()(instance) // 'return value'
```

Will execute the process in async mode if it is configured

```javascript
const instance = new S(() => Promise.resolve({ [S.Return]: 'return value' }))
	.async
return S.run()(instance) // 'return value'
```

Will not handle promises in sync mode

```javascript
const instance = new S(() => Promise.resolve({ [S.Return]: 'return value' }))
	.sync
return S.run()(instance) // undefined
```

Is the same as running the executable instance itself

```javascript
const instance = new S({ [S.Return]: 'return value' })
return S.run()(instance) === instance() // true
```

Takes the same arguments as the executable instance itself

```javascript
const instance = new S(({ a, b, c }) => ({ [S.Return]: `${a} + ${b} - ${c}` }))
	.input((a, b, c) => ({ a, b, c }))
return S.run(1, 2, 3)(instance) === instance(1, 2, 3) // true
```

## S.runSync (...input)

Execute the entire process synchronously.

Will execute the process

```javascript
const instance = new S({ [S.Return]: 'return value' })
return S.runSync()(instance) // 'return value'
```

Will not handle promises even if it is configured

```javascript
const instance = new S(() => Promise.resolve({ [S.Return]: 'return value' }))
	.async
return S.runSync()(instance) // undefined
```

Will not handle promises in sync mode

```javascript
const instance = new S(() => Promise.resolve({ [S.Return]: 'return value' }))
	.sync
return S.runSync()(instance) // undefined
```

Is the same as running the executable instance itself

```javascript
const instance = new S({ [S.Return]: 'return value' })
return S.runSync()(instance) === instance() // true
```

Takes the same arguments as the executable instance itself

```javascript
const instance = new S(({ a, b, c }) => ({ [S.Return]: `${a} + ${b} - ${c}` }))
	.input((a, b, c) => ({ a, b, c }))
return S.runSync(1, 2, 3)(instance) === instance(1, 2, 3) // true
```

## S.runAsync (...input)

Execute the entire process asynchronously. Always returns a promise.

Will execute the process

```javascript
const instance = new S({ [S.Return]: 'return value' })
return S.runAsync()(instance) // 'return value'
```

Will execute the process in async mode

```javascript
const instance = new S(() => Promise.resolve({ [S.Return]: 'return value' }))
	.async
return S.runAsync()(instance) // 'return value'
```

Will still handle promises even in sync mode

```javascript
const instance = new S(() => Promise.resolve({ [S.Return]: 'return value' }))
	.sync
return S.runAsync()(instance) // 'return value'
```

Is the same as running the executable instance itself

```javascript
const instance = new S({ [S.Return]: 'return value' })
return await S.runAsync()(instance) === instance() // true
```

Takes the same arguments as the executable instance itself

```javascript
const instance = new S(({ a, b, c }) => ({ [S.Return]: `${a} + ${b} - ${c}` }))
	.input((a, b, c) => ({ a, b, c }))
return await S.runAsync(1, 2, 3)(instance) === instance(1, 2, 3) // true
```

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

## S.untrace <default>

Shallow merges the state every time a state change in made.

Returns a function that will modify a given instance.

```javascript
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
return instance() // [  ]
```

## S.trace

Deep merges the all properties in the state every time a state change in made.

Returns a function that will modify a given instance.

```javascript
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
	return instance() // [
 [ [  ] ],
 [ [ 'initial' ] ],
 [ [ 'other' ] ],
 [ [ 'oneMore' ] ],
 [ [ 'oneMore', 0 ] ],
 [ [ 'oneMore', 1 ] ],
]
```

## S.shallow <default>

Shallow merges the state every time a state change in made.

Returns a function that will modify a given instance.

```javascript
	const instance = new S({ myProperty: { existingKey: 'newValue', deepKey: { deepValue2: 7 } } })
		.with(S.shallow)
		.output(ident)
	return instance({ myProperty: { existingKey: 'existingValue', anotherKey: 'anotherValue', deepKey: { deepVaue: 6 } } }) // {
 myProperty: {
  existingKey: 'newValue',
  anotherKey: undefined,
  deepKey: { deepVaue: undefined, deepValue2: 7 },
 },
}
```

## S.deep

Deep merges the all properties in the state every time a state change in made.

Returns a function that will modify a given instance.

```javascript
	const instance = new S({ myProperty: { existingKey: 'newValue', deepKey: { deepValue2: 7 } } })
		.with(S.deep)
		.output(ident)
	return instance({ myProperty: { existingKey: 'existingValue', anotherKey: 'anotherValue', deepKey: { deepVaue: 6 } } }) // {
 myProperty: {
  existingKey: 'newValue',
  anotherKey: 'anotherValue',
  deepKey: { deepVaue: 6, deepValue2: 7 },
 },
}
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

### Goto

Used to change the executing path.

```javascript
return { [S.Goto]: [] } // Succeeds
```

### Stack

Returned in the state to indicate the next action path, or passed in with the state to direct the machine.

```javascript
return { [S.Goto]: [] } // Succeeds
```

### Trace

Returned in the state when the trace flag is on, will contain every path that was executed during the run.

```javascript
return { [S.Trace]: [] } // Succeeds
```

### StrictTypes

Possible value of `config.strict`, used to indicate strict types as well as values.

Key Words

Node NodeTypes

All the defaults nodes together in one list.

## Config

```javascript
	return S.config // {
 async: false,
 deep: false,
 strict: false,
 trace: false,
 iterations: 10000,
 override: null,
 adapt: [  ],
 before: [  ],
 after: [  ],
 defaults: {  },
}
```

Initialise an empty state by default

Input the initial state by default

Return the `S.Return` property by default

Do not perform strict state checking by default

Allow 1000 iterations by default

Run util the return symbol is present by default.

Do not allow for asynchronous actions by default

Do not allow for asynchronous actions by default

Do not keep the stack trace by default

Shallow merge changes by default

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
		[S.Stack]: ['preserved'],
		[S.Changes]: {},
		preserved: 'value',
		common: 'initial',
	}, {
		[S.Stack]: ['ignored'],
		[S.Changes]: { ignored: true },
		common: 'changed',
	})
	return result // {
 common: 'changed',
 preserved: 'value',
 [S.Stack]: [ 'preserved' ],
 [S.Changes]: { ignored: undefined, common: 'changed' },
}
```

### If the strict state flag is truthy, perform state checking logic

Go through each property in the changes and check they all already exist

Throw a StateReferenceError if a property is referenced that did not previosly exist.

### If the strict state flag is set to the Strict Types Symbol, perform type checking logic.

Go through each property and check the JS type is the same as the initial values.

Throw a StateTypeError if a property changes types.

Collect all the changes in the changes object.

### Return a new object

Deep merge the current state with the new changes

Deep merge the current state with the new changes

Carry over the original path.

Update the changes to the new changes

## S._proceed (instance, state = {}, path = state[S.Stack] || [])

Proceed to the next execution path.

```javascript
const instance = new S([
	'firstAction',
	'secondAction'
])
return S._proceed(instance, {
	[S.Stack]: [[0]]
}) // { [S.Stack]: [ [ 1 ] ] }
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
	[S.Stack]: [[0,1]]
}) // { [S.Stack]: [ [ 1 ] ] }
```

Determine what type of node is proceeding

If the node is unrecognised, throw a TypeEror

Call the `proceed` method of the node to get the next path.

## S._perform (instance, state = {}, action = null)

Perform actions on the state.

```javascript
const instance = new S([
	'firstAction',
	'secondAction',
	'thirdAction'
])
return S._perform(instance, { [S.Stack]: [[0]], prop: 'value' }, { prop: 'newValue' }) // { prop: 'newValue', [S.Stack]: [ [ 1 ] ] }
```

Applies any changes in the given `action` to the given `state`.

```javascript
const instance = new S([
	'firstAction',
	'secondAction',
	'thirdAction'
])
return S._perform(instance, { [S.Stack]: [[0]], prop: 'value' }, { [S.Goto]: [2] }) // { prop: 'value', [S.Stack]: [ [ 2 ] ] }
```

Proceeds to the next node if the action is not itself a directive or return.

```javascript
const instance = new S([
	'firstAction',
	'secondAction'
])
return S._perform(instance, { [S.Stack]: [[0]] }, null) // { [S.Stack]: [ [ 1 ] ] }
```

Get the node type of the given `action`

Gets the node definition for the action

Perform the action on the state

## S._execute (instance, state = {}, node = get_path_object(instance.process, state[S.Stack][0])))

Executes the node in the process at the state's current path and returns it's action.

```javascript
const instance = new S([
	() => ({ result: 'first' }),
	() => ({ result: 'second' }),
	() => ({ result: 'third' }),
])
return S._execute(instance, { [S.Stack]: [[1]] }) // { result: 'second' }
```

If the node is not executable it will be returned as the action.

```javascript
const instance = new S([
	({ result: 'first' }),
	({ result: 'second' }),
	({ result: 'third' }),
])
return S._execute(instance, { [S.Stack]: [[1]] }) // { result: 'second' }
```

Get the type of that node

If the node is not recognised, throw a NodeTypeError

Execute the node and return an action

## S._traverse(instance, iterator)

Traverses a process, mapping each node to a new value, effectively cloning the process.

You can customise how each leaf node is mapped by supplying the `iterator` method

```javascript
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
	}) // {
 initial: 'with this',
 other: [
  { if: 'with another thing', then: 'with that' },
 ],
}
```

### Create an interation function to be used recursively

Get the node at the given `path`

Get the type of the node

If the node is not recognised, throw a NodeTypeError

Call the iterator for all nodes as a transformer

Call the primary method

## S._run (instance, ...input)

Execute the entire process either synchronously or asynchronously depending on the config.

Will execute the process

```javascript
const instance = new S({ [S.Return]: 'return value' })
return S._run(instance) // 'return value'
```

Will execute the process in async mode if it is configured

```javascript
const instance = new S(() => Promise.resolve({ [S.Return]: 'return value' }))
	.async
return S._run(instance) // 'return value'
```

Will not handle promises in sync mode

```javascript
const instance = new S(() => Promise.resolve({ [S.Return]: 'return value' }))
	.sync
return S._run(instance) // undefined
```

Is the same as running the executable instance itself

```javascript
const instance = new S({ [S.Return]: 'return value' })
return S._run(instance) === instance() // true
```

Takes the same arguments as the executable instance itself

```javascript
const instance = new S(({ a, b, c }) => ({ [S.Return]: `${a} + ${b} - ${c}` }))
	.input((a, b, c) => ({ a, b, c }))
return S._run(instance, 1, 2, 3) === instance(1, 2, 3) // true
```

If the process is asynchronous, execute use `runAsync`

If the process is asynchronous, execute use `runSync`

## S._runSync (instance, ...input)

Execute the entire process synchronously.

Will execute the process

```javascript
const instance = new S({ [S.Return]: 'return value' })
return S._runSync(instance) // 'return value'
```

Will not handle promises even if it is configured

```javascript
const instance = new S(() => Promise.resolve({ [S.Return]: 'return value' }))
	.async
return S._runSync(instance) // undefined
```

Will not handle promises in sync mode

```javascript
const instance = new S(() => Promise.resolve({ [S.Return]: 'return value' }))
	.sync
return S._runSync(instance) // undefined
```

Is the same as running the executable instance itself

```javascript
const instance = new S({ [S.Return]: 'return value' })
return S._runSync(instance) === instance() // true
```

Takes the same arguments as the executable instance itself

```javascript
const instance = new S(({ a, b, c }) => ({ [S.Return]: `${a} + ${b} - ${c}` }))
	.input((a, b, c) => ({ a, b, c }))
return S._runSync(instance, 1, 2, 3) === instance(1, 2, 3) // true
```

Extract the useful parts of the config

Turn the arguments into an initial condition

### Merge the initial condition with the default initial state

Default to an empty change object

Use the defaults as an initial state

Use the path from the initial state - allows for starting at arbitrary positions

Use the path from the initial state - allows for starting at arbitrary positions

### Repeat for a limited number of iterations.

This should be fine for most finite machines, but may be too little for some constantly running machines.

#### Check the configured `until` condition to see if we should exit.

Do it first to catch starting with a `S.Return` in place.

If the interations are exceeded, Error

If stack trace is enabled, push the current path to the stack

Execute the current node on the process, returning the action to perform

Perform any required actions. Updating the currentState

Proceed to the next action

When returning, run the ends state adapters, then the output adapter to complete execution.

## S._runAsync (instance, ...input)

Execute the entire process asynchronously. Always returns a promise.

Will execute the process

```javascript
const instance = new S({ [S.Return]: 'return value' })
return S._runAsync(instance) // 'return value'
```

Will execute the process in async mode

```javascript
const instance = new S(() => Promise.resolve({ [S.Return]: 'return value' }))
	.async
return S._runAsync(instance) // 'return value'
```

Will still handle promises even in sync mode

```javascript
const instance = new S(() => Promise.resolve({ [S.Return]: 'return value' }))
	.sync
return S._runAsync(instance) // 'return value'
```

Is the same as running the executable instance itself

```javascript
const instance = new S({ [S.Return]: 'return value' })
return await S._runAsync(instance) === instance() // true
```

Takes the same arguments as the executable instance itself

```javascript
const instance = new S(({ a, b, c }) => ({ [S.Return]: `${a} + ${b} - ${c}` }))
	.input((a, b, c) => ({ a, b, c }))
return await S._runAsync(instance, 1, 2, 3) === instance(1, 2, 3) // true
```

Extract the useful parts of the config

Turn the arguments into an initial condition

### Merge the initial condition with the default initial state

Default to an empty change object

Use the defaults as an initial state

Use the path from the initial state - allows for starting at arbitrary positions

Use the path from the initial state - allows for starting at arbitrary positions

### Repeat for a limited number of iterations.

This should be fine for most finite machines, but may be too little for some constantly running machines.

Pause execution based on the pause customisation method

Check the configured `until` condition to see if we should exit.

If the interaction are exceeded, throw MaxIterationsError

If stack trace is enabled, push the current path to the stack

If there are interruptions, perform them one by one

#### If there are no interruptions, execute the process as normal

Execute the current node on the process, returning the action to perform

Perform any required actions. Updating the currentState

Proceed to the next action

When returning, run the ends state adapters, then the output adapter to complete execution.

# Default Nodes

## Changes Node

Updates the state by merging the properties. Arrays will not be merged.

Overrides existing properties when provided

```javascript
const instance = new S({ result: 'overridden' })
	.output(({ result }) => result)
return instance({ result: 'start' }) // 'overridden'
```

Adds new properties while preserving existing properties

```javascript
const instance = new S({ newValue: true })
	.output(state => state)
return instance({ existingValue: true }) // { existingValue: true, newValue: true }
```

This definition is exported by the library as `{ Changes }`

```javascript
import { Changes } from './index.js'
	
return Changes; // success
```

Use the `NodeTypes.CH` (changes) value as the type.

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

This definition is exported by the library as `{ Sequence }`

```javascript
import { Sequence } from './index.js'
	
return Sequence; // success
```

Use the `NodeTypes.SQ` (sequence) value as the type.

### Proceed by running the next node in the sequence

Get the current index in this sequence from the path

Increment the index, unless the end has been reached

A sequence is an array. A sequence cannot be an action, that will be interpreted as an absolute-directive.

Execute a sequence by directing to the first node (so long as it has nodes)

Traverse a sequence by iterating through each node in the array.

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

This definition is exported by the library as `{ FunctionN }`

```javascript
import { FunctionN } from './index.js'
	
return FunctionN; // success
```

Use the `NodeTypes.FN` (function) value as the type.

A function is a JS function. A function cannot be an action.

Exectute a functon by running it, passing in the state.

## Undefined Node

This definition is exported by the library as `{ Undefined }`

```javascript
import { Undefined } from './index.js'
	
return Undefined; // success
```

Use the `NodeTypes.UN` (undefined) value as the type.

Undefined is the `undefined` keyword.

Un undefined node cannot be executed, throw an error to help catch incorrect configuration.

```javascript
const instance = new S([undefined])
return instance() // NodeReferenceError
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

This definition is exported by the library as `{ Empty }`

```javascript
import { Empty } from './index.js'
	
return Empty; // success
```

Use the `NodeTypes.EM` (empty) value as the type.

Empty is the `null` keyword.

Empty is a no-op, and will do nothing except move to the next node

```javascript
const instance = new S([null, { result: 'second' }, () => null])
	.output(({ result }) => result)
return instance({ result: 'start' }) // 'second'
```

## Condition Node

This definition is exported by the library as `{ Condition }`

```javascript
import { Condition } from './index.js'
	
return Condition; // success
```

Use the `NodeTypes.CD` (condition) value as the type.

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
	return { output1, output2, output3 } // {
 output1: 'first',
 output2: 'second',
 output3: 'none',
}
```

This definition is exported by the library as `{ Switch }`

```javascript
import { Switch } from './index.js'
	
return Switch; // success
```

Use the `NodeTypes.SW` (switch) value as the type.

A switch node is an object with the `'switch'` property.

### Execute a switch by evaluating the `'switch'` property and directing to the approprtate `'case'` clause.

Evaluate the `'switch'` property as a function that returns a key.

If the key exists in the `'case'` caluses, use the key, otherwise use the `'default'` clause

Check again if the key exists (`'default'` clause may not be defined), if it does, redirect to the case, otherwise do nothing.

Traverse a switch by iterating over the `'case'` clauses

## While Node

This definition is exported by the library as `{ While }`

```javascript
import { While } from './index.js'
	
return While; // success
```

Use the `NodeTypes.WH` (switch) value as the type.

A while node is an object with the `'while'` property.

### Execute a while by evaluating the `'while'` property and directing to the `'do'` clause if `true`.

#### Evaluate the `'while'` property as a function that returns a boolean.

If the condition is false, exit the while loop.

If `true`, execute the `'do'` clause

Proceed by re-entering the while loop.

Traverse a while by iterating over the `'do'` clause

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

This definition is exported by the library as `{ Machine }`

```javascript
import { Machine } from './index.js'
	
return Machine; // success
```

Use the `NodeTypes.MC` (machine) value as the type.

A machine is an object with the `'initial'` property. A machine cannot be used as an action.

Execute a machine by directing to the `'initial'` stages.

Traverse a machine by iterating over all the stages

## Directive Node

Transitioning is also possible by using and object with the `S.Stack` key set to a relative or absolute path. This is not recommended as it is almost never required, it should be considered system-only.

```javascript
const instance = new S({
	initial: [
		{ result: 'first' },
		{ [S.Goto]: 'next' }
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
		{ [S.Goto]: 'next', result: 'ignored' }
	],
	next: S.Return
}).output(({ result }) => result)
return instance({ result: 'start' }) // 'first'
```

This definition is exported by the library as `{ Directive }`

```javascript
import { Directive } from './index.js'
	
return Directive; // success
```

Use the `NodeTypes.DR` (directive) value as the type.

A directive is an object with the `S.Stack` property.

A directive is performed by performing the value of the `S.Stack` property to allow for using absolute or relative directives

A directive does not require proceeding, simply return the current state unmodified

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

This definition is exported by the library as `{ SequenceDirective }`

```javascript
import { SequenceDirective } from './index.js'
	
return SequenceDirective; // success
```

Use the `NodeTypes.SD` (sequence-directive) value as the type.

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

This definition is exported by the library as `{ MachineDirective }`

```javascript
import { MachineDirective } from './index.js'
	
return MachineDirective; // success
```

Use the `NodeTypes.MD` (machine-directive) value as the type.

A machine directive is a string.

### A machine directive is performed by directing to the given stage.

Get the closest ancestor that is a machine.

If no machine ancestor is found, throw a `PathReferenceError`

Update the path to parent>stage

## Interrupt Directive Node

Interrupts are like directives, except they will return to the previous execution path once complete.

Use the `NodeTypes.ID` (interrupt-directive) value as the type.

An interrupt directive is a symbol.

### An interrupt directive is performed by directing to the given stage.

Get the closest ancestor that is a machine.

If no machine ancestor is found, throw a `PathReferenceError`

Update the path to parent>stage

### 





## Absolute Directive Node

Arrays can be used to perform absolute redirects. This is not recommended as it may make your transition logic unclear.

Arrays cannot be used on their own, because they would be interpreted as sequences. For this reason they must be contained in an object with the `S.Stack` symbol as a ky, with the array as the value, or returned by an action.

Using an absolute directive in a directive object works

```javascript
const instance = new S({
	initial: [
		{ result: 'first' },
		{ [S.Goto]: ['next',1] }
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

This definition is exported by the library as `{ AbsoluteDirective }`

```javascript
import { AbsoluteDirective } from './index.js'
	
return AbsoluteDirective; // success
```

Use the `NodeTypes.AD` (absolute-directive) value as the type.

An absolute directive is a list of strings, symbols, and numbers. It can only be used as an action as it would otherwise be interpreted as a sequence.

An absolute directive is performed by setting `S.Stack` to the path

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

This definition is exported by the library as `{ Return }`

```javascript
import { Return } from './index.js'
	
return Return; // success
```

Use the `NodeTypes.RT` (return) value as the type.

A return node is the `S.Return` symbol itself, or an object with an `S.Return` property.

Perform a return by setting the `S.Return` property on the state to the return value

# Errors

## SuperSmallStateMachineError

All Super Small State Machine Errors will inherit from this class.

Allows for contextual information to be provided with the error

This class is exported by the library as `{ SuperSmallStateMachineError }`

```javascript
import { SuperSmallStateMachineError } from './index.js'
	
return SuperSmallStateMachineError; // success
```

Is an error instance

```javascript
return (new SuperSmallStateMachineError()) instanceof Error // true
```

A message string can be passed into the error

```javascript
return new SuperSmallStateMachineError('My String!') // { message: 'My String!' }
```

All exported errors inherit from this class

```javascript
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
    && pathReferenceError  instanceof SuperSmallStateMachineError // true
```

Passing a state, instance, data, and/or stack with make those properties available in the error

```javascript
	return new SuperSmallStateMachineError('', {
		instance: 'something',
		state: 'my state',
		data: 'special data'
	}) // {
 instance: 'something',
 state: 'my state',
 data: 'special data',
}
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

All exported reference errors inherit from this class

```javascript
const stateReferenceError = new StateReferenceError()
const nodeReferenceError  = new NodeReferenceError()
const pathReferenceError  = new PathReferenceError()
return stateReferenceError instanceof SuperSmallStateMachineReferenceError
    && nodeReferenceError  instanceof SuperSmallStateMachineReferenceError
    && pathReferenceError  instanceof SuperSmallStateMachineReferenceError // true
```

## SuperSmallStateMachineTypeError

All Super Small State Machine Type Errors will inherit from this class

This class is exported by the library as `{ SuperSmallStateMachineTypeError }`

```javascript
import { SuperSmallStateMachineTypeError } from './index.js'
	
return SuperSmallStateMachineTypeError; // success
```

All exported type errors inherit from this class

```javascript
const stateTypeError = new StateTypeError()
const nodeTypeError  = new NodeTypeError()
return stateTypeError instanceof SuperSmallStateMachineTypeError
    && nodeTypeError  instanceof SuperSmallStateMachineTypeError // true
```

## StateReferenceError

A state change has set a property that was not defined in the original state defaults.

This is likely intentional, as this is not default behaviour.

This class is exported by the library as `{ StateReferenceError }`

```javascript
import { StateReferenceError } from './index.js'
	
return StateReferenceError; // success
```

A state reference error is thrown when a new property is added to the state of a machine while in strict mode

```javascript
const machine = new S({ myUnknownVar: true }).strict
return machine() // StateReferenceError
```

## StateTypeError

A state change has updated a property that was defined as a different type in the original state defaults.

This is likely intentional, as this is not default behaviour.

This class is exported by the library as `{ StateTypeError }`

```javascript
import { StateTypeError } from './index.js'
	
return StateTypeError; // success
```

A state type errors is thrown when a property changes type in strict state mode

```javascript
const machine = new S({ myKnownVar: 'not a boolean' }).strictTypes
.defaults({ myKnownVar: true })
return machine() // StateTypeError
```

## NodeTypeError

A node of an unknown type was used in a process.

This was probably caused by a custom node definition

This class is exported by the library as `{ NodeTypeError }`

```javascript
import { NodeTypeError } from './index.js'
	
return NodeTypeError; // success
```

A node type error is thrown when an unrecognised node is used in a process

```javascript
const machine = new S(true)
return machine() // NodeTypeError
```

## NodeReferenceError

An undefined node was used in a process.

This is probably caused by a missing variable.

If you wish to perform an intentional no-op, use `null`

This class is exported by the library as `{ NodeReferenceError }`

```javascript
import { NodeReferenceError } from './index.js'
	
return NodeReferenceError; // success
```

An node reference error is thrown when a node in a process is `undefined`

```javascript
const machine = new S([undefined])
return machine() // NodeReferenceError
```

## MaxIterationsError

The execution of the process took more iterations than was allowed.

This can be configured using `.for` or `.forever`

This class is exported by the library as `{ MaxIterationsError }`

```javascript
import { MaxIterationsError } from './index.js'
	
return MaxIterationsError; // success
```

A max iterations errors is thrown when an execution exceeds the maximum allowed iterations

```javascript
const machine = new S([ 0 ]).for(10)
return machine() // MaxIterationsError
```

## PathReferenceError

A path was referenced which could not be found in the given process.

This class is exported by the library as `{ PathReferenceError }`

```javascript
import { PathReferenceError } from './index.js'
	
return PathReferenceError; // success
```

A path reference error is thrown when the machine is told to target a node that does not exist

```javascript
const machine = new S('not a stage')
return machine() // PathReferenceError
```

