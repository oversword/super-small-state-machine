import D, { E, JS, TS, CS, test } from './d/index.js'
// import S, { clone_object, NodeDefinition, normalise_function, StateReferenceError, StateTypeError, unique_list_strings, wait_time, get_path_object, deep_merge_object, UndefinedNodeError, MaxIterationsError } from './index.js'
import * as testModule from './path.js'
import { selectorAST, is, query } from './path.js'


const testValue1 = Symbol('Test Value 1')
const testValue2 = Symbol('Test Value 2')
const testValue3 = Symbol('Test Value 3')
const testValue4 = Symbol('Test Value 4')
const testValue5 = Symbol('Test Value 5')
const testValue6 = Symbol('Test Value 6')
const testValue7 = Symbol('Test Value 7')
const testValue8 = Symbol('Test Value 8')
const testValue9 = Symbol('Test Value 9')
const description = D("Object Path Query Selector",
	D('Can select the keys of objects using strings', E.equals(() => {
		const testObject = { myKey: testValue1 }
		return query(testObject, 'myKey')
	}, [testValue1])),
	D('Omits keys that do not match the string', E.equals(() => {
		const testObject = {
			myKey: testValue1,
			notMyKey: testValue2
		}
		return query(testObject, 'myKey')
	}, [testValue1])),
	D('Can use wildcards to match keys in an object', E.equals(() => {
		const testObject = {
			myKey: testValue1,
			alsoMyKey: testValue2
		}
		return query(testObject, '*Key')
	}, [testValue1,testValue2])),
	D('Matches all descendent object keys by default', E.equals(() => {
		const testObject = {
			myKey: testValue1,
			subObject: { myKey: testValue2 }
		}
		return query(testObject, 'myKey')
	}, [testValue1,testValue2])),
	D('The child operator can be used to match direct children', E.equals(() => {
		const testObject = {
			myKey: testValue1,
			subObject: { myKey: testValue2 }
		}
		return query(testObject, 'subObject > myKey')
	}, [testValue2])),
	D('The root node is used as the default context', E.equals(() => {
		const testObject = {
			myKey: testValue1,
			subObject: { myKey: testValue2 }
		}
		return query(testObject, '> myKey')
	}, [testValue1])),
	D('The descenedent operator can be also be used to match all descendent object keys', E.equals(() => {
		const testObject = {
			myKey: testValue1,
			subObject: { myKey: testValue2 }
		}
		return query(testObject, '>> myKey')
	}, [testValue1,testValue2])),
	D('The parent operator can be used to access the parent of a node', E.equals(() => {
		const testObject = {
			myKey: testValue1,
			subObject: { myKey: testValue2 }
		}
		return query(testObject, 'myKey < subObject')
	}, [{ myKey: testValue2 }])),
	D('The ancestor operator can be used to match any ancestor', E.equals(() => {
		const testObject = {
			myKey: testValue1,
			subObject: { subObject: { myKey: testValue2 } }
		}
		return query(testObject, 'myKey << subObject')
	}, [{ subObject: { myKey: testValue2 } }, { myKey: testValue2 }])),
	D('The comma can be used to match two things at once (`or`)', E.equals(() => {
		const testObject = {
			myKey: testValue1,
			myOtherKey: testValue2
		}
		return query(testObject, 'myKey,myOtherKey')
	}, [testValue1,testValue2])),
	D('Brackets can be used to nest `or` statements', E.equals(() => {
		const testObject = {
			subObject: { myKey: testValue1, myOtherKey: testValue2 }
		}
		return query(testObject, 'subObject (myKey,myOtherKey)')
	}, [testValue1,testValue2])),
	D('The equals operator can be used to match the values of keys', E.equals(() => {
		const testObject = {
			myKey: 'allowed',
			subObject: { myKey: 'notAllowed' }
		}
		return query(testObject, 'myKey=allowed')
	}, ['allowed'])),
	D('Wildcards can also be used in values', E.equals(() => {
		const testObject = {
			myKey: 'isAllowed',
			subObject: { myKey: 'alsoAllowed' }
		}
		return query(testObject, 'myKey=*Allowed')
	}, ['isAllowed', 'alsoAllowed'])),
	D('Square brackets can be used to ask about the contents of the current node without changing context', E.equals(() => {
		const testObject = {
			subObject: { myKey: 'myValue' },
			otherObject: { myKey: 'notMyValue' }
		}
		return query(testObject, '> *[myKey=myValue]')
	}, [{ myKey: 'myValue' }])),
	D('Square brackets will search all descendents by default', E.equals(() => {
		const testObject = {
			subObject: { otherObject: { myKey: 'myValue' }, },
		}
		return query(testObject, 'subObject[myKey=myValue]')
		
	}, [{ otherObject: { myKey: 'myValue' }, }])),
	D('The child operator can be used to select only direct children with a given value', E.equals(() => {
		const testObject = {
			subObject: { otherObject: { myKey: 'myValue' }, },
		}
		return query(testObject, 'subObject[>myKey=myValue]')
		
	}, [])),
	D('Neighboring square brackets will act as an `and` operator', E.equals(() => {
		const testObject = {
			subObject: { myKey: 'myValue', myOtherKey: 'myValue' },
			otherObject: { myKey: 'myValue', myOtherKey: 'notMyValue' }
		}
		return query(testObject, '> *[myKey=myValue][myOtherKey=myValue]')
	}, [{ myKey: 'myValue', myOtherKey: 'myValue' }])),
	D('Any query can be used inside the square brackets', E.equals(() => {
		const testObject = {
			subObject: { myKey: 'myValue', nested: { myOtherKey: 'myValue' }},
			otherObject: { myKey: 'myValue', myOtherKey: 'alsoMyValue' }
		}
		return query(testObject, '> *[>myKey=myValue, myOtherKey=*Value (<< *)]')
	}, [{ myKey: 'myValue', nested: { myOtherKey: 'myValue' }}, { myKey: 'myValue', myOtherKey: 'alsoMyValue' }])),
	D('Wildcards can be used in any position', E.equals(() => {
		
	})),
	D('Wildcards will not match an empty part (should this change?)', E.equals(() => {
		
	})),
	// D('Wildcards ', E.equals(() => {
		
	// })),
	// D('', E.equals(() => {
		
	// })),
	D('Regex can be used, with flags', E.equals(() => {
		
	})),
	D('Double quotes can be used to allow reserved characherts in a key selector', E.equals(() => {
		
	})),
	D('Single quotes can be used to allow reserved characherts in a key selector', E.equals(() => {
		
	})),
	D('Backtick quotes can be used to allow reserved characherts in a key selector', E.equals(() => {
		
	})),
	D('Wildcards can be used inside quote marks (should this change?)', E.equals(() => {
		
	})),
	D('', E.equals(() => {
		
	})),
)

await test(description)
/*



const testPaths = [
	'hi > (hi, > ho) > do << hi',
	'hi > (hi, > ho) > do, he ha (ho ho ho, hi > hi) > do',
	'hi > hi > (you to > (>> erg, dfg) > fo,do) > g* << *h, > hi > hi >> do',
	'> hi > hi > you,  hi > hi > (do)',
	'> hi > hi > do > /g.+/i',
	'> hi > hi > do < hi',
	'> hi > hi >> do << hi',
	'> hi > (you)',
	'> hi > (> you)',
	'> hi > (>> you)',
]
const struc = {
	hi: {
		// hi : 'he',
		you: 'HI',
		hi: {
			how: {
				you: 'HI HI HOW',
			},
			do: {
				you: 'HI HI DO',
				go: {
					
				},
				Go: {
					
				},
				po: {
					
				},
				do: {
					
				},
				grow: {
					you: 'HI HI DO GROW'
				}
			},
			you: {
				go: {
					
				},
				po: {
					
				},
				do: {
					
				},
				grow: {
					
				}
			}
		}
	}
}
console.log(JSON.stringify(struc, null, '  '))
const sortObjects = (a,b) => {
	const sa = JSON.stringify(a)
	const sb = JSON.stringify(b)
	if (sa > sb) return 1
	if (sa < sb) return -1
	return 0
}

const capture = () => {
	const orig_console_log = console.log
	const orig_console_error = console.error
	const orig_console_warn = console.warn
	const orig_console_info= console.info
	const orig_console_group = console.group
	const orig_console_groupCollapsed = console.groupCollapsed
	const orig_console_groupEnd = console.groupEnd
	const capture_console = []
	const _capture = method => (...args) => {
		capture_console.push([method, args])
	}
	console.log = _capture('log')
	console.error = _capture('error')
	console.info = _capture('info')
	console.warn = _capture('warn')
	console.group = _capture('group')
	console.groupCollapsed = _capture('groupCollapsed')
	console.groupEnd = _capture('groupEnd')
	let captured = true
	return {
		restore: () => {
			if (!captured) return false
			console.log = orig_console_log
			console.error = orig_console_error
			console.info = orig_console_info
			console.warn = orig_console_warn
			console.group = orig_console_group
			console.groupCollapsed = orig_console_groupCollapsed
			console.groupEnd = orig_console_groupEnd
			captured = false
			return true
		},
		repeat: () => {
			if (captured) throw new Error()
			capture_console.forEach(([cmd,args]) => {
				console[cmd](...args)
			})
		}
	}
}
// console.log({ path })
testPaths.forEach(path => {
	let queryResultString, SqueryResultString, OqueryResultString
	const logCapture = capture()
	try {
		// const queryResult = query(struc, path)
		const OqueryResult = origQuery(struc, path).sort(sortObjects)
		const SqueryResult = query(struc, path).sort(sortObjects)

		logCapture.restore()
		// queryResultString = JSON.stringify(queryResult, null, '  ')
		SqueryResultString = JSON.stringify(SqueryResult, null, '  ')
		OqueryResultString = JSON.stringify(OqueryResult, null, '  ')
		if (SqueryResultString !== OqueryResultString) {
			throw new Error()
		}
		console.log('good')//, SqueryResultString)
	} catch (error) {
		logCapture.restore()

		console.group(path)
		console.log(error)
		// if (queryResultString !== OqueryResultString) {
		// 	console.log('New does not match original')
		// 	console.log(OqueryResultString, queryResultString)
		// }
		if (SqueryResultString !== OqueryResultString) {
			console.log('State machine does not match original')
			console.log(OqueryResultString, SqueryResultString)
		}
		console.group('Logs')
		logCapture.repeat()
		console.groupEnd()
		console.groupEnd()
	}
})

const newTests = [
	'hello "hi  ho"',
	'> hi > you & hi',
	'> hi > you=HI',
	'> hi > you=hi',
	'hi > you=HI < *',
	'hi[you=HI]',
	'hi[>you=HI]',
]



newTests.forEach(path => {
	const logCapture = capture()
	let astResult
	let queryResult
	try {
		astResult = selectorAST(path)
		console.log(astResult)
		queryResult = query(struc, path)
		logCapture.restore()
		console.log('good')
		console.log(JSON.stringify(astResult, null, '  '), JSON.stringify(queryResult, null, '  '))
	} catch (error) {
		logCapture.restore()

		console.group(path)
			console.log(JSON.stringify(astResult, null, '  '), JSON.stringify(queryResult, null, '  '))
			console.log(error)
			console.group('Logs')
				logCapture.repeat()
			console.groupEnd()
		console.groupEnd()
	}
})
const ast = {
	"selectors": [
		[
			{
				"operator": "none",
				matcher: matcher("*"),
				children: [
					[
						[
							{
								"operator": "child",
								children: [],
								"name": "yes",
								value: "yes",
								matcher: matcher("yes", 'yes'),
							}
						],
						[
							{
								"operator": "child",
								children: [],
								"name": "dif",
								value: "dif",
								matcher: matcher("dif", 'dif'),
							}
						]
					],
					[
						[
							{
								"operator": "child",
								children: [],
								"name": "and",
								value: "and",
								matcher: matcher("and", 'and'),
							}
						]
					]
				],
				"name": "*",
			}
		]
	],
	"operator": "none"
}
const q = '*[>yes=yes,>dif=dif][>and=and]'

const tstruc = [
	{
		no: 'no',
		and: 'and'
	},
	{
		dif: 'dif',
		and: 'and'
	},
	{
		yes: 'yes',
		and: 'and'
	},
	{
		yes: 'yes',
	}
]
const ttast = selectorAST(q)

// if (JSON.stringify(ttast, null, '  ') !== JSON.stringify(ast, null, '  '))
// 	console.log('BAD', JSON.stringify(ast, null, '  '), JSON.stringify(ttast, null, '  '))

// const validPaths = list_path_object(tstruc).filter(matches(tstruc, ast))
// console.log(JSON.stringify(ast, null, '  '), JSON.stringify(validPaths, null, '  '))

*/