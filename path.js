import S, {  get_path_object, list_path_object, set_path_object, update_path_object } from "./index.js"
export class PathSyntaxError extends SyntaxError {
	constructor({ pointer, pathString, char, mode }) {
		const dist = 20
		const snippet = pathString.slice(Math.max(0, pointer-dist), pointer+dist)
		const preSpace = pathString.slice(Math.max(0, pointer-dist), pointer).split('').map(c => c === '\t' ? c : ' ').join('')
		super(`Symbol '${char}' cannot be used in this context. Read mode: ${mode}. At pos ${pointer}.\n${preSpace.length===dist?' ...':'    '}${snippet}\n    ${preSpace}^`)
	}
}
export class PathOperationError extends ReferenceError {}
// TODO: implement ! for not
// TODO: implement {} for dynamically getting values (and queries) from struc
// TODO: implement # and . in a CSS like way (assume id & class, but make configurable)
// TODO: Left over: £@|&?;: Reserved: _$\
// TODO: ? to mean optional

// TODO: & | should be used for AND and OR? optional with ][ and ,
const addCharacherToName = ({ char, name }) => ({ name: name + char })
const readName = {
	if: ({ readingValue }) => readingValue,
	then: ({ mode, name, stack, path, notted }) => {
		return {
			name: '',
			stack: update_path_object(stack, path, orig => [
				...orig.slice(0,-1),
				{
					...orig[orig.length-1],
					value: name,
					vaueNotted: notted,
					valueMode: mode,
					matcher: matcher(orig[orig.length-1].name, name, orig[orig.length-1].mode, mode)
				}
			]),
			readingValue: false,
			notted: false,
		}
	},
	else: ({ mode, name, stack, path, operator, notted }) => {
		return {
			name: '',
			notted: false,
			stack: update_path_object(stack, path, orig => [...orig, {
				operator: (operator === 'none' && orig.length === 0) ? get_path_object(stack, [...path.slice(0, -3), 'operator']) : operator,
				matcher: matcher(name, undefined, mode),
				mode,
				children: [],
				notted,
				name
			}])
		}
	}
}
const recordName = {
	if: ({ char, mode }) => ((char === undefined || char in chars) && (mode === 'text' || mode === 'regex_flags')),
	then: readName
}
const readingText = mode => mode === 'text' || mode === 'regex_flags'
const toRegex = str => {
	const endIndex = str.lastIndexOf('/')
	return  new RegExp(str.slice(1, endIndex), str.slice(endIndex+1))
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
	console.log({match, mod,matcher})
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
const chars = {
	'(': ({ operator, path, stack }) => {
		const nextNode = get_path_object(stack, path).length
		return {
			path: [ ...path, nextNode, 'selectors', 0, 0 ],
			stack: set_path_object(stack, [ ...path, nextNode ], { selectors: [[[]]], operator }),
			operator: 'none',
			mode: 'operator',
		}
	},
	')': ({ path }) => ({
		path: path.slice(0, -4),
		mode: 'operator',
		operator: 'none',
	}),
	'[': ({ operator, path, stack }) => {
		const currentNode =  get_path_object(stack, path).length-1
		const nextNode = get_path_object(stack, [...path, currentNode, 'children']).length
		const nextPath = [ ...path, currentNode, 'children', nextNode ]
		return {
			path: [ ...nextPath, 0 ],
			stack: set_path_object(set_path_object(stack, nextPath, []), [ ...nextPath, 0 ], []),
			operator: 'none',
			mode: 'operator',
		}
	},
	']': ({ path }) => ({
		path: path.slice(0, -4),
		mode: 'operator',
		operator: 'none',
	}),
	'=': {
		switch: ({ mode }) => mode,
		case: {
			text: { mode: 'text', readingValue: true },
			none: { [S.Return]: PathSyntaxError }
		}
	},
	',': ({ path, stack }) => {
		const newPath = [ ...path.slice(0,-1), path[path.length-1]+1 ]
		return {
			path: newPath,
			stack: set_path_object(stack, newPath, []),
			operator: 'none',
			mode: `operator`,
		}
	},
	'/': {
		if: ({ escaped }) => !escaped,
		then: [
			addCharacherToName,
			{
				if: ({ mode }) => mode === 'regex',
				then: { mode: 'regex_flags' },
				else: { mode: 'regex' }
			}
		]
	},
	'`': {
		switch: ({ mode }) => mode,
		case: {
			operator: { mode: 'magic_quote' },
			magic_quote: [
				readName,
				{ mode: 'operator', operator: 'default' }
			],
			default: { [S.Return]: PathSyntaxError }
		}
	},
	'"': {
		switch: ({ mode }) => mode,
		case: {
			operator: { mode: 'double_quote' },
			double_quote: [
				readName,
				{ mode: 'operator', operator: 'default' }
			],
			default: { [S.Return]: PathSyntaxError }
		}
	},
	"'": {
		switch: ({ mode }) => mode,
		case: {
			operator: { mode: 'single_quote' },
			single_quote: [
				readName,
				{ mode: 'operator', operator: 'default' }
			],
			default: { [S.Return]: PathSyntaxError }
		}
	},
	// '!': {
	// 	notted: true
	// },
	'+': {
		switch: ({ mode, operator }) => readingText(mode) || operator == 'none' ? 'text' : operator,
		case: {
			text: { mode: 'operator', operator: 'next_sibling', },
			next_sibling: { mode: 'operator', operator: 'next_siblings', }, 
			default: { [S.Return]: PathSyntaxError }
		}
	},
	'-': {
		if: ({ pointer, partPointer, pathString }) => {
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
		},
		then: [addCharacherToName,{ mode: 'text' }],
		else: {
			switch: ({ mode, operator }) => readingText(mode) || operator == 'none' ? 'text' : operator,
			case: {
				text: { mode: 'operator', operator: 'prev_sibling', },
				prev_sibling: { mode: 'operator', operator: 'prev_siblings', }, 
				default: { [S.Return]: PathSyntaxError }
			}
		}
	},
	'~': {
		switch: ({ mode, operator }) => readingText(mode) || operator == 'none' ? 'text' : operator,
		case: {
			text: { mode: 'operator', operator: 'sibling', },
			sibling: { mode: 'operator', operator: 'siblings', }, 
			default: { [S.Return]: PathSyntaxError }
		}
	},
	'<': {
		switch: ({ mode, operator }) => readingText(mode) || operator == 'none' ? 'text' : operator,
		case: {
			text: { mode: 'operator', operator: 'parent', },
			parent: { mode: 'operator', operator: 'ancestor' },
			default: { [S.Return]: PathSyntaxError }
		}
	},
	' ': {
		if: ({ mode }) => readingText(mode),
		then: { mode: 'operator', operator: 'none' }
	},
	'\t': {
		if: ({ mode }) => readingText(mode),
		then: { mode: 'operator', operator: 'none' }
	},
	'>': {
		switch: ({ mode, operator }) => readingText(mode) || operator == 'none' ? 'text' : operator,
		case: {
			text: { mode: 'operator', operator: 'child' },
			child: { mode: 'operator', operator: 'descendent' },
			default: { [S.Return]: PathSyntaxError }
		}
	},
	default: [
		addCharacherToName,
		{
			if: ({ mode }) => mode !== 'regex_flags',
			then: { mode : 'text' }
		}
	]
}
export const selectorAST = new S([
	{
		while: ({ pathString, partPointer }) => partPointer < pathString.length,
		do: [
			{
				while: ({ pointer, pathString, partPointer }) => pointer < pathString[partPointer].length,
				do: [
					({ pointer, partPointer, pathString }) => ({ char: pathString[partPointer][pointer] }),
					recordName,
					{
						if: ({ escaped, char, mode }) =>
							(mode === 'regex' && (char !== '/' || escaped)) ||
							(mode === 'single_quote' && (char !== "'" || escaped)) ||
							(mode === 'double_quote' && (char !== '"' || escaped)) ||
							(mode === 'magic_quote'  && (char !== '`' || escaped)),
						then: addCharacherToName,
						else: { switch: ({ char }) => char, case: chars, }
					},
					({ pointer }) => ({ pointer: pointer + 1 }),
				]
			},
			{
				if: ({ partPointer, data }) => partPointer < data.length,
				then: [
					({ partPointer, data }) => ({ name: data[partPointer], mode: 'text' }),
					readName,
					{ mode: 'operator', operator: 'none' }
				]
			},
			({ partPointer, data }) => {
				console.log({partPointer, data})
			},
			({ partPointer }) => ({ pointer: 0, partPointer: partPointer + 1 }),
		]
	},
	state => console.log(state),
	// Finish and exit
	{ char: undefined },
	recordName,
	{ mode: 'end' },
	S.Return,
])
.strict
.defaults({
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
	pathString: [],
	data: [],
})
.input((template, ...data) => {
	if (typeof template === 'string')
		return { pathString: [ template ] }
	return { pathString: template, data }
})
.output(state => {
	const { stack, [S.Return]: result = stack } = state
	if (result === PathSyntaxError)
		throw new PathSyntaxError(state)
	return result
})




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
const matchesMachine = new S({

})
	.defaults({
		direction: -1,
		struc: null,
		ast: null,
		path: [],

	})
	.input((struc, path, ast, direction = -1) => ({
		struc, ast, direction, path
	}))

const matches_new = (struc, ast, direction = -1) => path => matchesMachine(struc, path, ast, direction)

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

export default query


