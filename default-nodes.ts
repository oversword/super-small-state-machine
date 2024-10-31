import S, { deep_merge_object, get_path_object, normalise_function } from ".";
import { ActionNode, SequenceNode, ConditionNode, Path, PathReferenceError, ProcessNode, MachineNode, SwitchNode, UndefinedNodeError, PathUnit, N, SuperSmallStateMachine, returnSymbol, ParallelNode, SystemState, InitialState, parallelSymbol, DirectiveNode, StateChanges, ReturnNode, OutputNode } from "./types";

export enum NodeTypes {
	UN = 'undefined',
	EM = 'empty',
	DR = 'directive',
	RT = 'return',
	AC = 'action',
	SQ = 'sequence',
	CD = 'condition',
	SW = 'switch',
	MC = 'machine',
	CH = 'changes',
	PL = 'parallel-sequence'
}

const exitFindNext = (output: OutputNode, instance: Pick<SuperSmallStateMachine, 'process' | 'nodes'>, state: SystemState<InitialState>) => {
	const nextPath = S.nextPath(instance, state)
	return nextPath ? {
		...state,
		[S.path]: nextPath
	} : {
		...state,
		[S.return]: true,
	}
}


const contextChangesNode = new N<StateChanges,StateChanges>(NodeTypes.CH, {
	isNode: (object, objectType): object is Record<string,unknown> =>
		Boolean(object && objectType === 'object'),
	advance: (output, instance, state) => {
		const currentState = S.applyChanges(state, output)
		return exitFindNext(output, instance, currentState)
	},
})

const sequenceNode = new N<SequenceNode, Path>(NodeTypes.SQ, {
	nextPath: (parPath, instance, state, path) => {
		const parActs = get_path_object<SequenceNode>(instance.process, parPath)
		const childItem = path[parPath.length] as number
		if (parActs && childItem+1 < parActs.length)
			return [ ...parPath, childItem+1 ]
	},
	isNode: (object, objectType): object is SequenceNode => {
		if (objectType !== 'object') return false;
		return Array.isArray(object)
	},
	execute: (node, instance, state) => {
		const path = state[S.path] || []
		return node.length ? [ ...path, 0 ] : null
	},
	advance: (output, instance, state) => {
		return {
			...state,
			[S.path]: output
		}
	},
	traverse: (item, path, instance, iterate, post) => {
		const ret = item.map((_,i) => iterate(instance, [...path,i]))
		return ret
	}
	
})

// TODO: DELETE
export const parallel = <Process extends unknown = ProcessNode>(...list: Array<Process>): ParallelNode => {
	list[parallelSymbol] = true
	return list as unknown as ParallelNode
}
const parallelNode = new N<ParallelNode>(NodeTypes.PL, {
	nextPath: (parPath, instance, state, path) => {
		const parActs = get_path_object<ParallelNode>(instance.process, parPath)
		const childItem = path[parPath.length] as number
		if (parActs && childItem+1 < parActs.length)
			return [ ...parPath, childItem+1 ]
	},
	isNode: (object, objectType): object is ParallelNode => {
		if (objectType !== 'object') return false;
		return Array.isArray(object) && (parallelSymbol in object) && Boolean(object[parallelSymbol])
	},
	execute: (node, instance, state) => {
		if (!instance.config.async) return node.length ? [ ...state[S.path], 0 ] : null
		return Promise.all(node.map(parallel => new S(parallel, instance.config).async.input((state) => {
			const { [S.path]:__path, [S.changes]: __changes, [S.strict]: __strict, [S.return]: __return, ...pureState } = (state as SystemState<InitialState>)
			return pureState
		}).output((state) => state[S.changes])(state)))
			.then(res => deep_merge_object({}, ...res))
	},
	traverse: (item, path, instance, iterate, post) => {
		const ret = item.map((_,i) => iterate(instance, [...path,i]))
		return parallel(...ret)
	}
})


const actionNode = new N<ActionNode>(NodeTypes.AC, {
	isNode: (object, objectType, isOutput): object is ActionNode => objectType === 'function',
	execute: (node, instance, state) => (node as ActionNode)(state),
})
const undefinedNode = new N<undefined,undefined>(NodeTypes.UN, {
	isNode: (object, objectType): object is undefined => objectType === 'undefined',
	execute: (node, instance, state) => {
		throw new UndefinedNodeError(`There is nothing to execute at path [ ${state[S.path].map(s => s.toString()).join(', ')} ]`, { instance, state, data: {node}, path: state[S.path] })
	},
	advance: exitFindNext
})
const emptyNode = new N<null,null>(NodeTypes.EM, {
	isNode: (object, objectType): object is null => object === null,
	advance: exitFindNext
})
const conditionNode = new N<ConditionNode>(NodeTypes.CD, {
	isNode: (object, objectType, isOutput): object is ConditionNode =>
		Boolean((!isOutput) && object && objectType === 'object' && (S.kw.IF in (object as object))),
	execute: (node, instance, state) => {
		if (normalise_function(node[S.kw.IF])(state))
			return S.kw.TN in node
				? [ ...state[S.path], S.kw.TN ] : null
		return S.kw.EL in (node as ConditionNode)
			? [ ...state[S.path], S.kw.EL ]
			: null
	},
	traverse: (item, path, instance, iterate, post) => {
		return post({
			...item,
			[S.kw.IF]: item[S.kw.IF],
			...(S.kw.TN in item ? { [S.kw.TN]: iterate(instance, [...path,S.kw.TN]) } : {}),
			...(S.kw.EL in item ? { [S.kw.EL]: iterate(instance, [...path,S.kw.EL]) } : {})
		}, path, instance)
	}
})
const switchNode = new N<SwitchNode>(NodeTypes.SW, {
	isNode: (object, objectType, isOutput): object is SwitchNode =>
		Boolean((!isOutput) && object && objectType === 'object' && (S.kw.SW in (object as object))),
	execute: (node, instance, state) => {
			const key = normalise_function(node[S.kw.SW])(state)
			const fallbackKey = (key in node[S.kw.CS]) ? key : S.kw.DF
			return (fallbackKey in node[S.kw.CS])
				? [ ...state[S.path], S.kw.CS, fallbackKey ]
				: null
	},
	traverse: (item, path, instance, iterate, post) => {
		return post({
			...item,
			[S.kw.SW]: item[S.kw.SW],
			[S.kw.CS]: Object.fromEntries(Object.keys(item[S.kw.CS]).map(key => [ key, iterate(instance, [...path,S.kw.CS,key]) ])),
		}, path, instance)
	}
})
const machineNode = new N<MachineNode>(NodeTypes.MC, {
	isNode: (object, objectType, isOutput): object is MachineNode =>
		Boolean((!isOutput) && object && objectType === 'object' && (S.kw.IT in (object as object))),
	execute: (node, instance, state) => {
		return [ ...state[S.path], S.kw.IT ]
	},
	traverse: (item, path, instance, iterate, post) => {
		return post({
			...item,
			...Object.fromEntries(Object.keys(item).map(key => [ key, iterate(instance, [...path,key]) ]))
		}, path, instance)
	}
})
const directiveNode = new N<DirectiveNode,DirectiveNode>(NodeTypes.DR, {
	isNode: (object, objectType): object is DirectiveNode =>
		Boolean(objectType === 'number' || objectType === 'string' || objectType === 'symbol' ||
			(object && objectType === 'object' && (S.path in (object as object)))),
	advance: (output, instance, state) => {
		const outputType = typeof output
		if (outputType === 'object' && output) {
			return S.advance(instance, state, output[S.path])
		} else {
			const lastOf = S.lastNode(
				instance,
				state[S.path].slice(0,-1),
				outputType === 'number' ? NodeTypes.SQ : NodeTypes.MC
			)
			if (!lastOf)
				throw new PathReferenceError(`A relative directive has been provided as a ${outputType} (${String(output)}), but no ${outputType === 'number' ? 'sequence' : 'state machine'} exists that this ${outputType} could be ${outputType === 'number' ? 'an index': 'a state'} of from path [ ${state[S.path].map(s => s.toString()).join(', ')} ].`, { instance, state, data: {output}, path: state[S.path] })
			return {
				...state,
				[S.path]: [...lastOf, output as PathUnit]
			}
		}
	},
})

const returnNode = new N<ReturnNode,ReturnNode>(NodeTypes.RT, {
	isNode: (object, objectType): object is ReturnNode => {
		if (object === S.return) return true
		// console.log(object, S.return)
		return Boolean(object && objectType === 'object' && (S.return in (object as object)))
	},
	advance: (output, instance, state) => {
		return {
			...state,
			[S.return]: true,
			[S.path]: state[S.path],
			...(!output || output === S.return ? {} : { [S.kw.RS]: output[S.return] })
		}
	},
})

const defaultNodes = [
	contextChangesNode,
	sequenceNode,
	parallelNode,
	actionNode,
	undefinedNode,
	emptyNode,
	conditionNode,
	switchNode,
	machineNode,
	directiveNode,
	returnNode,
]
export default defaultNodes