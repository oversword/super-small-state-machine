import defaultNodes from "./default-nodes";
import { InitialState, MaxIterationsError,  Path, Config, SuperSmallStateMachine, PathUnit, NodeDefinition, NodeDefinitions, SystemState, InputSystemState, Keywords, ProcessNode, NodeTypeError, ContextReferenceError, ContextTypeError, OutputNode } from "./types";

export const clone_object = <T extends unknown = unknown>(obj: T): T => {
	if (Array.isArray(obj)) return obj.map(clone_object) as T
	if (obj === null) return null as T
	if (typeof obj !== 'object') return obj
	return Object.fromEntries(Object.entries(obj).map(([key,value]) => [ key, clone_object(value) ])) as T;
}
export const unique_list_strings = <T extends unknown = unknown>(list: Array<T>, getId: ((item: T) => string) = item => item as string): Array<T> => Object.values(Object.fromEntries(list.map(item=>[getId(item),item])));
const reduce_get_path_object = <T extends unknown = unknown, O extends unknown = unknown>(obj: T | O | undefined, step: PathUnit): T | undefined => obj ? obj[step] : undefined
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
	Arguments extends Array<unknown> = [Partial<InputSystemState<UserState>>] | [],
	Output extends unknown = OutputNode<UserState, Return>,
	Process extends unknown = ProcessNode<UserState, Return, Output>,
>
extends SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>
implements SuperSmallStateMachine<UserState, Return, Arguments, Output, Process> 
{
	static config: Config = {
		initialState: { [S.kw.RS]: null },
		iterations: 10000,
		until: result => S.return in result,
		strictContext: false,
		method: null,
		processModifiers: [],
		inputModifiers: [],
		outputModifiers: [],
		input: (a = {}) => a,
		output: a => a[S.kw.RS],
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
				if (Object.entries(changes).some(([name,value]) => typeof value !== typeof state[name])) {
					const errs = Object.entries(changes).filter(([name,value]) => typeof value !== typeof state[name])
					throw new ContextTypeError(`Properties must have the same type as their initial value. ${errs.map(([name,value]) => `${typeof value} given for '${name}', should be ${typeof state[name]}`).join('. ')}.`)
				}
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
		Arguments extends Array<unknown> = [Partial<InputSystemState<UserState>>] | [],
		Output extends unknown = OutputNode<UserState, Return>,
		Process extends unknown = ProcessNode<UserState, Return, Output>,
	>(instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>, 'process' | 'nodes'>, path: Path = [], ...nodeTypes: Array<NodeDefinition['name'] | Array<NodeDefinition['name']>>): Path | null {
		const flatNodeTypes = nodeTypes.flat(Infinity)
		return S.lastOf(instance.process, path, i => {
			const nodeType = instance.nodes.isNode(i)
			return Boolean(nodeType && flatNodeTypes.includes(nodeType))
		})
	}
	static nextPath<
		UserState extends InitialState = InitialState,
		Return extends unknown = UserState[Keywords.RS],
		Arguments extends Array<unknown> = [Partial<InputSystemState<UserState>>] | [],
		Output extends unknown = OutputNode<UserState, Return>,
		Process extends unknown = ProcessNode<UserState, Return, Output>,
	>(instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>, 'process' | 'nodes'>, state: SystemState<UserState> = ({} as SystemState<UserState>), path: Path = state[S.path] || []): Path | null {
		if (path.length === 0) return null
		const parPath = S.lastNode<UserState, Return, Arguments, Output, Process>(instance, path.slice(0,-1), [...instance.nodes.values()].filter(({ nextPath }) => nextPath).map(({ name }) => name))
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
		Arguments extends Array<unknown> = [Partial<InputSystemState<UserState>>] | [],
		Output extends unknown = OutputNode<UserState, Return>,
		Process extends unknown = ProcessNode<UserState, Return, Output>,
	>(instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>, 'process' | 'nodes'>, state: SystemState<UserState>, output: Output = (null as Output)): SystemState<UserState> {
		const path = state[S.path] || []
		const nodeType = instance.nodes.isNode(output)
		const nodeDefinition = nodeType && instance.nodes.get(nodeType)
		if (nodeDefinition && nodeDefinition.advance)
			return nodeDefinition.advance(output, instance, state)
		throw new NodeTypeError(`Unknown output or action type: ${typeof output}${nodeType ? `, nodeType: ${String(nodeType)}` : ''} at [ ${path.join(', ')} ]`)
	}
	static execute<
		UserState extends InitialState = InitialState,
		Return extends unknown = UserState[Keywords.RS],
		Arguments extends Array<unknown> = [Partial<InputSystemState<UserState>>] | [],
		Output extends unknown = OutputNode<UserState, Return>,
		Process extends unknown = ProcessNode<UserState, Return, Output>,
	>(instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>, 'process' | 'nodes' | 'config'>, state: SystemState<UserState> = ({} as SystemState<UserState>)): Output {
		const path = state[S.path] || []
		const node = get_path_object<Process>(instance.process, path)!
		const nodeType = instance.nodes.isNode(node)
		const nodeDefinition = nodeType && instance.nodes.get(nodeType)
		if (nodeDefinition && nodeDefinition.execute)
			return nodeDefinition.execute(node, instance, state) as Output
		return node as unknown as Output
	}
	static traverse<
		UserState extends InitialState = InitialState,
		Return extends unknown = UserState[Keywords.RS],
		Arguments extends Array<unknown> = [Partial<InputSystemState<UserState>>] | [],
		Output extends unknown = OutputNode<UserState, Return>,
		Process extends unknown = ProcessNode<UserState, Return, Output>,
	>(
		iterator: ((item: Process, path: Path, instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>, 'process' | 'nodes'>) => Process) = a => a,
		post:     ((item: Process, path: Path, instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>, 'process' | 'nodes'>) => Process) = b => b
	): ((instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>, 'process' | 'nodes'>, path?: Path) => Process) {
		const iterate = (instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>, 'process' | 'nodes'>, path: Path = []): Process => {
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
		Arguments extends Array<unknown> = [Partial<InputSystemState<UserState>>] | [],
		Output extends unknown = OutputNode<UserState, Return>,
		Process extends unknown = ProcessNode<UserState, Return, Output>,
	>(instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>, 'process' | 'nodes' | 'config'>, ...input: Arguments): Promise<Return> {
		const { delay, allow, wait, until, iterations, input: inputModifier, output: outputModifier, inputModifiers, outputModifiers, strictContext, initialState: state } = { ...S.config, ...instance.config }
		const modifiedInput = (await inputModifier.apply(instance, input)) || {}
		if (delay) await wait_time(delay)
		let r = 0, startTime = Date.now(), currentState = inputModifiers.reduce((prev, modifier) => modifier.call(instance, prev), S.applyChanges<UserState>({
			[S.changes]: {},
			...state,
			[S.path]: modifiedInput[S.path] || [],
			[S.strict]: strictContext
		}, modifiedInput))
		while (r < iterations) {
			if (until(currentState)) break;
			if (++r >= iterations)
				throw new MaxIterationsError(`Maximim iterations of ${iterations} reached at path [ ${currentState[S.path]?.join(', ')} ]`)
			currentState = S.advance<UserState, Return, Arguments, Output, Process>(instance, currentState, await S.execute<UserState, Return, Arguments, Output, Process>(instance, currentState))
			if (allow > 0 && r % 10 === 0) {
				const nowTime = Date.now()
				if (nowTime - startTime >= allow) {
					await wait_time(wait)
					startTime = Date.now()
				}
			}
		}
		return outputModifier(outputModifiers.reduce((prev, modifier) => modifier.call(instance, prev), currentState))
	}

	static exec<
		UserState extends InitialState = InitialState,
		Return extends unknown = UserState[Keywords.RS],
		Arguments extends Array<unknown> = [Partial<InputSystemState<UserState>>] | [],
		Output extends unknown = OutputNode<UserState, Return>,
		Process extends unknown = ProcessNode<UserState, Return, Output>,
	>(instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>, 'process' | 'nodes' | 'config'>, ...input: Arguments): Return {
		const { until, iterations, input: inputModifier, output: outputModifier, inputModifiers, outputModifiers, strictContext, initialState: state  } = { ...S.config, ...instance.config }
		const modifiedInput = inputModifier.apply(instance, input) || {}
		let r = 0, currentState = inputModifiers.reduce((prev, modifier) => modifier.call(instance, prev), S.applyChanges<UserState>({
			[S.changes]: {},
			...state,
			[S.path]: modifiedInput[S.path] || [],
			[S.strict]: strictContext
		}, modifiedInput))
		while (r < iterations) {
			if (until(currentState)) break;
			if (++r > iterations)
				throw new MaxIterationsError(`Maximim iterations of ${iterations} reached at path [ ${currentState[S.path]?.join(', ')} ]`)
			currentState = S.advance<UserState, Return, Arguments, Output, Process>(instance, currentState, S.execute<UserState, Return, Arguments, Output, Process>(instance, currentState))
		}
		return outputModifier.call(instance, (outputModifiers.reduce((prev, modifier) => modifier.call(instance, prev), currentState)))
	}
	static run<
		UserState extends InitialState = InitialState,
		Return extends unknown = UserState[Keywords.RS],
		Arguments extends Array<unknown> = [Partial<InputSystemState<UserState>>] | [],
		Output extends unknown = OutputNode<UserState, Return>,
		Process extends unknown = ProcessNode<UserState, Return, Output>,
	>(instance: Pick<SuperSmallStateMachine<UserState, Return, Arguments, Output, Process>, 'process' | 'nodes' | 'config'>, ...input: Arguments): Return {
		const { async: isAsync } = { ...S.config, ...instance.config }
		if (isAsync) return S.execAsync<UserState, Return, Arguments, Output, Process>(instance, ...input) as Return
		return S.exec<UserState, Return, Arguments, Output, Process>(instance, ...input)
	}

	process: Process
	private _config: Config<UserState, Return, Arguments, Output, Process>// = S.config
	get nodes(): NodeDefinitions<UserState, Return, Arguments, Output, Process> {
		return this._config.nodes
	}
	get config(): Config<UserState, Return, Arguments, Output, Process> {
		return { ...this._config }
	}
	get initialState(): UserState {
		return clone_object(this._config.initialState)
	}

	constructor(process: Process = null as Process, config: Partial<Config<UserState, Return, Arguments, Output, Process>> = S.config as unknown as Config<UserState, Return, Arguments, Output, Process>) {
		super((...argumentsList: Arguments): Return => (config.method || this.run).apply(this, argumentsList))
		this._config = {
			...S.config,
			...this._config,
			...config
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
		return S.lastNode<UserState, Return, Arguments, Output, Process>(this, path, ...nodeTypes)
	}
	nextPath(state: SystemState<UserState>, path: Path = state[S.path] || []):  Path | null {
		return S.nextPath<UserState, Return, Arguments, Output, Process>(this, state, path)
	}
	advance(state: SystemState<UserState>, output: Output): SystemState<UserState> {
		return S.advance<UserState, Return, Arguments, Output, Process>(this, state, output)
	}
	execute(state: SystemState<UserState>): Output {
		return S.execute<UserState, Return, Arguments, Output, Process>(this, state)
	}

	exec(...input: Arguments): Return {
		return S.exec<UserState, Return, Arguments, Output, Process>(this, ...input)
	}
	execAsync(...input: Arguments): Promise<Return> {
		return S.execAsync<UserState, Return, Arguments, Output, Process>(this, ...input)
	}
	run (...input: Arguments): Return {
		return S.run<UserState, Return, Arguments, Output, Process>(this, ...input)
	}
	get unstrict(): S<UserState, Return, Arguments, Output, Process> {
		return new S<UserState, Return, Arguments, Output, Process>(this.process, { ...this._config, strictContext: false })
	}
	get strict(): S<UserState, Return, Arguments, Output, Process> {
		return new S<UserState, Return, Arguments, Output, Process>(this.process, { ...this._config, strictContext: true })
	}
	get forever(): S<UserState, Return, Arguments, Output, Process> {
		return new S<UserState, Return, Arguments, Output, Process>(this.process, { ...this._config, iterations: Infinity })
	}
	for(iterations: number = 10000): S<UserState, Return, Arguments, Output, Process> {
		return new S<UserState, Return, Arguments, Output, Process>(this.process, { ...this._config, iterations })
	}
	delay(delay: number = 0): S<UserState, Return, Arguments, Output, Process> {
		return new S<UserState, Return, Arguments, Output, Process>(this.process, { ...this._config, delay })
	}
	allow(allow: number = 1000): S<UserState, Return, Arguments, Output, Process> {
		return new S<UserState, Return, Arguments, Output, Process>(this.process, { ...this._config, allow })
	}
	wait(wait: number = 0): S<UserState, Return, Arguments, Output, Process> {
		return new S<UserState, Return, Arguments, Output, Process>(this.process, { ...this._config, wait })
	}
	do(process: Process): S<UserState, Return, Arguments, Output, Process> {
		return new S<UserState, Return, Arguments, Output, Process>(this._config.processModifiers.reduce((prev, modifier) => modifier.call(this, prev), process), this._config as unknown as Config<UserState, Return, Arguments, Output, Process>)
	}
	with<NewUserState extends UserState = UserState, NewReturn extends Return = Return, NewArguments extends Arguments = Arguments, NewOutput extends Output = Output, NewProcess extends Process = Process>(transformer: ((instance: S<UserState, Return, Arguments, Output, Process>) => S<NewUserState, NewReturn, NewArguments, NewOutput, NewProcess>)): S<NewUserState, NewReturn, NewArguments, NewOutput, NewProcess> {
		return transformer(this)
	}
	adapt(adapter: (process: Process) => Process): S<UserState, Return, Arguments, Output, Process> {
		return new S<UserState, Return, Arguments, Output, Process>(adapter.call(this, this.process), { ...this._config, processModifiers: [...this._config.processModifiers,adapter] } as unknown as Config<UserState, Return, Arguments, Output, Process>)
	}
	override(method: ((...args: Arguments) => Return) | null): S<UserState, Return, Arguments, Output, Process> {
		return new S<UserState, Return, Arguments, Output, Process>(this.process, { ...this._config, method })
	}
	get strictTypes(): S<UserState, Return, Arguments, Output, Process> {
		return new S<UserState, Return, Arguments, Output, Process>(this.process, { ...this._config, strictContext: S.strictTypes })
	}
	get async(): S<UserState, Promise<Return>, Arguments, Output, Process> {
		return new S<UserState, Promise<Return>, Arguments, Output, Process>(this.process, { ...this._config, async: true } as unknown as Config<UserState, Promise<Return>, Arguments, Output, Process>)
	}
	get sync(): S<UserState, Awaited<Return>, Arguments, Output, Process> {
		return new S<UserState, Awaited<Return>, Arguments, Output, Process>(this.process, { ...this._config, async: false } as unknown as Config<UserState, Awaited<Return>, Arguments, Output, Process>)
	}
	get step(): S<UserState, SystemState<UserState>, Arguments, Output, Process> {
		return new S<UserState, SystemState<UserState>, Arguments, Output, Process>(this.process, { ...this._config, iterations: 1, outputModifier: a => a } as unknown as Config<UserState, SystemState<UserState>, Arguments, Output, Process>)
	}
	until(until: Config<UserState, Return, Arguments, Output, Process>['until']): S<UserState, Return, Arguments, Output, Process> {
		return new S<UserState, Return, Arguments, Output, Process>(this.process, { ...this._config, until })
	}
	input<NewArguments extends Array<unknown> = Arguments>(input: (...input: NewArguments) => Partial<InputSystemState<UserState>>): S<UserState, Return, NewArguments, Output, Process> {
		return new S<UserState, Return, NewArguments, Output, Process>(this.process, { ...this._config, input } as unknown as Config<UserState, Return, NewArguments, Output, Process>)
	}
	output<NewReturn extends unknown = Return>(output: (state: SystemState<UserState>) => NewReturn): S<UserState, NewReturn, Arguments, OutputNode<UserState, NewReturn>, ProcessNode<UserState, NewReturn, OutputNode<UserState, NewReturn>>> {
		return new S<UserState, NewReturn, Arguments, OutputNode<UserState, NewReturn>, ProcessNode<UserState, NewReturn, OutputNode<UserState, NewReturn>>>(this.process as unknown as ProcessNode<UserState, NewReturn, OutputNode<UserState, NewReturn>>, { ...this._config, output } as unknown as Config<UserState, NewReturn, Arguments, OutputNode<UserState, NewReturn>, ProcessNode<UserState, NewReturn, OutputNode<UserState, NewReturn>>>)
	}
	adaptInput(inputModifier: (state: Partial<InputSystemState<UserState>>) => Partial<InputSystemState<UserState>>): S<UserState, Return, Arguments, Output, Process> {
		return new S<UserState, Return, Arguments, Output, Process>(this.process, { ...this._config, inputModifiers: [ ...this._config.inputModifiers, inputModifier ] } as unknown as Config<UserState, Return, Arguments, Output, Process>)
	}
	adaptOutput(outputModifier: (state: SystemState<UserState>) => SystemState<UserState>): S<UserState, Return, Arguments, Output, Process> {
		return new S<UserState, Return, Arguments, Output, Process>(this.process, { ...this._config, outputModifiers: [ ...this._config.outputModifiers, outputModifier ] } as unknown as Config<UserState, Return, Arguments, Output, Process>)
	}
	defaults<NewUserState extends InitialState = UserState>
		(initialState: NewUserState):
			S<NewUserState, NewUserState[Keywords.RS], Arguments, OutputNode<NewUserState, Return>, ProcessNode<NewUserState, Return, OutputNode<NewUserState, Return>>>
			{
		return new S<NewUserState, NewUserState[Keywords.RS], Arguments, OutputNode<NewUserState, Return>, ProcessNode<NewUserState, Return, OutputNode<NewUserState, Return>>>(this.process as unknown as ProcessNode<NewUserState, Return, OutputNode<NewUserState, Return>>, { ...this._config, initialState } as unknown as Config<NewUserState, NewUserState[Keywords.RS], Arguments, OutputNode<NewUserState, Return>, ProcessNode<NewUserState, Return, OutputNode<NewUserState, Return>>>)
	}
}

