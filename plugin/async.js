import S, { Node, noop , Stack, Trace } from "../index.js"
import { InterruptGotoNode } from "../index.js"
import { Return } from "../index.js"
import { Changes } from "../index.js"
import { Interrupts } from "../index.js"

export const Wait = Symbol("SSSM Wait")
export class WaitNode extends Node {
	static type = Wait
	static typeof(object, objectType) { return object === Wait }
}
export const uninterruptable = (...actions) => ({ [Uninterruptable]: actions.length === 1 ? actions[0] : actions })
export const Uninterruptable = Symbol("SSSM Uninterruptable")
export class UninterruptableNode extends Node {
    static type = Uninterruptable
    static typeof(object, objectType) { return object && (objectType === 'object') && (Uninterruptable in object) }
    static perform(action, state) {
        return {
            ...state,
            [Stack]: [  [ ...state[Stack][0], Uninterruptable ], ...state[Stack].slice(1) ],
            [Uninterruptable]: state[Uninterruptable] + 1,
        }
    }
    static proceed(nodeInfo, state) {
        if (nodeInfo.action) return state;
        const proceedAsNormal = Node.proceed.call(this, nodeInfo, state)
        return { ...proceedAsNormal, [Uninterruptable]: proceedAsNormal[Uninterruptable] - 1 }
    }
}
export class Interruptable extends Promise {
	#interruptor = () => {}
	#settled = false
	constructor(executorOrPromise, interruptor) {
		const settle = f => (...args) => {
			this.#settled = true
			f(...args)
		}
		if (typeof executorOrPromise === 'function') super((resolve, reject) => executorOrPromise(settle(resolve), settle(reject)))
		else super((resolve, reject) => { Promise.resolve(executorOrPromise).then(settle(resolve)).catch(settle(reject)) })
		this.#interruptor = interruptor
	}
	interrupt(...interruptions) {
		if (this.#settled) throw new Error('A settled Interruptable cannot be interrupted.')
		return this.#interruptor(...interruptions)
	}
}
export const Interrupt = Symbol("SSSM Interrupt")
export function runAsync(...input) {
    if (typeof this.process !== 'object')
        throw new Error(`The top-level of an asynchronous state machine must be an object so that system interrupts may be performed.`)
    let interruptionStack = []
    let interruptionResolve = noop
    const waitForInterruption = resolve => {interruptionResolve = () => {resolve();interruptionResolve = noop}}

    const executor = async () => {
        const { until, iterations, input: adaptInput, output: adaptOutput, before, after, defaults, trace } = { ...S.config, ...this.config }
        const modifiedInput = (await adaptInput.apply(this, input)) || {}
        let r = 0, currentState = { ...before.reduce((prev, modifier) => modifier.call(this, prev), S._changes(this, {
            [Changes]: {},
            ...defaults,
			[Stack]: modifiedInput[Stack] || [[]],
			[Interrupts]: modifiedInput[Interrupts] || [],
			[Trace]: modifiedInput[Trace] || [],
            [Uninterruptable]: 0,
            [Interrupt]: (...args) => interruptable.interrupt(...args),
            ...(Return in modifiedInput ? {[Return]: modifiedInput[Return]} : {})
        }, modifiedInput)), [Changes]: {} }
        while (r < iterations) {
            if (await until.call(this, currentState, r)) break;
            if (++r >= iterations) throw new MaxIterationsError(`Maximum iterations of ${iterations} reached at path [ ${currentState[Stack][0].map(key => key.toString()).join(', ')} ]`, { instance: this, state: currentState, data: { iterations } })
            if (trace) currentState = { ...currentState, [Trace]: [ ...currentState[Trace], currentState[Stack] ] }
            if (interruptionStack.length && currentState[Uninterruptable] <= 0) {
                while (interruptionStack.length)
                    currentState = await S._perform(this, currentState, interruptionStack.shift())
            } else {
                const action = await S._execute(this, currentState)
                if (action === Wait && !interruptionStack.length) await new Promise(waitForInterruption)
                currentState = await S._perform(this, currentState, action)
                currentState = await S._proceed(this, currentState, { node: action, action: true })
            }
        }
        return adaptOutput.call(this, after.reduce((prev, modifier) => modifier.call(this, prev), currentState))
    }
    const interrupter = (...interruptions) => new Promise(resolve => {
        const systemInterruption = Symbol("System Interruption")
        const interruption = Symbol("User Interruption")
        const lastInterruption = (interruptions.length && this.config.nodes.typeof(interruptions[interruptions.length - 1]) === InterruptGotoNode.type)
            ? interruptions[interruptions.length - 1] : interruption
        const resolveInterruption = ({ [lastInterruption]: returnVal }) => resolve(returnVal)
        this.process[systemInterruption] = [interruption, resolveInterruption]
        this.process[interruption] = this.config.adapt.reduce((prev, adapter) => adapter.call(this, prev), interruptions)
        interruptionStack.push(systemInterruption)
        interruptionResolve()
    })
    const interruptable = new Interruptable(executor(), interrupter)
    return interruptable
}
export const asyncPlugin = S.with(
    S.addNode(WaitNode),
    S.addNode(UninterruptableNode),
    S.override(runAsync)
)
export default asyncPlugin