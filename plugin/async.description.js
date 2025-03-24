
// TS(`static proceed${commonGenericDefinition}(this: Instance${commonGenericArguments}, action: Action, state: SystemState<State, Output>): SystemState<State, Output> | Promise<SystemState<State, Output>> {
// 	const stack = state[Stack] || [[]]
// 	if (stack[0].length === 0) {
// 		if (stack.length === 1) return { ...state, [Return]: state[Return] }
// 		const { [Return]: interruptReturn, ...cleanState } = state
// 		return { ...cleanState, [Stack]: stack.slice(1) }
// 	}
// 	const parPath = stack[0].slice(0,-1)
// 	return S._proceed(this, { ...state, [Stack]: [parPath, ...stack.slice(1)] }, get_path_object(this.process, parPath), false, stack[0][parPath.length])
// };`)
        
// D('Node NodeTypes',
// 	'The string names of node types, index by two-letter abbreviations',
// 	D('This reference table is exported by the library as `{ NodeTypes }`',
// 		E.exports('NodeTypes', testModule, './index.js'),
// 	),
// 	JS("export const NodeTypes = {"),
// 	TS("export enum NodeTypes {"),
// 	D('Executable Nodes',
// 		JS("CD: 'condition', SW: 'switch', WH: 'while',"),
// 		TS("CD = 'condition', SW = 'switch', WH = 'while',"),
// 		JS("MC: 'machine', SQ: 'sequence', FN: 'function',"),
// 		TS("MC = 'machine', SQ = 'sequence', FN = 'function',")
// 	),
// 	D('Action Nodes',
// 		JS("CH: 'changes', UN: 'undefined', EM: 'empty',"),
// 		TS("CH = 'changes', UN = 'undefined', EM = 'empty',"),
// 		JS("RT: 'return', ER: 'error',"),
// 		TS("RT = 'return', ER = 'error',"),
// 		JS("DR: 'goto',"),
// 		TS("DR = 'goto',"),
// 		D('Goto Nodes',
// 			JS("ID: 'interrupt-goto', AD: 'absolute-goto', MD: 'machine-goto', SD: 'sequence-goto',"),
// 			TS("ID = 'interrupt-goto', AD = 'absolute-goto', MD = 'machine-goto', SD = 'sequence-goto',")
// 		),
// 	),
// 	CS("}"),
// ),
// D('Key Words',
// 	'Key Words used by specific nodes',
// 	D('This reference table is exported by the library as `{ KeyWords }`',
// 		E.exports('KeyWords', testModule, './index.js'),
// 	),
// 	JS("export const KeyWords = {"),
// 	TS("export enum KeyWords {"),
// 	D("`'initial'` used by Machine Node",
// 		JS("IT: 'initial',"),
// 		TS("IT = 'initial',")
// 	),
// 	D("`'if'`, `'then'`, and `'else'` used by Condition Node",
// 		JS("IF: 'if', TN: 'then', EL: 'else',"),
// 		TS("IF = 'if', TN = 'then', EL = 'else',")
// 	),
// 	D("`'switch'`, `'case'`, and `'default'` used by Switch Node",
// 		JS("SW: 'switch', CS: 'case', DF: 'default',"),
// 		TS("SW = 'switch', CS = 'case', DF = 'default',")
// 	),
// 	D("`'while'` and `'do'` used by While Node",
// 		JS("WH: 'while', DO: 'do',"),
// 		TS("WH = 'while', DO = 'do',")
// 	),
// 	CS("}"),
// ),



// D('Interruptable',
// 	JS("export class Interruptable extends Promise {"),
// 	TS("export class Interruptable<Result, Interrupt> extends Promise<Result> {"),
// 	D('',
// 		JS("#interruptor = () => {}"),
// 		TS("private interruptor: (...interruptions: Array<Interrupt>) => void = () => {}"),
// 	),
// 	D('',
// 		JS("#settled = false"),
// 		TS("private settled: boolean = false"),
// 	),
// 	D('',
// 		JS("constructor(executorOrPromise, interruptor) {"),
// 		TS("constructor(executorOrPromise: Promise<Result> | ((resolve: ((arg: Result) => void), reject: ((arg: Error) => void)) => void), interruptor: (...interruptions: Array<Interrupt>) => void) {"),
// 		D('',
// 			JS("const settle = f => (...args) => {"),
// 			TS("const settle = <A extends Array<unknown> = Array<unknown>>(f: ((...args: A) => void)) => (...args: A): void => {"),
// 			D('',
// 				JS("this.#settled = true"),
// 				TS("this.settled = true"),
// 			),
// 			D('',
// 				CS("f(...args)"),
// 			),
// 			CS("}"),
// 		),
// 		D('',
// 			CS("if (typeof executorOrPromise === 'function') super((resolve, reject) => executorOrPromise(settle(resolve), settle(reject)))"),
// 		),
// 		D('',
// 			CS("else super((resolve, reject) => { Promise.resolve(executorOrPromise).then(settle(resolve)).catch(settle(reject)) })"),
// 		),
// 		D('',
// 			JS("this.#interruptor = interruptor"),
// 			TS("this.interruptor = interruptor"),
// 		),
// 		CS("}"),
// 	),
// 	D('',
// 		JS("interrupt(...interruptions) {"),
// 		TS("interrupt(...interruptions: Array<Interrupt>): void {"),
// 		D('',
// 			JS("if (this.#settled) throw new Error('A settled Interruptable cannot be interrupted.')"),
// 			TS("if (this.settled) throw new Error('A settled Interruptable cannot be interrupted.')"),
// 		),
// 		D('',
// 			JS("return this.#interruptor(...interruptions)"),
// 			TS("return this.interruptor(...interruptions)"),
// 		),
// 		CS("}"),
// 	),
// 	CS("}"),
// ),


// D('Key Words',
// 	JS("static keyWords    = KeyWords"),
// 	JS("static kw          = KeyWords"),
// 	TS("public static readonly keyWords: typeof KeyWords = KeyWords"),
// 	TS("public static readonly kw:       typeof KeyWords = KeyWords"),
// ),
// D('Node NodeTypes',
// 	JS("static nodeTypes   = NodeTypes"),
// 	JS("static types       = NodeTypes"),
// 	TS("public static readonly nodeTypes:typeof NodeTypes = NodeTypes"),
// 	TS("public static readonly types:    typeof NodeTypes = NodeTypes")
// ),
// D('All the defaults nodes together in one list.',
// 	CS("static nodes = [ Changes, Sequence, FunctionN, Undefined, Empty, Condition, Switch, While, Machine, Goto, InterruptGoto, AbsoluteGoto, MachineGoto, SequenceGoto, Return, ]"),
// ),


// D('S._run (instance, ...input)',
// 	'Execute the entire process either synchronously or asynchronously depending on the config.',
// 	D('Will execute the process',
// 		E.equals(() => {
// 			const instance = new S({ [Return]: 'return value' })
// 			return S._run(instance)
// 		}, 'return value'),
// 	),
// 	// D('Will execute the process in async mode if it is configured',
// 	// 	E.equals(() => {
// 	// 		const instance = new S(() => Promise.resolve({ [Return]: 'return value' }))
// 	// 			.with(asyncPlugin)
// 	// 		return S._run(instance)
// 	// 	}, 'return value'),
// 	// ),
// 	D('Will not handle promises in sync mode',
// 		E.equals(() => {
// 			const instance = new S(() => Promise.resolve({ [Return]: 'return value' }))
// 			return S._run(instance)
// 		}, undefined),
// 	),
// 	D('Is the same as running the executable instance itself',
// 		E.equals(() => {
// 			const instance = new S({ [Return]: 'return value' })
// 			return S._run(instance) === instance()
// 		}, true),
// 	),
// 	D('Takes the same arguments as the executable instance itself',
// 		E.equals(() => {
// 			const instance = new S(({ a, b, c }) => ({ [Return]: `${a} + ${b} - ${c}` }))
// 				.input((a, b, c) => ({ a, b, c }))
// 			return S._run(instance, 1, 2, 3) === instance(1, 2, 3)
// 		}, true),
// 	),
// 	JS("static _run (instance, ...input) {"),
// 	TS(`public static _run${commonGenericDefinition}(instance: Instance${commonGenericArguments}, ...input: Input): Output {`),
// 	D('If the process is asynchronous, execute use `runAsync`',
// 		JS("if (instance.config.async) return this._runAsync(instance, ...input)"),
// 		TS("if (instance.config.async) return this._runAsync(instance, ...input) as Output"),
// 	),
// 	D('If the process is asynchronous, execute use `runSync`',
// 		CS("return this._runSync(instance, ...input)"),
// 	),
// 	CS("}"),
// ),


// D('S._runAsync (instance, ...input)',
// 	'Execute the entire process asynchronously. Always returns a promise.',
// 	D('Will execute the process',
// 		E.equals(() => {
// 			const instance = new S({ [Return]: 'return value' })
// 			return S._runAsync(instance)
// 		}, 'return value'),
// 	),
// 	D('Will execute the process in async mode',
// 		E.equals(() => {
// 			const instance = new S(() => Promise.resolve({ [Return]: 'return value' }))
// 				.with(asyncPlugin)
// 			return S._runAsync(instance)
// 		}, 'return value'),
// 	),
// 	D('Will still handle promises even in sync mode',
// 		E.equals(() => {
// 			const instance = new S(() => Promise.resolve({ [Return]: 'return value' }))
// 			return S._runAsync(instance)
// 		}, 'return value'),
// 	),
// 	D('Is the same as running the executable instance itself',
// 		E.equals(async () => {
// 			const instance = new S({ [Return]: 'return value' })
// 			return await S._runAsync(instance) === instance()
// 		}, true),
// 	),
// 	D('Takes the same arguments as the executable instance itself',
// 		E.equals(async () => {
// 			const instance = new S(({ a, b, c }) => ({ [Return]: `${a} + ${b} - ${c}` }))
// 				.input((a, b, c) => ({ a, b, c }))
// 			return await S._runAsync(instance, 1, 2, 3) === instance(1, 2, 3)
// 		}, true),
// 	),
// 	JS("static _runAsync (instance, ...input) {"),
// 	TS(`public static _runAsync${commonGenericDefinition}(instance: Instance${commonGenericArguments}, ...input: Input): Promise<Output> {`),
// 		JS(`let interruptionStack = []`),
// 		TS(`let interruptionStack: Array<Symbol> = []`),
// 		JS(`return new Interruptable((async () => {`),
// 		TS(`return new Interruptable<Output, Symbol>((async () => {`),
// 	D('Extract the useful parts of the config',
// 		CS("const { pause, until, iterations, input: adaptInput, output: adaptOutput, before, after, defaults, trace } = { ...this.config, ...instance.config }"),
// 	),
// 	D('Turn the arguments into an initial condition',
// 		CS("const modifiedInput = (await adaptInput.apply(instance, input)) || {}"),
// 	),
// 	D('Merge the initial condition with the default initial state',
// 		CS("let r = 0, currentState = { ...before.reduce((prev, modifier) => modifier.call(instance, prev), this._changes(instance, {"),
// 		D('Default to an empty change object',
// 			CS("[Changes]: {},"),
// 		),
// 		D('Use the defaults as an initial state',
// 			CS("...defaults,"),
// 		),
// 		D('Use the path from the initial state - allows for starting at arbitrary positions',
// 			CS("[Stack]: modifiedInput[Stack] || [[]], [Trace]: modifiedInput[Trace] || [],"),
// 		),
// 		D('Use the path from the initial state - allows for starting at arbitrary positions',
// 			CS("...(Return in modifiedInput ? {[Return]: modifiedInput[Return]} : {})"),
// 		),
// 		JS("}, modifiedInput)), [Changes]: {} }"),
// 		TS("} as SystemState<State, Output>, modifiedInput)), [Changes]: {} }")
// 	),
// 	D('Repeat for a limited number of iterations.',
// 		CS("while (r < iterations) {"),
// 		'This should be fine for most finite machines, but may be too little for some constantly running machines.',
// 		D('Pause execution based on the pause customisation method',
// 			CS(`const pauseExecution = pause.call(instance, currentState, r)`),
// 			CS(`if (pauseExecution) await pauseExecution;`),
// 		),
// 		D('Check the configured `until` condition to see if we should exit.',
// 			CS("if (until.call(instance, currentState, r)) break;"),
// 		),
// 		D('If the interaction are exceeded, throw MaxIterationsError',
// 			CS("if (++r >= iterations) throw new MaxIterationsError(`Maximum iterations of ${iterations} reached at path [ ${currentState[Stack][0].map(key => key.toString()).join(', ')} ]`, { instance, state: currentState, data: { iterations } })"),
// 		),
// 		D('If stack trace is enabled, push the current path to the stack',
// 			CS("if (trace) currentState = { ...currentState, [Trace]: [ ...currentState[Trace], currentState[Stack] ] }")
// 		),
        
// 		D('If there are interruptions, perform them one by one',
// 			JS("if (interruptionStack.length) currentState = await this._perform(instance, currentState, interruptionStack.shift())"),
// 			TS("if (interruptionStack.length) currentState = await this._perform(instance, currentState, interruptionStack.shift() as Action)"),
// 		),
// 		D('If there are no interruptions, execute the process as normal',
// 			CS("else {"),
// 			D('Execute the current node on the process, returning the action to perform',
// 				CS("const action = await this._execute(instance, currentState)")
// 			),
// 			D('Perform any required actions. Updating the currentState',
// 				CS("currentState = await this._perform(instance, currentState, action)")
// 			),
// 			D('Proceed to the next action',
// 				CS("currentState = await this._proceed(instance, currentState, action, true)")
// 			),
// 			CS("}"),
// 		),
// 		CS("}"),
// 	),
// 	D('When returning, run the ends state adapters, then the output adapter to complete execution.',
// 		CS("return adaptOutput.call(instance, after.reduce((prev, modifier) => modifier.call(instance, prev), currentState))"),
// 	),
// 	CS(`})(), (...interruptions) => {
// 		if (interruptions.length === 1 && instance.config.nodes.typeof(interruptions[0]) === NodeTypes.ID)
// 			interruptionStack.push(interruptions[0])
// 		else {
// 			const interruption = Symbol("System Interruption")
// 			instance.process[interruption] = interruptions
// 			interruptionStack.push(interruption)
// 		}
// 	})`),
// 	CS("}"),
// ),


// D('Return `null` (unsuccessful) if the root node is reached',
// 	CS("if (path.length === 0) return null"),
// ),
// D('Get the next closest ancestor that can be proceeded',
// 	CS("const parPath = path.slice(0,-1)"),
// ),
// D('Determine what type of node the ancestor is',
// 	CS("const parType = instance.config.nodes.typeof(get_path_object(instance.process, parPath))"),
// ),
// D('If the node is unrecognised, throw a TypeEror',
// 	CS("if (!parType) throw new NodeTypeError(`Unknown node type: ${typeof get_path_object(instance.process, parPath)}${parType ? `, nodeType: ${String(parType)}` : ''} at [ ${parPath.map(key => key.toString()).join(', ')} ]`, { instance, state, path: parPath, data: { node: get_path_object(instance.process, parPath) } })"),
// ),
// D('Call the `proceed` method of the ancestor node to get the next path.',
// 	JS("const proceedResult = instance.config.nodes.get(parType).proceed.call(instance, parPath, state, path)"),
// 	TS("const proceedResult = instance.config.nodes.get(parType)!.proceed.call(instance as any, parPath, state, path)"),
// ),
// D('If there a next path, return it',
// 	CS("if (proceedResult !== undefined) return proceedResult"),
// ),
// D('Proceed updwards through the tree and try again.',
// 	CS("return this._proceed(instance, state, parPath)"),
// ),

// D('Do not allow for asynchronous actions by default',
// 	CS("pause: () => false,"),
// ),
// D('Do not allow for asynchronous actions by default',
// 	CS("async: false,"),
// ),


// D('Will not handle promises even if it is configured',
// 	E.equals(() => {
// 		const instance = new S(() => Promise.resolve({ [Return]: 'return value' }))
// 		.with(asyncPlugin)
// 		return S._runSync(instance)
// 	}, undefined),
// ),


// D('S.runSync (...input)',
// 	'Execute the entire process synchronously.',
// 	D('Will execute the process',
// 		E.equals(() => {
// 			const instance = new S({ [Return]: 'return value' })
// 			return S.runSync()(instance)
// 		}, 'return value'),
// 	),
// 	// D('Will not handle promises even if it is configured',
// 	// 	E.equals(() => {
// 	// 		const instance = new S(() => Promise.resolve({ [Return]: 'return value' }))
// 	// 		.with(asyncPlugin)
// 	// 		return S.runSync()(instance)
// 	// 	}, undefined),
// 	// ),
// 	D('Will not handle promises in sync mode',
// 		E.equals(() => {
// 			const instance = new S(() => Promise.resolve({ [Return]: 'return value' }))
// 				.sync
// 			return S.runSync()(instance)
// 		}, undefined),
// 	),
// 	D('Is the same as running the executable instance itself',
// 		E.equals(() => {
// 			const instance = new S({ [Return]: 'return value' })
// 			return S.runSync()(instance) === instance()
// 		}, true),
// 	),
// 	D('Takes the same arguments as the executable instance itself',
// 		E.equals(() => {
// 			const instance = new S(({ a, b, c }) => ({ [Return]: `${a} + ${b} - ${c}` }))
// 				.input((a, b, c) => ({ a, b, c }))
// 			return S.runSync(1, 2, 3)(instance) === instance(1, 2, 3)
// 		}, true),
// 	),
// 	JS("static runSync(...input)           { return instance => this._runSync(instance, ...input) }"),
// 	TS(`static runSync${commonGenericDefinition}(...input: Input) { return (instance: Instance${commonGenericArguments}): Output => this._runSync(instance, ...input) }`)
// ),
// D('S.runAsync (...input)',
// 	'Execute the entire process asynchronously. Always returns a promise.',
// 	D('Will execute the process',
// 		E.equals(() => {
// 			const instance = new S({ [Return]: 'return value' })
// 			return S.runAsync()(instance)
// 		}, 'return value'),
// 	),
// 	D('Will execute the process in async mode',
// 		E.equals(() => {
// 			const instance = new S(() => Promise.resolve({ [Return]: 'return value' }))
// 			.with(asyncPlugin)
// 			return S.runAsync()(instance)
// 		}, 'return value'),
// 	),
// 	D('Will still handle promises even in sync mode',
// 		E.equals(() => {
// 			const instance = new S(() => Promise.resolve({ [Return]: 'return value' }))
// 				.sync
// 			return S.runAsync()(instance)
// 		}, 'return value'),
// 	),
// 	D('Is the same as running the executable instance itself',
// 		E.equals(async () => {
// 			const instance = new S({ [Return]: 'return value' })
// 			return await S.runAsync()(instance) === instance()
// 		}, true),
// 	),
// 	D('Takes the same arguments as the executable instance itself',
// 		E.equals(async () => {
// 			const instance = new S(({ a, b, c }) => ({ [Return]: `${a} + ${b} - ${c}` }))
// 				.input((a, b, c) => ({ a, b, c }))
// 			return await S.runAsync(1, 2, 3)(instance) === instance(1, 2, 3)
// 		}, true),
// 	),
// 	JS("static runAsync(...input)          { return instance => this._runAsync(instance, ...input) }"),
// 	TS(`static runAsync${commonGenericDefinition}(...input: Input) { return (instance: Instance${commonGenericArguments}): Promise<Output> => this._runAsync(instance, ...input) }`)
// ),


// D('S.sync <default>',
// 	'Execute synchronously and not allow for asynchronous actions.',
// 	'Will modify the given instance.',
// 	E.is(() => {
// 		const instance = new S(async () => ({ [Return]: 'returned' }))
// 		.with(
// 			S.async,
// 			S.sync,
// 		)
// 		return instance()
// 	}, undefined),
// 	JS("static sync                                   (instance) { return ({ process: instance.process, config: { ...instance.config, async: false }, }) }"),
// 	TS(`static sync${commonGenericDefinition} (instance: Instance${commonGenericArguments}): Pick<S<State, Awaited<Output>, Input, Action, Process>, 'process' | 'config'> { return ({ process: instance.process, config: { ...instance.config, async: false } as unknown as Config<State, Awaited<Output>, Input, Action, Process>, }) }`)
// ),
// D('S.async',
// 	'Execute asynchronously and allow for asynchronous actions.',
// 	'Will modify the given instance.',
// 	E.is(() => {
// 		const instance = new S(async () => ({ [Return]: 'returned' }))
// 		return instance()
// 	}, undefined),
// 	E.is(async () => {
// 		const instance = new S(async () => ({ [Return]: 'returned' }))
// 		.with(
// 			S.async
// 		)
// 		return await instance()
// 	}, 'returned'),
// 	JS("static async                                  (instance) { return ({ process: instance.process, config: { ...instance.config, async: true }, }) }"),
// 	TS(`static async${commonGenericDefinition} (instance: Instance${commonGenericArguments}): Pick<S<State, Promise<Output>, Input, Action, Process>, 'process' | 'config'> { return ({ process: instance.process, config: { ...instance.config, async: true } as unknown as Config<State, Promise<Output>, Input, Action, Process>, }) }`),
// ),
// D('S.pause(pause) <default: (() => false)>',
// 	'Allows an async execution to be paused between steps.',
// 	'Returns a function that will modify a given instance.',
// 	JS("static pause(pause = S.config.pause)         { return instance => ({ process: instance.process, config: { ...instance.config, pause }, }) }"),
// 	TS(`static pause${commonGenericDefinition}(pause: Config${commonGenericArguments}['pause']) { return (instance: Instance${commonGenericArguments}): Instance${commonGenericArguments} => ({ process: instance.process, config: { ...instance.config, pause }, }) }`)
// ),

// D('instance.runSync (...input)',
// 	'Execute the entire process synchronously.',
// 	D('Will execute the process',
// 		E.equals(() => {
// 			const instance = new S({ [Return]: 'return value' })
// 			return instance.run()
// 		}, 'return value'),
// 	),
// 	D('Will not handle promises even if it is configured',
// 		E.equals(() => {
// 			const instance = new S(() => Promise.resolve({ [Return]: 'return value' }))
// 				.with(asyncPlugin)
// 			return instance.run()
// 		}, undefined),
// 	),
// 	D('Will not handle promises in sync mode',
// 		E.equals(() => {
// 			const instance = new S(() => Promise.resolve({ [Return]: 'return value' }))
// 			return instance.runSync()
// 		}, undefined),
// 	),
// 	D('Is the same as running the executable instance itself',
// 		E.equals(() => {
// 			const instance = new S({ [Return]: 'return value' })
// 			return instance.runSync() === instance()
// 		}, true),
// 	),
// 	D('Takes the same arguments as the executable instance itself',
// 		E.equals(() => {
// 			const instance = new S(({ a, b, c }) => ({ [Return]: `${a} + ${b} - ${c}` }))
// 				.input((a, b, c) => ({ a, b, c }))
// 			return instance.runSync(1, 2, 3) === instance(1, 2, 3)
// 		}, true),
// 	),
// 	JS("runSync (...input)      { return S._runSync(this, ...input) }"),
// 	TS("runSync (...input: Input): Output { return S._runSync(this, ...input) }")
// ),
// D('instance.runAsync (...input)',
// 	'Execute the entire process asynchronously. Always returns a promise.',
// 	D('Will execute the process',
// 		E.equals(() => {
// 			const instance = new S({ [Return]: 'return value' })
// 			return instance.runAsync()
// 		}, 'return value'),
// 	),
// 	D('Will execute the process in async mode',
// 		E.equals(() => {
// 			const instance = new S(() => Promise.resolve({ [Return]: 'return value' }))
// 				.with(asyncPlugin)
// 			return instance.runAsync()
// 		}, 'return value'),
// 	),
// 	D('Will still handle promises even in sync mode',
// 		E.equals(() => {
// 			const instance = new S(() => Promise.resolve({ [Return]: 'return value' }))
// 			return instance.runAsync()
// 		}, 'return value'),
// 	),
// 	D('Is the same as running the executable instance itself',
// 		E.equals(async () => {
// 			const instance = new S({ [Return]: 'return value' })
// 			return await instance.runAsync() === instance()
// 		}, true),
// 	),
// 	D('Takes the same arguments as the executable instance itself',
// 		E.equals(async () => {
// 			const instance = new S(({ a, b, c }) => ({ [Return]: `${a} + ${b} - ${c}` }))
// 				.input((a, b, c) => ({ a, b, c }))
// 			return await instance.runAsync(1, 2, 3) === instance(1, 2, 3)
// 		}, true),
// 	),
// 	JS("runAsync(...input)      { return S._runAsync(this, ...input) }"),
// 	TS("runAsync(...input: Input): Promise<Output> { return S._runAsync(this, ...input) }")
// ),


// D('instance.sync <default>',
// 	'Execute synchronously and not allow for asynchronous actions.',
// 	'Creates a new instance.',
// 	E.is(() => {
// 		const instance = new S(async () => ({ [Return]: 'returned' }))
// 			.with(asyncPlugin)
// 			.sync
// 		return instance()
// 	}, undefined),
// 	JS("get sync()              { return this.with(S.sync) }"),
// 	TS("get sync(): S<State, Awaited<Output>, Input, Action, Process> { return this.with(S.sync) }"),
// ),
// D('instance.async',
// 	'Execute asynchronously and allow for asynchronous actions.',
// 	'Creates a new instance.',
// 	E.is(() => {
// 		const instance = new S(async () => ({ [Return]: 'returned' }))
// 		return instance()
// 	}, undefined),
// 	E.is(async () => {
// 		const instance = new S(async () => ({ [Return]: 'returned' }))
// 			.async
// 		return await instance()
// 	}, 'returned'),
// 	JS("get async()             { return this.with(S.async) }"),
// 	TS("get async(): S<State, Promise<Output>, Input, Action, Process> { return this.with(S.async) }")
// ),
// D('instance.pause(pause) <default: (() => false)>',
// 	'Allows an async execution to be paused between steps.',
// 	'Returns a new instance.',
// 	JS("pause(pause)            { return this.with(S.pause(pause)) }"),
// 	TS(`pause(pause: Config${commonGenericArguments}['pause']): S${commonGenericArguments} { return this.with(S.pause(pause)) }`)
// ),


// D('Cannot perform parallel actions when not using async.',
// 	E.is(() => {
// 		const instance = new S([
// 			({ input }) => ({ input: input - 1 }),
// 			parallel({
// 				if: ({ input }) => input > 5,
// 				then: [
// 					({ result, input }) => ({ result: [...result,input] }),
// 					({ input }) => ({ input: input - 1 }),
// 				],
// 			},
// 			{
// 				if: ({ input }) => input > 5, 
// 				then: [
// 					({ result, input }) => ({ result: [...result,input] }),
// 					({ input }) => ({ input: input - 1 }),
// 				],
// 			}),
// 			{
// 				if: ({ input }) => input > 0,
// 				then: 0,
// 			},
// 			({ result }) => ({ [Return]: result.join('_') })
// 		])
// 			.defaults({
// 				input: 0,
// 				result: []
// 			})
// 			.with(parallelPlugin)
// 		return instance({
// 			input: 10 
// 		})
// 	}, '9_8_6')
// ),