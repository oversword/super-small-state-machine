import { get_path_object } from "../index.js"

export const D_processed = Symbol('d')
export class DescriptionError extends Error {}

const repeat_string = (str = '', rep = 0) => Array(rep).fill(str).join('')
const rebase_string = (str, add = '') => {
	const lines = str.split('\n')
	// TODO: this assumes first line has no indent, fix that
	// if (lines.length <= 1) return str
	const indents = lines.map(line => {
		const match = line.match(/[^\s]/)
		if (match === null) return line.length
		return match.index
	})
	const toCut = Math.min(...indents)
	return lines.map(line => add+line.slice(toCut)).join('\n')
	// console.log(indents)
	// .join('\n')
}

const matches = (object, match, symbols = []) => {
	if (object === null || match === null || typeof object !== 'object' || typeof match !== 'object')
		return object === match
	return Object.keys(match).concat(symbols)
		.every(key => (!(key in match)) || matches(object[key], match[key], symbols))
}

// TODO: better object printing with spaces and symbols
export const keyToString = (obj, symbols = []) => {
	switch (typeof obj) {
		case 'symbol': {
			const foundSymbol = Object.entries(symbols).find(([_, value]) => value === obj)
			if (foundSymbol) return `[${foundSymbol[0]}]`
			return `[${obj.toString()}]`
		}
		case 'number':
			return `${obj}`
		case 'string':
			return `${obj}`
		default:
			console.error(`Unknown key type cannot be converted to string: ${typeof obj}`)
			return String(obj)
	}
}
export const toString = (obj, symbols = []) => {
	switch (typeof obj) {
		case 'boolean':
			return obj ? 'true' : 'false'
		case 'symbol': {
			const foundSymbol = Object.entries(symbols).find(([_, value]) => value === obj)
			if (foundSymbol) return foundSymbol[0]
			return obj.toString()
		}
		case 'number':
			return `${obj}`
		case 'string':
			return `'${obj}'`
		case 'undefined':
			return 'undefined'
		case 'object':
			if (obj === null)
				return 'null'
			if (Array.isArray(obj))
				return `[ ${obj.map(item => toString(item, symbols)).join(', ')} ]`
			return '{ ' + Object.entries(obj)
				.concat(Object.values(symbols)
					.filter(symbol => symbol in obj)
					.map(symbol => [symbol, obj[symbol]])
				)
				.map(([ key, value ]) => `${keyToString(key, symbols)}: ${toString(value, symbols)}`)
				.join(', ') + ' }'
		case 'function':
			return String(obj)
		default:
			console.error(`Unknown type cannot be converted to string: ${typeof obj}`)
			return String(obj)
	}
}
export class ExtensibleFunction extends Function { constructor(f) { super(); return Object.setPrototypeOf(f, new.target.prototype); }; }

const withFunctionContets = doThing => funct => {
	const originalString = funct.toString()
	const startPoint = originalString.indexOf('{')
	const isNL = originalString[startPoint+1] === '\n'
	const originalLines = originalString.slice(startPoint+1+(isNL ? 1:0)).split('\n')
	return originalString.slice(0, startPoint+1+(isNL ? 1:0)) +
		doThing(originalLines.slice(0,-1).join('\n'))
		+ '\n' + rebase_string(originalLines[originalLines.length-1])
}
const getFunctionContents = funct => {
	const originalString = funct.toString()
	const startPoint = originalString.indexOf('{')
	const isNL = originalString[startPoint+1] === '\n'
	const originalLines = originalString.slice(startPoint+1+(isNL ? 1:0)).split('\n')
	return originalLines.slice(0,-1).join('\n')
	// const originalString = funct.toString()
	// const originalLines = originalString.split('\n')
	// return originalLines.slice(1,-1).join('\n')
}

const rebase_functionString = withFunctionContets(contents => rebase_string(contents, '\t'))

export class TransformedFunction extends ExtensibleFunction {
	#toString = a => a
	#original = () => {}
	constructor(original = () => {}, transformed = original, toString = a => a) {
		super(transformed)
		this.#original = original
		this.#toString = toString
	}
	toString() {
		// console.log(this.#original.toString())
		return this.#toString(rebase_functionString(this.#original))
	}
}

export const E = {
	exports: (exportName, exportObj, exportFile) => new TransformedFunction(Function(`return ${exportName};`), () => {
		if (exportObj[exportName] === undefined)
			throw new DescriptionError(`Expected ${exportName} to be exported from '${exportFile}'.`)
	}, string => {
		return withFunctionContets((contents) => `import { ${exportName} } from '${exportFile}'\n${rebase_functionString(contents)} // success`)(string)
	}),
	notExports: (exportName, exportObj, exportFile) => new TransformedFunction(Function(`return ${exportName};`), () => {
		if (exportObj[exportName] !== undefined)
			throw new DescriptionError(`Expected ${exportName} not to be exported from '${exportFile}'.`)
	}, string => {
		return withFunctionContets((contents) => `import { ${exportName} } from '${exportFile}'\n${rebase_functionString(contents)} // nope`)(string)
	}),
	todo: method => new TransformedFunction(method, () => {
		throw new DescriptionError('TODO incomplete')
	}, string => {
		const lines = string.split('\n')
		const returnLine = lines.length-2
		lines[returnLine] = `${lines[returnLine]} // TODO: INCOMPLETE`
		return lines.join('\n')
	}),
	success: method => {
		return new TransformedFunction(method, async () => {
			try {
				await method()
			} catch (error) {
				throw error
			}
		}, string => {
			const lines = string.split('\n')
			const returnLine = lines.length-2
			lines[returnLine] = `${lines[returnLine]} // Succeeds`
			return lines.join('\n')
		})
	},
	error: (method, errorType) => {
		return new TransformedFunction(method, async () => {
			try {
				await method()
				throw new DescriptionError(`Method should have failed, succeeded instead.`)
			} catch (error) {
				if (error instanceof DescriptionError)
					throw error
				if (typeof errorType === 'string' && error.message !== errorType)
					throw new DescriptionError(`Method should have failed with message: "${errorType}", failed with message "${error.message}" instead.`)
				if (!errorType) return;
				if (error instanceof errorType) return;
				throw new DescriptionError(`Method should have failed with an ${errorType.name} error, failed with a ${error.constructor.name} instead.`)
			}
		}, string => {
			const lines = string.split('\n')
			const returnLine = lines.length-2
			lines[returnLine] = `${lines[returnLine]} // ${errorType ? (typeof errorType === 'string' ? `Error: ${errorType}` : errorType.name) : 'Error'}`
			return lines.join('\n')
		})
	},
	equals: (method, value, symbols) => {
		return new TransformedFunction(method, async () => {
			const result = await method()
			if (matches(result, value, symbols)) return;
			throw new DescriptionError(`Expected ${toString(value, symbols)}, got ${toString(result, symbols)}.`)
		}, string => {
			const lines = string.split('\n')
			const returnLine = lines.length-2
			lines[returnLine] = `${lines[returnLine]} // ${toString(value, symbols)}`
			return lines.join('\n')
		})
	},
	notEquals: (method, value, symbols) => {
		return new TransformedFunction(method, async () => {
			const result = await method()
			if (!matches(result, value, symbols)) return;
			throw new DescriptionError(`Expected anything except ${toString(value, symbols)}, got ${toString(result, symbols)}.`)
		}, string => {
			const lines = string.split('\n')
			const returnLine = lines.length-2
			lines[returnLine] = `${lines[returnLine]} // not ${toString(value, symbols)}`
			return lines.join('\n')
		})
	},
	is: (method, value, symbols) => {
		return new TransformedFunction(method, async () => {
			const result = await method()
			if (result === value) return;
			throw new DescriptionError(`Expected ${toString(value, symbols)}, got ${toString(result, symbols)}.`)
		}, string => {
			const lines = string.split('\n')
			const returnLine = lines.length-2
			lines[returnLine] = `${lines[returnLine]} // ${toString(value, symbols)}`
			return lines.join('\n')
		})
	},
	isNot: (method, value, symbols) => {
		return new TransformedFunction(method, async () => {
			const result = await method()
			if (result !== value) return;
			throw new DescriptionError(`Expected anything except ${toString(value, symbols)}, got ${toString(result, symbols)}.`)
		}, string => {
			const lines = string.split('\n')
			const returnLine = lines.length-2
			lines[returnLine] = `${lines[returnLine]} // not ${toString(value, symbols)}`
			return lines.join('\n')
		})
	},
}

export const Q = (description, path) => {
	if (path.length === 0) return description
	let found
	if (typeof path[0] === 'function')
		found = description.children.find(node => node[D_processed] && path[0](node.description))
	else found = description.children.find(node => node[D_processed] && node.description === path[0])
	// if (path.length === 1) return found
	return found ? Q(found, path.slice(1)) : null
}

export const traverse = (forNode = a => a, forCode = a => a) => {
	const iterate = (description, path = []) => {
		const desc = get_path_object(description, path)
		if (!desc[D_processed])
			return forCode(desc, path, description)
		let modified = forNode(desc, path, description)
		if (modified.children) {
			return modified.children.map((_, index) => iterate(description, [...path, 'children', index]))
		}
		return modified
	}
	return iterate
}

export default function D(description, ...children) {
	if (description === undefined)
		return console.log('Undescribed entry')
	const type = typeof description
	switch (type) {
		case 'object':
			if (description[D_processed])
				return description
		case 'string':
			return {
				[D_processed]: true,
				description,
				children: children.map(child => D(child)),
			}
		case 'function':
			return description
		default:
			throw new TypeError(`Unknown Description Type: '${type}'`)
	}
}


// TODO: return string instead of relying on console.log
export const test = async description => {
	const tests = []
	traverse(undefined, (code, path) => {
		tests.push({
			code, path
		})
	})(description)


	const runTest = async ({ code, path }) => {
		let log = []
		let existing_log = console.log
		console.log = (...args) => {
			log.push(args)
		}
		try {
			const result = await code()
			console.log = existing_log
			return {
				success: true,
				result,
				path,
			}
		} catch (error) {
			console.log = existing_log
			return {
				success: false,
				log,
				error,
				path,
			}
		}
	}

	const parallelTests = (runTest, tests) => Promise.all(tests.map(runTest))
	const sequentialTests = (runTest, tests) => tests.reduce(async (last, test) => [...(await last), await runTest(test)], Promise.resolve([]))

	const nextPath = (currentPath, newPath) => {
		const lastIndex = currentPath.findIndex((item, index) => item !== newPath[index])
		if (lastIndex === -1)
			return { path: newPath, offset: 0 }
		return { path: newPath.slice(lastIndex), offset: lastIndex }
	}
	const printTests = (results, print) => {
		return results.reduce((printingPath, result) => {
			const indent = '  '
			const parent = get_path_object(description, result.path.slice(0,-1))
			// console.log({ parent })
			const isAlone = parent.filter(o => !o[D_processed]).length <= 1
			const { offset, path } = nextPath(printingPath, isAlone ? result.path.slice(0,-1) : result.path)
			const basePath = result.path.slice(0, offset)
			let offsetStr = ''
			for (let i=0; i < offset; i++) {
				offsetStr += indent
			}
			const printedPath = path.reduce((curr, step, index, path) => {
				// const step = path[index]
				const item = get_path_object(description, [...basePath,...path.slice(0, index)])
				const gap = (curr ? '\n' : '')+Array(Math.ceil((offset+index)/2)).fill(indent).join('')
				if (step !== 'children' && index === path.length-1) return `${curr}${gap}${step}`
				if (step !== 'children') return curr
				if (!item[D_processed]) return `${curr}${gap}${step}`
				return `${curr}${gap}${item.description}`
			}, '')
			const printOffset = Array(result.path.length-1).fill(indent).join('')
			print({ printOffset, printedPath, result })
			return result.path
		}, [])
	}

	const results = await sequentialTests(runTest, tests)
	const failures = results.filter(res => !res.success)

	printTests(results, ({ printedPath, result }) => {
		if (result.success)
			console.log(`\x1b[32m${printedPath} \x1b[0m`)
		else if (result.error instanceof DescriptionError)
			console.error(`\x1b[33m${printedPath}\tFailure: ${result.error.message}\x1b[0m`)
		else {
			console.error(`\x1b[31m${printedPath}\tCrash: ${result.error.constructor.name}\x1b[0m`)
		}
	})

	if (failures.length) {
		console.error(`\n\n\x1b[33m ${failures.length} Failures`)
		printTests(failures, ({ printOffset, printedPath, result }) => {
			if (result.error instanceof DescriptionError)
				console.error(`\x1b[33m${printedPath}\tFailure: ${result.error.message}\x1b[0m`)
			else {
				console.error(`\x1b[31m${printedPath}\tCrash: ${result.error.constructor.name}\x1b[0m`)
				console.error(result.error)
			}
			if (result.log && result.log.length) {
				console.error('LOGS:')
				result.log.forEach(args => console.log(...args.map(arg => typeof arg === 'string' ? arg : toString(arg))))
			}
		})
		throw new Error('Tests Failed')
	}
}
export const readme = async description => {
	const lines = []
	traverse((node, path, description) => {
		if (node.code) return node;
		if (path.length === 0) {
			lines.push(`<img alt="${node.description}" src="./logo.svg" width=800 />`)
			lines.push('')
			return node
		}
		const header = repeat_string('#', Math.ceil(path.length / 2))
		const isHeader = node.children && node.children.some(child => child[D_processed] && !child.code)
		lines.push((isHeader ? header+' ' : '')+node.description)
		lines.push('')
		return node
	}, (node, path, description) => {
		lines.push('```javascript')
		lines.push(rebase_string(getFunctionContents(node)))
		lines.push('```')
		lines.push('')
	})(description)
	const ret = lines.join('\n')+'\n'
	return ret
}


export const JS = str => ({
	code: 'javascript',
	[D_processed]: true,
	description: str
})
export const TS = str => ({
	code: 'typescript',
	[D_processed]: true,
	description: str
})
export const CS = str => ({
	code: true,
	[D_processed]: true,
	description: str
})

export const code = async (description, codeType = 'javascript') => {
	const lines = []
	let lastIndent = Infinity
	let count = 0
	traverse((node, path, description) => {
		if (!(node[D_processed] && node.code
		&& (node.code === true || node.code === codeType))) return node;
		const currentIndent = Math.ceil(path.length / 2)
		let toReset = false
		count += 1
		if (lastIndent === currentIndent && count > 1)
			toReset = true
		if (lastIndent > currentIndent) {
			lastIndent = currentIndent
			count = 0
		}
		const indent = repeat_string('\t', currentIndent - lastIndent)
		lines.push(indent+node.description)
		if (toReset) {
			lastIndent = Infinity
			count = 0
		}
		return node
	})(description)
	const ret = lines.join('\n')+'\n'
	return ret
}