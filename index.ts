import defaultNodes from "./default-nodes";
import {  InitialState, MaxIterationsError,  Path, RunConfig, SuperSmallStateMachine, TransformerContext,  RelativeGOTOUnit, Plugin, NodeDefinition, NodeDefinitions, SystemState, InputSystemState, Keywords, ProcessNode, ActionTypeError, ContextReferenceError, ContextTypeError } from "./types";

export const clone_object = <T extends unknown = unknown>(obj: T): T => {
	if (Array.isArray(obj)) return obj.map(clone_object) as T
	if (obj === null) return null as T
	if (typeof obj !== 'object') return obj
	return Object.fromEntries(Object.entries(obj).map(([key,value]) => [ key, clone_object(value) ])) as T;
}
export const unique_list_strings = <T extends unknown = unknown>(list: Array<T>, getId: ((item: T) => string) = item => item as string): Array<T> => Object.values(Object.fromEntries(list.map(item=>[getId(item),item])));
const reduce_get_path_object = <T extends unknown = unknown, O extends unknown = unknown>(obj: T | O | undefined, step: RelativeGOTOUnit): T | undefined => obj ? obj[step] : undefined
export const get_path_object = <T extends unknown = unknown, O extends unknown = unknown>(object: O, path: Path): undefined | T => (path.reduce(reduce_get_path_object<T,O>, object) as (T | undefined))
export const normalise_function = (functOrReturn: Function | unknown): Function => (typeof functOrReturn === 'function') ? functOrReturn : () => functOrReturn
const reduce_deep_merge_object = <T extends unknown = unknown>(base: T, override: unknown): T => {
	if (!((base && typeof base === 'object') && !Array.isArray(base)
	&& (override && typeof override === 'object') && !Array.isArray(override)))
		return override as T;
	const allKeys = unique_list_strings(Object.keys(base).concat(Object.keys(override)));
	return Object.fromEntries(allKeys.map(key => [
		key, key in override ? deep_merge_object(base[key], override[key]) : base[key]
	])) as T;
}
export const deep_merge_object = <T extends unknown = unknown>(base: T, ...overrides: Array<unknown>): T => overrides.reduce(reduce_deep_merge_object<T>, base)
export const wait_time = (delay: number): Promise<void> => (delay ? new Promise(resolve => setTimeout(resolve, delay)) : Promise.resolve())

export default class S<
	UserState extends InitialState = InitialState,
	Return extends unknown = UserState[Keywords.RS],
	Arguments extends Array<unknown> = Array<unknown>,
	Process extends unknown = ProcessNode<UserState>,
>
extends SuperSmallStateMachine<UserState, Return, Arguments, Process>
implements SuperSmallStateMachine<UserState, Return, Arguments, Process> 
{
	static runConfig: RunConfig = {
		initialState: { [S.kw.RS]: null },
		iterations: 10000,
		until: result => S.return in result,
		strictContext: false,
		runMethod: null,
		inputModifier: a => a as Partial<InputSystemState<InitialState>>,
		outputModifier: (a: SystemState<InitialState>) => a[S.kw.RS],
		async: false,
		nodes: new NodeDefinitions(defaultNodes.map(node => [node.name,node]) as unknown as []),
		// Special settings for async
		delay: 0,
		allow: 1000,
		wait: 0,
	}

	static applyChanges<UserState extends InitialState = InitialState>(state: SystemState<UserState>, changes: Partial<UserState> = {}): SystemState<UserState> {
		if (state[S.strict]) {
			if (Object.entries(changes).some(([name]) => !(name in state)))
				throw new ContextReferenceError(`Only properties that exist on the initial context may be updated.\nYou changed [ ${Object.keys(changes).filter(property => !(property in state)).join(', ')} ], which ${Object.keys(changes).filter(property => !(property in state)).length === 1 ? 'is' : 'are'} not in: [ ${Object.keys(state).join(', ')} ].\nPath: [ ${state[S.path]?.join(' / ')} ]`)
			if (state[S.strict] === S.strictTypes) {
				if (Object.entries(changes).some(([name,value]) => typeof value !== typeof state[name]))
					throw new ContextTypeError()//`Only properties that exist on the initial context may be updated.\nYou changed [ ${Object.keys(changes).filter(property => !(property in state)).join(', ')} ], which ${Object.keys(changes).filter(property => !(property in state)).length === 1 ? 'is' : 'are'} not in: [ ${Object.keys(state).join(', ')} ].\nPath: [ ${state[S.path].join(' / ')} ]`)
			}
		}
		const allChanges = deep_merge_object(state[S.changes] || {}, changes)
		return {
			...deep_merge_object(state, allChanges),
			[S.path]: state[S.path],
			[S.changes]: allChanges
		}
	}

	static actionName<Process extends unknown = ProcessNode>(process: Process, path: Path = []): string | undefined {
		const method = get_path_object<{name:string}>(process, path)
		return method && method.name
	}
	static lastOf<Process extends unknown = ProcessNode>(process: Process, path: Path = [], condition: ((item: Process, path: Path, process: Process) => boolean) = () => true): Path | null {
		const item = get_path_object<Process>(process, path)!
		if (condition(item, path, process)) return path
		if (path.length === 0) return null
		return S.lastOf(process, path.slice(0,-1), condition)
	}

	static lastNode<
		UserState extends InitialState = InitialState,
		Return extends unknown = UserState[Keywords.RS],
		Arguments extends Array<unknown> = Array<unknown>,
		Process extends unknown = ProcessNode<UserState>,
	>(instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Process>, 'process' | 'nodes'>, path: Path = [], ...nodeTypes: Array<NodeDefinition['name'] | Array<NodeDefinition['name']>>): Path | null {
		const flatNodeTypes = nodeTypes.flat(Infinity)
		return S.lastOf(instance.process, path, i => {
			const nodeType = instance.nodes.isNode(i)
			return Boolean(nodeType && flatNodeTypes.includes(nodeType))
		})
	}
	static nextPath<
		UserState extends InitialState = InitialState,
		Return extends unknown = UserState[Keywords.RS],
		Arguments extends Array<unknown> = Array<unknown>,
		Process extends unknown = ProcessNode<UserState>,
	>(instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Process>, 'process' | 'nodes'>, state: SystemState<UserState> = ({} as SystemState<UserState>), path: Path = state[S.path] || []): Path | null {
		if (path.length === 0) return null
		const parPath = S.lastNode<UserState, Return, Arguments, Process>(instance, path.slice(0,-1), [...instance.nodes.values()].filter(({ nextPath }) => nextPath).map(({ name }) => name))
		if (!parPath) return null
		const parActs = get_path_object<Process>(instance.process, parPath)
		const parType = instance.nodes.isNode(parActs)
		const nodeDefinition = parType && instance.nodes.get(parType)
		if (!(nodeDefinition && nodeDefinition.nextPath)) return null
		const result = nodeDefinition.nextPath(parPath, instance, state, path)
		if (result !== undefined)
			return result
		return S.nextPath(instance, state, parPath)
	}
	static advance<
		UserState extends InitialState = InitialState,
		Return extends unknown = UserState[Keywords.RS],
		Arguments extends Array<unknown> = Array<unknown>,
		Process extends unknown = ProcessNode<UserState>,
	>(instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Process>, 'process' | 'nodes'>, state: SystemState<UserState>, output: Process = (null as Process)): SystemState<UserState> {
		const path = state[S.path] || []
		const nodeType = instance.nodes.isNode(output)
		const nodeDefinition = nodeType && instance.nodes.get(nodeType)
		if (nodeDefinition && nodeDefinition.advance)
			return nodeDefinition.advance(output, instance, state)
		throw new ActionTypeError(`Unknown output or action type: ${typeof output}${nodeType ? `, nodeType: ${String(nodeType)}` : ''} at [ ${path.join(', ')} ]`)
	}
	static execute<
		UserState extends InitialState = InitialState,
		Return extends unknown = UserState[Keywords.RS],
		Arguments extends Array<unknown> = Array<unknown>,
		Process extends unknown = ProcessNode<UserState>,
	>(instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Process>, 'process' | 'nodes' | 'runConfig'>, state: SystemState<UserState> = ({} as SystemState<UserState>)): Process {
		const path = state[S.path] || []
		const node = get_path_object<Process>(instance.process, path)!
		const nodeType = instance.nodes.isNode(node)
		const nodeDefinition = nodeType && instance.nodes.get(nodeType)
		if (nodeDefinition && nodeDefinition.execute)
			return nodeDefinition.execute(node, instance, state) as Process
		return node
	}
	static traverse<
		UserState extends InitialState = InitialState,
		Return extends unknown = UserState[Keywords.RS],
		Arguments extends Array<unknown> = Array<unknown>,
		Process extends unknown = ProcessNode<UserState>,
	>(
		iterator: ((item: Process, path: Path, instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Process>, 'process' | 'nodes'>) => Process) = a => a,
		post:     ((item: Process, path: Path, instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Process>, 'process' | 'nodes'>) => Process) = b => b
	): ((instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Process>, 'process' | 'nodes'>, path?: Path) => Process) {
		const iterate = (instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Process>, 'process' | 'nodes'>, path: Path = []): Process => {
			const item = get_path_object<Process>(instance.process, path)!
			const nodeType = instance.nodes.isNode(item)
			const nodeDefinition = nodeType && instance.nodes.get(nodeType)
			if (nodeDefinition && nodeDefinition.traverse)
				return nodeDefinition.traverse(item, path, instance, iterate, post)
			return iterator(item, path, instance)
		}
		return iterate
	}
	static async execAsync<
		UserState extends InitialState = InitialState,
		Return extends unknown = UserState[Keywords.RS],
		Arguments extends Array<unknown> = Array<unknown>,
		Process extends unknown = ProcessNode<UserState>,
	>(instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Process>, 'process' | 'nodes' | 'runConfig'>, ...input: Arguments): Promise<Return> {
		const { delay, allow, wait, until, iterations, inputModifier, outputModifier, strictContext, initialState: state } = { ...S.runConfig, ...instance.runConfig }
		const modifiedInput = (await inputModifier.apply(this, input)) || {}
		if (delay) await wait_time(delay)
		let r = 0, startTime = Date.now(), currentState = S.applyChanges<UserState>({
			[S.changes]: {},
			...state,
			[S.path]: modifiedInput[S.path] || [],
			[S.strict]: strictContext
		}, modifiedInput)
		while (r < iterations) {
			if (until(currentState)) break;
			if (++r >= iterations)
				throw new MaxIterationsError(`Maximim iterations of ${iterations} reached at path [ ${currentState[S.path]?.join(', ')} ]`)
			currentState = S.advance<UserState, Return, Arguments, Process>(instance, currentState, await S.execute<UserState, Return, Arguments, Process>(instance, currentState))
			if (allow > 0 && r % 10 === 0) {
				const nowTime = Date.now()
				if (nowTime - startTime >= allow) {
					await wait_time(wait)
					startTime = Date.now()
				}
			}
		}
		return outputModifier(currentState)
	}

	static exec<
		UserState extends InitialState = InitialState,
		Return extends unknown = UserState[Keywords.RS],
		Arguments extends Array<unknown> = Array<unknown>,
		Process extends unknown = ProcessNode<UserState>,
	>(instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Process>, 'process' | 'nodes' | 'runConfig'>, ...input: Arguments): Return {
		const { until, iterations, inputModifier, outputModifier, strictContext, initialState: state  } = { ...S.runConfig, ...instance.runConfig }
		const modifiedInput = inputModifier.apply(this, input) || {}
		let r = 0, currentState = S.applyChanges<UserState>({
			[S.changes]: {},
			...state,
			[S.path]: modifiedInput[S.path] || [],
			[S.strict]: strictContext
		}, modifiedInput)
		while (r < iterations) {
			if (until(currentState)) break;
			if (++r > iterations)
				throw new MaxIterationsError(`Maximim iterations of ${iterations} reached at path [ ${currentState[S.path]?.join(', ')} ]`)
			currentState = S.advance<UserState, Return, Arguments, Process>(instance, currentState, S.execute<UserState, Return, Arguments, Process>(instance, currentState))
		}
		return outputModifier(currentState)
	}
	static run<
		UserState extends InitialState = InitialState,
		Return extends unknown = UserState[Keywords.RS],
		Arguments extends Array<unknown> = Array<unknown>,
		Process extends unknown = ProcessNode<UserState>,
	>(instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Process>, 'process' | 'nodes' | 'runConfig'>, ...input: Arguments): Return {
		const { async: isAsync } = { ...S.runConfig, ...instance.runConfig }
		if (isAsync) return S.execAsync<UserState, Return, Arguments, Process>(instance, ...input) as Return
		return S.exec<UserState, Return, Arguments, Process>(instance, ...input)
	}

	process: Process
	protected _runConfig: RunConfig<UserState, Return, Arguments, Process>// = S.runConfig
	get nodes() {
		return this._runConfig.nodes
	}
	get runConfig(): RunConfig<UserState, Return, Arguments, Process> {
		return { ...this._runConfig }
	}
	get initialState(): UserState {
		return clone_object(this._runConfig.initialState)
	}

	constructor(process: Process, runConfig: Partial<RunConfig<UserState, Return, Arguments, Process>> = S.runConfig as unknown as RunConfig<UserState, Return, Arguments, Process>) {
		super((...argumentsList: Arguments): Return => (runConfig.runMethod || this.run).apply(this, argumentsList))
		this._runConfig = {
			...S.runConfig,
			...this._runConfig,
			...runConfig
		}
		this.process = process
	};

	isNode(object: unknown, objectType: (typeof object)): false | NodeDefinition['name'] {
		return this.nodes.isNode(object, objectType)
	}
	applyChanges(state: SystemState<UserState>, changes: Partial<UserState>): SystemState<UserState> {
		return S.applyChanges<UserState>(state, changes)
	}

	actionName(path: Path): string | undefined {
		return S.actionName(this.process, path)
	}
	lastOf(path: Path, condition: ((item: Process, path: Path, process: Process) => boolean)): Path | null {
		return S.lastOf<Process>(this.process, path, condition)
	}
	
	lastNode(path: Path, ...nodeTypes: Array<NodeDefinition['name'] | Array<NodeDefinition['name']>>): Path | null {
		return S.lastNode<UserState, Return, Arguments, Process>(this, path, ...nodeTypes)
	}
	nextPath(state: SystemState<UserState>, path: Path = state[S.path] || []):  Path | null {
		return S.nextPath<UserState, Return, Arguments, Process>(this, state, path)
	}
	advance(state: SystemState<UserState>, output: Process): SystemState<UserState> {
		return S.advance<UserState, Return, Arguments, Process>(this, state, output)
	}
	execute(state: SystemState<UserState>): Process {
		return S.execute<UserState, Return, Arguments, Process>(this, state)
	}

	exec(...input: Arguments): Return {
		return S.exec<UserState, Return, Arguments, Process>(this, ...input)
	}
	execAsync(...input: Arguments): Promise<Return> {
		return S.execAsync<UserState, Return, Arguments, Process>(this, ...input)
	}
	run (...input: Arguments): Return {
		return S.run<UserState, Return, Arguments, Process>(this, ...input)
	}

	// These are effectively runConfig "setters"
	plugin(...transformers: Array<Plugin<UserState, Return, Arguments, Process>>): S<UserState, Return, Arguments, Process> {
		const transformed = transformers.reduce((transformed: TransformerContext<UserState, Return, Arguments, Process>, transformer: Plugin<UserState, Return, Arguments, Process>): TransformerContext<UserState, Return, Arguments, Process> => {
			if (typeof transformer === 'function') {
				return {
					...transformed,
					...transformer({ ...transformed }),
				}
			} else if (typeof transformer === 'object') {
				return {
					...transformed,
					...((typeof transformer.process === 'function') ? {
						process: transformer.process(transformed)
					} : {}),
					...((typeof transformer.runConfig === 'function') ? {
						runConfig: transformer.runConfig(transformed)
					} : {}),
				}
			} else throw new Error()
		}, { process: this.process, runConfig: this._runConfig })
		return new S<UserState, Return, Arguments, Process>(transformed.process, transformed.runConfig)
	}
	config(runConfig: Partial<RunConfig<UserState, Return, Arguments, Process>>): S<UserState, Return, Arguments, Process> {
		return new S<UserState, Return, Arguments, Process>(this.process, { ...this._runConfig, ...runConfig })
	}
	get unstrict(): S<UserState, Return, Arguments, Process> {
		return new S<UserState, Return, Arguments, Process>(this.process, { ...this._runConfig, strictContext: false })
	}
	get strict(): S<UserState, Return, Arguments, Process> {
		return new S<UserState, Return, Arguments, Process>(this.process, { ...this._runConfig, strictContext: true })
	}
	get strictTypes(): S<UserState, Return, Arguments, Process> {
		return new S<UserState, Return, Arguments, Process>(this.process, { ...this._runConfig, strictContext: S.strictTypes })
	}
	get async(): S<UserState, Promise<Return>, Arguments, Process> {
		return new S<UserState, Promise<Return>, Arguments, Process>(this.process, { ...this._runConfig, async: true } as unknown as RunConfig<UserState, Promise<Return>, Arguments, Process>)
	}
	get sync(): S<UserState, Awaited<Return>, Arguments, Process> {
		return new S<UserState, Awaited<Return>, Arguments, Process>(this.process, { ...this._runConfig, async: false } as unknown as RunConfig<UserState, Awaited<Return>, Arguments, Process>)
	}
	get step(): S<UserState, SystemState<UserState>, Arguments, Process> {
		return new S<UserState, SystemState<UserState>, Arguments, Process>(this.process, { ...this._runConfig, iterations: 1, outputModifier: a => a } as unknown as RunConfig<UserState, SystemState<UserState>, Arguments, Process>)
	}
	until(until: RunConfig<UserState, Return, Arguments, Process>['until']): S<UserState, Return, Arguments, Process> {
		return new S<UserState, Return, Arguments, Process>(this.process, { ...this._runConfig, until })
	}
	input<NewArguments extends Array<unknown> = Arguments>(inputModifier: (...input: NewArguments) => Partial<InputSystemState<UserState>>): S<UserState, Return, NewArguments, Process> {
		return new S<UserState, Return, NewArguments, Process>(this.process, { ...this._runConfig, inputModifier } as unknown as RunConfig<UserState, Return, NewArguments, Process>)
	}
	output<NewReturn extends unknown = Return>(outputModifier: (state: SystemState<UserState>) => NewReturn): S<UserState, NewReturn, Arguments, Process> {
		return new S<UserState, NewReturn, Arguments, Process>(this.process, { ...this._runConfig, outputModifier } as unknown as RunConfig<UserState, NewReturn, Arguments, Process>)
	}
	defaults<NewUserState extends UserState = UserState>(initialState: NewUserState): S<NewUserState, NewUserState[Keywords.RS], Arguments, Process> {
		return new S<NewUserState, NewUserState[Keywords.RS], Arguments, Process>(this.process, { ...this._runConfig, initialState } as unknown as RunConfig<NewUserState, NewUserState[Keywords.RS], Arguments, Process>)
	}
	addNode(...nodes: Array<NodeDefinition>): S<UserState, Return, Arguments, Process> {
		return new S<UserState, Return, Arguments, Process>(this.process, { ...this._runConfig, nodes: new NodeDefinitions<UserState, Return, Arguments, Process>([...this._runConfig.nodes.values(), ...nodes].map(node => [node.name, node]) as unknown as []) })
	}
}
