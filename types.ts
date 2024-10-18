export class PathReferenceError extends ReferenceError {}
export class ContextReferenceError extends ReferenceError {}
export class ContextTypeError extends TypeError {}
export class ActionTypeError extends TypeError {}
export class UndefinedActionError extends ReferenceError {}
export class MaxIterationsError extends Error {}

export const returnSymbol      = Symbol('Super Small State Machine Return')
export const changesSymbol     = Symbol('Super Small State Machine Changes')
export const pathSymbol        = Symbol('Super Small State Machine Path')
export const strictSymbol      = Symbol('Super Small State Machine Strict')
export const strictTypesSymbol = Symbol('Super Small State Machine Strict Types')

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
	iterations: number,
	result: boolean,
	until: (state: State) => boolean,
	strictContext: boolean | typeof strictTypesSymbol,
	runMethod: null,
	inputModifier: (...input: Array<unknown>) => InputState,
	outputModifier: (output: State | unknown) => unknown,
	async: boolean,
	// Special settings for async
	delay: number,
	allow: number,
	wait: number,
}


export interface State extends InitialState {
	[strictSymbol]: boolean | typeof strictTypesSymbol
	[pathSymbol]: Path
	[changesSymbol]: Partial<InitialState>
	[returnSymbol]?: boolean
}

export type StateChanges = Partial<State>
export type Path = Array<RelativeGOTOUnit>
	
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
export type Directive = RelativeGOTOUnit | typeof returnSymbol


export type Sequence = ArraySequence | StateMachine | Conditional | SwitchConditional | Directive | Action | null | undefined

export type Parallel = Array<Sequence> & {[Keywords.PL]:true}

export type AbsoluteGOTO = Record<typeof pathSymbol, Path>
export type RelativeGOTO = Record<typeof pathSymbol, RelativeGOTOUnit>
export type Return = { [returnSymbol]: any }

export type Output = Partial<State> | AbsoluteGOTO | RelativeGOTO | Directive | Path | Return | undefined | null

export interface NodeType {
	name: string | symbol;
	isNode: ((object: unknown, objectType: typeof object, last: NodeType['name'] | false) => boolean | undefined) | null,
	execute: ((state: State, process: Sequence, node: Sequence) => Output) | null,
	nextPath: ((state: State, process: Sequence, parPath: Path, path: Path) => undefined | null | Path) | null,
	advance: ((state: State, process: Sequence, output: Output) => State) | null,
	// nextPath: (() => void) | null
}

export interface TransformerContext {
	state: InitialState,
	process: Sequence,
	runConfig: RunConfig,
}

export type InitialState = Record<string | Keywords.RS, unknown>
export type InputState = InitialState & Partial<Pick<State, typeof pathSymbol | typeof returnSymbol>>

class ExtensibleFunction extends Function {
	constructor(f: Function) {
		super()
		return Object.setPrototypeOf(f, new.target.prototype);
	}
}

export abstract class StateMachineClass extends ExtensibleFunction {
	public static readonly return:      typeof returnSymbol      = returnSymbol
	public static readonly changes:     typeof changesSymbol     = changesSymbol
	public static readonly path:        typeof pathSymbol        = pathSymbol
	public static readonly strict:      typeof strictSymbol      = strictSymbol
	public static readonly strictTypes: typeof strictTypesSymbol = strictTypesSymbol

	public static readonly runConfig: RunConfig

	public static readonly keywords: typeof Keywords = Keywords
	public static readonly kw:       typeof Keywords = Keywords
	public static readonly nodeTypes: typeof NodeTypes = NodeTypes
	public static readonly types:     typeof NodeTypes = NodeTypes

	public static readonly isNode: (object: unknown, objectType: (typeof object)) => false | NodeType['name']
	public static readonly addNode: (name: NodeType['name'], nodeDefinition: Partial<Pick<NodeType, 'execute' | 'nextPath' | 'isNode' | 'advance'>>) => void
	public static readonly removeNode: (name: NodeType['name']) => NodeType

	public static readonly isStateMachine: (object: unknown) => boolean
	public static readonly isParallel: (object: unknown) => boolean
	public static readonly parallel: (...list: Array<Sequence>) => Parallel

	public static readonly lastOf:                 (process: Sequence, path: Path, condition: ((item: Sequence, path: Path, process: Sequence) => boolean)) => Path | null
	public static readonly lastNode:               (process: Sequence, path: Path, ...nodeTypes: Array<NodeType['name'] | Array<NodeType['name']>>) => Path | null
	public static readonly lastSequence:           (process: Sequence, path: Path) => Path | null
	public static readonly lastStateMachine:       (process: Sequence, path: Path) => Path | null
	public static readonly actionName:             (process: Sequence, path: Path) => string | undefined
	public static readonly nextPath: (state: State, process: Sequence, path: Path) => Path | null
	public static readonly advance:  (state: State, process: Sequence, output: Output) => State
	public static readonly execute:  (state: State, process: Sequence) => Output
	public static readonly applyChanges: (state: State, changes: Partial<InitialState>) => State

	public static readonly traverse: (
		iterator: ((item: Sequence, path: Path, process: Sequence) => Sequence),
		post: ((item: Sequence, path: Path, process: Sequence) => Sequence)
	) => ((process: Sequence, path?: Path) => Sequence)
	public static readonly exec: (state: State, process: Sequence, runConfig: Partial<RunConfig>, ...input: Array<unknown>) => unknown
	public static readonly execAsync: (state: State, process: Sequence, runConfig: Partial<RunConfig>, ...input: Array<unknown>) => Promise<unknown>
	public static readonly run: (state: State, process: Sequence, runConfig: Partial<RunConfig>, ...input: Array<unknown>) => unknown | Promise<unknown>


	public readonly process: Sequence = null
	protected _initialState: InitialState
	protected _runConfig: RunConfig

	public abstract run(...input: Array<unknown>): unknown | Promise<unknown>
	public abstract runConfig: RunConfig
	public abstract initialState: InitialState
	public abstract actionName(path: Path): string | undefined

	public abstract plugin(transformer: ((current: TransformerContext) => Partial<TransformerContext>) | {
		state?: (current: TransformerContext) => InitialState,
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

// declare module '@oversword/super-small-state-machine' {
//	 export default S
//	 export const SuperSmallStateMachine = S
// }
