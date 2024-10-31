import S, { get_path_object, N } from '../index.js'

export class StateMachineInstance /*extends Promise*/ {
	#resolve = () => {}
	#reject = () => {}
	#forEventResolve = null
	#promise = Promise.resolve()
	#partialPromise = Promise.resolve()
	#runner = () => {}
	#subscriptions = []
	#queuedEvents = []
	constructor(runner, ...input) {
		let promiseResolve
		let promiseReject
		this.#promise = new Promise((resolve, reject) => {
			promiseResolve = resolve
			promiseReject = reject
		})
		this.#resolve = promiseResolve
		this.#reject = promiseReject

		this.#runner = runner.override(null).output(a => a).input(a => a).async
		const modifiedInput = runner.config.input(...input)
		this.#partialPromise = this.#runner(modifiedInput)
		try {
			this.#progressUtilWaitingForEvents()
		} catch(error) {
			this.#reject(error)
		}
	}
	async #progressUtilWaitingForEvents() {
		while (true) {
			const res = await this.#partialPromise
			const node = get_path_object(this.#runner.process, res[S.path])
			const nodeType = this.#runner.nodes.isNode(node)
			if (nodeType === eventEmitter) {
				const event = typeof node.callback === 'function' ? node.callback(res) : node.callback
				this.#subscriptions.forEach(callback => {
					callback(event)
				})
				this.#partialPromise = this.#runner(S.advance(this.#runner, res))
			} else
			if (nodeType === eventHandler) {
					const event = this.#queuedEvents.length
						? this.#queuedEvents.shift()
						: (await new Promise((resolve) => {
							this.#forEventResolve = resolve
						}))
					this.#forEventResolve = null
					if (!(event.name in node.on)) continue;
					this.#partialPromise = this.#runner({
						...res,
						event,
						[S.path]: [...res[S.path],'on',event.name]
					})
			} else {
				this.#resolve(res[S.kw.RS])
				return;
			}
		}
	}
	send(eventName, eventData) {
		const event = (typeof eventName === 'string')
			? { name: eventName, data: eventData }
			: eventName
		if (this.#forEventResolve) {
			this.#forEventResolve(event)
		} else {
			this.#queuedEvents.push(event)
		}
	}
	subscribe(nameOrCallback, callback = () => {}) {
		if (typeof nameOrCallback === 'function')
			this.#subscriptions.push(nameOrCallback)
		else this.#subscriptions.push(event => {
			if (nameOrCallback !== event.name) return;
			return callback(event)
		})
		return this
	}
	then(...a) {
		return this.#promise.then(...a)
	}
	catch(...a) {
		return this.#promise.catch(...a)
	}
}
export const eventEmitter = Symbol('Super Small State Machine Event Emitter')
export const eventHandler = Symbol('Super Small State Machine Event Handler')
export const emit = callback => ({
	[eventEmitter]: true,
	callback
})

const eventHandlerNode = new N(eventHandler, {
	isNode: (object, objectType) => {
		if (objectType !== 'object' || !object) return;
		if ('on' in object) return true;
	},
	execute: () => S.return,
	nextPath: (path) => path
})

const eventEmitterNode = new N(eventEmitter, {
	isNode: (object, objectType) => {
		if (objectType !== 'object' || !object) return;
		if (eventEmitter in object) return true;
	},
	execute: () => S.return,
})


export default events => instance => {
  return instance
    .override(function (...input) { return new StateMachineInstance(this, ...input) })
    .addNode(eventEmitterNode)
		.addNode(eventHandlerNode)
    .adaptInput(state => ({ event: null, ...state }))
}
// export default ({ process, config: { initialState: { events = {}, ...initialState }, ...config } }) => {
// 	return {
// 		process,
// 		config: {
// 			...config,
// 			initialState: {
// 				...initialState,
// 				event: null,
// 			},
// 			method: function (...input) { return new StateMachineInstance(this, ...input) },
// 			nodes: new NodeDefinitions([...config.nodes.values(), eventEmitterNode, eventHandlerNode].map(node => [node.name,node]))
// 		}
// 	}
// }
