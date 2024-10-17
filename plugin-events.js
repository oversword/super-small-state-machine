import S, { get_path_object } from './index.js'

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

		this.#runner = runner.config({ runMethod: null, result: false, inputModifier: a => a }).async
		const modifiedInput = runner.runConfig.inputModifier(...input)
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
			const nodeType = S.isNode(node)
			if (nodeType === eventEmitter) {
				const event = typeof node.callback === 'function' ? node.callback(res) : node.callback
				this.#subscriptions.forEach(callback => {
					callback(event)
				})
				this.#partialPromise = this.#runner(S.advance(res, this.#runner.process))
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

S.addNode(eventHandler, {
  isNode: (object, objectType) => {
    if (objectType !== 'object' || !object) return;
    if ('on' in object) return true;
  },
  execute: () => S.return,
  advance: (_state, _process, path, _lastPath) => path
})

S.addNode(eventEmitter, {
	isNode: (object, objectType) => {
		if (objectType !== 'object' || !object) return;
		if (eventEmitter in object) return true;
	},
	execute: () => S.return,
})

export default ({ state: { events = {}, ...state }, process, runConfig }) => {
  return {
    state: {
      ...state,
			event: null,
    },
    process,
    runConfig: {
      ...runConfig,
      runMethod: function (...input) { return new StateMachineInstance(this, ...input) }
    }
  }
}
