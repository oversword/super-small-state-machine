<img alt="Super Small State Machine" src="./logo.svg" width=800 />

# Language

A process is made of nodes

Nodes are executables or actions

There are three phases: execute, perform, proceed

- An executable results in an action

- Actions are performed on the state

- Then we proceed to the next node

The state is made of properties

The state may be given special system symbols containing execution information

Machines have multiple stages, refered to by strings

Machines have multiple interrupts, refered to by symbols

Sequences have multiple indexes, refered to by numbers

Conditions (including switch) have clauses

# Tutorial

To create a new state machine, create a new instance of the `S` class

```javascript
const instance = new S() // Succeeds
```

The instance is executable, and can be run just like a function

```javascript
const instance = new S([
	{ myProperty: 'myValue' },
	({ myProperty }) => ({ [Return]: myProperty })
])
return instance() // 'myValue'
```

The initial state can be passed into the function call

```javascript
const instance = new S([
	({ myProperty }) => ({ [Return]: myProperty })
])
return instance({ myProperty: 'myValue' }) // 'myValue'
```

An intuitive syntax can be used to construct the process of the state machine

```javascript
const instance = new S({
	initial: [
		{ order: [] }, // Set the "order" property to an empty list
		'second',      // Goto the "second" stage
	],
	second: { // Conditionally add the next number
		if: ({ order }) => order.length < 10,
		then: ({ order }) => ({ order: [ ...order, order.length ] }),
		else: 'end' // Goto the "end" stage if we have already counted to 10
	},
	end: ({ order }) => ({ [Return]: order }) // Return the list we have constructed
}) // Succeeds
```

To configure the state machine, you can cahin configuration methods

```javascript
const instance = new S()
	.deep
	.strict
	.forever // Succeeds
```

You can avoid making a new instance for each method by using `.with`

```javascript
const specificConfig = S.with(S.deep, S.strict, S.forever)
const instance = new S()
	.with(specificConfig) // Succeeds
```

# Instance

Process

```javascript
const instance = new S({ result: 'value' })
return instance.process // { result: 'value' }
```

Config

```javascript
const instance = new S()
return instance.config // { defaults: { result: undefined }, iterations: 10000, strict: false }
```

```javascript
const instance = new S()
const modifiedInstance = instance
	.with(asyncPlugin)
	.for(10)
	.defaults({ result: 'other' })
	.strict
return modifiedInstance.config // { defaults: { result: 'other' }, iterations: 10, strict: true }
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

Neither of these arguments are required, and it is not recommended to configure them via the constructor. Instead you should update the config using the various chainable methods and properties.

```javascript
const instance = new S(process)
	.defaults({})
	.input()
	.output() // Succeeds
```

### The executable instance will be an `instanceof ExecutableFunction` 

It will execute the `run` or `override` method in scope of the new SuperSmallStateMachine instance.

### Create the config by merging the passed config with the defaults.

This is private so it cannot be mutated at runtime

```javascript
const myConfig = { iterations: 1000 }
const instance = new S(null, myConfig)
const retrievedConfig = instance.config
return retrievedConfig !== myConfig && retrievedConfig !== instance.config // true
```

```javascript
const myConfig = { iterations: 'original' }
const instance = new S(null, myConfig)
instance.config.iterations = 'new value'
return instance.config.iterations // 'original'
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
			Return,
		]
	}
])
return instance.closest([0, 'then', 1], SequenceNode.type) // [ 0, 'then' ]
```

## instance.changes (state = {}, changes = {})

Safely apply the given `changes` to the given `state`.

Merges the `changes` with the given `state` and returns it.

```javascript
const instance = new S()
const result = instance.changes({
	[Changes]: {},
	preserved: 'value',
	common: 'initial',
}, {
	common: 'changed',
})
return result // { common: 'changed', preserved: 'value', [Changes]: { common: 'changed' } }
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
return instance.proceed({ [Stack]: [{path:[ 2, 1 ],origin:Return,point:2}] }) // { [Stack]: [ { path: [ 3 ], origin: Symbol(SSSM Return), point: 1 } ] }
```

## instance.perform (state = {}, action = null)

Perform actions on the state.

Applies any changes in the given `action` to the given `state`.

```javascript
const instance = new S()
return instance.perform({ myProperty: 'start value' }, { myProperty: 'new value' }) // { myProperty: 'new value' }
```

## instance.execute (state = {}, node = undefined)

Execute a node in the process, return an action.

Executes the node in the process at the state's current path and returns its action.

If the node is not executable it will be returned as the action.

```javascript
const instance = new S([
	{ myProperty: 'this value' },
	{ myProperty: 'that value' },
	{ myProperty: 'the other value' },
])
return instance.execute({ [Stack]: [{path:[1],origin:Return,point:1}], myProperty: 'start value' }, get_path_object(instance.process, [1])) // { myProperty: 'that value' }
```

## instance.traverse(iterator = a => a)

Traverses the process of the instance, mapping each node to a new value, effectively cloning the process.

You can customise how each leaf node is mapped by supplying the `iterator` method

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
	if (nodeType === ConditionNode.type && node.if === 'swap this too')
		return {
			...node,
			if: 'with another thing'
		}
	return node
}) // { initial: 'with this', other: [ { if: 'with another thing', then: 'with that' } ] }
```

## instance.run (...input)

Execute the entire process.

Will execute the process

```javascript
const instance = new S({ [Return]: 'return value' })
return instance.run() // 'return value'
```

Will not handle promises in async mode even if it is configured

```javascript
const instance = new S(() => Promise.resolve({ [Return]: 'return value' }))
	.with(asyncPlugin)
return instance.run() // undefined
```

Will not handle promises in sync mode

```javascript
const instance = new S(() => Promise.resolve({ [Return]: 'return value' }))
return instance.run() // undefined
```

Is the same as running the executable instance itself

```javascript
const instance = new S({ [Return]: 'return value' })
return instance.run() === instance() // true
```

Takes the same arguments as the executable instance itself

```javascript
const instance = new S(({ a, b, c }) => ({ [Return]: `${a} + ${b} - ${c}` }))
	.input((a, b, c) => ({ a, b, c }))
return instance.run(1, 2, 3) === instance(1, 2, 3) // true
```

## instance.do(process) <default: null>

Defines a process to execute, overrides the existing process.

Returns a new instance.

```javascript
const instance = new S({ [Return]: 'old' })
	.do({ [Return]: 'new' })
return instance() // 'new'
```

## instance.defaults(defaults) <default: {}>

Defines the initial state to be used for all executions.

Returns a new instance.

```javascript
const instance = new S(({ result }) => ({ [Return]: result }))
	.defaults({ result: 'default' })
return instance() // 'default'
```

## instance.input(input) <default: (state => state)>

Allows the definition of the arguments the executable will use, and how they will be applied to the initial state.

Returns a new instance.

```javascript
const instance = new S(({ first, second }) => ({ [Return]: `${first} then ${second}` }))
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
.output(({ [Trace]: trace }) => trace)
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
.output(({ [Trace]: trace }) => trace)
return instance() // [ [ { path: [  ], origin: Symbol(SSSM Return), point: 0 } ], [ { path: [ 'initial' ], origin: Symbol(SSSM Return), point: 1 } ], [ { path: [ 'other' ], origin: Symbol(SSSM Return), point: 1 } ], [ { path: [ 'oneMore' ], origin: Symbol(SSSM Return), point: 1 } ], [ { path: [ 'oneMore', 0 ], origin: Symbol(SSSM Return), point: 2 } ], [ { path: [ 'oneMore', 1 ], origin: Symbol(SSSM Return), point: 2 } ] ]
```

## instance.shallow <default>

Shallow merges the state every time a state change is made.

Creates a new instance.

```javascript
const instance = new S({ myProperty: { existingKey: 'newValue', deepKey: { deepValue2: 7 } } })
	.shallow
	.output(ident)
return instance({ myProperty: { existingKey: 'existingValue', anotherKey: 'anotherValue', deepKey: { deepVaue: 6 } } }) // { myProperty: { existingKey: 'newValue', anotherKey: undefined, deepKey: { deepVaue: undefined, deepValue2: 7 } } }
```

## instance.deep

Deep merges the all properties in the state every time a state change is made.

Creates a new instance.

```javascript
const instance = new S({ myProperty: { existingKey: 'newValue', deepKey: { deepValue2: 7 } } })
	.deep
	.output(ident)
return instance({ myProperty: { existingKey: 'existingValue', anotherKey: 'anotherValue', deepKey: { deepVaue: 6 } } }) // { myProperty: { existingKey: 'newValue', anotherKey: 'anotherValue', deepKey: { deepVaue: 6, deepValue2: 7 } } }
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
	({ knownVariable }) => ({ [Return]: knownVariable })
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

## instance.until(until) <default: (state => Return in state)>

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

## instance.override(override) <default: instance.run>

Overrides the method that will be used when the executable is called.

Returns a new instance.

```javascript
const instance = new S({ [Return]: 'definedResult' })
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
class SpecialNode extends Node {
	static type = 'special'
	static typeof(object, objectType) { return Boolean(objectType === 'object' && object && specialSymbol in object)}
	static execute(){ return { [Return]: 'specialValue' } }
}
const instance = new S({ [specialSymbol]: true })
	.output(({ result, [Return]: output = result }) => output)
	.addNode(SpecialNode)
return instance({ result: 'start' }) // 'specialValue'
```

```javascript
const specialSymbol = Symbol('My Symbol')
const instance = new S({ [specialSymbol]: true })
	.output(({ result, [Return]: output = result }) => output)
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
			return { [Return]: 'replaced' }
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
	.with(S.strict, asyncPlugin, S.for(10))
return instance.config // { strict: true, iterations: 10 }
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
import { NodeDefinition } from './index.js'
	
return NodeDefinition; // success
```

The node collection class is exported as `{ NodeDefinitions }`

```javascript
import { NodeDefinitions } from './index.js'
	
return NodeDefinitions; // success
```

The node class is exported as `{ Node }`

```javascript
import { Node } from './index.js'
	
return Node; // success
```

The node collection class is exported as `{ Nodes }`

```javascript
import { Nodes } from './index.js'
	
return Nodes; // success
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
			Return,
		]
	}
])
return S.closest([0, 'then', 1], SequenceNode.type)(instance) // [ 0, 'then' ]
```

## S.changes (state = {}, changes = {})

Safely apply the given `changes` to the given `state`.

Merges the `changes` with the given `state` and returns it.

```javascript
const instance = new S()
const result = S.changes({
	[Changes]: {},
	preserved: 'value',
	common: 'initial',
}, {
	common: 'changed',
})(instance)
return result // { common: 'changed', preserved: 'value', [Changes]: { common: 'changed' } }
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
const proceeder = S.proceed({ [Stack]: [{path:[ 2, 1 ],origin:Return,point:2}] })
return proceeder(instance) // { [Stack]: [ { path: [ 3 ], origin: Symbol(SSSM Return), point: 1 } ] }
```

## S.perform (state = {}, action = null)

Perform actions on the state.

Applies any changes in the given `action` to the given `state`.

```javascript
const instance = new S()
const performer = S.perform({ myProperty: 'start value' }, { myProperty: 'new value' })
return performer(instance) // { myProperty: 'new value' }
```

## S.execute (state = {}, node = undefined)

Execute a node in the process, return an action.

Executes the node in the process at the state's current path and returns its action.

If the node is not executable it will be returned as the action.

```javascript
const instance = new S([
	{ myProperty: 'this value' },
	{ myProperty: 'that value' },
	{ myProperty: 'the other value' },
])
const executor = S.execute({ [Stack]: [{path:[1],origin:Return,point:1}], myProperty: 'start value' })
return executor(instance) // { myProperty: 'that value' }
```

## S.traverse(iterator = a => a)

Traverses the process of the given instance, mapping each node to a new value, effectively cloning the process.

You can customise how each leaf node is mapped by supplying the `iterator` method

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
	if (nodeType === ConditionNode.type && node.if === 'swap this too')
		return {
			...node,
			if: 'with another thing'
		}
	return node
})
return traverser(instance) // { initial: 'with this', other: [ { if: 'with another thing', then: 'with that' } ] }
```

## S.run (...input)

Execute the entire process.

Will execute the process

```javascript
const instance = new S({ [Return]: 'return value' })
return S.run()(instance) // 'return value'
```

Will not handle promises in async mode even if it is configured

```javascript
const instance = new S(() => Promise.resolve({ [Return]: 'return value' }))
	.with(asyncPlugin)
return S.run()(instance) // undefined
```

Will not handle promises in sync mode

```javascript
const instance = new S(() => Promise.resolve({ [Return]: 'return value' }))
return S.run()(instance) // undefined
```

Is the same as running the executable instance itself

```javascript
const instance = new S({ [Return]: 'return value' })
return S.run()(instance) === instance() // true
```

Takes the same arguments as the executable instance itself

```javascript
const instance = new S(({ a, b, c }) => ({ [Return]: `${a} + ${b} - ${c}` }))
	.input((a, b, c) => ({ a, b, c }))
return S.run(1, 2, 3)(instance) === instance(1, 2, 3) // true
```

## S.do(process) <default: null>

Defines a process to execute, overrides the existing process.

Returns a function that will modify a given instance.

```javascript
const instance = new S({ [Return]: 'old' })
const newInstance = instance.with(S.do({ [Return]: 'new' }))
return newInstance() // 'new'
```

## S.defaults(defaults) <default: {}>

Defines the initial state to be used for all executions.

Returns a function that will modify a given instance.

```javascript
const instance = new S(({ result }) => ({ [Return]: result }))
const newInstance = instance.with(S.defaults({ result: 'default' }))
return newInstance() // 'default'
```

## S.input(input) <default: (state => state)>

Allows the definition of the arguments the executable will use, and how they will be applied to the initial state.

Returns a function that will modify a given instance.

```javascript
const instance = new S(({ first, second }) => ({ [Return]: `${first} then ${second}` }))
.with(
	S.defaults({ first: '', second: '' }),
	S.input((first, second) => ({ first, second }))
)
return instance('this', 'that') // 'this then that'
```

## S.output(output) <default: (state => state[Return])>

Allows the modification of the value the executable will return.

Returns a function that will modify a given instance.

```javascript
const instance = new S(({ myReturnValue }) => ({ myReturnValue: myReturnValue + ' extra' }))
	.with(S.output(state => state.myReturnValue))
return instance({ myReturnValue: 'start' }) // 'start extra'
```

## S.untrace <default>

Shallow merges the state every time a state change is made.

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
.output(({ [Trace]: trace }) => trace)
return instance() // [  ]
```

## S.trace

Deep merges the all properties in the state every time a state change is made.

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
.output(({ [Trace]: trace }) => trace)
return instance() // [ [ { path: [  ], origin: Symbol(SSSM Return), point: 0 } ], [ { path: [ 'initial' ], origin: Symbol(SSSM Return), point: 1 } ], [ { path: [ 'other' ], origin: Symbol(SSSM Return), point: 1 } ], [ { path: [ 'oneMore' ], origin: Symbol(SSSM Return), point: 1 } ], [ { path: [ 'oneMore', 0 ], origin: Symbol(SSSM Return), point: 2 } ], [ { path: [ 'oneMore', 1 ], origin: Symbol(SSSM Return), point: 2 } ] ]
```

## S.shallow <default>

Shallow merges the state every time a state change is made.

Returns a function that will modify a given instance.

```javascript
const instance = new S({ myProperty: { existingKey: 'newValue', deepKey: { deepValue2: 7 } } })
	.with(S.shallow)
	.output(ident)
return instance({ myProperty: { existingKey: 'existingValue', anotherKey: 'anotherValue', deepKey: { deepVaue: 6 } } }) // { myProperty: { existingKey: 'newValue', anotherKey: undefined, deepKey: { deepVaue: undefined, deepValue2: 7 } } }
```

## S.deep

Deep merges the all properties in the state every time a state change is made.

Returns a function that will modify a given instance.

```javascript
const instance = new S({ myProperty: { existingKey: 'newValue', deepKey: { deepValue2: 7 } } })
	.with(S.deep)
	.output(ident)
return instance({ myProperty: { existingKey: 'existingValue', anotherKey: 'anotherValue', deepKey: { deepVaue: 6 } } }) // { myProperty: { existingKey: 'newValue', anotherKey: 'anotherValue', deepKey: { deepVaue: 6, deepValue2: 7 } } }
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

## S.until(until) <default: (state => Return in state)>

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

## S.override(override) <default: instance.run>

Overrides the method that will be used when the executable is called.

Returns a function that will modify a given instance.

```javascript
const instance = new S({ [Return]: 'definedResult' })
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
class SpecialNode extends Node {
	static type = 'special'
	static typeof(object, objectType) { return Boolean(objectType === 'object' && object && specialSymbol in object)}
	static execute(){ return { [Return]: 'specialValue' } }
}
const instance = new S({ [specialSymbol]: true })
	.with(
		S.output(({ result, [Return]: output = result }) => output),
		S.addNode(SpecialNode)
	)
return instance({ result: 'start' }) // 'specialValue'
```

```javascript
const specialSymbol = Symbol('My Symbol')
const instance = new S({ [specialSymbol]: true })
	.with(
		S.output(({ result, [Return]: output = result }) => output)
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
				return { [Return]: 'replaced' }
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
const plugin = S.with(S.strict, asyncPlugin, S.for(10))
const instance = new S().with(plugin)
return instance.config // { strict: true, iterations: 10 }
```

Allow the input of a list or a list of lists, etc.

### Return a function that takes a specific instance.

Pass each state through the adapters sequentially.

Make sure an instance is returned.

# Core

Every instance must have a process and be callable.

## Config

```javascript
return S.config // { deep: false, strict: false, trace: false, iterations: 10000, override: null, adapt: [  ], before: [  ], after: [  ], defaults: {  } }
```

Initialise an empty state by default

```javascript
return Object.keys(new S(null).config.defaults) // [  ]
```

Input the initial state by default

```javascript
return new S(null).config.input({ myProperty: 'myValue' }, 2, 3) // { myProperty: 'myValue' }
```

Return the `Return` property by default

```javascript
return new S(null).config.output({ [Return]: 'myValue' }) // 'myValue'
```

Do not perform strict state checking by default

```javascript
return new S(null).config.strict // false
```

Allow 10000 iterations by default

```javascript
return new S(null).config.iterations // 10000
```

Run until the return symbol is present by default.

```javascript
return new S(null).config.until({ [Return]: undefined }) // true
```

Do not keep the stack trace by default

```javascript
return new S(null).config.trace // false
```

Shallow merge changes by default

```javascript
return new S(null).config.deep // false
```

Do not override the execution method by default

```javascript
return new S(null).config.override // null
```

Uses the provided nodes by default.

```javascript
	return new S(null).config.nodes // { [Changes]: class ChangesNode extends Node {
	static type = Changes
	static typeof(object, objectType) { return Boolean(object && objectType === 'object') }
	static perform(action, state) { return S._changes(this, state, action) }
}, [Sequence]: class SequenceNode extends Node {
	static type = Sequence
	static proceed(node, state) {
		const index = state[Stack][0].path[state[Stack][0].point]
		if (node && (typeof index === 'number') && (index+1 < node.length))
			return { ...state, [Stack]: [{ ...state[Stack][0], path: [...state[Stack][0].path.slice(0,state[Stack][0].point), index+1], point: state[Stack][0].point + 1 }, ...state[Stack].slice(1)] }
		return Node.proceed.call(this, node, state)
	}
	static typeof(object, objectType, isAction) { return ((!isAction) && objectType === 'object' && Array.isArray(object)) }
	static execute(node, state) { return node.length ? [ ...state[Stack][0].path.slice(0,state[Stack][0].point), 0 ] : null }
	static traverse(node, path, iterate) { return node.map((_,i) => iterate([...path,i])) }
}, [FunctionN]: class FunctionNode extends Node {
	static type = FunctionN
	static typeof(object, objectType, isAction) { return (!isAction) && objectType === 'function' }
	static execute(node, state) { return node(state) }
}, [Condition]: class ConditionNode extends Node {
	static type = Condition
	static typeof(object, objectType, isAction) { return Boolean((!isAction) && object && objectType === 'object' && ('if' in object)) }
	static keywords = ['if','then','else']
	static execute(node, state) {
		if (normalise_function(node.if)(state))
		return 'then' in node ? [ ...state[Stack][0].path.slice(0,state[Stack][0].point), 'then' ] : null
		return 'else' in node ? [ ...state[Stack][0].path.slice(0,state[Stack][0].point), 'else' ] : null
	}
	static traverse(node, path, iterate) { return {
		...node,
		...('then' in node ? { then: iterate([...path,'then']) } : {}),
		...('else' in node ? { else: iterate([...path,'else']) } : {}),
		...(Symbols in node ? Object.fromEntries(node[Symbols].map(key => [key, iterate([...path,key])])) : {}),
	} }
}, [Switch]: class SwitchNode extends Node {
	static type = Switch
	static typeof(object, objectType, isAction) { return Boolean((!isAction) && object && objectType === 'object' && ('switch' in object)) }
	static keywords = ['switch','case','default']
	static execute(node, state) {
		const key = normalise_function(node.switch)(state)
		const fallbackKey = (key in node.case) ? key : 'default'
		return (fallbackKey in node.case) ? [ ...state[Stack][0].path.slice(0,state[Stack][0].point), 'case', fallbackKey ] : null
	}
	static traverse(node, path, iterate) { return { ...node, case: Object.fromEntries(Object.keys(node.case).map(key => [ key, iterate([...path,'case',key]) ])), ...(Symbols in node ? Object.fromEntries(node[Symbols].map(key => [key, iterate([...path,key])])) : {}) } }
}, [While]: class WhileNode extends Node {
	static type = While
	static typeof(object, objectType, isAction) { return Boolean((!isAction) && object && objectType === 'object' && ('while' in object)) }
	static keywords = ['while','do']
	static execute(node, state) {
			if (!(('do' in node) && normalise_function(node.while)(state))) return null
			return [ ...state[Stack][0].path.slice(0,state[Stack][0].point), 'do' ]
	}
	static proceed(node, state) { return { ...state, [Stack]: [ { ...state[Stack][0], path: state[Stack][0].path.slice(0,state[Stack][0].point) }, ...state[Stack].slice(1) ] } }
	static traverse(node, path, iterate) { return { ...node, ...('do' in node ? { do: iterate([ ...path, 'do' ]) } : {}), ...(Symbols in node ? Object.fromEntries(node[Symbols].map(key => [key, iterate([...path,key])])) : {}), } }
}, [Machine]: class MachineNode extends Node {
	static type = Machine
	static typeof(object, objectType, isAction) { return Boolean((!isAction) && object && objectType === 'object' && ('initial' in object)) }
	static keywords = ['initial']
	static execute(node, state) { return [ ...state[Stack][0].path.slice(0,state[Stack][0].point), 'initial' ] }
	static traverse(node, path, iterate) { return { ...node, ...Object.fromEntries(Object.keys(node).concat(Symbols in node ? node[Symbols]: []).map(key => [ key, iterate([...path,key]) ])) } }
}, [Goto]: class GotoNode extends Node {
	static type = Goto
	static typeof(object, objectType, isAction) { return Boolean(object && objectType === 'object' && (Goto in object)) }
	static perform(action, state) { return S._perform(this, state, action[Goto]) }
	static proceed(node, state) { return state }
}, [InterruptGoto]: class InterruptGotoNode extends GotoNode {
	static type = InterruptGoto
	static typeof(object, objectType, isAction) { return objectType === 'symbol' }
	static perform(action, state) {
		const lastOf = get_closest_path(this.process, state[Stack][state[Stack].length-1].path.slice(0,state[Stack][state[Stack].length-1].point-1), parentNode => Boolean(parentNode && (typeof parentNode === 'object') && (action in parentNode)))
		if (!lastOf) return { ...state, [Return]: action }
		return { ...state, [Stack]: [ { origin: action, path: [...lastOf, action], point: lastOf.length + 1 }, ...state[Stack] ] }
	}
	static proceed(node, state) {
		const { [Stack]: stack, [Return]: interruptReturn, ...proceedPrevious } = S._proceed(this, { ...state, [Stack]: state[Stack].slice(1) }, undefined)
		return { ...proceedPrevious, [Stack]: [ state[Stack][0], ...stack ] }
	}
}, [AbsoluteGoto]: class AbsoluteGotoNode extends GotoNode {
	static type = AbsoluteGoto
	static typeof(object, objectType, isAction) { return isAction && Array.isArray(object) }
	static perform(action, state) { return { ...state, [Stack]: [ { ...state[Stack][0], path: action, point: action.length }, ...state[Stack].slice(1) ] } }
}, [MachineGoto]: class MachineGotoNode extends GotoNode {
	static type = MachineGoto
	static typeof(object, objectType, isAction) { return objectType === 'string' }
	static perform(action, state) {
		const lastOf = S._closest(this, state[Stack][0].path.slice(0,state[Stack][0].point-1), MachineNode.type)
		if (!lastOf) throw new PathReferenceError(`A relative goto has been provided as a string (${String(action)}), but no state machine exists that this string could be a state of. From path [ ${state[Stack][0].path.slice(0,state[Stack][0].point).map(key => key.toString()).join(', ')} ].`, { instance: this, state, data: { action } })
		return { ...state, [Stack]: [ { ...state[Stack][0], path: [...lastOf, action], point: lastOf.length + 1 }, ...state[Stack].slice(1) ] }
	}
}, [SequenceGoto]: class SequenceGotoNode extends GotoNode {
	static type = SequenceGoto
	static typeof(object, objectType, isAction) { return objectType === 'number' }
	static perform(action, state) {
		const lastOf = S._closest(this, state[Stack][0].path.slice(0,state[Stack][0].point-1), SequenceNode.type)
		if (!lastOf) throw new PathReferenceError(`A relative goto has been provided as a number (${String(action)}), but no sequence exists that this number could be an index of from path [ ${state[Stack][0].path.slice(0,state[Stack][0].point).map(key => key.toString()).join(', ')} ].`, { instance: this, state, data: { action } })
		return { ...state, [Stack]: [ { ...state[Stack][0], path: [...lastOf, action], point: lastOf.length + 1 }, ...state[Stack].slice(1) ] }
	}
}, [ErrorN]: class ErrorNode extends Node {
	static type = ErrorN
	static typeof = (object, objectType) => (objectType === 'object' && object instanceof Error) || (objectType === 'function' && (object === Error || object.prototype instanceof Error))
	static perform(action, state) {
		if (typeof action === 'function') throw new action()
		throw action
	}
}, [Undefined]: class UndefinedNode extends Node {
	static type = Undefined
	static typeof(object, objectType) { return objectType === 'undefined' }
	static execute(node, state) { throw new NodeReferenceError(`There is nothing to execute at path [ ${state[Stack][0].path.slice(0,state[Stack][0].point).map(key => key.toString()).join(', ')} ]`, { instance: this, state, data: { node } }) }
}, [Empty]: class EmptyNode extends Node {
	static type = Empty
	static typeof(object, objectType) { return object === null }
}, [Continue]: class ContinueNode extends GotoNode {
	static type = Continue
	static typeof(object, objectType) { return object === Continue }
	static perform(action, state) {
		const lastOf = S._closest(this, state[Stack][0].path.slice(0,state[Stack][0].point-1), WhileNode.type)
		if (!lastOf) throw new PathReferenceError(`A Continue has been used, but no While exists that this Continue could refer to. From path [ ${state[Stack][0].path.slice(0,state[Stack][0].point).map(key => key.toString()).join(', ')} ].`, { instance: this, state, data: { action } })
		return { ...state, [Stack]: [ { ...state[Stack][0], path: lastOf, point: lastOf.length }, ...state[Stack].slice(1) ] }
	}
}, [Break]: class BreakNode extends GotoNode {
	static type = Break
	static typeof(object, objectType, isAction) { return object === Break }
	static proceed (node, state) {
		const lastOf = S._closest(this, state[Stack][0].path.slice(0,state[Stack][0].point-1), WhileNode.type)
		if (!lastOf) throw new PathReferenceError(`A Break has been used, but no While exists that this Break could refer to. From path [ ${state[Stack][0].path.slice(0,state[Stack][0].point).map(key => key.toString()).join(', ')} ].`, { instance: this, state, data: { node } })
		return S._proceed(this, { ...state, [Stack]: [{ ...state[Stack][0], point: lastOf.length-1 }, ...state[Stack].slice(1)] }, get_path_object(this.process, lastOf.slice(0,-1)))
	}
	static perform = Node.perform
}, [Return]: class ReturnNode extends GotoNode {
	static type = Return
	static typeof(object, objectType) { return object === Return || Boolean(object && objectType === 'object' && (Return in object)) }
	static perform(action, state) { return { ...state, [Return]: !action || action === Return ? undefined : action[Return], } }
	static proceed = Node.proceed
} }
```

Initialise with an empty process adapters list.

```javascript
return new S(null).config.adapt // [  ]
```

Initialise with an empty `before` adapters list.

```javascript
return new S(null).config.before // [  ]
```

Initialise with an empty `after` adapters list.

```javascript
return new S(null).config.after // [  ]
```

## S._closest (instance, path = [], ...nodeTypes)

Returns the path of the closest ancestor to the node at the given `path` that matches one of the given `nodeTypes`.

Returns `null` if no ancestor matches the one of the given `nodeTypes`.

```javascript
const instance = new S([
	{
		if: ({ result }) => result === 'start',
		then: [
			{ result: 'second' },
			Return,
		]
	}
])
return S._closest(instance, [0, 'then', 1], SequenceNode.type) // [ 0, 'then' ]
```

Node types can be passed in as arrays of strings, or arrays of arrays of strings...

### Use get_closest_path to find the closest path.

Get the type of the node

Pick this node if it matches any of the given types

## S._changes (instance, state = {}, changes = {})

Safely apply the given `changes` to the given `state`.

Merges the `changes` with the given `state` and returns it.

```javascript
const instance = new S()
const result = S._changes(instance, {
	[Changes]: {},
	preserved: 'value',
	common: 'initial',
}, {
	common: 'changed',
})
return result // { common: 'changed', preserved: 'value', [Changes]: { common: 'changed' } }
```

### If the strict state flag is truthy, perform state checking logic

Go through each property in the changes and check they all already exist

Throw a StateReferenceError if a property is referenced that did not previosly exist.

### If the strict state flag is set to the Strict Types Symbol, perform type checking logic.

Go through each property and check the JS type is the same as the initial values.

Throw a StateTypeError if a property changes types.

Collect all the changes in the changes object.

Deep merge the current state with the new changes

## S._proceed (instance, state = {}, node = undefined)

Proceed to the next execution path.

```javascript
const instance = new S([
	'firstAction',
	'secondAction'
])
return S._proceed(instance, {
	[Stack]: [{path:[0],origin:Return,point:1}]
}) // { [Stack]: [ { path: [ 1 ], origin: Symbol(SSSM Return), point: 1 } ] }
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
	[Stack]: [{path:[0,1],origin:Return,point:2}]
}) // { [Stack]: [ { path: [ 1 ], origin: Symbol(SSSM Return), point: 1 } ] }
```

Gets the type of the given `node`

```javascript
let typeofCalled = false
const MyNodeType = Symbol("My Node")
class MyNode extends Node {
	static type = MyNodeType
	static typeof(object) {
		typeofCalled = true
		return object === MyNodeType
	}
}
S._proceed(
	new S(null).addNode(MyNode),
	{[Stack]:[{path:[],origin:Return,point:0}]},
	MyNodeType,
)
return typeofCalled // true
```

If the node is unrecognised, throw a TypeEror

```javascript
return S._proceed(
	new S(null),
	{[Stack]:[{path:[],origin:Return,point:0}]},
	false
) // NodeTypeError
```

Call the `proceed` method of the node to get the next path.

```javascript
let proceedCalled = false
const MyNodeType = Symbol("My Node")
class MyNode extends Node {
	static type = MyNodeType
	static typeof(object) { return object === MyNodeType }
	static proceed(action, state) {
		proceedCalled = true
		return { ...state, someChange: 'someValue' }
	}
}
const result = S._proceed(
	new S(null).addNode(MyNode),
	{[Stack]:[{path:[0],origin:Return,point:1}]},
	MyNodeType
)
return proceedCalled && result // { someChange: 'someValue' }
```

## S._perform (instance, state = {}, action = undefined)

Perform actions on the state.

```javascript
const instance = new S([
	'firstAction',
	'secondAction',
	'thirdAction'
])
return S._perform(instance, { [Stack]: [{path:[0],origin:Return,point:1}], prop: 'value' }, { prop: 'newValue' }) // { prop: 'newValue', [Stack]: [ { path: [ 0 ], origin: Symbol(SSSM Return), point: 1 } ] }
```

Applies any changes in the given `action` to the given `state`.

```javascript
const instance = new S([
	'firstAction',
	'secondAction',
	'thirdAction'
])
return S._perform(instance, { [Stack]: [{path:[0],origin:Return,point:1}], prop: 'value' }, { [Goto]: [2] }) // { prop: 'value', [Stack]: [ { path: [ 2 ], origin: Symbol(SSSM Return), point: 1 } ] }
```

Gets the node type of the given `action`

```javascript
let typeofCalled = false
const MyNodeType = Symbol("My Node")
class MyNode extends Node {
	static type = MyNodeType
	static typeof(object) {
		typeofCalled = true
		return object === MyNodeType
	}
}
S._perform(
	new S(null).addNode(MyNode),
	{},
	MyNodeType
)
return typeofCalled // true
```

If the given `action` is not recognised, throw a NodeTypeError

```javascript
return S._perform(
	new S(null),
	{},
	false
) // NodeTypeError
```

Performs the given `action` on the state

```javascript
let performCalled = false
const MyNodeType = Symbol("My Node")
class MyNode extends Node {
	static type = MyNodeType
	static typeof(object) { return object === MyNodeType }
	static perform(action, state) {
		performCalled = true
		return { ...state, someChange: 'someValue' }
	}
}
const result = S._perform(
	new S(null).addNode(MyNode),
	{},
	MyNodeType
)
return performCalled && result // { someChange: 'someValue' }
```

## S._execute (instance, state = {}, node = get_path_object(instance.process, state[Stack][0].path.slice(0,state[Stack][0].point))))

Executes the node in the process at the state's current path and returns its action.

```javascript
const instance = new S([
	() => ({ result: 'first' }),
	() => ({ result: 'second' }),
	() => ({ result: 'third' }),
])
return S._execute(instance, { [Stack]: [{path:[1],origin:Return,point:1}] }) // { result: 'second' }
```

If the node is not executable it will be returned as the action.

```javascript
const instance = new S([
	({ result: 'first' }),
	({ result: 'second' }),
	({ result: 'third' }),
])
return S._execute(instance, { [Stack]: [{path:[1],origin:Return,point:1}] }) // { result: 'second' }
```

Gets the type of the given `node`

```javascript
let typeofCalled = false
const MyNodeType = Symbol("My Node")
class MyNode extends Node {
	static type = MyNodeType
	static typeof(object) {
		typeofCalled = true
		return object === MyNodeType
	}
}
S._execute(
	new S(null).addNode(MyNode),
	{},
	MyNodeType
)
return typeofCalled // true
```

If the given `node` is not recognised, throw a `NodeTypeError`

```javascript
return S._execute(
	new S(null),
	{},
	false
) // NodeTypeError
```

Execute the given `node` and return an action

```javascript
let executeCalled = false
const MyNodeType = Symbol("My Node")
class MyNode extends Node {
	static type = MyNodeType
	static typeof(object) { return object === MyNodeType }
	static execute() {
		executeCalled = true
		return 'some action'
	}
}
const result = S._execute(
	new S(null).addNode(MyNode),
	{},
	MyNodeType
)
return executeCalled && result // 'some action'
```

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
	if (nodeType === ConditionNode.type && node.if === 'swap this too')
		return {
			...node,
			if: 'with another thing'
		}
	return node
}) // { initial: 'with this', other: [ { if: 'with another thing', then: 'with that' } ] }
```

### Create an iteration function to be used recursively

Get the node at the given `path`

Get the type of the node

If the node is not recognised, throw a NodeTypeError

Call the iterator for all nodes as a transformer

Call the primary method

## S._run (instance, ...input)

Execute the entire process synchronously.

Will execute the process

```javascript
const instance = new S({ [Return]: 'return value' })
return S._run(instance) // 'return value'
```

Will not handle promises even if it is configured

```javascript
const instance = new S(() => Promise.resolve({ [Return]: 'return value' }))
.with(asyncPlugin)
return S._run(instance) // undefined
```

Will not handle promises in sync mode

```javascript
const instance = new S(() => Promise.resolve({ [Return]: 'return value' }))
return S._run(instance) // undefined
```

Is the same as running the executable instance itself

```javascript
const instance = new S({ [Return]: 'return value' })
return S._run(instance) === instance() // true
```

Takes the same arguments as the executable instance itself

```javascript
const instance = new S(({ a, b, c }) => ({ [Return]: `${a} + ${b} - ${c}` }))
	.input((a, b, c) => ({ a, b, c }))
return S._run(instance, 1, 2, 3) === instance(1, 2, 3) // true
```

Extract the useful parts of the config

```javascript
const instance = new S(null).output(ident).until(() => true)
let gettersAccessed = {}
S._run(
	{
		config: new Proxy(instance.config, {
			get(target, property) {
				gettersAccessed[property] = true
				return target[property]
			}
		}),
		process: instance.process,
	},
	{  }
)
return gettersAccessed // { until: true, iterations: true, input: true, output: true, before: true, after: true, defaults: true, trace: true }
```

### Turn the arguments into an initial condition

Runs the input adapter

```javascript
let inputAdapterCalled;
S._run(
	new S(null).output(ident).until(() => true)
		.input((state) => {
			inputAdapterCalled = true
			return state
		}),
	{  }
)
return inputAdapterCalled // true
```

Takes in all arguments passed in after the instance

```javascript
let passedArgs;
S._run(
	new S(null).output(ident).until(() => true)
		.input((...args) => {
			passedArgs = args
			return {}
		}),
	1, 2, 3, 4
)
return passedArgs // [ 1, 2, 3, 4 ]
```

### Merge the initial condition with the default initial state

the iterations are initialised at 0

```javascript
let firstValue;
S._run(
	new S(null).output(ident)
		.until((state, iterations) => {
			if (firstValue === undefined)
				firstValue = iterations
			return state
		}),
	{  }
)
return firstValue // 0
```

Before modifiers are called

```javascript
let beforeAdapterCalled = false
S._run(
	new S(null).output(ident).until(() => true)
		.before((state) => {
			beforeAdapterCalled = true
			return state
		}),
	{  }
)
return beforeAdapterCalled // true
```

Before adapter are called after input adapter

```javascript
let inputAdapterCalled = false
let beforeAdapterCalled = false
let beforeAdapterCalledAfterInputAdapter = false
S._run(
	new S(null).output(ident).until(() => true)
		.input((state) => {
			inputAdapterCalled = true
			return state
		})
		.before((state) => {
			beforeAdapterCalled = true
			if (inputAdapterCalled)
				beforeAdapterCalledAfterInputAdapter = true
			return state
		}),
	{  }
)
return inputAdapterCalled && beforeAdapterCalled && beforeAdapterCalledAfterInputAdapter // true
```

Initial state will be deep merged if enabled

```javascript
return S._run(
	new S(null).output(ident).until(() => true).deep
	.defaults({ myProperty: { subProperty: 'otherValue' } }),
	{ myProperty: { myOtherProperty: 'myValue' } }
) // { myProperty: { myOtherProperty: 'myValue', subProperty: 'otherValue' } }
```

Initial state will be merged before passing it into the before modifiers

```javascript
let initialState = null
S._run(
	new S(null).output(ident).until(() => true)
		.before((state) => {
			initialState = state
			return state
		}),
	{ myProperty: 'myValue' }
)
return initialState // { myProperty: 'myValue', [Stack]: [ { path: [  ], origin: Symbol(SSSM Return), point: 0 } ], [Trace]: [  ], [Changes]: { myProperty: 'myValue' }, [Return]: undefined }
```

Default to an empty change object

Uses the defaults as an initial state

```javascript
return S._run(
	new S(null).output(ident).until(() => true)
		.defaults({ myProperty: 'myValue' }),
	{ }
) // { myProperty: 'myValue' }
```

#### Uses the Stack from the initial state - allows for starting at arbitrary positions

```javascript
return S._run(
	new S(null).output(ident).until(() => true),
	{ [Stack]: [{path:['some','specific','path'],origin:Return,point:3}] }
) // { [Stack]: [ { path: [ 'some', 'specific', 'path' ], origin: Symbol(SSSM Return), point: 3 } ] }
```

Stack starts as root node path by default.

```javascript
return S._run(
	new S(null).output(ident).until(() => true),
	{ }
) // { [Stack]: [ { path: [  ], origin: Symbol(SSSM Return), point: 0 } ] }
```

Trace can be populated by passing it in

```javascript
return S._run(
	new S([null]).output(ident).until(() => true),
	{ [Trace]: [[{path:['some','specific','path'],origin:Return,point:3}]] }
) // { [Trace]: [ [ { path: [ 'some', 'specific', 'path' ], origin: Symbol(SSSM Return), point: 3 } ] ] }
```

Trace will be an empty list by default.

```javascript
return S._run(
	new S(null).output(ident).until(() => true),
	{ }
) // { [Trace]: [  ] }
```

#### Keep the return value if it already exists

```javascript
return S._run(new S(null).output(ident), { [Return]: 'myValue' }) // { [Return]: 'myValue' }
```

Do not define a return value by default

```javascript
return S._run(new S(null).output(ident), { }) // { [Return]: undefined }
```

Changes will be empty after initialisation

```javascript
return S._run(
	new S(null).output(ident).before(function (state) {
		return this.changes(state, { myOtherProperty: 'myOtherValue' })
	}),
	{ myProperty: 'myValue' }
) // { myProperty: 'myValue', myOtherProperty: 'myOtherValue', [Changes]: { myProperty: undefined, myOtherProperty: undefined } }
```

Changes can be populated by passing it in

```javascript
return S._run(
	new S(null).output(ident).before(function (state) {
		return this.changes(state, { myOtherProperty: 'myOtherValue' })
	}),
	{ myProperty: 'myValue', [Changes]: { myProperty: 'anything' } }
) // { myProperty: 'myValue', myOtherProperty: 'myOtherValue', [Changes]: { myProperty: 'anything', myOtherProperty: undefined } }
```

### Repeat for a limited number of iterations.

This should be fine for most finite machines, but may be too little for some constantly running machines.

#### Check the configured `until` condition to see if we should exit.

```javascript
let untilCalled = false
S._run(new S(
	() => ({ myProperty: 'myValue' })
).until(() => {
	untilCalled = true
	return true
}).output(ident), {
	[Stack]: [{path:[],origin:Return,point:0}],
})
return untilCalled // true
```

Do it first to catch starting with a `Return` in place.

```javascript
return S._run(new S(
	() => ({ myProperty: 'myValue' })
).output(ident), {
	[Stack]: [{path:[],origin:Return,point:0}],
	[Return]: 'myValue'
}) // { myProperty: undefined, [Stack]: [ { path: [  ], origin: Symbol(SSSM Return), point: 0 } ], [Return]: 'myValue' }
```

If the iterations are exceeded, Error

```javascript
return S._run(new S([
	() => ({ myProperty: 'myValue' })
]).for(1).trace.output(ident), {
	[Stack]: [{path:[],origin:Return,point:0}],
	[Trace]: [],
}) // MaxIterationsError
```

If stack trace is enabled, push the current path to the stack

```javascript
return S._run(new S(
	() => ({ myProperty: 'myValue' })
).until((_,runs)=>runs>=1).trace.output(ident), {
	[Stack]: [{path:[],origin:Return,point:0}],
	[Trace]: [],
}) // { [Trace]: [ [ { path: [  ], origin: Symbol(SSSM Return), point: 0 } ] ] }
```

Executes the current node on the process, returning the action to perform

```javascript
return S._run(new S(
	() => ({ myProperty: 'myValue' })
).until((_,runs)=>runs>=1).output(ident), {
	[Stack]: [{path:[],origin:Return,point:0}]
}) // { myProperty: 'myValue' }
```

Performs any required actions. Updating the currentState

```javascript
return S._run(new S([
	{ myProperty: 'myValue' }
]).until((_,runs)=>runs>=1).output(ident), {
	[Stack]: [{path:[0],origin:Return,point:1}]
}) // { myProperty: 'myValue' }
```

Proceeds to the next action

```javascript
return S._run(new S([
	null,
	null
]).until((_,runs)=>runs>=1).output(ident), {
	[Stack]: [{path:[0],origin:Return,point:1}]
}) // { [Stack]: [ { path: [ 1 ], origin: Symbol(SSSM Return), point: 1 } ] }
```

When returning, run the end state adapters, then the output adapter to complete execution.

```javascript
				let adaptOutputCalled = false
				let afterCalled = false
				let adaptOutputCalledAfterAfter = false

				new S(Return)
					.after((state) => {
						afterCalled = true
						return state
					})
					.output((state) => {
						adaptOutputCalled = true
						if (afterCalled)
							adaptOutputCalledAfterAfter = true
						return state
					})
					({
						myProperty: 'myValue'
					})

				return adaptOutputCalled && afterCalled && adaptOutputCalledAfterAfter // true
```

# Default Nodes

## Error Node

Throws the given error

The ErrorN symbol is exported as `{ ErrorN }`

```javascript
import { ErrorN } from './index.js'
	
return ErrorN; // success
```

This definition is exported by the library as `{ ErrorNode }`

```javascript
import { ErrorNode } from './index.js'
	
return ErrorNode; // success
```

Uses the ErrorN symbol as the type.

```javascript
return ErrorNode.type // Symbol(SSSM Error)
```

### Look for Error objects, or Error constructors.

Matches error objects

```javascript
return S.config.nodes.typeof(new Error('My Error')) // Symbol(SSSM Error)
```

Matches error constructors

```javascript
return S.config.nodes.typeof(Error) // Symbol(SSSM Error)
```

Matches descendent error objects

```javascript
return S.config.nodes.typeof(new TypeError('My Error')) // Symbol(SSSM Error)
```

Matches descendent error constructors

```javascript
return S.config.nodes.typeof(TypeError) // Symbol(SSSM Error)
```

### Perform an error by throwing it, no fancy magic.

Throw an error constructed by the function.

```javascript
return ErrorNode.perform(TestError, {}) // TestError
```

Throw an existing error instance.

```javascript
return ErrorNode.perform(new TestError(), {}) // TestError
```

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

The Changes symbol is exported as `{ Changes }`

```javascript
import { Changes } from './index.js'
	
return Changes; // success
```

This definition is exported by the library as `{ ChangesNode }`

```javascript
import { ChangesNode } from './index.js'
	
return ChangesNode; // success
```

Uses the Changes symbol as the type.

```javascript
return ChangesNode.type // Symbol(SSSM Changes)
```

Any object not caught by other conditions should qualify as a state change.

```javascript
return S.config.nodes.typeof({ someProperty: 'someValue' }) // Symbol(SSSM Changes)
```

Apply the changes to the state and step forward to the next node

```javascript
return ChangesNode.perform.call(new S(), { myProperty: 'changed' }, { [Changes]: {}, myProperty: 'myValue' }) // { myProperty: 'changed', [Changes]: { myProperty: 'changed' } }
```

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

The Sequence symbol is exported as `{ Sequence }`

```javascript
import { Sequence } from './index.js'
	
return Sequence; // success
```

This definition is exported by the library as `{ SequenceNode }`

```javascript
import { SequenceNode } from './index.js'
	
return SequenceNode; // success
```

Uses the Sequence symbol as the type.

```javascript
return SequenceNode.type // Symbol(SSSM Sequence)
```

### Proceed by running the next node in the sequence

Get the current index in this sequence from the path

#### If there are more nodes to execute

```javascript
return SequenceNode.proceed.call(new S([[null,null,null], null]), [null,null,null], { [Stack]: [{path:[0,1],origin:Return,point:1}]}) // { [Stack]: [ { path: [ 0, 2 ], origin: Symbol(SSSM Return), point: 2 } ] }
```

Execute the next node

Proceed as normal if the list is complete

```javascript
return SequenceNode.proceed.call(new S([[null,null,null], null]), [null,null,null], { [Stack]: [{path:[0,2],origin:Return,point:1}]}) // { [Stack]: [ { path: [ 1 ], origin: Symbol(SSSM Return), point: 1 } ] }
```

A sequence is an array.

```javascript
return S.config.nodes.typeof([ 1, 2, 3 ]) // Symbol(SSSM Sequence)
```

```javascript
return S.config.nodes.typeof([ 1, 2, 3 ], 'object', true) // Symbol(SSSM Absolute Goto)
```

Execute a sequence by directing to the first node (so long as it has nodes)

```javascript
return SequenceNode.execute([null,null,null], { [Stack]: [{path:['some',0,'complex','path'],origin:Return,point:4}]}) // [ 'some', 0, 'complex', 'path', 0 ]
```

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

A function can return a goto

```javascript
const instance = new S([
	{ result: 'first' },
	() => 4,
	{ result: 'skipped' },
	Return,
	{ result: 'second' },
]).output(({ result }) => result)
return instance({ result: 'start' }) // 'second'
```

A function can return a return statement

```javascript
const instance = new S(() => ({ [Return]: 'changed' }))
return instance() // 'changed'
```

A function can do anything without needing to return (set and forget)

```javascript
const instance = new S(() => {
	// Arbitrary code
}).output(({ result }) => result)
return instance({ result: 'start' }) // 'start'
```

The FunctionN symbol is exported as `{ FunctionN }`

```javascript
import { FunctionN } from './index.js'
	
return FunctionN; // success
```

This definition is exported by the library as `{ FunctionNode }`

```javascript
import { FunctionNode } from './index.js'
	
return FunctionNode; // success
```

Uses the FunctionN symbol as the type.

```javascript
return FunctionNode.type // Symbol(SSSM Function)
```

A function is a JS function. A function cannot be an action.

```javascript
return S.config.nodes.typeof(() => {}) // Symbol(SSSM Function)
```

Exectute a functon by running it, passing in the state.

```javascript
let methodRun = false
const result = FunctionNode.execute((...args) => {
	methodRun = true
	return args
}, { [Stack]: [{path:[],origin:Return,point:0}] })
return methodRun && result // [ { [Stack]: [ { path: [  ], origin: Symbol(SSSM Return), point: 0 } ] } ]
```

## Undefined Node

The Undefined symbol is exported as `{ Undefined }`

```javascript
import { Undefined } from './index.js'
	
return Undefined; // success
```

This definition is exported by the library as `{ UndefinedNode }`

```javascript
import { UndefinedNode } from './index.js'
	
return UndefinedNode; // success
```

Uses the Undefined symbol as the type.

```javascript
return UndefinedNode.type // Symbol(SSSM Undefined)
```

Undefined is the `undefined` keyword.

```javascript
return S.config.nodes.typeof(undefined) // Symbol(SSSM Undefined)
```

Un undefined node cannot be executed, throw an error to help catch incorrect configuration.

```javascript
const instance = new S([undefined])
return instance() // NodeReferenceError
```

When used as an action, undefined only moves to the next node.

```javascript
const instance = new S([
	() => undefined,
	{ [Return]: 'second' }
])
return instance() // 'second'
```

## Empty Node

The Empty symbol is exported as `{ Empty }`

```javascript
import { Empty } from './index.js'
	
return Empty; // success
```

This definition is exported by the library as `{ EmptyNode }`

```javascript
import { EmptyNode } from './index.js'
	
return EmptyNode; // success
```

Uses the Empty symbol as the type.

```javascript
return EmptyNode.type // Symbol(SSSM Empty)
```

Empty is the `null` keyword.

```javascript
return S.config.nodes.typeof(null) // Symbol(SSSM Empty)
```

Empty is a no-op, and will do nothing except move to the next node

```javascript
const instance = new S([null, { result: 'second' }, () => null])
	.output(({ result }) => result)
return instance({ result: 'start' }) // 'second'
```

## Condition Node

The Condition symbol is exported as `{ Condition }`

```javascript
import { Condition } from './index.js'
	
return Condition; // success
```

This definition is exported by the library as `{ ConditionNode }`

```javascript
import { ConditionNode } from './index.js'
	
return ConditionNode; // success
```

Uses the Condition symbol as the type.

```javascript
return ConditionNode.type // Symbol(SSSM Condition)
```

A condition is an object with the `'if'` property. A condition cannot be an action.

```javascript
return S.config.nodes.typeof({ if: false }) // Symbol(SSSM Condition)
```

Defines `'if', 'then', 'else'` keywords

```javascript
return ConditionNode.keywords // [ 'if', 'then', 'else' ]
```

### Execute a condition by evaluating the `'if'` property and directing to the `'then'` or `'else'` clauses

Evaluate the `'if'` property as a function that depends on the state.

```javascript
let switchMethodRun = false
ConditionNode.execute({ if: () => {
	switchMethodRun = true
	return 'someKey'
}, then: null }, { [Stack]: [{path:[],origin:Return,point:0}] })
return switchMethodRun // true
```

If truthy, direct to the `'then'` clause if it exists

```javascript
const instance = new S({
	if: ({ input }) => input === 'the same',
	then: { [Return]: 'truthy' },
	else: { [Return]: 'falsey' },
})
return instance({ input: 'the same' }) // 'truthy'
```

Otherwise, direct to the `'else'` clause if it exists

```javascript
const instance = new S({
	if: ({ input }) => input === 'the same',
	then: { [Return]: 'truthy' },
	else: { [Return]: 'falsey' },
})
return instance({ input: 'NOT the same' }) // 'falsey'
```

### Traverse a condition by iterating on the then and else clauses.

Copy over the original properties to preserve any custom symbols.

Iterate on the `'then'` clause if it exists

Iterate on the `'else'` clause if it exists

Iterate over any symbols specified

## Switch Node

```javascript
const instance = new S({
	switch: ({ input }) => input,
	case: {
		start: { [Return]: 'first' },
		two: { [Return]: 'second' },
		default: { [Return]: 'none' },
	}
})
const output1 = instance({ input: 'start' })
const output2 = instance({ input: 'two' })
const output3 = instance({ input: 'other' })
return { output1, output2, output3 } // { output1: 'first', output2: 'second', output3: 'none' }
```

The Switch symbol is exported as `{ Switch }`

```javascript
import { Switch } from './index.js'
	
return Switch; // success
```

This definition is exported by the library as `{ SwitchNode }`

```javascript
import { SwitchNode } from './index.js'
	
return SwitchNode; // success
```

Uses the Switch symbol as the type.

```javascript
return SwitchNode.type // Symbol(SSSM Switch)
```

A switch node is an object with the `'switch'` property.

```javascript
return S.config.nodes.typeof({ switch: false }) // Symbol(SSSM Switch)
```

Defines `'switch', 'case', 'default'` keywords.

```javascript
return SwitchNode.keywords // [ 'switch', 'case', 'default' ]
```

### Execute a switch by evaluating the `'switch'` property and directing to the approprtate `'case'` clause.

Evaluate the `'switch'` property as a function that returns a key.

```javascript
let switchMethodRun = false
SwitchNode.execute({ switch: () => {
	switchMethodRun = true
	return 'someKey'
}, case: { someKey: null } }, { [Stack]: [{path:[],origin:Return,point:0}] })
return switchMethodRun // true
```

If the key exists in the `'case'` caluses, use the key, otherwise use the `'default'` clause

```javascript
return SwitchNode.execute({ switch: 'extant', case: { extant: null } }, { [Stack]: [{path:[],origin:Return,point:0}] }) // [ 'case', 'extant' ]
```

```javascript
return SwitchNode.execute({ switch: 'non extant', case: { default: null } }, { [Stack]: [{path:[],origin:Return,point:0}] }) // [ 'case', 'default' ]
```

Check again if the key exists (`'default'` clause may not be defined), if it does, redirect to the case, otherwise do nothing.

```javascript
return SwitchNode.execute({ switch: 'non extant', case: {} }, { [Stack]: [{path:[],origin:Return,point:0}] }) // null
```

Traverse a switch by iterating over the `'case'` clauses

## While Node

Repeatedly executes the 'do' clause, so long as the 'while' condition is true

The While symbol is exported as `{ While }`

```javascript
import { While } from './index.js'
	
return While; // success
```

This definition is exported by the library as `{ WhileNode }`

```javascript
import { WhileNode } from './index.js'
	
return WhileNode; // success
```

Uses the While symbol as the type.

```javascript
return WhileNode.type // Symbol(SSSM While)
```

A while node is an object with the `'while'` property.

```javascript
return S.config.nodes.typeof({ while: false }) // Symbol(SSSM While)
```

Defines `'while`, 'do'` keywords

```javascript
return WhileNode.keywords // [ 'while', 'do' ]
```

### Execute a while by evaluating the `'while'` property and directing to the `'do'` clause if `true`.

#### Evaluate the `'while'` property as a function that returns a boolean.

```javascript
return WhileNode.execute({ while: false, do: null }, { [Stack]: [{path:[0,0],origin:Return,point:2}] }) // null
```

If the condition is false, exit the while loop.

If `true`, execute the `'do'` clause

```javascript
return WhileNode.execute({ while: true, do: null }, { [Stack]: [{path:[0,0],origin:Return,point:2}] }) // [ 0, 0, 'do' ]
```

Proceed by re-entering the while loop.

```javascript
return WhileNode.proceed(undefined, { [Stack]: [{path:['some',0,'complex',0,'path'],origin:Return,point:2}] }) // { [Stack]: [ { path: [ 'some', 0 ], origin: Symbol(SSSM Return), point: 2 } ] }
```

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

The Machine symbol is exported as `{ Machine }`

```javascript
import { Machine } from './index.js'
	
return Machine; // success
```

This definition is exported by the library as `{ MachineNode }`

```javascript
import { MachineNode } from './index.js'
	
return MachineNode; // success
```

Uses the Machine symbol as the type.

```javascript
return MachineNode.type // Symbol(SSSM Machine)
```

A machine is an object with the `'initial'` property. A machine cannot be used as an action.

```javascript
return S.config.nodes.typeof({ initial: null }) // Symbol(SSSM Machine)
```

Defines `'initial'` keyword.

```javascript
return MachineNode.keywords // [ 'initial' ]
```

Execute a machine by directing to the `'initial'` stages.

```javascript
return MachineNode.execute(undefined, { [Stack]: [{path:['a','b','c'],oirign:Return,point:3}]}) // [ 'a', 'b', 'c', 'initial' ]
```

Traverse a machine by iterating over all the stages

## Goto Node

Transitioning is also possible by using and object with the `Goto` key set to a relative or absolute path. This is not recommended as it is almost never required, it should be considered system-only.

```javascript
const instance = new S({
	initial: [
		{ result: 'first' },
		{ [Goto]: 'next' }
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
		{ [Goto]: 'next', result: 'ignored' }
	],
	next: Return
}).output(({ result }) => result)
return instance({ result: 'start' }) // 'first'
```

The Goto symbol is exported as `{ Goto }`

```javascript
import { Goto } from './index.js'
	
return Goto; // success
```

This definition is exported by the library as `{ GotoNode }`

```javascript
import { GotoNode } from './index.js'
	
return GotoNode; // success
```

Uses the Goto symbol as the type.

```javascript
return GotoNode.type // Symbol(SSSM Goto)
```

A goto is an object with the `Goto` property.

```javascript
return S.config.nodes.typeof({ [Goto]: 'stage' }) // Symbol(SSSM Goto)
```

A goto is performed by performing the value of the `Goto` property to allow for using absolute or relative gotos

```javascript
let performCalled = false
const MyNodeType = Symbol("My Node")
class MyNode extends Node {
	static type = MyNodeType
	static typeof(object) { return object === MyNodeType }
	static perform(action, state) {
		performCalled = true
		return { ...state, someChange: 'someValue' }
	}
}
const result = GotoNode.perform.call(new S().addNode(MyNode), { [Goto]: MyNodeType }, {})
return performCalled && result // { someChange: 'someValue' }
```

A goto does not require proceeding, simply return the current state unmodified

```javascript
const stateObj = { myProperty: 'myValue' }
return GotoNode.proceed(undefined, stateObj) === stateObj // true
```

## Sequence Goto Node

Numbers indicate a goto for a sequence. It is not recommended to use this as it may be unclear, but it must be possible, and should be considered system-only.

```javascript
const instance = new S([
	2,
	{ [Return]: 'skipped' },
	{ [Return]: 'second' },
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
	{ [Return]: 'skipped' },
	{ [Return]: 'second' },
])
return instance({ input: 'skip' }) // 'second'
```

The SequenceGoto symbol is exported as `{ SequenceGoto }`

```javascript
import { SequenceGoto } from './index.js'
	
return SequenceGoto; // success
```

This definition is exported by the library as `{ SequenceGotoNode }`

```javascript
import { SequenceGotoNode } from './index.js'
	
return SequenceGotoNode; // success
```

Uses the SequenceGoto symbol as the type.

```javascript
return SequenceGotoNode.type // Symbol(SSSM Sequence Goto)
```

A sequence goto is a number.

```javascript
return S.config.nodes.typeof(8) // Symbol(SSSM Sequence Goto)
```

### A sequence goto is performed by finding the last sequence and setting the index to the given value.

Get the closest ancestor that is a sequence.

```javascript
return SequenceGotoNode.perform.call(new S([[null,{initial:null}]]), 2, { [Stack]: [{path:[0,1,'initial'],origin:Return,point:3}] }) // { [Stack]: [ { path: [ 0, 2 ], origin: Symbol(SSSM Return), point: 2 } ] }
```

If there is no such ancestor, throw a `PathReferenceError`

```javascript
return SequenceGotoNode.perform.call(new S({initial:{initial:{initial:null}}}), 'myStage', { [Stack]: [{path:['initial','initial','initial'],origin:Return,point:3}] }) // PathReferenceError
```

Update the path to the parent > index

```javascript
return SequenceGotoNode.perform.call(new S([[null,null]]), 2, { [Stack]: [{path:[0,0],origin:Return,point:2}] }) // { [Stack]: [ { path: [ 0, 2 ], origin: Symbol(SSSM Return), point: 2 } ] }
```

## Machine Goto Node

Gotos are the natural way of proceeding in state machines, using the name of a neighboring state as a string you can direct flow through a state machine.

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

The MachineGoto symbol is exported as `{ MachineGoto }`

```javascript
import { MachineGoto } from './index.js'
	
return MachineGoto; // success
```

This definition is exported by the library as `{ MachineGotoNode }`

```javascript
import { MachineGotoNode } from './index.js'
	
return MachineGotoNode; // success
```

Uses the MachineGoto symbol as the type.

```javascript
return MachineGotoNode.type // Symbol(SSSM Machine Goto)
```

A machine goto is a string.

```javascript
return S.config.nodes.typeof('stage') // Symbol(SSSM Machine Goto)
```

### A machine goto is performed by directing to the given stage.

Get the closest ancestor that is a machine.

```javascript
return MachineGotoNode.perform.call(new S({initial:[{ initial: [null] }]}), 'myStage', { [Stack]: [{path:['initial',0,'initial',0],origin:Return,point:4}] }) // { [Stack]: [ { path: [ 'initial', 0, 'myStage' ], origin: Symbol(SSSM Return), point: 3 } ] }
```

If no machine ancestor is found, throw a `PathReferenceError`

```javascript
return MachineGotoNode.perform.call(new S([null]), 'myStage', { [Stack]: [{path:[0],origin:Return,point:1}] }) // PathReferenceError
```

Update the path to parent > stage

```javascript
return MachineGotoNode.perform.call(new S([[{ initial: null }]]), 'myStage', { [Stack]: [{path:[0,0,'initial'],origin:Return,point:3}] }) // { [Stack]: [ { path: [ 0, 0, 'myStage' ], origin: Symbol(SSSM Return), point: 3 } ] }
```

## Interrupt Goto Node

Interrupts are like gotos, except they will return to the previous execution path once complete.

Interrupts a way of performing other paths, then returning to the current path, using the symbol of a neghboring interrupt you can direct flow through a state machine.

```javascript
const interrupt = Symbol('interrupt')
const instance = new S({
	initial: [
		{ result: 'first' },
		interrupt
	],
	[interrupt]: { result: 'second' }
}).output(({ result }) => result)
return instance({ result: 'start' }) // 'second'
```

The InterruptGoto symbol is exported as `{ InterruptGoto }`

```javascript
import { InterruptGoto } from './index.js'
	
return InterruptGoto; // success
```

This definition is exported by the library as `{ InterruptGotoNode }`

```javascript
import { InterruptGotoNode } from './index.js'
	
return InterruptGotoNode; // success
```

Uses the InterruptGoto symbol as the type.

```javascript
return InterruptGotoNode.type // Symbol(SSSM Interrupt Goto)
```

An interrupt goto is a symbol.

```javascript
return S.config.nodes.typeof(testSymbol) // Symbol(SSSM Interrupt Goto)
```

### An interrupt goto is performed by directing to the given interrupt.

Get the closest ancestor that contains this interrupt symbol.

```javascript
return InterruptGotoNode.perform.call(new S({ [testSymbol]: null, initial:{ [testSymbol]: null,initial: { initial: null } } }), testSymbol, { [Stack]: [{path:['initial','initial','initial'],origin:Return,point:3}] }) // { [Stack]: [ { path: [ 'initial', Symbol(test symbol) ], origin: Symbol(test symbol), point: 2 }, { path: [ 'initial', 'initial', 'initial' ], origin: Symbol(SSSM Return), point: 3 } ] }
```

If no suitable ancestor is found, return the interrupt symbol itself.

```javascript
return InterruptGotoNode.perform.call(new S([[{ initial: null }]]), testSymbol, { [Stack]: [{path:[0,0,'initial'],origin:Return,point:3}] }) // { [Stack]: [ { path: [ 0, 0, 'initial' ], origin: Symbol(SSSM Return), point: 3 } ], [Return]: Symbol(test symbol) }
```

Update the path to parent > interrupt

```javascript
return InterruptGotoNode.perform.call(new S([[{ [testSymbol]: null, initial: null }]]), testSymbol, { [Stack]: [{path:[0,0,'initial'],origin:Return,point:3}] }) // { [Stack]: [ { path: [ 0, 0, Symbol(test symbol) ], origin: Symbol(test symbol), point: 3 }, { path: [ 0, 0, 'initial' ], origin: Symbol(SSSM Return), point: 3 } ] }
```

### An interrupt goto proceeds the path previous to it, but preserves the interrupts place at the top of the stack.

Proceed the stack before this point, and strip out the affected system properties.

```javascript
return InterruptGotoNode.proceed.call(new S([ null, null ]), testSymbol, { [Stack]: [{path:['first','item'],origin:testSymbol,point:2},{path:[0],origin:Return,point:1}] }) // { [Stack]: [ { path: [ 'first', 'item' ], origin: Symbol(test symbol), point: 2 }, { path: [ 1 ], origin: Symbol(SSSM Return), point: 1 } ] }
```

Add the current interrupt back in to the resulting stack.

```javascript
return InterruptGotoNode.proceed.call(new S(), testSymbol, { [Stack]: [{path:['first','item'],origin:testSymbol,point:2},{path:[],origin:Return,point:0}] }) // { [Stack]: [ { path: [ 'first', 'item' ], origin: Symbol(test symbol), point: 2 } ] }
```

## Absolute Goto Node

Arrays can be used to perform absolute redirects. This is not recommended as it may make your transition logic unclear.

Arrays cannot be used on their own, because they would be interpreted as sequences. For this reason they must be contained in an object with the `Goto` symbol as a key, with the array as the value, or returned by an action.

Using an absolute goto in a goto object works

```javascript
const instance = new S({
	initial: [
		{ result: 'first' },
		{ [Goto]: ['next',1] }
	],
	next: [
		{ result: 'skipped' },
		({ result }) => ({ [Return]: result }),
	]
})
return instance({ result: 'start' }) // 'first'
```

Using an absolute goto as a return value works

```javascript
const instance = new S({
	initial: [
		{ result: 'first' },
		() => ['next',1]
	],
	next: [
		{ result: 'skipped' },
		({ result }) => ({ [Return]: result }),
	]
})
return instance({ result: 'start' }) // 'first'
```

Using an absolute goto as an action does NOT work.

```javascript
const instance = new S({
	initial: [
		{ result: 'first' },
		['next',1]
	],
	next: [
		{ result: 'not skipped' },
		({ result }) => ({ [Return]: result }),
	]
})
return instance({ result: 'start' }) // 'not skipped'
```

The AbsoluteGoto symbol is exported as `{ AbsoluteGoto }`

```javascript
import { AbsoluteGoto } from './index.js'
	
return AbsoluteGoto; // success
```

This definition is exported by the library as `{ AbsoluteGotoNode }`

```javascript
import { AbsoluteGotoNode } from './index.js'
	
return AbsoluteGotoNode; // success
```

Uses the AbsoluteGoto symbol as the type.

```javascript
return AbsoluteGotoNode.type // Symbol(SSSM Absolute Goto)
```

An absolute goto is a list of strings, symbols, and numbers. It can only be used as an action as it would otherwise be interpreted as a sequence.

```javascript
const path = [1,'stage',testSymbol]
return S.config.nodes.typeof(path, typeof path, true) // Symbol(SSSM Absolute Goto)
```

An absolute goto is performed by setting `Stack` to the path

```javascript
return AbsoluteGotoNode.perform(['a','b','c'], { [Stack]: [{path:[],origin:Return,point:0}] }) // { [Stack]: [ { path: [ 'a', 'b', 'c' ], origin: Symbol(SSSM Return), point: 3 } ] }
```

## Return Node

Causes the entire process to terminate immediately and return, setting `Return` to `true` on the state.

If the symbol is used with a `.output` configuration, then it will return according to the given method.

```javascript
const instance = new S(Return)
	.output(({ result }) => result)
return instance({ result: 'start' }) // 'start'
```

If the symbol is used on its own, then it will simply return `undefined`.

```javascript
const instance = new S(Return)
return instance({ result: 'start' }) // undefined
```

Using the return symbol as the key to an object will set the return property to that value before returning.

```javascript
const instance = new S({ [Return]: 'custom' })
return instance() // 'custom'
```

```javascript
const instance = new S({ [Return]: 'custom' })
return instance.output(state => state)({ result: 'start' }) // { result: 'start', [Return]: 'custom' }
```

The Return symbol is exported as `{ Return }`

```javascript
import { Return } from './index.js'
	
return Return; // success
```

This definition is exported by the library as `{ ReturnNode }`

```javascript
import { ReturnNode } from './index.js'
	
return ReturnNode; // success
```

Uses the Return symbol as the type.

```javascript
return ReturnNode.type // Symbol(SSSM Return)
```

A return node is the `Return` symbol itself, or an object with an `Return` property.

```javascript
return S.config.nodes.typeof(Return) // Symbol(SSSM Return)
```

```javascript
return S.config.nodes.typeof({ [Return]: 'value' }) // Symbol(SSSM Return)
```

Perform a return by setting the `Return` property on the state to the return value

```javascript
return ReturnNode.perform({ [Return]: 'myValue' }, {}) // { [Return]: 'myValue' }
```

Inherit from root node definition, not GotoNode.

```javascript
return ReturnNode.proceed // proceed (node, state) {
	const stack = state[Stack] || [{path:[],origin:Return,point:0}]
	if (stack[0].point === 0) {
		if (stack.length === 1) return { ...state, [Return]: state[Return], [Stack]: [] }
		const { [Return]: interruptReturn, ...cleanState } = state
		return { ...cleanState, [Stack]: stack.slice(1), [stack[0].origin]: interruptReturn }
	}
	return S._proceed(this, { ...state, [Stack]: [{ ...stack[0], point: stack[0].point-1 }, ...stack.slice(1)] }, get_path_object(this.process, stack[0].path.slice(0,stack[0].point-1)))
}
```

## Continue Node

Exit this pass of a While loop and evaluate the condition again.

The Continue symbol is exported as `{ Continue }`

```javascript
import { Continue } from './index.js'
	
return Continue; // success
```

This definition is exported by the library as `{ ContinueNode }`

```javascript
import { ContinueNode } from './index.js'
	
return ContinueNode; // success
```

Uses the Continue symbol as the type.

```javascript
return ContinueNode.type // Symbol(SSSM Continue)
```

Looks for the Continue symbol specifically.

```javascript
return S.config.nodes.typeof(Continue) // Symbol(SSSM Continue)
```

### A Continue is performed by finding the closest While loop and re-entering.

Find the closest While loop.

```javascript
return ContinueNode.perform.call(new S([{ while: true, do: {while:true,do:null} }, null]), Continue, { [Stack]: [{path:[0,'do','do'],origin:Return,point:3}] }) // { [Stack]: [ { path: [ 0, 'do' ], origin: Symbol(SSSM Return), point: 2 } ] }
```

If there is none, throw a `PathReferenceError`.

```javascript
return ContinueNode.perform.call(new S(null), Continue, { [Stack]: [{path:[],origin:Return,point:0}] }) // PathReferenceError
```

Modify the stack to point to the closest While loop.

```javascript
return ContinueNode.perform.call(new S([{ while: true, do: [null] }, null]), Continue, { [Stack]: [{path:[0,'do',0],origin:Return,point:3}] }) // { [Stack]: [ { path: [ 0 ], origin: Symbol(SSSM Return), point: 1 } ] }
```

## Break Node

Break out of a while loop, and proceed as if the condition has failed.

The Break symbol is exported as `{ Break }`

```javascript
import { Break } from './index.js'
	
return Break; // success
```

This definition is exported by the library as `{ BreakNode }`

```javascript
import { BreakNode } from './index.js'
	
return BreakNode; // success
```

Uses the Break symbol as the type.

```javascript
return BreakNode.type // Symbol(SSSM Break)
```

Looks for the Break symbol specifically.

```javascript
return S.config.nodes.typeof(Break) // Symbol(SSSM Break)
```

### A Break is performed by finding the closest While loop and proceeding from there.

Find the closest While loop.

```javascript
return BreakNode.proceed.call(new S([{ while: true, do: {while:true,do:null} }, null]), Break, { [Stack]: [{path:[0,'do','do'],origin:Return,point:3}] }) // { [Stack]: [ { path: [ 0 ], origin: Symbol(SSSM Return), point: 1 } ] }
```

If there is none, throw a `PathReferenceError`.

```javascript
return BreakNode.proceed.call(new S(null), Break, { [Stack]: [{path:[],origin:Return,point:0}] }) // PathReferenceError
```

Proceed on the While loop as if it is exiting.

```javascript
return BreakNode.proceed.call(new S([{ while: true, do: [null] }, null]), Break, { [Stack]: [{path:[0,'do',0],origin:Return,point:3}] }) // { [Stack]: [ { path: [ 1 ], origin: Symbol(SSSM Return), point: 1 } ] }
```

Perform by doing nothing, do not inherit from `GotoNode`.

```javascript
const stateObj = { myProperty: 'myValue' }
return BreakNode.perform(Break, stateObj) === stateObj // true
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

Passing a state, instance, and/or data will make those properties available in the error

```javascript
return new SuperSmallStateMachineError('', {
	instance: 'something',
	state: 'my state',
	data: 'special data'
}) // { instance: 'something', state: 'my state', data: 'special data' }
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

