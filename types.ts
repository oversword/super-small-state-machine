
// export const _return = Symbol('Small State Machine Return')
// export const _goto = Symbol('Small State Machine Go-To')
// export const _path = Symbol('Small State Machine Path')


export const _return      = Symbol('Super Small State Machine Return')
export const _changes     = Symbol('Super Small State Machine Changes')
export const _path        = Symbol('Super Small State Machine Path')
export const _strict      = Symbol('Super Small State Machine Strict')
export const _strictTypes = Symbol('Super Small State Machine Strict Types')

export type PartialPick<O, K extends keyof O> = Pick<O, K> & Partial<O>;


export enum Keywords {
  IF = 'if',
  TN = 'then',
  EL = 'else',
  SW = 'switch',
  CS = 'case',
  DF = 'default',
  IT = 'initial',
  RS = 'result',
  PL = 'parallel',
}

export enum NodeTypes {
  UN = 'undefined',
  EM = 'empty',
  DR = 'directive',
  RT = 'return',
  AC = 'action',
  SQ = 'sequence',
  CD = 'conditional',
  SC = 'switch-conditional',
  SM = 'state-machine',
  CH = 'changes'
}

export interface RunConfig {
  // delay: number,
  // allow: number,
  // iterations: number,
  // wait: number,
  // result: boolean,
  // until: (state: any) => boolean,
  // inputModifier: Function,
  // outputModifier: Function,

  iterations: number,
  result: boolean,
  until: (state: State) => boolean,
  strictContext: boolean | typeof _strictTypes,
  runMethod: null,
  inputModifier: (...input: Array<unknown>) => State,
  outputModifier: (output: State | unknown) => unknown,
  async: boolean,
  // Special settings for async
  delay: number,
  allow: number,
  wait: number,
}


export interface State {
  [key: string]: unknown
  [Keywords.RS]?: unknown
  [_strict]?: boolean | typeof _strictTypes
  [_path]?: Path
  [_return]?: boolean
  [_changes]?: Partial<State>
}

export type StateChanges = Partial<State>
export type Path = Array<string|number>

export type Action = (state: State) => Output
export type ArraySequence = Array<Sequence>
export interface StateMachine {
  [Keywords.IT]: Sequence
  [key: string]: Sequence
}
export interface Conditional {
  [Keywords.IF]: (state: State) => boolean,
  [Keywords.TN]?: Sequence
  [Keywords.EL]?: Sequence
}
export interface SwitchConditional {
  [Keywords.SW]: (state: State) => string | number,
  [Keywords.CS]: Record<string|number, Sequence>
}
export type RelativeGOTOUnit = string | number | symbol
export type Directive = RelativeGOTOUnit | typeof _return


export type Sequence = ArraySequence | StateMachine | Conditional | SwitchConditional | Directive | Action | null

export type Parallel = Array<Sequence> & {[Keywords.PL]:true}

export type AbsoluteGOTO = Record<typeof _path, Path>
export type RelativeGOTO = Record<typeof _path, RelativeGOTOUnit>
export type Return = { [_return]: any }

export type Output = AbsoluteGOTO | RelativeGOTO | Directive | Path | Return | undefined | null
// export type RawOutput = Directive | StateChanges | Output

export interface NodeType {
  name: string | symbol;
  isNode: ((object: unknown, objectType: typeof object, last: NodeType['name'] | false) => boolean | undefined) | null,
  execute: ((state: State, process: Sequence, node: Sequence) => Output) | null,
  advance: ((state: State, process: Sequence, parPath: Path, path: Path) => undefined | null | Path) | null,
  advance2: ((state: State, process: Sequence, output: Output) => State) | null,
  nextPath: (() => void) | null
}

export interface TransformerContext {
  state: State,
  process: Sequence,
  runConfig: RunConfig,
}

// declare module '@oversword/super-small-state-machine' {
//   export default S
//   export const SuperSmallStateMachine = S
// }

export type InitialState = Record<string | Keywords.RS, unknown>


class ExtensibleFunction extends Function {
	constructor(f: Function) {
		super()
		return Object.setPrototypeOf(f, new.target.prototype);
	}
}
export abstract class StateMachineClass extends ExtensibleFunction {
	static return      = _return
	static changes     = _changes
	static path        = _path
	static strict      = _strict
	static strictTypes = _strictTypes
	static kw: typeof Keywords
	static keywords: typeof Keywords
	static runConfig: RunConfig

	// Types:
	static nodeTypes: typeof NodeTypes
	static types: typeof NodeTypes
	protected static additionalNodetypes: Record<NodeType['name'], NodeType>
	protected static additionalNodetypesList: Array<NodeType>
	static isNode: ((object: unknown, objectType: (typeof object)) => false | NodeType['name'])
	static addNode: (name: NodeType['name'], nodeDefinition: Partial<Pick<NodeType, 'execute' | 'nextPath' | 'isNode' | 'advance'| 'advance2'>>) => void
	static removeNode: ((name: NodeType['name']) => void)
	static isStateMachine: (object: unknown) => boolean
	static isParallel: (object: unknown) => boolean
	static parallel: (...list: Array<Sequence>) => Parallel
	static actionName: (process: Sequence, path: Path) => string | undefined
	static lastOf: (process: Sequence, path: Path, condition: ((item: Sequence, path: Path, process: Sequence) => boolean)) => Path | null
	static lastNode: (process: Sequence, path: Path, ...nodeTypes: Array<NodeType['name'] | Array<NodeType['name']>>) => Path | null
	static lastSequence: (process: Sequence, path: Path) => Path | null
	static lastStateMachine: (process: Sequence, path: Path) => Path | null
	static nextPath: (state: State, process: Sequence, path: Path) => Path | null
	static advance: (state: State, process: Sequence, output: Output) => State
	static execute: (state: State, process: Sequence) => Output
	static applyChanges: (state: State, changes: Partial<State>) => State

	static traverse: (
		iterator: ((item: Sequence, path: Path, process: Sequence) => Sequence),
		post: ((item: Sequence, path: Path, process: Sequence) => Sequence)
	) => ((process: Sequence, path?: Path) => Sequence)
	static exec: (state: State, process: Sequence, runConfig: Partial<RunConfig>, ...input: Array<unknown>) => unknown
	static execAsync: (state: State, process: Sequence, runConfig: Partial<RunConfig>, ...input: Array<unknown>) => Promise<unknown>
	static run: (state: State, process: Sequence, runConfig: Partial<RunConfig>, ...input: Array<unknown>) => unknown | Promise<unknown>

	public process: Sequence
	protected _initialState: State
	protected _runConfig: RunConfig

  public abstract run(...input: Array<unknown>): unknown | Promise<unknown>
	public abstract runConfig: RunConfig
	public abstract initialState: State
	public abstract actionName(path: Path): string | undefined

	public abstract plugin(transformer: ((current: TransformerContext) => Partial<TransformerContext>) | {
		state?: (current: TransformerContext) => State,
		process?: (current: TransformerContext) => Sequence,
		runConfig?: (current: TransformerContext) => RunConfig,
	}): StateMachineClass

	// These are effectively runConfig "setters"
	public abstract config(runConfig: Partial<RunConfig>): StateMachineClass
	public abstract unstrict: StateMachineClass
	public abstract strict: StateMachineClass
	public abstract strictTypes: StateMachineClass
	public abstract async: StateMachineClass
	public abstract sync: StateMachineClass
	public abstract step: StateMachineClass
	public abstract until(until: RunConfig['until']): StateMachineClass
	public abstract input(inputModifier: RunConfig['inputModifier']): StateMachineClass
	public abstract output(outputModifier: RunConfig['outputModifier']): StateMachineClass
}
