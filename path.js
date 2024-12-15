import { get_path_object, list_path_object } from "./index.js"

// TODO: implement ! for not
// TODO: implement {} for dynamically getting values (and queries) from struc
// TODO: implement # and . in a CSS like way (assume id & class, but make configurable)
// TODO: Left over: £@|&?;: Reserved: _$\
// TODO: ? to mean optional
// TODO: & | should be used for AND and OR? optional with ][ and ,

/********** SYNTAX PARSER **********/
export class PathSyntaxError extends SyntaxError {
	constructor({ pointer, pathString, char, mode }) {
		const dist = 20
		const snippet = pathString.slice(Math.max(0, pointer-dist), pointer+dist)
		const preSpace = pathString.slice(Math.max(0, pointer-dist), pointer).split('').map(c => c === '\t' ? c : ' ').join('')
		super(`Symbol '${char}' cannot be used in this context. Read mode: ${mode}. At pos ${pointer}.\n${preSpace.length===dist?' ...':'    '}${snippet}\n    ${preSpace}^`)
	}
}
const Return = Symbol('Return')
const readingText = mode => mode === 'text' || mode === 'regex_flags'
const numberLookAhead = ({ pointer, partPointer, pathString }) => {
	let p = pointer + 1
	let numberSeen = false
	while (p < pathString[partPointer].length) {
		const char = pathString[partPointer][p]
		if (regex_number.exec(char)) {
			numberSeen = true
			p ++
		}
		else if (char === '%')
			return numberSeen
		else return false
	}
	return false
}
const recordName = state => (state.char === undefined || state.char in chars) && readingText(state.mode)
const readName = state => {
	const { readingValue, mode, name, stack, path, notted, operator } = state
	const list = get_path_object(stack, path)
	if (readingValue) {
		list[list.length-1] = {
			...list[list.length-1],
			value: name,
			vaueNotted: notted,
			valueMode: mode,
			matcher: matcher(list[list.length-1].name, name, list[list.length-1].mode, mode)
		}
		state.name = ''
		state.readingValue = false
		state.notted = false
		return
	}
	list[list.length] = {
		operator: (operator === 'none' && list.length === 0) ? get_path_object(stack, [...path.slice(0, -3), 'operator']) : operator,
		matcher: matcher(name, undefined, mode),
		mode,
		children: [],
		notted,
		name
	}
	state.name = ''
	state.notted = false
}
const chars = {
	'(': state => {
		const list = get_path_object(state.stack, state.path)
		const nextNode = list.length
		list[nextNode] = { selectors: [[[]]], operator: state.operator }
		state.path = [ ...state.path, nextNode, 'selectors', 0, 0 ]
		state.operator = 'none'
		state.mode = 'operator'
	},
	')': state => {
		state.path = state.path.slice(0, -4)
		state.mode = 'operator'
		state.operator = 'none'
	},
	'[': state => {
		const currentNode = get_path_object(state.stack, state.path).length-1
		const list = get_path_object(state.stack, [...state.path, currentNode, 'children'])
		const nextNode = list.length
		const nextPath = [ ...state.path, currentNode, 'children', nextNode ]
		list[nextNode] = [[]]
		state.path = [ ...nextPath, 0 ]
		state.operator = 'none'
		state.mode = 'operator'
	},
	']': state => {
		state.path = state.path.slice(0, -4)
		state.mode = 'operator'
		state.operator = 'none'
	},
	'=': state => {
		switch (state.mode) {
			case 'text':
				state.mode = 'text'
				state.readingValue = true
				return
			case 'none':
				state[Return] = PathSyntaxError
				return
			default:
				return
		}
	},
	',': state => {
		const list = get_path_object(state.stack, state.path.slice(0,-1))
		const newPath = [ ...state.path.slice(0,-1), state.path[state.path.length-1]+1 ]
		list[state.path[state.path.length-1]+1] = []
		state.path = newPath
		state.operator = 'none'
		state.mode = `operator`
	},
	'/': state => {
		if (!state.escaped) {
			state.name = state.name + state.char
			if (state.mode === 'regex')
				state.mode = 'regex_flags'
			else state.mode = 'regex'
		}
	},
	'`': state => {
		switch (state.mode) {
			case 'operator':
				state.mode = 'magic_quote'
				return
			case 'magic_quote':
				readName(state)
				state.mode = 'operator'
				state.operator = 'default'
				return;
			default:
				state[Return] = PathSyntaxError
		}
	},
	'"': state => {
		switch (state.mode) {
			case 'operator':
				state.mode = 'double_quote'
				return
			case 'double_quote':
				readName(state)
				state.mode = 'operator'
				state.operator = 'default'
				return;
			default:
				state[Return] = PathSyntaxError
		}
	},
	"'": state => {
		switch (state.mode) {
			case 'operator':
				state.mode = 'single_quote'
				return
			case 'single_quote':
				readName(state)
				state.mode = 'operator'
				state.operator = 'default'
				return;
			default:
				state[Return] = PathSyntaxError
		}
	},
	// '!': {
	// 	notted: true
	// },
	'+': state => {
		switch (readingText(state.mode) || state.operator == 'none' ? 'text' : state.operator) {
			case 'text':
				state.mode = 'operator'
				state.operator = 'next_sibling'
				return
			case 'next_sibling':
				state.mode = 'operator'
				state.operator = 'next_siblings'
				return
			default:
				state[Return] = PathSyntaxError
		}
	},
	'-': state => {
		const isNumber = numberLookAhead(state)
		if (isNumber) {
			state.mode = 'text'
			state.name = state.name + state.char
			return
		}
		switch(readingText(state.mode) || state.operator == 'none' ? 'text' : state.operator) {
			case 'text':
				state.mode = 'operator'
				state.operator = 'prev_sibling'
				return;
			case 'prev_sibling':
				state.mode = 'operator'
				state.operator = 'prev_siblings'
				return;
			default:
				state[Return] = PathSyntaxError
		}
	},
	'~': state => {
		switch (readingText(state.mode) || state.operator == 'none' ? 'text' : state.operator) {
			case 'text':
				state.mode = 'operator'
				state.operator = 'sibling'
				return
			case 'sibling':
				state.mode = 'operator'
				state.operator = 'siblings'
				return
			default:
				state[Return] = PathSyntaxError
		}
	},
	'<': state => {
		switch (readingText(state.mode) || state.operator == 'none' ? 'text' : state.operator) {
			case 'text':
				state.mode = 'operator'
				state.operator = 'parent'
				return
			case 'parent':
				state.mode = 'operator'
				state.operator = 'ancestor'
				return
			default:
				state[Return] = PathSyntaxError
		}
	},
	' ': state => {
		if (readingText(state.mode)) {
			state.mode = 'operator'
			state.operator = 'none'
		}
	},
	'\t': state => {
		if (readingText(state.mode)) {
			state.mode = 'operator'
			state.operator = 'none'
		}
	},
	'>': state => {
		switch (readingText(state.mode) || state.operator == 'none' ? 'text' : state.operator) {
			case 'text':
				state.mode = 'operator'
				state.operator = 'child'
				return
			case 'child':
				state.mode = 'operator'
				state.operator = 'descendent'
				return
			default:
				state[Return] = PathSyntaxError
		}
	},
}
export const selectorAST = (template, ...data) => {
	const initialState = {
		mode: 'operator',
		operator: 'none',
		notted: false,
		name: '',
		value: '',
		readingValue: false,
		escaped: false,
		path: ['selectors', 0, 0],
		stack: { selectors: [[[]]], operator: 'none' },
		char: undefined,
		pointer: 0,
		partPointer: 0,
		pathString: typeof template === 'string' ? [ template ] : template,
		data,
	}
	let state = { ...initialState }
	while (state.partPointer < state.pathString.length) {
		while (state.pointer < state.pathString[state.partPointer].length) {
			state.char = state.pathString[state.partPointer][state.pointer]
			if (recordName(state))
				readName(state)
			if ((state.mode === 'regex'        && (state.char !== '/' || state.escaped)) ||
					(state.mode === 'single_quote' && (state.char !== "'" || state.escaped)) ||
					(state.mode === 'double_quote' && (state.char !== '"' || state.escaped)) ||
					(state.mode === 'magic_quote'  && (state.char !== '`' || state.escaped))) {
				state.name += state.char
			} else {
				if (chars[state.char]) {
					chars[state.char](state)
					if (state[Return]) break;
				} else {
					state.name += state.char
					if(state.mode !== 'regex_flags')
						state.mode = 'text'
				}
			}
			state.pointer ++
		}
		if (state[Return]) break;

		if (state.partPointer < state.data.length) {
			state.name = state.data[state.partPointer]
			state.mode = 'text'
			readName(state)
			state.mode = 'operator'
			state.operator = 'none'
		}
		state.partPointer ++
		state.pointer = 0
	}
	state.char = undefined
	if (recordName(state))
		readName(state)
	state.mode = 'end'
	const { stack, [Return]: result = stack } = state
	if (result === PathSyntaxError)
		throw new PathSyntaxError(state)
	return result
}

/********** PROPERTY MATCHER **********/
const toRegex = str => {
	const endIndex = str.lastIndexOf('/')
	return new RegExp(str.slice(1, endIndex), str.slice(endIndex+1))
}
const execRegex = regex => str => regex.exec(str)
const matcher = (name, value, mode, valueMode) => {
	if (value === undefined)
		return textMatcher(name, mode)
	const nameMatcher = textMatcher(name, mode)
	const valueMatcher = textMatcher(value, valueMode)
	return (n, v) => nameMatcher(n) && valueMatcher(v)
}
const numberMatcher = matcher => {
	let [ match, mod ] = matcher.split('%')
	// console.log({match, mod,matcher})
	if (!mod) mod = match ? Infinity : 1
	else mod = parseInt(mod)
	if (!match) match = 0
	else match = parseInt(match)
	return (index, v, parent) => {
		const length = mod === Infinity
			? (Array.isArray(parent) ? parent.length : Math.max(0,...Object.keys(parent).filter(key => regex_number.exec(key)).map(n => Number(n)))+1)
			: mod
		const ret = (index % mod) === ((match + length) % length)
		return ret
	}
}
const regex_number = /^\d+$/
const textMatcher = (name, mode) => {
	if (name instanceof RegExp) return execRegex(name)
	if (mode === 'regex_flags') return execRegex(toRegex(name))
	if (typeof name === 'symbol') return str => name == str
	const quoted = mode === 'double_quote' || mode === 'single_quote'
	if (quoted) return str => name == str
	else if (name === '*') return () => true
	else if (name === '^') return v => Boolean(v)
	else if (name.includes('*') || name.includes('^')) return execRegex(new RegExp('^'+escapeStringRegExp(name).replaceAll('*', '.*').replaceAll('^', '.+')+'$'))
	else if (name === '%' && mode !== 'magic_quote') return execRegex(regex_number)
	else if (name.includes('%') && mode !== 'magic_quote') return numberMatcher(name)
	return str => name == str
}
const regex = /[|\\{}()[\]$+?.]/g; // exclude '*' and '^'
const escapeStringRegExp = str => str.replace(regex, '\\$&')





/********** PATH MATCHER **********/
export class PathOperationError extends ReferenceError {}
const siblingData = ({ path, struc }) => {
	const parentPath = path.slice(0,-1)
	const siblings = Object.keys(get_path_object(struc, parentPath))
	const currentKey = path[path.length-1]
	const index = siblings.findIndex(typeof currentKey === 'number' ? k => Number(k) === currentKey : k => k === currentKey)
	return { index, siblings, parentPath }
}
const operators = {
	child: ({ path, item }) => Object.keys(item).map(key => [...path, key]),
	parent: ({ path }) => [path.slice(0,-1)],
	ancestor: ({ path }) => path.map((_, index, path) => path.slice(0, index)),
	descendent: ({ path, item }) => list_path_object(item).slice(1).map(child => [ ...path, ...child ]),
	sibling: ({ path, struc }) => {
		if (path.length === 0) return []
		const { index, siblings, parentPath } = siblingData({ path, struc })
		return [].concat(index === 0 ? [] : [[ ...parentPath, siblings[index-1] ]], index === siblings.length-1 ? []: [[ ...parentPath, siblings[index+1] ]])
	},
	siblings: ({ path, struc }) => {
		if (path.length === 0) return []
		const { index, siblings, parentPath } = siblingData({ path, struc })
		return siblings.slice(0, index).concat(siblings.slice(index+1)).map(key => [ ...parentPath, key ])
	},
	prev_sibling: ({ path, struc }) => {
		if (path.length === 0) return []
		const { index, siblings, parentPath } = siblingData({ path, struc })
		return index === 0 ? [] : [[ ...parentPath, siblings[index-1] ]]
	},
	next_sibling: ({ path, struc }) => {
		if (path.length === 0) return []
		const { index, siblings, parentPath } = siblingData({ path, struc })
		return index === siblings.length-1 ? []: [[ ...parentPath, siblings[index+1] ]]
	},
	prev_siblings: ({ path, struc }) => {
		if (path.length === 0) return []
		const { index, siblings, parentPath } = siblingData({ path, struc })
		return siblings.slice(0, index).reverse().map(key => [ ...parentPath, key ])
	},
	next_siblings: ({ path, struc }) => {
		if (path.length === 0) return []
		const { index, siblings, parentPath } = siblingData({ path, struc })
		return siblings.slice(index+1).map(key => [ ...parentPath, key ])
	}
}

const inverse = {
	child: 'parent',
	parent: 'child',
	ancestor: 'descendent',
	none: 'none',
	descendent: 'ancestor',
	sibling: 'sibling',
	prev_sibling: 'next_sibling',
	next_sibling: 'prev_sibling',
	siblings: 'siblings',
	prev_siblings: 'next_siblings',
	next_siblings: 'prev_siblings',
}

const bumpOperator = ast => ast.map((a, i, l) => ({
	...a,
	operator: i < l.length-1 ? l[i+1].operator : 'none'
}))
// Logic is all in reverse by default to work like node.is not document.query
const matches = (struc, ast, direction = -1) => {
	console.log(ast)
	const iterate = (path, astPath = []) => {
		const currentAst = get_path_object(ast, astPath)
		if ('selectors' in currentAst) return currentAst.selectors.every((orList, j) => orList.some((_, i) => iterate(path, [ ...astPath, 'selectors', j, i ])))
		if (Array.isArray(currentAst)) return currentAst.length === 0 ? false : iterate(path, [ ...astPath, direction === -1 ? currentAst.length-1 : 0 ],)
		const item = get_path_object(struc, path)
		const parItem = get_path_object(struc, path.slice(0,-1))
		// TODO: item, index, list?
		if (!currentAst.matcher(path[path.length-1], item, parItem)) return false
		if (currentAst.children && currentAst.children.length) {
			const childMatch = currentAst.children.every(disconnected => {
				const { children, ...simpleAST } = currentAst
				return matches(struc, {
					operator: 'none',
					selectors: [disconnected.map(a => 
						bumpOperator([
							simpleAST,
							...a,
						]))]
				}, 1)(path)
			})
			if (!childMatch) return false
		}
		const operator = direction === -1 ? inverse[currentAst.operator] : currentAst.operator
		const nextNodebase = [...astPath].reverse().findIndex((n, i, l) => i%4 === 0 && typeof n === 'number' && ((direction === -1 && n !== 0) || (direction === 1 && n !== get_path_object(ast, astPath.slice(0,-1-i)).length-1)))
		if (nextNodebase === -1) return operator === 'none' || operator === 'ancestor' || (operator === 'parent' && path.length === 1)
		const nextNode = [ ...astPath.slice(0,-1-nextNodebase), astPath[astPath.length-1-nextNodebase] + direction ]
		const operation = operator === 'none' ? (direction === -1 ? operators.ancestor : operators.descendent) : operators[operator]
		const nextPaths = operation({ path, item, struc })
		// console.log(nextPaths, operator)
		return nextPaths.some(p => iterate(p, nextNode))
	}
	return (a) => iterate(a)
}
export const queryPaths_recurse = (struc, selector) => list_path_object(struc).filter(matches(struc, selectorAST(selector)))


const matchModes = ['node','and','or','seq']
// // Logic is all in reverse by default to work like node.is not document.query
const matches_bork = (struc, ast, direction = -1) => {
	// console.log(ast)
	// const iterate = (path, astPath = []) => {
		const allPaths = list_path_object(struc)
		const directions = [-1]
		let currentAstPath = []
		// let currentPaths = [[]]
		let origins = allPaths.map((_,i) => i)
		let final_matches = []
		let paths_stack = [[...allPaths]]
		while (currentAstPath) {
			const mode = matchModes[currentAstPath.length % 4]
			const currentAst = get_path_object(ast, currentAstPath)
			// console.log(mode)
			// const state = {

			// }
			const direction = directions[directions.length-1]
			const currentPaths = paths_stack[paths_stack.length-1]
			switch (mode) {
				case 'seq':
					if (direction === 1)
						currentAstPath  = [ ...currentAstPath, 0 ]
					else currentAstPath  = [ ...currentAstPath, currentAst.length-1 ]
					break
				case 'and':
				case 'or':
					currentAstPath  = [ ...currentAstPath, 0 ]
					break
				case 'node': {
					if ('selectors' in currentAst) {
						currentAstPath = [...currentAstPath, 'selectors']
						break
					}


					const operator = direction === -1 ? inverse[currentAst.operator] : currentAst.operator
					const nextNodebase = [...currentAstPath].reverse().findIndex((n, i, l) => i%4 === 0 && typeof n === 'number' && ((direction === -1 && n !== 0) || (direction === 1 && n !== get_path_object(ast, currentAstPath.slice(0,-1-i)).length-1)))
					const nextNode = [ ...currentAstPath.slice(0,-1-nextNodebase), currentAstPath[currentAstPath.length-1-nextNodebase] + direction ]
					console.log({nextNodebase, currentAstPath})
					// if (nextNodebase === -1) {
					// 	console.log()
					// }
						// return operator === 'none' || operator === 'ancestor' || (operator === 'parent' && path.length === 1)
					const operation = operator === 'none' ? (direction === -1 ? operators.ancestor : operators.descendent) : operators[operator]


					let newPaths = []
					let newOrigins = []
					for (let i=0;i<currentPaths.length;i++) {
						const origin = origins[i]
						const path = currentPaths[i]
						console.log({path})
						const item = get_path_object(struc, path)
						const parItem = path.length === 0 ? undefined : get_path_object(struc, path.slice(0,-1))
						// TODO: item, index, list?
						if (!currentAst.matcher(path[path.length-1], item, parItem)) continue;


						// TODO: item, index, list?
						const nextPaths = operation({ path, item, struc })
						newOrigins = newOrigins.concat(Array(nextPaths.length).fill(origin))
						newPaths = newPaths.concat(nextPaths)
						// console.log({nextPaths, operator, nextNode,operation})
						// return nextPaths.some(p => iterate(p, nextNode))


						// if (currentAst.children && currentAst.children.length) {
						// 	const childMatch = currentAst.children.every(disconnected => {
						// 		const { children, ...simpleAST } = currentAst
						// 		return matches(struc, {
						// 			operator: 'none',
						// 			selectors: [disconnected.map(a => 
						// 				bumpOperator([
						// 					simpleAST,
						// 					...a,
						// 				]))]
						// 		}, 1)(path)
						// 	})
						// 	if (!childMatch) return false
						// }
					}
					let end = false
					let parentAst = get_path_object(ast, currentAstPath.slice(0, -1))
					const currentIndex = currentAstPath[currentAstPath.length-1]
					if (direction === 1) {
						if (currentIndex < parentAst.length-1)
							currentAstPath = [ ...currentAstPath.slice(0, -1), currentIndex+1 ]
						else end = true
					}
					else {
						if (currentIndex > 0)
							currentAstPath = [ ...currentAstPath.slice(0, -1), currentIndex-1 ]
						else end = true
					}

					if (end) {
						console.log({ newOrigins, newPaths, currentAstPath, currentIndex, direction, operator, currentPaths })
						let done = true
						for (let pathIndex=currentAstPath.length-2;pathIndex >= 0; pathIndex--) {
							const pathMode = matchModes[pathIndex % 4]
							if (pathMode === 'node') continue;
							if (pathMode === 'seq') continue;
							const parPath = currentAstPath.slice(0, pathIndex)
							const astIndex = currentAstPath[pathIndex]
							const list = get_path_object(ast, parPath)
							if (pathMode === 'or') {
								// if (!newPaths.length) {
									if (astIndex < list.length-1) {
										final_matches = final_matches.concat(allPaths.filter((_,i) => newOrigins.includes(i)))
										// return allPaths.filter((_,i) => newOrigins.includes(i))

										currentAstPath = [...parPath, astIndex+1]
										break
										console.log('more')
									} else {
										// end
						// currentAstPath = null
										done = true
										console.log('end or')
									}
								// }

							} else if (pathMode === 'and') {
								if (astIndex < list.length-1) {
									console.log('more')
								} else {
									// end
									console.log('end')
								}
								done = true
							}
						}
						if (done)
							currentAstPath = null
						// console.log({pathMode, parPath, list})
						break
						// const nextNodebase = [...currentAstPath].reverse().findIndex((n, i, l) => {
						// 	console.log(n,i,l)
						// 	// if (i%4 === 0) {
						// 	// 	&& typeof n === 'number' && ((direction === -1 && n !== 0) || (direction === 1 && n !== get_path_object(ast, astPath.slice(0,-1-i)).length-1))
						// })
						// if (nextNodebase === -1) return operator === 'none' || operator === 'ancestor' || (operator === 'parent' && path.length === 1)


						// if (operator === 'none' || operator === 'ancestor' || (operator === 'parent' && path[0].length === 1)) {// TODO: path[0] is a cheat. path.some?
						// 	return allPaths.filter((_,i) => newOrigins.includes(i))
						// }
						// if ()
						currentAstPath = null
					} else {
						// console.log({newPaths, nextNodebase, nextNode})
						currentPaths = newPaths
						origins = newOrigins
						currentAstPath = [ ...currentAstPath.slice(0,-1), currentAstPath[currentAstPath.length-1] + direction ]
					}
					break;
					console.log(currentAst, mode)
				}
				default:
					currentAstPath = null
			}
		}

		// const currentAst = get_path_object(ast, astPath)
		// if ('selectors' in currentAst) return currentAst.selectors.every((orList, j) => orList.some((_, i) => iterate(path, [ ...astPath, 'selectors', j, i ])))
		// if (Array.isArray(currentAst)) return currentAst.length === 0 ? false : iterate(path, [ ...astPath, direction === -1 ? currentAst.length-1 : 0 ],)
		// const item = get_path_object(struc, path)
		// const parItem = get_path_object(struc, path.slice(0,-1))
		// // TODO: item, index, list?
		// if (!currentAst.matcher(path[path.length-1], item, parItem)) return false
		// if (currentAst.children && currentAst.children.length) {
		// 	const childMatch = currentAst.children.every(disconnected => {
		// 		const { children, ...simpleAST } = currentAst
		// 		return matches(struc, {
		// 			operator: 'none',
		// 			selectors: [disconnected.map(a => 
		// 				bumpOperator([
		// 					simpleAST,
		// 					...a,
		// 				]))]
		// 		}, 1)(path)
		// 	})
		// 	if (!childMatch) return false
		// }
		// const operator = direction === -1 ? inverse[currentAst.operator] : currentAst.operator
		// const nextNodebase = [...astPath].reverse().findIndex((n, i, l) => i%4 === 0 && typeof n === 'number' && ((direction === -1 && n !== 0) || (direction === 1 && n !== get_path_object(ast, astPath.slice(0,-1-i)).length-1)))
		// if (nextNodebase === -1) return operator === 'none' || operator === 'ancestor' || (operator === 'parent' && path.length === 1)
		// const nextNode = [ ...astPath.slice(0,-1-nextNodebase), astPath[astPath.length-1-nextNodebase] + direction ]
		// const operation = operator === 'none' ? (direction === -1 ? operators.ancestor : operators.descendent) : operators[operator]
		// const nextPaths = operation({ path, item, struc })
		// // console.log(nextPaths, operator)
		// return nextPaths.some(p => iterate(p, nextNode))
	// }
	// return (a) => iterate(a)
	return final_matches
}

const array_eq = (a,b) => {
	if (a.length !== b.length) return false
	return a.every((item,index) => item === b[index])
}
const get_matching_paths = (struc = null, selector = '') => {
	const ast = selectorAST(selector)
	const allPaths = list_path_object(struc)
	let currentAstPath = []
	const resultStack = [{
		results: [],
		resultIndexes: [],
		// indexes: allPaths.map((_,i) => i),
		// paths: [...allPaths],
		currentPaths: [...allPaths],
		currentIndexes: allPaths.map((_,i) => i),
	}]
	let done = false
	while (!done) {
		const currentAst = get_path_object(ast, currentAstPath)
		const currentStack = resultStack[resultStack.length-1]
		// Enter Node
		const mode = matchModes[currentAstPath.length % 4]
		console.log(`Enter: ${mode}${Array(6-mode.length).fill(' ').join('')}`, '/'+(currentAstPath.join('/')))
		console.log(currentStack)
		// console.log(currentStack.currentPaths)
		// console.log(mode, currentAstPath, currentStack.currentPaths, currentStack.results)
		let move = false
		switch (mode) {
			case 'seq':
				resultStack.push({
					results: [],
					resultIndexes: [],
					// paths: [...currentStack.currentPaths],
					// indexes: [...currentStack.currentIndexes],
					currentPaths: [...currentStack.currentPaths],
					currentIndexes: [...currentStack.currentIndexes],
				})
				move  = [ ...currentAstPath, currentAst.length-1 ]
				break
			case 'or':
				resultStack.push({
					results: [],
					resultIndexes: [],
					// paths: [...currentStack.currentPaths],
					// indexes: [...currentStack.currentIndexes],
					currentPaths: [...currentStack.currentPaths],
					currentIndexes: [...currentStack.currentIndexes],
				})
				move = [ ...currentAstPath, 0 ]
				break
			case 'and':
				resultStack.push({
					results: [],
					resultIndexes: [],
					// paths: [...currentStack.currentPaths],
					// indexes: [...currentStack.currentIndexes],
					currentPaths: [...currentStack.currentPaths],
					currentIndexes: [...currentStack.currentIndexes],
				})
				move = [ ...currentAstPath, 0 ]
				break
			case 'node':
				if ('selectors' in currentAst) {
					// Sub-Query (brackets and commas)
					resultStack.push({
						results: [],
						resultIndexes: [],
						// paths: [...currentStack.currentPaths],
						// indexes: [...currentStack.currentIndexes],
						currentPaths: [...currentStack.currentPaths],
						currentIndexes: [...currentStack.currentIndexes],
					})
					move = [ ...currentAstPath, 'selectors' ]
					break
				} else {
					// Actual node
					const operator = currentAst.operator === 'none' ? 'descendent' : currentAst.operator
					const operation = operators[inverse[operator]]

					let newPaths = []
					let newIndexes = []
					// console.log(currentAst, resultStack, currentStack)
					for (let i=0;i<currentStack.currentPaths.length;i++) {
						const origin = currentStack.currentIndexes[i]
						const path = currentStack.currentPaths[i]
						const item = get_path_object(struc, path)
						const parItem = path.length === 0 ? undefined : get_path_object(struc, path.slice(0,-1))
						// TODO: item, index, list?
						if (!currentAst.matcher(path[path.length-1], item, parItem)) continue;
						// TODO: item, index, list?
						const nextPaths = operation({ path, item, struc })
						newIndexes = newIndexes.concat(Array(nextPaths.length).fill(origin))
						newPaths = newPaths.concat(nextPaths)
					}
					currentStack.currentIndexes = newIndexes
					currentStack.currentPaths = newPaths

					if ('children' in currentAst && currentAst.children.length) {
						resultStack.push({
							results: [],
							resultIndexes: [],
							// paths: [...currentStack.currentPaths],
							// indexes: [...currentStack.currentIndexes],
							currentPaths: [...allPaths],
							currentIndexes: allPaths.map((_,i) => i),
						})
						move = [ ...currentAstPath, 'children' ]
						break;
					}
					// Exit Node
					for (let pathIndex=currentAstPath.length-1;pathIndex >= 0; pathIndex--) {
						const parentMode = matchModes[pathIndex % 4]
						const parentStack = resultStack.pop()
						const parentParentStack = resultStack[resultStack.length-1]
						const parentPath = currentAstPath.slice(0, pathIndex)
						const currentIndex = currentAstPath[pathIndex]
						const parentAst = get_path_object(ast, parentPath)
						console.log(`\x1b[31mExit:  ${parentMode}${Array(6-parentMode.length).fill(' ').join('')}\x1b[0m`, '/'+(parentPath.join('/')))
						// console.log(parentStack, newPaths, newIndexes)
						console.log(parentStack)
						if (parentMode === 'node') {
							// parentParentStack.results = parentParentStack.results.concat(parentStack.results)
							console.log()
							if ('sequence' in parentAst) {
								parentParentStack.currentPaths = parentStack.results
								parentParentStack.currentIndexes = parentStack.resultIndexes
							} else {
								console.log(parentParentStack)
							}
							continue; // this the the last thing that will run
						}

						// console.log({ parentMode, parentAst, currentIndex, parentPath, parentStack })
						if (parentMode === 'seq') {
							// Move backward in sequence
							if (currentIndex > 0) {
								resultStack.push(parentStack)
								move = [ ...parentPath, currentIndex-1 ]
								break;
							}
							// Exit sequence
							// parentParentStack.results = parentParentStack.results.concat(allPaths.filter((_,i) => parentStack.currentIndexes.includes(i)))
							// parentParentStack.resultIndexes = parentParentStack.resultIndexes.concat(allPaths.map((_,i) => i).filter(i => parentStack.currentIndexes.includes(i)))
							parentParentStack.results = parentParentStack.results.concat(parentStack.currentPaths)
							parentParentStack.resultIndexes = parentParentStack.resultIndexes.concat(parentStack.currentIndexes)
							continue;
							// else end = true
						}
						// Move forward in or
						if (parentMode === 'or') {
							if (currentIndex < parentAst.length-1) {
								parentParentStack.results = parentParentStack.results.concat(parentStack.results)
								parentParentStack.resultIndexes = parentParentStack.resultIndexes.concat(parentStack.resultIndexes)
								resultStack.push({
									results: [],
									resultIndexes: [],
									// paths: [...parentParentStack.currentPaths],
									// indexes: [...parentParentStack.currentIndexes],
									currentPaths: [...parentParentStack.currentPaths],
									currentIndexes: [...parentParentStack.currentIndexes],
								})
								move = [ ...parentPath, currentIndex+1 ]
								break;
							}
							parentParentStack.results = parentParentStack.results.concat(parentStack.results)
							parentParentStack.resultIndexes = parentParentStack.resultIndexes.concat(parentStack.resultIndexes)
							continue;
						}
						// Move forward in and
						if (parentMode === 'and') {
							// If any failure, exit upstream
							// console.log(parentParentStack)
							parentParentStack.currentIndexes = parentParentStack.currentIndexes.filter((_,i) => parentStack.results.some(otherPath => array_eq(parentParentStack.currentPaths[i], otherPath)))
							parentParentStack.currentPaths = parentParentStack.currentPaths.filter(path => parentStack.results.some(otherPath => array_eq(path, otherPath)))
							// parentParentStack.resultIndexes = parentParentStack.currentIndexes.filter((_,i) => parentStack.results.some(otherPath => array_eq(parentParentStack.currentPaths[i], otherPath)))
							// parentParentStack.resultPaths = parentParentStack.currentPaths.filter(path => parentStack.results.some(otherPath => array_eq(path, otherPath)))
							// filter currentPaths if in result
							if (parentStack.results.length === 0) {
								console.log('none')
								// b
							}
							if (currentIndex < parentAst.length-1) {
								move = [ ...parentPath, currentIndex+1 ]
								break;
							}
							// parentParentStack.results = parentParentStack.results.concat(parentStack.results)
							// parentParentStack.resultIndexes = parentParentStack.resultIndexes.concat(parentStack.resultIndexes)
							continue;
						}
					}
					// Return Machine
					if (!move) {
						done = true
						// console.log({ newPaths, newIndexes })
						resultStack.forEach(i => console.log(i))
						return allPaths.filter((_,i) => resultStack[0].currentIndexes.includes(i))
						// resultStack[0].results
					}

					// console.log({ newPaths, newIndexes })

				}
		}
		// console.log('Goto:        ', '/'+(move.join('/')))
		// console.log(currentStack)
		currentAstPath = move
	}

	// console.log({ast, allPaths,})
	// resultStack.forEach(i => console.log(i))
	// // console.log(JSON.stringify(resultStack, null, '  '))


	return []
}






/********** HELPERS **********/
// export const queryPaths = get_matching_paths
export const queryPaths = (struc, selector) => list_path_object(struc).filter(matches(struc, selectorAST(selector)))

export const query = (struc, selector) => queryPaths(struc, selector).map(found => get_path_object(struc, found))
export const is = (struc, path, selector) => matches(struc, selectorAST(selector))(path)

export const createQuery = (template, ...pieces) => {
	const queryPaths = createQueryPaths(template, ...pieces)
	return struc => queryPaths(struc).map(found => get_path_object(struc, found))
}
export const createQueryPaths = (template, ...pieces) => {
	const ast = selectorAST(template, ...pieces)
	return struc => list_path_object(struc).filter(matches(struc, ast))
}




const testObject = {
	a: {
		b: {
			c: {
				d: 8,
				e: 6
			}
		}
	}
}

// queryPaths(testObject, 'a > b c < b')
// console.log(get_matching_paths(testObject, 'a > b c < b c *'))
// console.log(get_matching_paths(testObject, 'c (d,e)'))
// console.log(get_matching_paths(testObject, 'c d, c e'))
// console.log(get_matching_paths(testObject, 'c > (*),a'))
// console.log(get_matching_paths(testObject, 'c d'))
// console.log(get_matching_paths(testObject, 'c[d]'))
console.log(get_matching_paths(testObject, '*[> d]'))
// console.log(get_matching_paths(testObject, 'c[d][f]'))



/**
 * When performing a node, 
 * When exiting a node, pass the current paths up
 * When exiting a sequence, go the next node with the current paths
 * When there are no more nodes, pass the current paths up?
 * 
a SEQuence modifies a list of paths until there are no results

an OR adds to the list of results 
 */