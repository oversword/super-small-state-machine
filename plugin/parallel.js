import S, { deep_merge_object, shallow_merge_object, Sequence } from "../index.js"

export const parallelSymbol = Symbol('Super Small State Machine Parallel')

export const parallel = (...list) => new Parallel(...list)

export class Parallel extends Sequence {
	static type = 'parallel-sequence'
	static typeof(object, objectType, isAction) {
		return super.typeof(object, objectType, isAction) && Boolean(object[parallelSymbol])
	}
	static execute(node, state) {
		if (!this.config.async) 
			return super.execute(node, state)
		const merge = this.config.deep ? deep_merge_object : shallow_merge_object
		return Promise.all(node.map(parallel => new S(parallel, this.config).async.input((state) => {
			const { [S.Stack]:__path, [S.Changes]: __changes, [S.Return]: __return, ...pureState } = state
			return pureState
		}).output(state => state[S.Changes])(state)))
			.then(res => merge({}, ...res))
	}
	static traverse(item, path, iterate) {
		return parallel(...super.traverse(item, path, iterate))
	}
	static proceed(...args) {
		if (this.config.async)
			return N.proceed(...args)
		return super.proceed(...args)
	}
	constructor(...list) {
		list[parallelSymbol] = true
		return list
	}
}

export const parallelPlugin = S.addNode(Parallel)
export default parallelPlugin