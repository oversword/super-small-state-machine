import S, { deep_merge_object, shallow_merge_object, SequenceNode, Changes, Stack, Return } from "../index.js"
import asyncPlugin from "./async.js"

export const parallelSymbol = Symbol('SSSM Parallel')

export const parallel = (...list) => new Parallel(...list)

const stripState = ({ [Changes]: _c, [Return]: _r, [Stack]: _s, ...state }) => state
const extractChanges = state => state[Changes]
export class Parallel extends SequenceNode {
	static type = 'parallel-sequence'
	static typeof(object, objectType, isAction) {
		return super.typeof(object, objectType, isAction) && Boolean(object[parallelSymbol])
	}
	static execute(node, state) {
		const merge = this.config.deep ? deep_merge_object : shallow_merge_object
		return Promise.all(node.map(parallel => new S(parallel, this.config).input(stripState).output(extractChanges)(state)))
			.then(res => merge({}, ...res))
	}
	static traverse(item, path, iterate) {
		return parallel(...super.traverse(item, path, iterate))
	}
	constructor(...list) {
		list[parallelSymbol] = true
		return list
	}
}

export const parallelPlugin = S.with(asyncPlugin, S.addNode(Parallel))
export default parallelPlugin