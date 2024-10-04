const clone_object = (obj) => {
    if (Array.isArray(obj)) return obj.map(clone_object)
    if (obj === null) return null
    if (typeof obj !== 'object') return obj
    return Object.fromEntries(Object.entries(obj).map(([key,value]) => [ key, clone_object(value) ]));
}
const unique_list_strings = (list, getId = item => item) => Object.values(Object.fromEntries(list.map(item=>[getId(item),item])));
const reduce_get_path_object = (obj, step) => obj[step]
const get_path_object = (object, path) => path.reduce(reduce_get_path_object, object)
const normalise_function = functOrReturn => (typeof functOrReturn === 'function') ? functOrReturn : () => functOrReturn
const reduce_deep_merge_object = (base, override) => {
    if (!((base && typeof base === 'object') && !Array.isArray(base) && (override && typeof override === 'object') && !Array.isArray(override)))
        return override;
    const allKeys = unique_list_strings(Object.keys(base).concat(Object.keys(override)));
    return Object.fromEntries(allKeys.map(key => [
        key, key in override ? deep_merge_object(base[key], override[key]) : base[key]
    ]));
}
const deep_merge_object = (base, ...overrides) => overrides.reduce(reduce_deep_merge_object, base)
const wait_time = delay => (delay ? new Promise(resolve => setTimeout(resolve, delay)) : Promise.resolve())

class GoToReferenceError extends ReferenceError {}
class ContextReferenceError extends ReferenceError {}
class ActionTypeError extends TypeError {}

export default class S {
    static return = Symbol('Small State Machine Return')
    static goto = Symbol('Small State Machine Go-To')
    static path = Symbol('Small State Machine Path')
    static kw = {
        IF: 'if',
        TN: 'then',
        EL: 'else',
        SW: 'switch',
        CS: 'case',
        DF: 'default',
        IT: 'initial',
        RS: 'result',
    }
    static keywords = S.kw
    static runConfig = {
        iterations: 10000,
        result: true,
        until: result => S.return in result,
        inputModifier: a => a,
        outputModifier: a => a,
        async: false,
        delay: 0,
        allow: 1000,
        wait: 0,
    }
    static traverse = (iterator = a => a, post = b => b) => {
        const iterate = sequence => {
            if (Array.isArray(sequence))
                return sequence.map(action => iterate(action))
            if (sequence && (typeof sequence) === 'object') {
                if (S.kw.IF in sequence) {
                    return post({
                        [S.kw.IF]: sequence[S.kw.IF],
                        ...(S.kw.TN in sequence ? {
                            [S.kw.TN]: iterate(sequence[S.kw.TN])
                        } : {}),
                        ...(S.kw.EL in sequence ? {
                            [S.kw.EL]: iterate(sequence[S.kw.EL])
                        } : {})
                    })
                } else if (S.kw.SW in sequence) {
                    const cases = Object.fromEntries(Object.entries(sequence[S.kw.CS]).map(([key, method]) => [
                        key,
                        iterate(method)
                    ]))
                    return post({
                        [S.kw.SW]: sequence.switch,
                        [S.kw.CS]: cases,
                    })
                } else if (S.kw.IT in sequence) {
                    const stages = Object.fromEntries(Object.entries(sequence).map(([key, method]) => [
                        key,
                        iterate(method)
                    ]))
                    return post(stages)
                }
            }
            return iterator(sequence)
        }
        return iterate
    }
    static lastArray(sequence, path) {
        const item = get_path_object(sequence, path)
        if (Array.isArray(item)) return path
        if (path.length === 0) return null
        return S.lastArray(sequence, path.slice(0,-1))
    }
    static lastMachine(sequence, path) {
        const item = get_path_object(sequence, path)
        if (item && typeof item === 'object' && (S.kw.IT in item)) return path
        if (path.length === 0) return null
        return S.lastMachine(sequence, path.slice(0,-1))
    }
    static nextPath(sequence, path) {
        const childItem = path[path.length-1]
        const parentPath = path.slice(0,-1)
        const parActs = get_path_object(sequence, parentPath)
        const acts = get_path_object(sequence, path)
        if (Array.isArray(acts) && acts.length !== 0)
            return [ ...path, 0 ]
        if (Array.isArray(parActs) && childItem+1 < parActs.length)
            return [ ...parentPath, childItem+1 ]
        if (parentPath.length === 0)
            return null
        // TODO: use lastArray instead
        const lastNumber = parentPath.findLastIndex(p => typeof p === 'number')
        return parentPath.slice(0, lastNumber).concat([parentPath[lastNumber]+1])
    }
    static advance(state, process, path, output) {
        if (output === S.return)
            return {
                ...state,
                [S.return]: true,
                [S.path]: path
            }
        let currentState = state
        switch (typeof output) {
            case 'undefined':
                break;
            case 'number':
                const lastArray = S.lastArray(process, path.slice(0,-1))
                if (!lastArray)
                    throw new GoToReferenceError(`A relative goto has been provided as a number (${output}), but no list exists that this number could be an index of.`)
                return {
                    ...currentState,
                    [S.path]: [...lastArray, output]
                }
            case 'string':
                const lastMachine = S.lastMachine(process, path.slice(0,-1))
                if (!lastMachine)
                    throw new GoToReferenceError(`A relative goto has been provided as a string (${output}), but no state machine exists that this string could be a state of.`)
                return {
                    ...currentState,
                    [S.path]: [...lastMachine, output]
                }
            case 'object': {
                if (!output) break;
                if (Array.isArray(output))
                    return {
                        ...currentState,
                        [S.path]: output
                    }
                if (S.goto in output) {
                    if (Array.isArray(output[S.goto]))
                        return {
                            ...currentState,
                            [S.path]: output[S.goto]
                        }
                    return S.advance(currentState, process, path, output[S.goto])
                }
                if (S.return in output)
                    return {
                        ...currentState,
                        [S.return]: true,
                        [S.kw.RS]: output[S.return],
                        [S.path]: path
                    }
                // If none of the above, assume it is an assign object
                currentState = S.applyChanges(currentState, output)
                break;
            }
            default:
                throw new ActionTypeError(`Unknwown output or action type: ${typeof output} at [ ${path.join(', ')} ]`)
        }
        const nextPath = S.nextPath(process, path)
        if (! nextPath)
            return {
                ...currentState,
                [S.path]: path,
                [S.return]: true,
            }
        return {
            ...currentState,
            [S.path]: nextPath
        }
    }
    static execute(state, process, path) {
        const method = get_path_object(process, path)
        const methodType = typeof method
        switch (methodType) {
            case 'function': {
                return method(state)
            }
            case 'object': {
                if (!method) break;
                if (Array.isArray(method))
                    return [...path,0]
                if (S.kw.IF in method) {
                    if (normalise_function(method[S.kw.IF])(state))
                        return [...path,S.kw.TN]
                    else return [...path,S.kw.EL]
                }
                if (S.kw.SW in method) {
                    const key = normalise_function(method[S.kw.SW])(state)
                    const fallbackKey = key in (method[S.kw.CS]) ? key : S.kw.DF
                    return [...path,S.kw.CS,fallbackKey]
                }
                if (S.kw.IT in method) {
                    return [...path,S.kw.IT]
                }
            }
        }
        return method
    }
    static applyChanges(state, changes) {
        const invalidChanges = Object.entries(changes).find(([name]) => !(name in state))
        if (invalidChanges)
            throw new ContextReferenceError(`Only properties that exist on the initial context may be updated.\nYou changed '${invalidChanges[0]}', which is not one of: ${Object.keys(state).join(', ')}`)
        return deep_merge_object(state, changes)
    }
    constructor(state = {}, process, runConfig = S.runConfig) {
        const defaultRunConfig = deep_merge_object(S.runConfig, runConfig)
        const initialState = deep_merge_object({
            [S.kw.RS]: null
        }, state)
        const exec = (input = {}, runConfig = defaultRunConfig) => {
            const { until, result, iterations, inputModifier, outputModifier } = deep_merge_object(defaultRunConfig, runConfig)
            const modifiedInput = inputModifier(input) || {}
            const { [S.path]: path = [], ...pureInput } = modifiedInput
            let currentPath = path
            let currentState = S.applyChanges(initialState, pureInput)
            let r = 0
            while (r < iterations) {
                if (until(currentState))
                    break;
                r++
                const output = S.execute(currentState, process, currentPath)
                currentState = S.advance(currentState, process, currentPath, output)
                currentPath = currentState[S.path]
            }
            return outputModifier(result ? currentState[S.kw.RS] : currentState)
        }
        const execAsync = async (input = {}, runConfig = defaultRunConfig) => {
            const { delay, allow, wait, until, result, iterations, inputModifier, outputModifier } = deep_merge_object(defaultRunConfig, runConfig)
            const modifiedInput = (await inputModifier(input)) || {}
            const { [S.path]: path = [], ...pureInput } = modifiedInput
            let currentPath = path
            let currentState = S.applyChanges(initialState, pureInput)
            if (delay)
                await wait_time(delay)
            let startTime = Date.now()
            let r = 0
            while (r < iterations) {
                if (until(currentState))
                    break;
                r++
                const output = await S.execute(currentState, process, currentPath)
                currentState = S.advance(currentState, process, currentPath, output)
                currentPath = currentState[S.path]
                if (allow > 0 && r % 10 === 0) {
                    const nowTime = Date.now()
                    if (nowTime - startTime >= allow)
                        await wait_time(wait)
                }
            }
            return outputModifier(result ? currentState[S.kw.RS] : currentState)
        }
        return new Proxy(S, {
            apply(target, thisArg, argumentsList) {
                return defaultRunConfig.async ? execAsync(...argumentsList) : exec(...argumentsList)
            },
            get(target, name) {
                switch (name) {
                    case 'async':
                        return new S(initialState, process, { ...defaultRunConfig, async: true })
                    case 'sync':
                        return new S(initialState, process, { ...defaultRunConfig, async: false })
                    case 'input':
                        return inputModifier => new S(initialState, process, {
                            ...defaultRunConfig,
                            inputModifier: input => inputModifier(defaultRunConfig.inputModifier(input))
                        })
                    case 'output':
                        return outputModifier => new S(initialState, process, {
                            ...defaultRunConfig,
                            outputModifier: output => outputModifier(defaultRunConfig.outputModifier(output))
                        })
                    case 'step':
                        return new S(initialState, process, { ...defaultRunConfig, iterations: 1, result: false })
                    case 'actionName':
                        return path => {
                            const method = get_path_object(process, path)
                            return method && method.name
                        }
                    default:
                        return target[name]
                }
            }
        })
    }
}
export const SuperSmallStateMachine = S