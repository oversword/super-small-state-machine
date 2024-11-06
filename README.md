 Super Small State Machine

# Library Methods

## clone_object (obj)

export const clone_object = (obj) => {

Is exported

```javascript
function anonymous(
	) {
	return clone_object;
```

Deep clones objects.

```javascript
const obj = {a:{b:3},c:5}
const clone = clone_object(obj)
return clone !== obj
	&& JSON.stringify(clone) === JSON.stringify(obj)
	&& clone.a !== obj.a
	&& clone.c === obj.c // true
```

### Can clone arrays

```javascript
const obj = [{a:{b:3},c:5},2,3,{d:6}]
const clone = clone_object(obj)
return clone !== obj
	&& clone[0] !== obj[0]
	&& clone[1] === obj[1]
	&& clone[3] !== obj[3]
	&& JSON.stringify(clone) === JSON.stringify(obj) // true
```

if (Array.isArray(obj)) return obj.map(clone_object)

### Returns null if given null

```javascript
return clone_object(null) // null
```

if (obj === null) return null

### Returns input if not object

```javascript
return clone_object('hello') // 'hello'
```

if (typeof obj !== 'object') return obj

### Deep clones properties of an object

```javascript
const obj = {a:{b:3}}
const clone = clone_object(obj)
return clone !== obj
	&& JSON.stringify(clone) === JSON.stringify(obj)
	&& clone.a !== obj.a
	&& clone.a.b === obj.a.b // true
```

return Object.fromEntries(Object.entries(obj).map(([key,value]) => [ key, clone_object(value) ]));

}

## unique_list_strings (list, getId

export const unique_list_strings = (list, getId = item => item) => Object.values(Object.fromEntries(list.map(item=>[getId(item),item])));

## reduce_get_path_object (obj, step)

const reduce_get_path_object = (obj, step) => obj ? obj[step] : undefined

## get_path_object (object, path)

export const get_path_object = (object, path) => (path.reduce(reduce_get_path_object, object))

## normalise_function (functOrReturn)

export const normalise_function = (functOrReturn) => (typeof functOrReturn === 'function') ? functOrReturn : () => functOrReturn

## reduce_deep_merge_object (base, override)

const reduce_deep_merge_object = (base, override) => {

### 

if (!((base && typeof base === 'object') && !Array.isArray(base) && (override && typeof override === 'object') && !Array.isArray(override))) return override;

### 

const allKeys = unique_list_strings(Object.keys(base).concat(Object.keys(override)));

### 

return Object.fromEntries(allKeys.map(key => [ key, key in override ? deep_merge_object(base[key], override[key]) : base[key] ]));

}

## deep_merge_object (base, ...overrides)

export const deep_merge_object = (base, ...overrides) => overrides.reduce(reduce_deep_merge_object, base)

## get_closest_object (object, path = [], condition = () => true)

export const get_closest_object = (object, path = [], condition = () => true) => {

### 

const item = get_path_object(object, path)

### 

if (condition(item, path, object)) return path

### 

if (path.length === 0) return null

### 

return get_closest_object(object, path.slice(0,-1), condition)

}

## wait_time (delay)

export const wait_time = delay => (delay ? new Promise(resolve => setTimeout(resolve, delay)) : Promise.resolve())

# Errors

## SuperSmallStateMachineError

export class SuperSmallStateMachineError extends Error {

### 

instance; state; data; path;

### 

constructor(message, { instance, state, data, path } = {}) {

#### 

super(message)

#### 

Object.assign(this, { instance, state, data, path })

}

}

## SuperSmallStateMachineReferenceError

export class SuperSmallStateMachineReferenceError extends SuperSmallStateMachineError {}

## SuperSmallStateMachineTypeError

export class SuperSmallStateMachineTypeError extends SuperSmallStateMachineError {}

## ContextReferenceError

export class ContextReferenceError extends SuperSmallStateMachineReferenceError {}

## ContextTypeError

export class ContextTypeError extends SuperSmallStateMachineTypeError {}

## NodeTypeError

export class NodeTypeError extends SuperSmallStateMachineTypeError {}

## UndefinedNodeError

export class UndefinedNodeError extends SuperSmallStateMachineReferenceError {}

## MaxIterationsError

export class MaxIterationsError extends SuperSmallStateMachineError {}

## PathReferenceError

export class PathReferenceError extends SuperSmallStateMachineReferenceError {}

# Node Types

export const NodeTypes = {

## 

UN: 'undefined',

## 

EM: 'empty',

## 

RT: 'return',

## 

FN: 'function',

## 

SQ: 'sequence',

## 

CD: 'condition',

## 

SW: 'switch',

## 

MC: 'machine',

## 

CH: 'changes',

## 

DR: 'directive',

## 

AD: 'absolute-directive',

## 

MD: 'machine-directive',

## 

SD: 'sequence-directive',

}

# Key Words

export const KeyWords = {

## 

IF: 'if',

## 

TN: 'then',

## 

EL: 'else',

## 

SW: 'switch',

## 

CS: 'case',

## 

DF: 'default',

## 

IT: 'initial',

## 

RS: 'result',

}

# Node Definitions

export class NodeDefinitions extends Map {

## 

constructor(...nodes) { super(nodes.flat(Infinity).map(node => [node.name,node])) }

## 

typeof(object, objectType = typeof object, isOutput = false) {

### 

const foundType = [...this.values()].findLast(current => current.typeof && current.typeof(object, objectType, isOutput))

### 

return foundType ? foundType.name : false

}

}

# Node Definition

export class NodeDefinition {

## 

static name = Symbol('Unnamed node')

## 

static typeof = null;

## 

static execute = null;

## 

static proceed = null;

## 

static perform = null;

## 

static traverse = null;

}

export const N = NodeDefinition

# exitFindNext (action, state)

TODO: merge into S._proceed? or S._perform?

const exitFindNext = function (action, state) {

## 

const path = S._proceed(this, state)

## 

return path ? { ...state, [S.Path]: path } : { ...state, [S.Return]: true }

}

# Default Nodes

## Changes Node

Updates the state by deep-merging the values. Arrays will not be deep merged.

```javascript
const instance = new S({ result: 'overridden' })
return instance({ result: 'start' }) // 'overridden'
```

```javascript
const instance = new S({ result: { newValue: true } })
return instance({ result: { existingValue: true } }) // { existingValue: true, newValue: true }
```

export class ChangesNode extends NodeDefinition {

### 

static name = NodeTypes.CH

### 

static typeof(object, objectType) { return Boolean(object && objectType === 'object') }

### 

static perform(action, state) { return exitFindNext.call(this, action, S._changes(this, state, action)) }

}

## Sequence Node

Sequences are lists of nodes and executables, they will visit each node in order and exit when done.

```javascript
const instance = new S([
	({ result }) => ({ result: result + ' addition1' }),
	({ result }) => ({ result: result + ' addition2' }),
])
return instance({ result: 'start' }) // 'start addition1 addition2'
```

export class SequenceNode extends NodeDefinition {

### 

static name = NodeTypes.SQ

### 

static proceed(parPath, state, path) {

#### 

const parActs = get_path_object(this.process, parPath)

#### 

const childItem = path[parPath.length]

#### 

if (parActs && childItem+1 < parActs.length) return [ ...parPath, childItem+1 ]

}

### 

static typeof(object, objectType, isOutput) { return ((!isOutput) && objectType === 'object' && Array.isArray(object)) }

### 

static execute(node, state) { return node.length ? [ ...state[S.Path], 0 ] : null }

### 

static traverse(item, path, iterate, post) { return item.map((_,i) => iterate([...path,i])) }

}

## Function Node

The only argument to the function will be the state.

You can return any of the previously mentioned action types from a function, or return nothing at all for a set-and-forget action.

```javascript
const instance = new S(({ result }) => ({ result: result + ' addition' }))
return instance({ result: 'start' }) // 'start addition'
```

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

```javascript
const instance = new S(() => ({ [S.Return]: 'changed' }))
return instance({ result: 'start' }) // 'changed'
```

```javascript
const instance = new S(() => {
	// Arbitrary code
})
return instance({ result: 'start' }) // 'start'
```

export class FunctionNode extends NodeDefinition {

### 

static name = NodeTypes.FN

### 

static typeof(object, objectType, isOutput) { return (!isOutput) && objectType === 'function' }

### 

static execute(node, state) { return node(state) }

}

## Undefined Node

export class UndefinedNode extends NodeDefinition {

### 

static name = NodeTypes.UN

### 

static typeof(object, objectType) { return objectType === 'undefined' }

### 

static execute(node, state) { throw new UndefinedNodeError(`There is nothing to execute at path [ ${state[S.Path].map(key => key.toString()).join(', ')} ]`) }

### 

static perform = exitFindNext

}

## Empty Node

export class EmptyNode extends NodeDefinition {

### 

static name = NodeTypes.EM

### 

static typeof(object, objectType) { return object === null }

### 

static perform = exitFindNext

}

## Condition Node

```javascript
const instance = new S({
	if: ({ result }) => result === 'start',
	then: { result: 'truthy' },
	else: { result: 'falsey' },
})
return instance({ result: 'start' }) // 'truthy'
```

```javascript
const instance = new S({
	if: ({ result }) => result === 'start',
	then: { result: 'truthy' },
	else: { result: 'falsey' },
})
return instance({ result: 'other' }) // 'falsey'
```

export class ConditionNode extends NodeDefinition {

### 

static name = NodeTypes.CD

### 

static typeof(object, objectType, isOutput) { return Boolean((!isOutput) && object && objectType === 'object' && (KeyWords.IF in object)) }

### 

static execute(node, state) {

if (normalise_function(node[KeyWords.IF])(state))

return KeyWords.TN in node ? [ ...state[S.Path], KeyWords.TN ] : null

return KeyWords.EL in node ? [ ...state[S.Path], KeyWords.EL ] : null

}

### 

static traverse(item, path, iterate, post) { return post({

...item,

[KeyWords.IF]: item[KeyWords.IF],

...(KeyWords.TN in item ? { [KeyWords.TN]: iterate([...path,KeyWords.TN]) } : {}),

...(KeyWords.EL in item ? { [KeyWords.EL]: iterate([...path,KeyWords.EL]) } : {})

}, path) }

}

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

export class SwitchNode extends NodeDefinition {

### 

static name = NodeTypes.SW

### 

static typeof(object, objectType, isOutput) { return Boolean((!isOutput) && object && objectType === 'object' && (KeyWords.SW in object)) }

### 

static execute(node, state) {

const key = normalise_function(node[KeyWords.SW])(state)

const fallbackKey = key in node[KeyWords.CS] ? key : KeyWords.DF

return fallbackKey in node[KeyWords.CS] ? [ ...state[S.Path], KeyWords.CS, fallbackKey ] : null

}

### 

static traverse(item, path, iterate, post) { return post({

...item,

[KeyWords.SW]: item[KeyWords.SW],

[KeyWords.CS]: Object.fromEntries(Object.keys(item[KeyWords.CS]).map(key => [ key, iterate([...path,KeyWords.CS,key]) ])),

}, path) }

}

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

export class MachineNode extends NodeDefinition {

### 

static name = NodeTypes.MC

### 

static typeof(object, objectType, isOutput) { return Boolean((!isOutput) && object && objectType === 'object' && (KeyWords.IT in object)) }

### 

static execute(node, state) { return [ ...state[S.Path], KeyWords.IT ] }

### 

static traverse(item, path, iterate, post) { return post({

...item,

...Object.fromEntries(Object.keys(item).map(key => [ key, iterate([...path,key]) ]))

}, path) }

}

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

export class DirectiveNode extends NodeDefinition {

### 

static name = NodeTypes.DR

### 

static typeof(object, objectType, isOutput) { return Boolean(object && objectType === 'object' && (S.Path in object)) }

### 

static perform(action, state) { return S._perform(this, state, action[S.Path]) }

}

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

export class SequenceDirectiveNode extends DirectiveNode {

### 

static name = NodeTypes.SD

### 

static typeof(object, objectType, isOutput) { return objectType === 'number' }

### 

static perform(action, state) {

#### 

const lastOf = S._closest(this, state[S.Path].slice(0,-1), NodeTypes.SQ)

#### 

if (!lastOf) throw new PathReferenceError(`A relative directive has been provided as a ${actionType} (${String(action)}), but no sequence exists that this ${actionType} could be an index of from path [ ${state[S.Path].map(key => key.toString()).join(', ')} ].`)

#### 

return { ...state, [S.Path]: [...lastOf, action] }

}

}

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

export class MachineDirectiveNode extends DirectiveNode {

### 

static name = NodeTypes.MD

### 

static typeof(object, objectType, isOutput) { return objectType === 'string' || objectType === 'symbol' }

### 

static perform(action, state) {

#### 

const lastOf = S._closest(this, state[S.Path].slice(0,-1), NodeTypes.MC)

#### 

if (!lastOf) throw new PathReferenceError(`A relative directive has been provided as a ${actionType} (${String(action)}), but no state machine exists that this ${actionType} could be a state of from path [ ${state[S.Path].map(key => key.toString()).join(', ')} ].`)

#### 

return { ...state, [S.Path]: [...lastOf, action] }

}

}

## Absolute Directive Node

Arrays can be used to perform absolute redirects. This is not recommended as it may make your transition logic unclear.

Arrays cannot be used on their own, because they would be interpreted as sequences. For this reason they must be contained in an object with the `S.Path` symbol as a ky, with the array as the value, or returned by an action.

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

export class AbsoluteDirectiveNode extends DirectiveNode {

### 

static name = NodeTypes.AD

### 

static typeof(object, objectType, isOutput) { return isOutput && Array.isArray(object) }

### 

static perform(action, state) { return { ...state, [S.Path]: action } }

}

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
const instance = new S({ [S.Return]: 456 })
const result = instance({ result: 44 }) // 456
const endState = instance.result(state => state)({ result: 44 }) // { result: 465, [S.Return]: true } // TODO: INCOMPLETE
```

export class ReturnNode extends NodeDefinition {

### 

static name = NodeTypes.RT

### 

static typeof(object, objectType) { return object === S.Return || Boolean(object && objectType === 'object' && (S.Return in object)) }

### 

static perform(action, state) { return {

#### 

...state,

#### 

[S.Return]: true,

#### 

[S.Path]: state[S.Path],

#### 

...(!action || action === S.Return ? {} : { [KeyWords.RS]: action[S.Return] })

} }

}

## 

export const nodes = [ ChangesNode, SequenceNode, FunctionNode, UndefinedNode, EmptyNode, ConditionNode, SwitchNode, MachineNode, DirectiveNode, AbsoluteDirectiveNode, MachineDirectiveNode, SequenceDirectiveNode, ReturnNode, ]

# Extensible Function

export class ExtensibleFunction extends Function { constructor(f) { super(); return Object.setPrototypeOf(f, new.target.prototype); }; }

# Core

export class SuperSmallStateMachineCore extends ExtensibleFunction {

## Symbols

### Return

static Return      = Symbol('Super Small State Machine Return')

Use for intentionally exiting the entire process, can be used in an object to override the result value before returning

```javascript
return { [S.Return]: "value" } // Succeeds
```

### Changes

Returned in the state. Should not be passed in.

static Changes     = Symbol('Super Small State Machine Changes')

### Path

Returned in the state to indicate the next action path, or passed in with the state to direct the machine. This can also be used as a node on its own to change the executing path.

static Path        = Symbol('Super Small State Machine Path')

### StrictTypes

Possible value of `config.strict`, used to indicate strict types as well as values.

static StrictTypes = Symbol('Super Small State Machine Strict Types')

## Key Words

static keyWords    = KeyWords

static kw          = KeyWords

## Node Types

static nodeTypes   = NodeTypes

static types       = NodeTypes

## Config

static config = {

### 

defaults: { [KeyWords.RS]: null },

### 

input: (a = {}) => a,

### 

result: a => a[KeyWords.RS],

### 

strict: false,

### 

iterations: 10000,

### 

until: result => this.Return in result,

### 

async: false,

#### Special settings for async

delay: 0,

allow: 1000,

wait: 0,

### 

override: null,

### 

nodes: new NodeDefinitions(nodes),

### 

adapt: [],

### 

adaptStart: [],

### 

adaptEnd: [],

}

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

static _closest (instance, path = [], ...nodeTypes) { // Find closest node of type nodeTypes

### 

const flatNodeTypes = nodeTypes.flat(Infinity)

### 

return get_closest_object(instance.process, path, i => {

#### 

const nodeType = instance.config.nodes.typeof(i)

#### 

return Boolean(nodeType && flatNodeTypes.includes(nodeType))

})

}

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

static _changes (instance, state = {}, changes = {}) { // Safely apply changes to the state

### 

if (instance.config.strict) {

if (Object.entries(changes).some(([name]) => !(name in state)))

throw new ContextReferenceError(`Only properties that exist on the initial context may be updated.\nYou changed [ ${Object.keys(changes).filter(property => !(property in state)).map(key => key.toString()).join(', ')} ], which ${Object.keys(changes).filter(property => !(property in state)).length === 1 ? 'is' : 'are'} not in: [ ${Object.keys(state).map(key => key.toString()).join(', ')} ].\nPath: [ ${state[this.Path].map(key => key.toString()).join(' / ')} ]`)

if (instance.config.strict === this.StrictTypes) {

if (Object.entries(changes).some(([name,value]) => typeof value !== typeof state[name])) {

const errs = Object.entries(changes).filter(([name,value]) => typeof value !== typeof state[name])

throw new ContextTypeError(`Properties must have the same type as their initial value. ${errs.map(([name,value]) => `${typeof value} given for '${name}', should be ${typeof state[name]}`).join('. ')}.`)

}

}

}

### 

const allChanges = deep_merge_object(state[this.Changes] || {}, changes)

### 

return {

#### 

...deep_merge_object(state, allChanges),

#### 

[this.Path]: state[this.Path],

#### 

[this.Changes]: allChanges

}

}

## instance.proceed (state = {}, path = state[this.Path] || [])

Proceed to the next execution path.

Performs fallback logic when a node exits.

static _proceed (instance, state = {}, path = state[this.Path] || []) { // Proceed to the next execution path

### 

if (path.length === 0) return null

### 

const parPath = this._closest(instance, path.slice(0,-1), [...instance.config.nodes.values()].filter(({ proceed }) => proceed).map(({ name }) => name))

### 

if (!parPath) return null

### 

const parActs = get_path_object(instance.process, parPath)

### 

const parType = instance.config.nodes.typeof(parActs)

### 

const nodeDefinition = parType && instance.config.nodes.get(parType)

### 

if (!(nodeDefinition && nodeDefinition.proceed)) return null

### 

const result = nodeDefinition.proceed.call(instance, parPath, state, path)

### 

if (result !== undefined) return result

### 

return this._proceed(instance, state, parPath)

}

## instance.perform (state = {}, action = null)

Perform actions on the state.

Applies any changes in the given `output` to the given `state`.

Proceeds to the next node if the action is not itself a directive or return.

static _perform (instance, state = {}, action = null) { // Perform actions on the state

### 

const path = state[this.Path] || []

### 

const nodeType = instance.config.nodes.typeof(action, typeof action, true)

### 

const nodeDefinition = nodeType && instance.config.nodes.get(nodeType)

### 

if (nodeDefinition && nodeDefinition.perform)

### 

return nodeDefinition.perform.call(instance, action, state)

### 

throw new NodeTypeError(`Unknown action or action type: ${typeof action}${nodeType ? `, nodeType: ${String(nodeType)}` : ''} at [ ${path.map(key => key.toString()).join(', ')} ]`)

}

## instance.execute (state = {}, path = state[this.Path] || [])

Execute a node in the process, return an action.

Executes the node in the process at the state's current path and returns it's output.

If the node is not executable it will be returned as the output.

static _execute (instance, state = {}, path = state[this.Path] || []) { // Execute a node in the process, return an action

### 

const node = get_path_object(instance.process, path)

### 

const nodeType = instance.config.nodes.typeof(node)

### 

const nodeDefinition = nodeType && instance.config.nodes.get(nodeType)

### 

if (nodeDefinition && nodeDefinition.execute)

### 

return nodeDefinition.execute.call(instance, node, state)

### 

return node

}

## instance.traverse(iterator = a => a, post = b => b)

TODO: traverse and adapt same thing?

static _traverse(instance, iterator = a => a, post = b => b) {

### 

const boundPost = post.bind(instance)

### 

const iterate = (path = []) => {

#### 

const item = get_path_object(instance.process, path)

#### 

const nodeType = instance.config.nodes.typeof(item)

#### 

const nodeDefinition = nodeType && instance.config.nodes.get(nodeType)

#### 

if (nodeDefinition && nodeDefinition.traverse)

#### 

return nodeDefinition.traverse.call(instance, item, path, iterate, boundPost)

#### 

return iterator.call(instance, item, path)

}

### 

return iterate()

}

## instance.run (...input)

Execute the entire state machine either synchronously or asynchronously depending on the config.

static _run (instance, ...input) {

### 

if (instance.config.async) return this._runAsync(instance, ...input)

### 

return this._runSync(instance, ...input)

}

## instance.runSync (...input)

Execute the entire state machine synchronously.

static _runSync (instance, ...input) {

### 

const { until, iterations, input: inputModifier, result: adaptResult, adaptStart, adaptEnd, strict, defaults: state  } = { ...this.config, ...instance.config }

### 

const modifiedInput = inputModifier.apply(instance, input) || {}

### 

let r = 0, currentState = adaptStart.reduce((prev, modifier) => modifier.call(instance, prev), this._changes(instance, {

#### 

[this.Changes]: {},

#### 

...state,

#### 

[this.Path]: modifiedInput[this.Path] || [],

}, modifiedInput))

### 

while (r < iterations) {

#### 

if (until(currentState)) break;

#### 

if (++r > iterations)

##### 

throw new MaxIterationsError(`Maximim iterations of ${iterations} reached at path [ ${currentState[this.Path].map(key => key.toString()).join(', ')} ]`, { instance, state: currentState, data: { iterations } })

#### 

currentState = this._perform(instance, currentState, this._execute(instance, currentState))

}

### 

return adaptResult.call(instance, adaptEnd.reduce((prev, modifier) => modifier.call(instance, prev), currentState))

}

## instance.runAsync (...input)

Execute the entire state machine asynchronously. Always returns a promise.

static async _runAsync (instance, ...input) {

### 

const { delay, allow, wait, until, iterations, input: inputModifier, result: adaptResult, adaptStart, adaptEnd, strict, defaults } = { ...this.config, ...instance.config }

### 

const modifiedInput = (await inputModifier.apply(instance, input)) || {}

### 

if (delay) await wait_time(delay)

### 

let r = 0, startTime = Date.now(), currentState = adaptStart.reduce((prev, modifier) => modifier.call(instance, prev), this._changes(instance, {

### 

[this.Changes]: {},

### 

...defaults,

### 

[this.Path]: modifiedInput[this.Path] || [],

### 

}, modifiedInput))

### 

while (r < iterations) {

#### 

if (until(currentState)) break;

#### 

if (++r >= iterations)

#### 

throw new MaxIterationsError(`Maximim iterations of ${iterations} reached at path [ ${currentState[this.Path].map(key => key.toString()).join(', ')} ]`, { instance, state: currentState, data: { iterations } })

#### 

currentState = this._perform(instance, currentState, await this._execute(instance, currentState))

#### 

if (allow > 0 && r % 10 === 0) {

##### 

const nowTime = Date.now()

##### 

if (nowTime - startTime >= allow) {

###### 

await wait_time(wait)

###### 

startTime = Date.now()

}

}

}

return adaptResult.call(instance, adaptEnd.reduce((prev, modifier) => modifier.call(instance, prev), currentState))

}

}

# Chain

export class SuperSmallStateMachineChain extends SuperSmallStateMachineCore {

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

static closest(path, ...nodeTypes) { return instance => this._closest(instance, path, ...nodeTypes) }

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

static changes(state, changes) { return instance => this._changes(instance, state, changes) }

## instance.proceed (state = {}, path = state[this.Path] || [])

Proceed to the next execution path.

Performs fallback logic when a node exits.

static proceed(state, path)    { return instance => this._proceed(instance, state, path) }

## instance.perform (state = {}, action = null)

Perform actions on the state.

Applies any changes in the given `output` to the given `state`.

Proceeds to the next node if the action is not itself a directive or return.

static perform(state, action)  { return instance => this._perform(instance, state, action) }

## instance.execute (state = {}, path = state[this.Path] || [])

Execute a node in the process, return an action.

Executes the node in the process at the state's current path and returns it's output.

If the node is not executable it will be returned as the output.

static execute(state)          { return instance => this._execute(instance, state) }

## instance.traverse(iterator = a => a, post = b => b)

TODO: traverse and adapt same thing?

static traverse(iterator, post){ return instance => this._traverse(instance, iterator, post) }

## instance.run (...input)

Execute the entire state machine either synchronously or asynchronously depending on the config.

static run(...input)           { return instance => this._run(instance, ...input) }

## instance.runSync (...input)

Execute the entire state machine synchronously.

static runSync(...input)       { return instance => this._runSync(instance, ...input) }

## instance.runAsync (...input)

Execute the entire state machine asynchronously. Always returns a promise.

static runAsync(...input)      { return instance => this._runAsync(instance, ...input) }

## instance.do(process) <default: null>

Defines a process to execute, overrides the existing process.

Returns a new instance.

```javascript
const instance = new S({ result: 'old' })
	.do({ result: 'new' })
return instance() // 'new'
```

static do(process)             { return instance => ({ process: instance.config.adapt.reduce((prev, modifier) => modifier.call(instance, prev), process), config: instance.config }) }

## instance.defaults(defaults) <default: { result: null }>

Defines the initial state to be used for all executions.

Returns a new instance.

```javascript
const instance = new S()
	.defaults({ result: 'default' })
return instance() // 'default'
```

static defaults(defaults)      { return instance => ({ process: instance.process, config: { ...instance.config, defaults }, }) }

## instance.input(input) <default: (state => state)>

Allows the definition of the arguments the executable will use, and how they will be applied to the initial state.

Returns a new instance.

```javascript
const instance = new S(({ first, second }) => ({ [S.Return]: `${first} then ${second}` }))
	.defaults({ first: '', second: '' })
	.input((first, second) => ({ first, second }))
return instance('this', 'that') // 'this then that'
```

static input(input)            { return instance => ({ process: instance.process, config: { ...instance.config, input }, }) }

## instance.result(result) <default: (state => state.result)>

Allows the modification of the value the executable will return.

Returns a new instance.

```javascript
const instance = new S(({ myReturnValue }) => ({ myReturnValue: myReturnValue + ' extra' }))
	.result(state => state.myReturnValue)
return instance({ myReturnValue: 'start' }) // 'start extra'
```

static result(result)          { return instance => ({ process: instance.process, config: { ...instance.config, result }, }) }

## instance.unstrict <default>

Execute without checking state properties when a state change is made.

Creates a new instance.

```javascript
const instance = new S(() => ({ unknownVariable: false}))
	.defaults({ knownVariable: true })
	.strict
return instance() // Error
```

```javascript
const instance = new S(() => ({ unknownVariable: false}))
	.defaults({ knownVariable: true })
	.strict
	.unstrict
return instance() // Succeeds
```

static unstrict                 (instance) { return ({ process: instance.process, config: { ...instance.config, strict: false }, }) }

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
return instance() // Error
```

static strict                   (instance) { return ({ process: instance.process, config: { ...instance.config, strict: true }, }) }

## instance.strictTypes

Checking state property types when an state change is made.

Creates a new instance.

```javascript
const instance = new S(() => ({ knownVariable: 45 }))
	.defaults({ knownVariable: true })
	.strictTypes
return instance() // Error
```

static strictTypes              (instance) { return ({ process: instance.process, config: { ...instance.config, strict: this.StrictTypes }, }) }

## instance.for(iterations = 10000) <default: 10000>

Defines the maximum iteration limit.

Returns a new instance.

```javascript
const instance = new S(({ result }) => ({ result: result + 1}))
	.defaults({ result: 0 })
	.for(10)
const result = instance() // ?? // TODO: INCOMPLETE
```

static for(iterations = 10000) { return instance => ({ process: instance.process, config: { ...instance.config, iterations }, }) }

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

static until(until)            { return instance => ({ process: instance.process, config: { ...instance.config, until }, }) }

## instance.forever

Removes the max iteration limit.

Creates a new instance.

```javascript
const instance = new S().forever
return instance.config.iterations // Infinity
```

static forever                  (instance) { return ({ process: instance.process, config: { ...instance.config, iterations: Infinity }, }) }

## instance.step

Execute one action or directive at a time, and always return the full state (ignoring previous `instance.result` calls)

```javascript
const instance = new S([{ result: 'first' }, { result: 'second' }])
	.defaults({ result: 'initial' })
	.step
const result1 = instance()
const result2 = instance(result1)
const result3 = instance(result2)
return { result1, result2, result3 } // { result1: { result: 'initial' }, result2: { result: 'first' }, result3: { result: 'second' } }
```

static step                     (instance) { return ({ process: instance.process, config: { ...instance.config, iterations: 1, result: a => a }, }) }

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

static sync                     (instance) { return ({ process: instance.process, config: { ...instance.config, async: false }, }) }

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

static async                    (instance) { return ({ process: instance.process, config: { ...instance.config, async: true }, }) }

## instance.delay(delay = 0) <default: 0>

Defines an initial delay before starting to execute the process.

Returns a new instance.

static delay(delay = 0)      { return instance => ({ process: instance.process, config: { ...instance.config, delay }, }) }

## instance.allow(allow = 1000) <default: 1000>

Defines the amount of time the process is allowed to run for before pausing.

Returns a new instance.

static allow(allow = 1000)   { return instance => ({ process: instance.process, config: { ...instance.config, allow }, }) }

## instance.wait(wait = 0) <default: 0>

Defines the amount of time the process will pause for when the allowed time is exceeded.

Returns a new instance.

static wait(wait = 0)        { return instance => ({ process: instance.process, config: { ...instance.config, wait }, }) }

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

static override(override)      { return instance => ({ process: instance.process, config: { ...instance.config, override } }) }

## instance.addNode(...nodes)

Allows for the addition of new node types.

Returns a new instance.

```javascript
const instance = new S()
const result = instance() // TODO: INCOMPLETE
```

static addNode(...nodes)       { return instance => ({ process: instance.process, config: { ...instance.config, nodes: new NodeDefinitions(...instance.config.nodes.values(),...nodes) }, }) }

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

static adapt(...adapters)      { return instance => ({ process: adapters.reduce((prev, adapter) => adapter.call(instance, prev), instance.process), config: { ...instance.config, adapt: [ ...instance.config.adapt, ...adapters ] }, }) }

## instance.adaptStart(...adapters)

Transforms the state before execution.

Returns a new instance.

```javascript
const instance = new S()
.adaptInput(state => ({
	...state,
	addedValue: 'new'
}))
const result = instance({ }) // TODO: INCOMPLETE
```

static adaptStart(...adapters) { return instance => ({ process: instance.process, config: { ...instance.config, adaptStart: [ ...instance.config.adaptStart, ...adapters ] }, }) }

## instance.adaptEnd(...adapters)

Transforms the state after execution.

Returns a new instance.

```javascript
const instance = new S()
const result = instance() // TODO: INCOMPLETE
```

static adaptEnd(...adapters)   { return instance => ({ process: instance.process, config: { ...instance.config, adaptEnd: [ ...instance.config.adaptEnd, ...adapters ] }, }) }

## instance.with(...adapters)

Allows for the addition of predifined modules.

Returns a new instance.

```javascript
// const instance = new S()
// const result = instance() // TODO: INCOMPLETE
```

static with(...adapters) {

### 

const flatAdapters = adapters.flat(Infinity)

### 

return instance => {

#### 

const result = flatAdapters.reduce((prev, adapter) => adapter.call(instance, prev), instance)

#### 

return result instanceof S ? result : new S(result.process, result.config)

}

}

}

# Instance

export default class S extends SuperSmallStateMachineChain {

## Process

```javascript
const instance = new S({ result: 'value' })
const result = instance.process // { result: 'value' } // TODO: INCOMPLETE
```

process = null

## Config

```javascript
// const instance = new S({ result: 'value' })
// const modifiedInstance = instance
// 	.async
// 	.for(10)
// 	.defaults({ result: 'other' })
// 	.strict
// 	.delay(20)
// 	.allow(100)
// 	.wait(100)
// const result1 = instance.config
// // { 
// // 	defaults: { result: null },
// // 	iterations: 10000,
// // 	strict: false,
// // 	async: false,
// // 	delay: 0,
// // 	allow: 1000,
// // 	wait: 0,
// // }
// const result2 = modifiedInstance.config
// // { 
// // 	defaults: { result: 'other' }
// // 	iterations: 10,
// // 	strict: true,
// // 	async: true,
// // 	delay: 20,
// // 	allow: 100,
// // 	wait: 100,
// // }  // TODO: INCOMPLETE
```

#config = S.config

get config() { return { ...this.#config } }

## 

constructor(process = null, config = S.config) {

### 

super((...input) => (config.override || this.run).apply(this, input))

### 

this.#config = { ...this.#config, ...config }

### 

this.process = process

}

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

closest(path, ...nodeTypes) { return S._closest(this, path, ...nodeTypes) }

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

changes(state, changes) { return S._changes(this, state, changes) }

## instance.proceed (state = {}, path = state[this.Path] || [])

Proceed to the next execution path.

Performs fallback logic when a node exits.

proceed(state, path)    { return S._proceed(this, state, path) }

## instance.perform (state = {}, action = null)

Perform actions on the state.

Applies any changes in the given `output` to the given `state`.

Proceeds to the next node if the action is not itself a directive or return.

perform(state, action)  { return S._perform(this, state, action) }

## instance.execute (state = {}, path = state[this.Path] || [])

Execute a node in the process, return an action.

Executes the node in the process at the state's current path and returns it's output.

If the node is not executable it will be returned as the output.

execute(state)          { return S._execute(this, state) }

## instance.traverse(iterator = a => a, post = b => b)

TODO: traverse and adapt same thing?

traverse(iterator, post){ return S._traverse(this, iterator, post) }

## instance.run (...input)

Execute the entire state machine either synchronously or asynchronously depending on the config.

run     (...input)      { return S._run(this, ...input) }

## instance.runSync (...input)

Execute the entire state machine synchronously.

runSync (...input)      { return S._runSync(this, ...input) }

## instance.runAsync (...input)

Execute the entire state machine asynchronously. Always returns a promise.

runAsync(...input)      { return S._runAsync(this, ...input) }

## instance.do(process) <default: null>

Defines a process to execute, overrides the existing process.

Returns a new instance.

```javascript
const instance = new S({ result: 'old' })
	.do({ result: 'new' })
return instance() // 'new'
```

do(process)             { return this.with(S.do(process)) }

## instance.defaults(defaults) <default: { result: null }>

Defines the initial state to be used for all executions.

Returns a new instance.

```javascript
const instance = new S()
	.defaults({ result: 'default' })
return instance() // 'default'
```

defaults(defaults)      { return this.with(S.defaults(defaults)) }

## instance.input(input) <default: (state => state)>

Allows the definition of the arguments the executable will use, and how they will be applied to the initial state.

Returns a new instance.

```javascript
const instance = new S(({ first, second }) => ({ [S.Return]: `${first} then ${second}` }))
	.defaults({ first: '', second: '' })
	.input((first, second) => ({ first, second }))
return instance('this', 'that') // 'this then that'
```

input(input)            { return this.with(S.input(input)) }

## instance.result(result) <default: (state => state.result)>

Allows the modification of the value the executable will return.

Returns a new instance.

```javascript
const instance = new S(({ myReturnValue }) => ({ myReturnValue: myReturnValue + ' extra' }))
	.result(state => state.myReturnValue)
return instance({ myReturnValue: 'start' }) // 'start extra'
```

result(result)          { return this.with(S.result(result)) }

## instance.unstrict <default>

Execute without checking state properties when a state change is made.

Creates a new instance.

```javascript
const instance = new S(() => ({ unknownVariable: false}))
	.defaults({ knownVariable: true })
	.strict
return instance() // Error
```

```javascript
const instance = new S(() => ({ unknownVariable: false}))
	.defaults({ knownVariable: true })
	.strict
	.unstrict
return instance() // Succeeds
```

get unstrict()          { return this.with(S.unstrict) }

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
return instance() // Error
```

get strict()            { return this.with(S.strict) }

## instance.strictTypes

Checking state property types when an state change is made.

Creates a new instance.

```javascript
const instance = new S(() => ({ knownVariable: 45 }))
	.defaults({ knownVariable: true })
	.strictTypes
return instance() // Error
```

get strictTypes()       { return this.with(S.strictTypes) }

## instance.for(iterations = 10000) <default: 10000>

Defines the maximum iteration limit.

Returns a new instance.

```javascript
const instance = new S(({ result }) => ({ result: result + 1}))
	.defaults({ result: 0 })
	.for(10)
const result = instance() // ?? // TODO: INCOMPLETE
```

for(iterations)         { return this.with(S.for(iterations)) }

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

until(until)            { return this.with(S.until(until)) }

## instance.forever

Removes the max iteration limit.

Creates a new instance.

```javascript
const instance = new S().forever
return instance.config.iterations // Infinity
```

get forever()           { return this.with(S.forever) }

## instance.step

Execute one action or directive at a time, and always return the full state (ignoring previous `instance.result` calls)

```javascript
const instance = new S([{ result: 'first' }, { result: 'second' }])
	.defaults({ result: 'initial' })
	.step
const result1 = instance()
const result2 = instance(result1)
const result3 = instance(result2)
return { result1, result2, result3 } // { result1: { result: 'initial' }, result2: { result: 'first' }, result3: { result: 'second' } }
```

get step()              { return this.with(S.step) }

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

get sync()              { return this.with(S.sync) }

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

get async()             { return this.with(S.async) }

## instance.delay(delay = 0) <default: 0>

Defines an initial delay before starting to execute the process.

Returns a new instance.

delay(delay)          { return this.with(S.delay(delay)) }

## instance.allow(allow = 1000) <default: 1000>

Defines the amount of time the process is allowed to run for before pausing.

Returns a new instance.

allow(allow)          { return this.with(S.allow(allow)) }

## instance.wait(wait = 0) <default: 0>

Defines the amount of time the process will pause for when the allowed time is exceeded.

Returns a new instance.

wait(wait)            { return this.with(S.wait(wait)) }

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

override(override)      { return this.with(S.override(override)) }

## instance.addNode(...nodes)

Allows for the addition of new node types.

Returns a new instance.

```javascript
const instance = new S()
const result = instance() // TODO: INCOMPLETE
```

addNode(...nodes)       { return this.with(S.addNode(...nodes)) }

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

adapt(...adapters)      { return this.with(S.adapt(...adapters)) }

## instance.adaptStart(...adapters)

Transforms the state before execution.

Returns a new instance.

```javascript
const instance = new S()
.adaptInput(state => ({
	...state,
	addedValue: 'new'
}))
const result = instance({ }) // TODO: INCOMPLETE
```

adaptStart(...adapters) { return this.with(S.adaptStart(...adapters)) }

## instance.adaptEnd(...adapters)

Transforms the state after execution.

Returns a new instance.

```javascript
const instance = new S()
const result = instance() // TODO: INCOMPLETE
```

adaptEnd(...adapters)   { return this.with(S.adaptEnd(...adapters)) }

## instance.with(...adapters)

Allows for the addition of predifined modules.

Returns a new instance.

```javascript
// const instance = new S()
// const result = instance() // TODO: INCOMPLETE
```

with(...transformers)   { return S.with(...transformers)(this) }

}

export const StateMachine = S

export const SuperSmallStateMachine = S

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
		(new S([
			({ counter }) => ({ counter: counter + 1 }),
			({ result, counter }) => ({ result: result * counter }),
			{
				if: ({ input, counter }) => counter < input,
				then: 0
			}
		]).defaults({
			result: 1,
			input: 1,
			counter: 0,
		})).step.input(({ subState, subPath }) => ({
			...subState,
			[S.Path]: subPath
		})).result(({ [S.Path]: subPath, [S.Return]: subDone = false, ...subState }) => ({
			subPath, subState, subDone
		})),
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

