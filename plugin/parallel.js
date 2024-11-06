import S, { deep_merge_object } from "../index.js"
import { SequenceNode } from "../index.js"

export const parallelSymbol = Symbol('Super Small State Machine Parallel')

// TODO: this should be the constructor of the instance?
export const parallel = (...list) => {
	list[parallelSymbol] = true
	return list
}
export class ParallelNode extends SequenceNode {
	static name = 'parallel-sequence'
	static typeof(object, objectType) {
		if (objectType !== 'object') return false;
		return Array.isArray(object) && (parallelSymbol in object) && Boolean(object[parallelSymbol])
	}
	static execute(node, state) {
		if (!this.config.async) 
			return super.execute(node, state)
		return Promise.all(node.map(parallel => new S(parallel, this.config).async.input((state) => {
			const { [S.Path]:__path, [S.Changes]: __changes, [S.Return]: __return, ...pureState } = state
			return pureState
		}).result((state) => state[S.Changes])(state)))
			.then(res => deep_merge_object({}, ...res))
	}
	static traverse(item, path, iterate, post) {
		return parallel(...super.traverse(item, path, iterate, post))
	}
}

export const parallelPlugin = instance => instance.addNode(ParallelNode)
export default parallelPlugin