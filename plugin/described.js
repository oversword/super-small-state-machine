import S from "../index.js"

export const actionMarker = Symbol('Super Small State Machine Action')
export const action = (name) => {
	return {
		[actionMarker]: true,
		name,
	}
}
export const a = action

export const conditionMarker = Symbol('Super Small State Machine Condition')
export const condition = (name) => {
	return {
		[conditionMarker]: true,
		name,
	}
}
export const c = condition

export const transitionMarker = Symbol('Super Small State Machine Transition')
export const transition = (name) => {
	return {
		[transitionMarker]: true,
		name,
	}
}
export const t = transition

const transformProcess = ({ actions, conditions, transitions }) => {
	const recur = S.traverse(function (item, _path, _process, type) {
		if (!(item && typeof item === 'object')) return item
		
		if (type === S.types.CD) {
			const conditionString = item[S.kw.IF]
			if (conditionString && typeof conditionString === 'object' && conditionString[conditionMarker])
				return {
					...item,
					[S.kw.IF]: conditions[conditionString.name]
				}
		} else

		if (type === S.types.SW) {
			const conditionString = item[S.kw.SW]
			if (conditionString && typeof conditionString === 'object' && conditionString[conditionMarker])
				return {
					...item,
					[S.kw.SW]: conditions[conditionString.name]
				}
		}
		
		let action;
		const name = item.name;
		if (item[actionMarker]) {
			action = actions[name]
		}
		else if (item[transitionMarker]) {
			action = transitions[name]
		}
		if (name && action) {
			const actionType = typeof action
			if (actionType === 'function')
				return action
			const processed = recur({
				config: this.config,
				process: action
			})
			if (typeof processed === 'object')
				processed.name = name
			return processed
		}
		return item
	})
	return recur
}

export const describedPlugin = ({ actions, conditions, transitions }) =>
	instance => instance.adapt(process => transformProcess({ actions, conditions, transitions })({
		process,
		config: instance.config
	}))
export default describedPlugin