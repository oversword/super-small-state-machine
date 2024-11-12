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

		this.#runner = runner.override(null).result(a => a).input(a => a).async
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
			const node = get_path_object(this.#runner.process, res[S.Path])
			const nodeType = this.#runner.config.nodes.typeof(node)
			if (nodeType === eventEmitter) {
				const event = typeof node.callback === 'function' ? node.callback(res) : node.callback
				this.#subscriptions.forEach(callback => {
					callback(event)
				})
				this.#partialPromise = this.#runner.perform(res)
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
						[S.Path]: [...res[S.Path],'on',event.name]
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

export class EventHandlerNode extends N {
	static name = eventHandler
	static typeof(object, objectType) {
		if (objectType !== 'object' || !object) return;
		if ('on' in object) return true;
	}
	static execute() { return S.Return }
	static proceed(path) { return path }
}

export class EventEmitterNode extends N {
	static name = eventEmitter
	static typeof(object, objectType) {
		if (objectType !== 'object' || !object) return;
		if (eventEmitter in object) return true;
	}
	static execute() { return S.Return }
}

const eventsPlugin = events => instance => {
  return instance
    .override(function (...input) { return new StateMachineInstance(this, ...input) })
    .addNode(EventEmitterNode)
		.addNode(EventHandlerNode)
    .adaptStart(state => ({ event: null, ...state }))
}
export default eventsPlugin