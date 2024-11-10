 Super Small State Machine

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

# Library Methods

## clone_object (obj)

Deep clones objects.

```javascript
const obj = {a:{b:3},c:5}
const clone = clone_object(obj)
return clone !== obj
	&& JSON.stringify(clone) === JSON.stringify(obj)
	&& clone.a !== obj.a
	&& clone.c === obj.c // true
```

This method is exported by the library as `{ clone_object }`

```javascript
import { clone_object } from './index.js'
	
return clone_object; // success
```

Can clone arrays

```javascript
const obj = [{a:{b:3},c:5},2,3,{d:6}]
const clone = clone_object(obj)
return clone !== obj
	&& clone[0] !== obj[0]
	&& clone[1] === obj[1]
	&& clone[3] !== obj[3]
	&& JSON.stringify(clone) === JSON.stringify(obj) // true
```

Returns null if given null

```javascript
return clone_object(null) // null
```

Returns input if not object

```javascript
return clone_object('hello') // 'hello'
```

Deep clones properties of an object

```javascript
const obj = {a:{b:3}}
const clone = clone_object(obj)
return clone !== obj
	&& JSON.stringify(clone) === JSON.stringify(obj)
	&& clone.a !== obj.a
	&& clone.a.b === obj.a.b // true
```

## unique_list_strings (list, getId)

Takes a list of strings and returns a list containing the unique strings only

```javascript
return unique_list_strings(['a','a','b','c','d','c','a','b']) // [ 'a', 'b', 'c', 'd' ]
```

### Takes a transformer function that can extract a string identifier from objects

```javascript
const objA = {
	id: 'a',
	val: 1,
}
const objB = {
	id: 'b',
	val: 2,
}
return unique_list_strings([ objA, objA, objB, objA, objB, objB ],
	obj => obj.id
) // [ { id: 'a', val: 1 }, { id: 'b', val: 2 } ]
```

Always preserves objects without copyng them

```javascript
const objA = {
	id: 'a',
	val: 1,
}
const objB = {
	id: 'b',
	val: 2,
}
const result = unique_list_strings([ objA, objA, objB, objA, objB, objB ],
	obj => obj.id
)
return result[0] === objA && result[1] === objB // true
```

This method is exported by the library as `{ unique_list_strings }`

```javascript
import { unique_list_strings } from './index.js'
	
return unique_list_strings; // success
```

## reduce_get_path_object (obj, step)

Returns the value at a specific key `step` of the given object `obj`

This method is not exported by the library.

```javascript
import { reduce_get_path_object } from './index.js'
	
return reduce_get_path_object; // nope
```

## get_path_object (object, path)

Return the value at the given `path` in the given `object`

```javascript
const obj = [
	{
		key: {
			another: { target: 'node' }
		}
	},
	{
		different: { path: 0 }
	}
]
const path = [0,'key','another']
return get_path_object(obj, path) // { target: 'node' }
```

This method is exported by the library as `{ get_path_object }`

```javascript
import { get_path_object } from './index.js'
	
return get_path_object; // success
```

## normalise_function (functOrReturn)

Wrap a value in a function, unless it's already one.

If the value is a function, return it as-is

```javascript
const method = () => {}
const result = normalise_function(method)
return result === method // true
```

If the value is not a function, return a function that returns that value when called

```javascript
const method = 'value'
const result = normalise_function(method)
return result() // 'value'
```

This method is exported by the library as `{ normalise_function }`

```javascript
import { normalise_function } from './index.js'
	
return normalise_function; // success
```

## reduce_deep_merge_object (base, override)

Merge the given `override` object into the given `base` object.

This method is not exported by the library

```javascript
import { reduce_deep_merge_object } from './index.js'
	
return reduce_deep_merge_object; // nope
```

### If both objects are not pure objects

Return the override value

Get all combined unique keys

### Make a new object with the combined keys

Merge each value recursively if the key exists in both objects

## deep_merge_object (base, ...overrides)

Merge each of the given `overrides` into the given `base` object, in the order they are given.

Deep merges two objects, using the second as the override

```javascript
return deep_merge_object({
	key1: 'value1',
	key2: {
		key3: 'value3',
		key4: 'value4',
	}
}, {
	key1: 'value2',
	key2: {
		key3: 'value5'
	}
}) // { key1: 'value2', key2: { key3: 'value5', key4: 'value4' } }
```

Does not merge arrays

```javascript
return deep_merge_object({
	array: [{ deep: 'object' }, 2, 3, 4 ]
}, {
	array: [{ new: 'value' }, 5, 6 ]
}) // { array: [ { new: 'value', deep: undefined }, 5, 6 ] }
```

If the values have different types, the override is always used without deep merging.

```javascript
return deep_merge_object({
	original: 'string',
	another: {
		deep: 'object'
	}
}, {
	original: { new: 'object' },
	another: 'changed'
}) // { original: { new: 'object' }, another: 'changed' }
```

Does not preserve symbols

```javascript
const mySymbol = Symbol('My Symbol')
return deep_merge_object({
	[mySymbol]: 'value'
}, { }) // {  }
```

Preserves original key order

```javascript
return Object.keys(deep_merge_object({
	first: 1,
	second: 2,
	third: 3
}, {
	second: 4,
	first: 5,
})) // [ 'first', 'second', 'third' ]
```

Merges multiple objects into the base object

```javascript
return deep_merge_object({
	first: 1,
}, {
	second: 2,
}, {
	first: 5,
	third: 3,
}, {
	first: 6,
	second: 7,
	fourth: 4,
}) // { first: 6, second: 7, third: 3, fourth: 4 }
```

This method is exported by the library as `{ deep_merge_object }`

```javascript
import { deep_merge_object } from './index.js'
	
return deep_merge_object; // success
```

## get_closest_path (object, path = [], condition = (node, path, object) => boolean)

Returns the path of the closest node that matches the given `conditon`. It will check all ancestors including the node at the given `path`.

This method is exported by the library as `{ get_closest_path }`

```javascript
import { get_closest_path } from './index.js'
	
return get_closest_path; // success
```

Get the object at the given path

Check the item against the condition

If the root node is reached, return `null` (unsuccessful)

Ascend up the tree

## wait_time (delay)

Returns a promise that waits for the given `delay` time before resolving.

If zero is passed, it resolves as immediately as possible.

```javascript
const startTime = Date.now()
await wait_time(0)
const endTime = Date.now()
return endTime - startTime // 0
```

It may not be possible to accurately set times less than four ms.

```javascript
const startTime = Date.now()
await wait_time(2)
await wait_time(2)
const endTime = Date.now()
return endTime - startTime // not 4
```

This method is exported by the library as `{ wait_time }`

```javascript
import { wait_time } from './index.js'
	
return wait_time; // success
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

# Node Types

The string names of node types, index by two-letter abbreviations

This reference table is exported by the library as `{ NodeTypes }`

```javascript
import { NodeTypes } from './index.js'
	
return NodeTypes; // success
```

Undefined Node

Empty Node

Return Node

Function Node

Sequence Node

Condition Node

Switch Node

Machine Node

Changes Node

Directive Node

Absolute Directive Node

Machine Directive Node

Sequence Directive Node

# Key Words

Key Words used by specific nodes

This reference table is exported by the library as `{ KeyWords }`

```javascript
import { KeyWords } from './index.js'
	
return KeyWords; // success
```

`'if'` used by Condition Node

`'then'` used by Condition Node

`'else'` used by Condition Node

`'switch'` used by Switch Node

`'case'` used by Switch Node

`'default'` used by Switch Node

`'initial'` used by Machine Node

## `'result'` used by Changes Node

is the default property on the state.

Should be used for pasing in arguments to actions, and returning a value from the machine itself.

# Node Definitions

Extends the Map class.

This class is exported by the library as `{ NodeDefinitions }`

```javascript
import { NodeDefinitions } from './index.js'
	
return NodeDefinitions; // success
```

Takes in a list of nodes and acts as a collection-object for them

## Provides a typeof method that checks the given `object` against the node definitions and returns the name of the node.

### Search from last to first to allow easy overriding

Newer types override older types

Return the name of the type if the type is found, otherwise return false

# Node Definition

This class is exported by the library as `{ NodeDefinition }`

```javascript
import { NodeDefinition } from './index.js'
	
return NodeDefinition; // success
```

The name will deafault to "Unnamed node", but will be a unique symbol each time

The typeof method will be null by default.

The execute method will be null by default.

The proceed method will be null by default.

The perform method will be null by default.

The traverse method will be null by default.

## Typescript requires us to do this through a constructor for some reason. This should probably be fixed.

Assigns the given properties to the new instance

# exitFindNext (action, state)

TODO: merge into S._proceed? or S._perform?

Attempts to proceed to the next path

If it fails, we should return

Extra types

# Default Nodes

## Changes Node

Updates the state by deep-merging the properties. Arrays will not be deep merged.

Overrides existing properties when provided

```javascript
const instance = new S({ result: 'overridden' })
return instance({ result: 'start' }) // 'overridden'
```

Adds new properties while preserving existing properties

```javascript
const instance = new S({ result: { newValue: true } })
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
])
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
])
return instance({ result: 'start' }) // 'second'
```

A function can return a return statement

```javascript
const instance = new S(() => ({ [S.Return]: 'changed' }))
return instance({ result: 'start' }) // 'changed'
```

A function can do anything without needing to return (set and forget)

```javascript
const instance = new S(() => {
	// Arbitrary code
})
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
const instance = new S([() => undefined, { result: 'second' }])
return instance({ result: 'start' }) // 'second'
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
	if: ({ result }) => result === 'start',
	then: { result: 'truthy' },
	else: { result: 'falsey' },
})
return instance({ result: 'start' }) // 'truthy'
```

Otherwise, direct to the `'else'` clause if it exists

```javascript
const instance = new S({
	if: ({ result }) => result === 'start',
	then: { result: 'truthy' },
	else: { result: 'falsey' },
})
return instance({ result: 'other' }) // 'falsey'
```

### Traverse a condition by iterating on the then and else clauses.

Run `post` on the result to allow the interception of the condition method.

Copy over the original properties to preserve any custom symbols.

Copy over the `'if'` property

Iterate on the `'then'` clause if it exists

Iterate on the `'else'` clause if it exists

## Switch Node

```javascript
const instance = new S({
	switch: ({ result }) => result,
	case: {
		start: { result: 'first' },
		two: { result: 'second' },
		default: { result: 'none' },
	}
})
const result1 = instance({ result: 'start' })
const result2 = instance({ result: 'two' })
const result3 = instance({ result: 'other' })
return { result1, result2, result3 } // { result1: 'first', result2: 'second', result3: 'none' }
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

Copy over the `'switch'` property

Iterate over each of the `'case'` clauses.

## Machine Node

```javascript
const instance = new S({
	initial: [
		() => ({ result: 'first' }),
		'next',
	],
	next: { result: 'second' }
})
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
})
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
})
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
	{ result: 'first' },
	4,
	{ result: 'skip' },
	S.Return,
	{ result: 'second' },
])
return instance({ result: 'start' }) // 'second'
```

Slightly less not recommended is transitioning in a sequence conditonally. If you're making an incredibly basic state machine this is acceptable.

```javascript
const instance = new S([
	{
		if: ({ result }) => result === 'start',
		then: 3,
		else: 1,
	},
	{ result: 'skip' },
	S.Return,
	{ result: 'second' },
])
return instance({ result: 'start' }) // 'second'
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
})
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
})
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
		S.Return,
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
		S.Return,
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
		S.Return,
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

If the symbol is used on its own, the it will simply return whatever value is in the "result".

It is reccomended you use the result variable for this purpose.

```javascript
const instance = new S(S.Return)
return instance({ result: 'start' }) // 'start'
```

Using the return symbol as the key to an object will override the result variable with that value before returning.

```javascript
const instance = new S({ [S.Return]: 'custom' })
return instance({ result: 'start' }) // 'custom'
```

```javascript
const instance = new S({ [S.Return]: 'custom' })
return instance.result(state => state)({ result: 'start' }) // { result: 'custom' }
```

This definition is exported by the library as `{ ReturnNode }`

```javascript
import { ReturnNode } from './index.js'
	
return ReturnNode; // success
```

Use the `NodeTypes.RT` (return) value as the name.

A return node is the `S.Return` symbol itself, or an object with an `S.Return` property.

### Perform a return by setting the result to the return value and setting the `S.Return` flag on the state to `true`

Copy the original properties from the state

Set `S.Return` to true

Copy over the original path to preserve it.

Update the result if one was passed in as the return value.

## Export all the defaults nodes together in one list.

This list is exported by the library as `{ nodes }`

```javascript
import { nodes } from './index.js'
	
return nodes; // success
```

Extensible Function

# Core

Every instance must have a process and be callable.

## Symbols

### Return

Use for intentionally exiting the entire process, can be used in an object to override the result value before returning

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

Initialise the result property as `null` by default

Input the initial state by default

Return the result property by default

Do not perform strict state checking by default

Allow 1000 iterations by default

Run util the return symbol is present by default.

### Do not allow for asynchronous actions by default

Special settings for async

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

Call the primary method and return the result

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

When returning, run the ends state adapters, then the result adapter to complete execution.

## S._runAsync (instance, ...input)

Execute the entire process asynchronously. Always returns a promise.

Extract the useful parts of the config

Turn the arguments into an initial condition

If a delay is configured, wait before starting execution

### Merge the initial condition with the default initial state

Default to an empty change object

Use the defaults as an initial state

Use the path from the initial state - allows for starting at arbitrary positions

### Repeat for a limited number of iterations.

This should be fine for most finite machines, but may be too little for some constantly running machines.

Check the configured `until` condition to see if we should exit.

#### If the interaction are exceeded, Error

Throw new MaxIterationsError

Execute the current node on the process and perform any required actions. Updating the currentState

#### Check if the allowed execution time is exceeded every 10 steps

Get the current time

##### If the allowed time is exceeded

Wait for the configured `wait` time

Reset the start time of execution

When returning, run the ends state adapters, then the result adapter to complete execution.

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
const instance = new S({ result: 'old' })
const newInstance = instance.with(S.do({ result: 'new' }))
return newInstance() // 'new'
```

## S.defaults(defaults) <default: { result: null }>

Defines the initial state to be used for all executions.

Returns a function that will modify a given instance.

```javascript
const instance = new S()
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

## S.result(result) <default: (state => state.result)>

Allows the modification of the value the executable will return.

Returns a function that will modify a given instance.

```javascript
const instance = new S(({ myReturnValue }) => ({ myReturnValue: myReturnValue + ' extra' }))
	.with(S.result(state => state.myReturnValue))
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
	.with(S.until(({ result }) => result === 'exit'))
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
const instance = new S(async () => ({ result: 'changed' }))
.with(
	S.async,
	S.sync,
	S.defaults({ result: 'initial' })
)
return instance() // 'initial'
```

## S.async

Execute asynchronously and allow for asynchronous actions.

Will modify the given instance.

```javascript
const instance = new S(async () => ({ result: 'changed' }))
.with(S.defaults({ result: 'initial' }))
return instance() // 'initial'
```

```javascript
const instance = new S(async () => ({ result: 'changed' }))
.with(
	S.defaults({ result: 'initial' }),
	S.async
)
return await instance() // 'changed'
```

## S.delay(delay = 0) <default: 0>

Defines an initial delay before starting to execute the process.

Returns a function that will modify a given instance.

## S.allow(allow = 1000) <default: 1000>

Defines the amount of time the process is allowed to run for before pausing.

Returns a function that will modify a given instance.

## S.wait(wait = 0) <default: 0>

Defines the amount of time the process will pause for when the allowed time is exceeded.

Returns a function that will modify a given instance.

## S.override(override) <default: instance.run>

Overrides the method that will be used when the executable is called.

Returns a function that will modify a given instance.

```javascript
const instance = new S({ result: 'definedResult' })
	.with(S.override(function (...args) {
		// console.log({ scope: this, args }) // { scope: { process: { result: 'definedResult' } }, args: [1, 2, 3] }
		return 'customReturn'
	}))
return instance(1, 2, 3) // 'customReturn'
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
	.with(S.addNode(SpecialNode))
return instance({ result: 'start' }) // 'specialValue'
```

```javascript
const specialSymbol = Symbol('My Symbol')
const instance = new S({ [specialSymbol]: true })
return instance({ result: 'start' }) // 'start'
```

## S.adapt(...adapters)

Transforms the process before usage, allowing for temporary nodes.

Returns a function that will modify a given instance.

```javascript
const replaceMe = Symbol('replace me')
const instance = new S([
	replaceMe,
	S.Return,
]).with(S.adapt(function (process) {
	return S.traverse((node) => {
		if (node === replaceMe)
			return { result: 'changed' }
		return node
	})(this) }))
return instance({ result: 'unchanged' }) // 'changed'
```

## S.adaptStart(...adapters)

Transforms the state before execution.

Returns a function that will modify a given instance.

```javascript
const instance = new S()
.adaptStart(state => ({
	...state,
	result: 'overridden'
}))
return instance({ result: 'input' }) // 'overridden'
```

## S.adaptEnd(...adapters)

Transforms the state after execution.

Returns a function that will modify a given instance.

```javascript
const instance = new S()
.adaptEnd(state => ({
	...state,
	result: 'overridden'
}))
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

# Instance

Process

```javascript
const instance = new S({ result: 'value' })
return instance.process // { result: 'value' }
```

Config

```javascript
const instance = new S()
return instance.config // { defaults: { result: null }, iterations: 10000, strict: false, async: false, delay: 0, allow: 1000, wait: 0 }
```

```javascript
const instance = new S()
const modifiedInstance = instance
	.async
	.for(10)
	.defaults({ result: 'other' })
	.strict
	.delay(20)
	.allow(100)
	.wait(100)
return modifiedInstance.config // { defaults: { result: 'other' }, iterations: 10, strict: true, async: true, delay: 20, allow: 100, wait: 100 }
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
	.result() // Succeeds
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
const instance = new S({ result: 'old' })
	.do({ result: 'new' })
return instance() // 'new'
```

## instance.defaults(defaults) <default: { result: null }>

Defines the initial state to be used for all executions.

Returns a new instance.

```javascript
const instance = new S()
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

## instance.result(result) <default: (state => state.result)>

Allows the modification of the value the executable will return.

Returns a new instance.

```javascript
const instance = new S(({ myReturnValue }) => ({ myReturnValue: myReturnValue + ' extra' }))
	.result(state => state.myReturnValue)
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
const instance = new S([() => ({ knownVariable: 45 }), ({ knownVariable }) => ({ result: knownVariable })])
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
const instance = new S(async () => ({ result: 'changed' }))
	.async
	.sync
	.defaults({ result: 'initial' })
return instance() // 'initial'
```

## instance.async

Execute asynchronously and allow for asynchronous actions.

Creates a new instance.

```javascript
const instance = new S(async () => ({ result: 'changed' }))
	.defaults({ result: 'initial' })
return instance() // 'initial'
```

```javascript
const instance = new S(async () => ({ result: 'changed' }))
	.defaults({ result: 'initial' })
	.async
return await instance() // 'changed'
```

## instance.delay(delay = 0) <default: 0>

Defines an initial delay before starting to execute the process.

Returns a new instance.

## instance.allow(allow = 1000) <default: 1000>

Defines the amount of time the process is allowed to run for before pausing.

Returns a new instance.

## instance.wait(wait = 0) <default: 0>

Defines the amount of time the process will pause for when the allowed time is exceeded.

Returns a new instance.

## instance.override(override) <default: instance.run>

Overrides the method that will be used when the executable is called.

Returns a new instance.

```javascript
const instance = new S({ result: 'definedResult' }).override(function (...args) {
	// console.log({ scope: this, args }) // { scope: { process: { result: 'definedResult' } }, args: [1, 2, 3] }
	return 'customReturn'
})
return instance(1, 2, 3) // 'customReturn'
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
	.addNode(SpecialNode)
return instance({ result: 'start' }) // 'specialValue'
```

```javascript
const specialSymbol = Symbol('My Symbol')
const instance = new S({ [specialSymbol]: true })
return instance({ result: 'start' }) // 'start'
```

## instance.adapt(...adapters)

Transforms the process before usage, allowing for temporary nodes.

```javascript
const replaceMe = Symbol('replace me')
const instance = new S([
	replaceMe,
	S.Return,
])
.adapt(function (process) {
	return S.traverse((node) => {
		if (node === replaceMe)
			return { result: 'changed' }
		return node
	})(this) })
return instance({ result: 'unchanged' }) // 'changed'
```

## instance.adaptStart(...adapters)

Transforms the state before execution.

Returns a new instance.

```javascript
const instance = new S()
.adaptStart(state => ({
	...state,
	result: 'overridden'
}))
return instance({ result: 'input' }) // 'overridden'
```

## instance.adaptEnd(...adapters)

Transforms the state after execution.

Returns a new instance.

```javascript
const instance = new S()
	.adaptEnd(state => ({
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

# Requirements

## Execution

Can execute function

```javascript
const instance = new S(({ input }) => ({ result: (input + 5) * 47 }))
	.defaults({
		input: -5,
	})
return instance({
	input: 8,
}) // 611
```

Can execute array

```javascript
const instance = new S([
	({ input }) => ({ result: input * 9 }),
	({ result }) => ({ result: result + 15 })
])
	.defaults({
		input: 0,
	})
return instance({
	input: 6
}) // 69
```

Can execute conditional (then)

```javascript
const instance = new S({
	if: ({ input }) => input === 25,
	then: () => ({ result: 44 }),
	else: () => ({ result: 55 }),
})
	.defaults({
		input: 0,
	})
return instance({
	input: 25
}) // 44
```

Can execute conditional (else)

```javascript
const instance = new S({
	if: ({ input }) => input === 25,
	then: () => ({ result: 44 }),
	else: () => ({ result: 55 }),
})
	.defaults({
		input: 0,
	})
return instance({
	input: 8
}) // 55
```

Can execute switch conditional (specific case)

```javascript
const instance = new S({
	switch: ({ mode }) => mode,
	case: {
		first: () => ({ result: 1 }),
		second: () => ({ result: 2 }),
		third: () => ({ result: 3 }),
		default: () => ({ result: -1 }),
	}
})
	.defaults({
		mode: 'none'
	})
return instance({
	mode: 'second'
}) // 2
```

Can execute switch conditional (default)

```javascript
const instance = new S({
	switch: ({ mode }) => mode,
	case: {
		first: () => ({ result: 1 }),
		second: () => ({ result: 2 }),
		third: () => ({ result: 3 }),
		default: () => ({ result: -1 }),
	}
})
	.defaults({
		mode: 'none'
	})
return instance({
	mode: 'blarg'
}) // -1
```

Can execute state machine

```javascript
const instance = new S({
	initial: [
		({ input }) => ({ result: input }),
		'secondState'
	],
	secondState: [
		({ result }) => ({ result: result * 3 }),
		'thirdState'
	],
	thirdState: [
		{
			if: ({ result }) => result < 1000,
			then: 'secondState',
		}
	]
})
	.defaults({
		input: 0,
	})
return instance({
	input: 32,
}) // 2592
```

Can execute array as state machine

```javascript
const instance = new S([
	({ input }) => ({ result: input - 1 }),
	({ result, input }) => ({ result: result + input }),
	({ input }) => ({ input: input - 1 }),
	{
		if: ({ input }) => input > 0,
		then: 1,
	}
])
	.defaults({
		result: 0,
		input: 1,
	})
return instance({
	input: 13,
}) // 103
```

Can nest indefinitely

```javascript
const instance = new S({
	if: ({ input }) => input < 4,
	else: {
		initial: [
			[
				({ input }) => ({ result: input }),
				({ input }) => ({ input: input - 1 }),
			],
			({ result, input }) => ({ result: result + input }),
			'machine'
		],
		machine: [
			{
				initial: {
					if: ({ result }) => result % 2 === 0,
					then: 'halve',
					else: 'other'
				},
				halve: ({ input }) => ({ input: input / 2 }),
				other: {
					switch: ({ result }) => result % 3,
					case: {
						0: ({ result }) => ({ result: result + 7 }),
						1: ({ result }) => ({ result: result + 5 }),
						2: ({ result }) => ({ result: result + 3 }),
					}
				}
			},
			'afterMachine'
		],
		afterMachine: 'somethingElse',
		somethingElse: {
			initial: {
				switch: () => 'always',
				case: {
					always: [
						{
							if:() => true,
							then:{
								initial:{
									if:()=>true,
									then:[{
										switch:()=>'always',
										case:{
											always:{
												if:()=>true,
												then:({ result }) => ({ result: result - 1 })
											}
										}
									}]
								}
							}
						}
					]
				}
			}
		}
	},
	then: ({ input }) => ({ result: input }),
})
	.defaults({
		input: 0,
	})
return instance({
	input: 18,
}) // 37
```

## Static Values

Can use path object as absolute path

```javascript
const instance = new S({
	initial: { [S.Path]: ['second',0] },
	second: [
		({ result }) => ({ result: result + 4 })
	]
})
	.defaults({
		result: 0,
	})
return instance({
	result: 5,
}) // 9
```

Can use path object as relative path

```javascript
const instance = new S({
	initial: { [S.Path]: 'second' },
	second: [
		({ result }) => ({ result: result + 4 })
	]
})
	.defaults({
		result: 0,
	})
return instance({
	result: 5,
}) // 9
```

Can use string as relative path

```javascript
const instance = new S({
	initial: [
		({ result }) => ({ result: result + 1 }),
		'final'
	],
	final: [
		{
			if: ({ result }) => result < 7,
			then: 'initial'
		}
	]
})
	.defaults({
		result: 9,
	})
return instance({
	result: 0,
}) // 7
```

Can use symbol as relative path

```javascript
const testSymbol = Symbol('Test Symbol')
const instance = new S({
	initial: [
		({ result }) => ({ result: result + 1 }),
		testSymbol
	],
	[testSymbol]: [
		{
			if: ({ result }) => result < 7,
			then: 'initial'
		}
	]
})
	.defaults({
		result: 9,
	})
return instance({
	result: 0,
}) // 7
```

Can use number as relative path

```javascript
const instance = new S([
	({ result }) => ({ result: result + 1 }),
	{
		if: ({ result }) => result < 7,
		then: 0
	}
])
	.defaults({
		result: 9,
	})
return instance({
	result: 0,
}) // 7
```

Can use return as directive

```javascript
const instance = new S([
	({ result }) => ({ result: result - 1 }),
	{
		if: ({ result }) => result <= 0,
		then: S.Return,
		else: 0
	}
])
	.defaults({
		result: -1,
	})
return instance({
	result: 6,
}) // 0
```

Can use return object as directive

```javascript
const instance = new S([
	({ result }) => ({ result: result - 1 }),
	{
		if: ({ result }) => result <= 0,
		then: { [S.Return]: 66 },
		else: 0
	}
])
	.defaults({
		result: -1,
	})
return instance({
	result: 6,
}) // 66
```

Can use state change object as value

```javascript
const instance = new S({ result: 66 })
	.defaults({
		result: 0,
	})
return instance({
	result: 99
}) // 66
```

## Dynamic Values

Can return array as absolute path

```javascript
const instance = new S({
	initial: () => ['second',0],
	second: [
		({ result }) => ({ result: result + 4 })
	]
})
	.defaults({
		result: 0,
	})
return instance({
	result: 5,
}) // 9
```

Can return path object as absolute path

```javascript
const instance = new S({
	initial: () => ({ [S.Path]: ['second',0] }),
	second: [
		({ result }) => ({ result: result + 4 })
	]
})
	.defaults({
		result: 0,
	})
return instance({
	result: 5,
}) // 9
```

Can return path object as relative path

```javascript
const instance = new S({
	initial: () => ({ [S.Path]: 'second' }),
	second: [
		({ result }) => ({ result: result + 4 })
	]
})
	.defaults({
		result: 0,
	})
return instance({
	result: 5,
}) // 9
```

Can return string as relative path

```javascript
const instance = new S({
	initial: [
		({ result }) => ({ result: result + 1 }),
		() => 'final'
	],
	final: [
		{
			if: ({ result }) => result < 7,
			then: () => 'initial'
		}
	]
})
	.defaults({
		result: 9,
	})
return instance({
	result: 0,
}) // 7
```

Can return symbol as relative path

```javascript
const testSymbol = Symbol('Test Symbol')
const instance = new S({
	initial: [
		({ result }) => ({ result: result + 1 }),
		() => testSymbol
	],
	[testSymbol]: [
		{
			if: ({ result }) => result < 7,
			then: () => 'initial'
		}
	]
})
	.defaults({
		result: 9,
	})
return instance({
	result: 0,
}) // 7
```

Can return number as relative path

```javascript
const instance = new S([
	({ result }) => ({ result: result + 1 }),
	{
		if: ({ result }) => result < 7,
		then: () => 0
	}
])
	.defaults({
		result: 9,
	})
return instance({
	result: 0,
}) // 7
```

Can return return as directive

```javascript
const instance = new S([
	({ result }) => ({ result: result - 1 }),
	{
		if: ({ result }) => result <= 0,
		then: () => S.Return,
		else: 0
	}
])
	.defaults({
		result: -1,
	})
return instance({
	result: 6,
}) // 0
```

Can return return object as directive

```javascript
const instance = new S([
	({ result }) => ({ result: result - 1 }),
	{
		if: ({ result }) => result <= 0,
		then: () => ({ [S.Return]: 66 }),
		else: 0
	}
])
	.defaults({
		result: -1,
	})
return instance({
	result: 6,
}) // 66
```

Can return object as state change

```javascript
const instance = new S(() => ({ result: 66 }))
	.defaults({
		result: 0,
	})
return instance({
	result: 99
}) // 66
```

## Wrapping

Can use other machine as step

```javascript
const instance = new S({
	initial: [
		({ input }) => ({ realInput: input }),
		'testEnd'
	],
	testEnd: {
		if: ({ realInput }) => realInput <= 1,
		then: ({ stack }) => ({ [S.Return]: stack.join('_') }),
		else: 'nextBatch'
	},
	nextBatch: [
		(new S([
			({ result, input }) => ({ result: result * input }),
			({ input }) => ({ input: input-1 }),
			{
				if: ({ input }) => input > 1,
				then: 0
			}
		]).defaults({
			result: 1,
			input: 1,
		}))
		.input(({ realInput }) => ({ input: realInput, result: 1 }))
		.result(({result}) => ({ result })),
		({ realInput }) => ({ realInput: realInput - 1}),
		({ stack,result }) => ({ stack: [...stack,result]}),
		'testEnd'
	]
})
	.defaults({
		input: 1,
		realInput: 1,
		result: 1,
		stack: [],
	})
return instance({
	input: 10
}) // '3628800_362880_40320_5040_720_120_24_6_2'
```

Can use other machine step as own step

```javascript
const instance = new S({
	initial: [
		({ subState, input }) => ({ subState: { ...subState, input }}),
		'cradle'
	],
	cradle: [
		new S([
			({ counter }) => ({ counter: counter + 1 }),
			({ result, counter }) => ({ result: result * counter }),
			{
				if: ({ input, counter }) => counter < input,
				then: 0
			}
		])
		.override(function ({ subState: currentSubState, subPath: currentSubPath }) {
			const currentState = {
				result: 1,
				input: 1,
				counter: 0,
				...currentSubState,
				[S.Path]: currentSubPath
			}
			const { [S.Path]: subPath, [S.Return]: subDone = false, ...subState } = this.perform(currentState, this.execute(currentState))
			return {
				subPath, subState, subDone
			}
		}),
		'final'
	],
	final: [
		{
			if: ({ subState, resultList }) => subState.result !== resultList[resultList.length-1],
			then: ({ resultList, subState }) => ({ resultList: [...resultList, subState.result]})
		},
		{
			if: ({ subDone }) => subDone,
			then: ({ resultList }) => ({ [S.Return]: resultList.join('_') }),
			else: 'cradle'
		}
	]
})
	.defaults({
		input: 1,
		resultList: [],
		subState: {},
		subPath: [],
		subDone: false,
	})
return instance({
	input: 10,
}) // '1_2_6_24_120_720_5040_40320_362880_3628800'
```

# Examples

7 bang is 5040

```javascript
const instance = new S([
	({ result, input }) => ({ result: result * input }),
	({ input }) => ({ input: input-1 }),
	{
		if: ({ input }) => input > 1,
		then: 0
	}
],)
	.defaults({
		result: 1,
		input: 1,
	})
return instance({
	input: 7
}) // 5040
```

12th fibonacci number is 144

```javascript
const instance = new S({
	initial: 'testStart',
	testStart: [
		{
			if: ({ result }) => result === 0,
			then: () => ({ result: 1 })
		},
		'fib'
	],
	fib: [
		({ result, result2 }) => ({
			result2: result,
			result: result + result2
		}),
		'testEnd',
	],
	testEnd: [
		({ input }) => ({ input: input-1 }),
		{
			if: ({ input }) => input > 1,
			then: 'fib',
			else: S.Return,
		}
	]
})
	.defaults({
		input: 1,
		result: 0,
		result2: 0,
	})
return instance({
	input: 12,
}) // 144
```

12th fibonacci number is 144 (described)

```javascript
const instance = new S({
	initial: 'testStart',
	testStart: [
		a('startingPosition'),
		'fib'
	],
	fib: [
		a('fibonacci'),
		'testEnd',
	],
	testEnd: [
		a('decrementCounter'),
		t('exitOrLoop')
	]
})
	.with(describedPlugin({
		transitions: {
			exitOrLoop: {
				if: ({ input }) => input > 1,
				then: 'fib',
				else: S.Return,
			}
		},
		actions: {
			startAtOne: () => ({ result: 1 }),
			decrementCounter: ({ input }) => ({ input: input-1 }),
			fibonacci: ({ result, result2 }) => ({
				result2: result,
				result: result + result2
			}),
			startingPosition: {
				if: c('startAtZero'),
				then: a('startAtOne')
			}
		},
		conditions: {
			startAtZero: ({ result }) => result === 0
		}
	}))
	.defaults({
		input: 1,
		result: 0,
		result2: 0,
	})
return instance({
	input: 12,
}) // 144
```

## Parallel

Can perform parallel actions when using async.

```javascript
const instance = new S([
	({ input }) => ({ input: input - 1 }),
	parallel({
		if: ({ input }) => input > 5,
		then: [
			({ result, input }) => ({ result: [...result,input] }),
			({ input }) => ({ input: input - 1 }),
		],
	},
	{
		if: ({ input }) => input > 5, 
		then: [
			({ result, input }) => ({ result: [...result,input] }),
			({ input }) => ({ input: input - 1 }),
		],
	}),
	{
		if: ({ input }) => input > 0,
		then: 0,
	},
	({ result }) => ({ [S.Return]: result.join('_') })
]).defaults( {
		input: 0,
		result: []
	})
	.async
	.with(parallelPlugin)
return instance({
	input: 10 
}) // '9_7'
```

Cannot perform parallel actions when not using async.

```javascript
const instance = new S([
	({ input }) => ({ input: input - 1 }),
	parallel({
		if: ({ input }) => input > 5,
		then: [
			({ result, input }) => ({ result: [...result,input] }),
			({ input }) => ({ input: input - 1 }),
		],
	},
	{
		if: ({ input }) => input > 5, 
		then: [
			({ result, input }) => ({ result: [...result,input] }),
			({ input }) => ({ input: input - 1 }),
		],
	}),
	{
		if: ({ input }) => input > 0,
		then: 0,
	},
	({ result }) => ({ [S.Return]: result.join('_') })
])
	.defaults({
		input: 0,
		result: []
	}).with(parallelPlugin)
return instance({
	input: 10 
}) // '9_8_6'
```

## Events

Fibonacci numbers (events)

```javascript
const instance = new S({
	initial: 'testStart',
	testStart: [
		{
			if: ({ result }) => result === 0,
			then: () => ({ result: 1 }),
		},
		'fibb'
	],
	fibb: [
		({ result, result2 }) => ({
			result2: result,
			result: result + result2
		}),
		'testEnd',
	],
	testEnd: [
		({ input }) => ({ input: input-1 }),
		{
			if: ({ input }) => input > 1,
			then: 'fibb',
			else: 'waitForEvents',
		}
	],
	waitForEvents: {
		on: {
			nextNumber: [
				({ input }) => ({ input: input+1 }),
				'fibb'
			],
			getResult: emit(({ result }) => ({ name: 'result', data: result })),
			kill: S.Return,
		}
	}
})
	.defaults({
		input: 1,
		result: 0,
		result2: 0,
	})
	.async
	.with(eventsPlugin({
		nextNumber: {},
		getResult: {},
		kill: {},
	}))
const runningInstance = instance({input:12})
let results = []
runningInstance.subscribe((event) => {
	if (event.name === 'result') {
		results.push(event.data)
	}
});
runningInstance.send('getResult')
runningInstance.send('nextNumber')
runningInstance.send('getResult')
runningInstance.send('getResult')
runningInstance.send('nextNumber')
runningInstance.send('getResult')
runningInstance.send('kill')
await runningInstance
return results.join('_') // '144_233_233_377'
```

Fibonacci numbers (events + described)

```javascript
const instance = new S({
	initial: 'testStart',
	testStart: [
		{
			if: c('startAtZero'),
			then: a('startAtOne'),
		},
		'fibb'
	],
	fibb: [
		a('fibonacci'),
		'testEnd',
	],
	testEnd: [
	a('decrementCounter'),
		{
			if: c('moreRepetitions'),
			then: 'fibb',
			else: 'waitForEvents',
		}
	],
	waitForEvents: {
		on: {
			nextNumber: [
				({ input }) => ({ input: input+1 }),
				'fibb'
			],
			getResult: emit(({ result }) => ({ name: 'result', data: result })),
			kill: S.Return,
		}
	}
})
	.defaults({
		input: 1,
		result: 0,
		result2: 0,
	})
	.async
	.with(describedPlugin({
		actions:{
			startAtOne: () => ({ result: 1 }),
			fibb: ({ result, result2 }) => ({
				result2: result,
				result: result + result2
			}),
			decrementCounter: ({ input }) => ({ input: input-1 }),
			fibonacci: [
				a('fibb'),
			],
		},
		conditions: {
			startAtZero: ({ result }) => result === 0,
			moreRepetitions: ({ input }) => input > 1
		},
	}), eventsPlugin({
		nextNumber: {},
		getResult: {},
		kill: {},
	}))
const runningInstance = instance({input:12})
let results = []
runningInstance.subscribe((event) => {
	if (event.name === 'result') {
		results.push(event.data)
	}
});
runningInstance.send('getResult')
runningInstance.send('nextNumber')
runningInstance.send('getResult')
runningInstance.send('getResult')
runningInstance.send('nextNumber')
runningInstance.send('getResult')
runningInstance.send('kill')
await runningInstance
return results.join('_') // '144_233_233_377'
```

