import S, {  get_path_object, set_path_object, update_path_object } from "./index.js"
export class PathSyntaxError extends SyntaxError {
	constructor({ pointer, pathString, char, mode }) {
		const dist = 20
		const snippet = pathString.slice(Math.max(0, pointer-dist), pointer+dist)
		const preSpace = pathString.slice(Math.max(0, pointer-dist), pointer).split('').map(c => c === '\t' ? c : ' ').join('')
		super(`Symbol '${char}' cannot be used in this context. Read mode: ${mode}. At pos ${pointer}.\n${preSpace.length===dist?' ...':'    '}${snippet}\n    ${preSpace}^`)
	}
}
export class PathOperationError extends ReferenceError {}
const addCharacherToName = ({ char, name }) => ({ name: name + char })

const readName = {
	if: ({ readingValue }) => readingValue,
	then: ({ mode, name, stack, path, notted }) => {
		const normalName = mode === 'regex_flags' ? toRegex(name) : name
		return {
			name: '',
			stack: update_path_object(stack, path, orig => [
				...orig.slice(0,-1),
				{
					...orig[orig.length-1],
					value: normalName,
					vaueNotted: notted,
					matcher: matcher(orig[orig.length-1].name, normalName)
				}
			]),
			readingValue: false,
			notted: false,
		}
	},
	else: ({ mode, name, stack, path, operator, notted }) => {
		const normalName = mode === 'regex_flags' ? toRegex(name) : name
		return {
			name: '',
			notted: false,
			stack: update_path_object(stack, path, orig => [...orig, {
				operator: (operator === 'none' && orig.length === 0) ? get_path_object(stack, [...path.slice(0, -3), 'operator']) : operator,
				matcher: matcher(normalName),
				children: [],
				notted,
				name: normalName
			}])
		}
	}
}
const recordName = {
	if: ({ char, mode }) => ((char === undefined || char in chars) && (mode === 'text' || mode === 'regex_flags')),
	then: readName
}
const readingText = mode => mode === 'text' || mode === 'regex_flags'
// TODO: implement ! for not
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
			default: { [S.Return]: PathSyntaxError }
		}
	},
	'-': {
		switch: ({ mode, operator }) => readingText(mode) || operator == 'none' ? 'text' : operator,
		case: {
			text: { mode: 'operator', operator: 'prev_sibling', },
			default: { [S.Return]: PathSyntaxError }
		}
	},
	'&': {
		switch: ({ mode, operator }) => readingText(mode) || operator == 'none' ? 'text' : operator,
		case: {
			text: { mode: 'operator', operator: 'sibling', },
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
	{ while: ({ pointer, pathString }) => pointer < pathString.length,
		do: [
			({ pointer, pathString }) => ({ char: pathString[pointer] }),
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
	// Finish and exit
	{ char: undefined },
	recordName,
	{ mode: 'end' },
	S.Return,
])
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
})
.input(pathString => ({ pathString }))
.output(state => {
	const { stack, [S.Return]: result = stack } = state
	if (result === PathSyntaxError)
		throw new PathSyntaxError(state)
	return result
})

const toRegex = str => {
	const endIndex = str.lastIndexOf('/')
	return  new RegExp(str.slice(1, endIndex), str.slice(endIndex+1))
}
const execRegex = regex => str => regex.exec(str)
const matcher = (name, value) => {
	if (value === undefined)
		return textMatcher(name)
	const nameMatcher = textMatcher(name)
	const valueMatcher = textMatcher(value)
	return (n, v) => nameMatcher(n) && valueMatcher(v)
}
const textMatcher = name => {
	if (name instanceof RegExp) return execRegex(name)
	else if (name === '*') return () => true
	else if (name.includes('*')) return execRegex(new RegExp('^'+escapeStringRegExp(name).replaceAll('*', '.+')+'$'))
	return str => name == str
}
const regex = /[|\\{}()[\]^$+?.]/g; // exclude '*'
const escapeStringRegExp = str => str.replace(regex, '\\$&')
const list_path_object = object => typeof object !== 'object' ? [[]] : [[]].concat(...Object.keys(object).map(key => list_path_object(object[key]).map(path => [key,...path])))

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
		const { index, siblings, parentPath } = siblingData({ path, struc })
		return siblings.slice(0, index).concat(siblings.slice(index+1)).map(key => [ ...parentPath, key ])
	},
	prev_sibling: ({ path, struc }) => {
		const { index, siblings, parentPath } = siblingData({ path, struc })
		return index === 0 ? [] : [[ ...parentPath, siblings[index-1] ]]
	},
	next_sibling: ({ path, struc }) => {
		const { index, siblings, parentPath } = siblingData({ path, struc })
		return index === siblings.length-1 ? []: [[ ...parentPath, siblings[index+1] ]]
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
}

const bumpOperator = ast => ast.map((a, i, l) => ({
	...a,
	operator: i < l.length-1 ? l[i+1].operator : 'none'
}))
// Logic is all in reverse by default to work like node.is not document.query
const matches = (struc, initialAst, direction = -1) => {
	const iterate = (path, astPath = []) => {
		const ast = get_path_object(initialAst, astPath)
		if ('selectors' in ast) return ast.selectors[0].some((_, i) => iterate(path, [ ...astPath, 'selectors', 0, i ]))
		if (Array.isArray(ast)) return ast.length === 0 ? false : iterate(path, [ ...astPath, direction === -1 ? ast.length-1 : 0 ],)
		const item = get_path_object(struc, path)
		if (!ast.matcher(path[path.length-1], item)) return false
		if (ast.children && ast.children.length) {
			const childMatch = ast.children.every(disconnected => {
				const { children, ...simpleAST } = ast
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
		const operator = direction === -1 ? inverse[ast.operator] : ast.operator
		const nextNodebase = [...astPath].reverse().findIndex((n, i, l) => i%4 === 0 && typeof n === 'number' && ((direction === -1 && n !== 0) || (direction === 1 && n !== get_path_object(initialAst, astPath.slice(0,-1-i)).length-1)))
		if (nextNodebase === -1) return operator === 'none' || operator === 'ancestor' || (operator === 'parent' && path.length === 1)
		const nextNode = [ ...astPath.slice(0,-1-nextNodebase), astPath[astPath.length-1-nextNodebase] + direction ]
		const operation = operator === 'none' ? (direction === -1 ? operators.ancestor : operators.descendent) : operators[operator]
		return operation({ path, item, struc }).some(p => iterate(p, nextNode))
	}
	return (a) => iterate(a)
}


export const query = (struc, selector) => list_path_object(struc).filter(matches(struc, selectorAST(selector))).map(found => get_path_object(struc, found))
export const is = (struc, path, selector) => matches(struc, selectorAST(selector))(path)

export default query