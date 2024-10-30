import S, { deep_merge_object, get_path_object, N } from "../index.js"

export const parallelSymbol = Symbol('Super Small State Machine Parallel')

export const parallel = (...list) => {
	list[parallelSymbol] = true
	return list
}
const parallelNode = new N('parallel-sequence', {
	nextPath: (parPath, instance, state, path) => {
		const parActs = get_path_object(instance.process, parPath)
		const childItem = path[parPath.length]
		if (parActs && childItem+1 < parActs.length)
			return [ ...parPath, childItem+1 ]
	},
	isNode: (object, objectType) => {
		if (objectType !== 'object') return false;
		return Array.isArray(object) && (parallelSymbol in object) && Boolean(object[parallelSymbol])
	},
	execute: (node, instance, state) => {
		if (!instance.config.async) return node.length ? [ ...state[S.path], 0 ] : null
		return Promise.all(node.map(parallel => new S(parallel, instance.config).async.input((state) => {
			const { [S.path]:__path, [S.changes]: __changes, [S.strict]: __strict, [S.return]: __return, ...pureState } = state
			return pureState
		}).output((state) => state[S.changes])(state)))
			.then(res => deep_merge_object({}, ...res))
	},
	traverse: (item, path, instance, iterate, post) => {
		const ret = item.map((_,i) => iterate(instance, [...path,i]))
		return parallel(...ret)
	}
})

export const parallelPlugin = (instance) => instance.addNode(parallelNode)
export default parallelPlugin