import D, { E, JS, TS, CS, test } from './d/index.js'
// import S, { clone_object, NodeDefinition, normalise_function, StateReferenceError, StateTypeError, unique_list_strings, wait_time, get_path_object, deep_merge_object, UndefinedNodeError, MaxIterationsError } from './index.js'
import * as testModule from './path.js'
import { selectorAST, is, query, queryPaths, createQuery } from './path.js'


const testStruc = {
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
const testStruc2 = [
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
	D('Requirements',
		D('Basics',
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
			D('The equals operator can be used to match the values of keys', E.equals(() => {
				const testObject = { myKey: 'allowed', }
				return query(testObject, 'myKey=allowed')
			}, ['allowed'])),
			D('Omit values that do not match the value selector', E.equals(() => {
				const testObject = [{ myKey: 'allowed', },{ myKey: 'not-allowed', }]
				return query(testObject, 'myKey=allowed')
			}, ['allowed'])),
		),
		D('Descendents and Ancestors',
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
		),
		D('Brackets',
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
		),
		D('Wildcards',
			D('Can use wildcards to match keys in an object', E.equals(() => {
				const testObject = {
					myKey: testValue1,
					alsoMyKey: testValue2
				}
				return query(testObject, '*Key')
			}, [testValue1,testValue2])),
			D('Wildcards can also be used in values', E.equals(() => {
				const testObject = {
					myKey: 'isAllowed',
					subObject: { myKey: 'alsoAllowed' }
				}
				return query(testObject, 'myKey=*Allowed')
			}, ['isAllowed', 'alsoAllowed'])),

			D('Wildcards can be used in any position',
				D('Wildcards can be used at the start of a key', E.equals(() => {
					const testObject = {
						endSame: testValue1, asSame: testValue2
					}
					return query(testObject, '*Same')
				}, [ testValue1, testValue2 ])),
				D('Wildcards can be used at the end of a key', E.equals(() => {
					const testObject = {
						sameStart: testValue1, sameAs: testValue2
					}
					return query(testObject, 'same*')
				}, [ testValue1, testValue2 ])),
				D('Wildcards can be used in the middle of a key', E.equals(() => {
					const testObject = {
						sameStartKey: testValue1, sameAsKey: testValue2
					}
					return query(testObject, 'same*Key')
				}, [ testValue1, testValue2 ])),
				D('Wildcards can be used in multiple positions in a key', E.equals(() => {
					const testObject = {
						sameMiddleKey: testValue1, asMuddleThis: testValue2
					}
					return query(testObject, '*M*ddle*')
				}, [ testValue1, testValue2 ])),
				D('Wildcards can be used at the start of a value', E.equals(() => {
					const testObject = {
						myKey1: 'endSame', myKey2: 'asSame'
					}
					return query(testObject, '*=*Same')
				}, [ 'endSame', 'asSame' ])),
				D('Wildcards can be used at the end of a value', E.equals(() => {
					const testObject = {
						sameStart: testValue1, sameAs: testValue2
					}
					return query(testObject, 'same*')
				}, [ testValue1, testValue2 ])),
				D('Wildcards can be used in the middle of a value', E.equals(() => {
					const testObject = {
						sameStartKey: testValue1, sameAsKey: testValue2
					}
					return query(testObject, 'same*Key')
				}, [ testValue1, testValue2 ])),
				D('Wildcards can be used in multiple positions in a value', E.equals(() => {
					const testObject = {
						sameMiddleKey: testValue1, asMuddleThis: testValue2
					}
					return query(testObject, '*M*ddle*')
				}, [ testValue1, testValue2 ])),
			),
			D('Wildcards will match an empty part', E.equals(() => {
				const testObject = {
					endSame: testValue1, Same: testValue2
				}
				return query(testObject, '*Same')
			}, [ testValue1, testValue2 ])),
			D('Carat wildcards will not match an empty part', E.equals(() => {
				const testObject = {
					endSame: testValue1, Same: testValue2
				}
				return query(testObject, '^Same')
			}, [ testValue1 ])),
			D('Number Wildcard',
				D('Number Wildcards match any number', E.equals(() => {
					const testObject = { 42: testValue1, notANumber: testValue2 }
					return query(testObject, '%')
				}, [testValue1])),
				D('Number Wildcards with a number before the % symbol match the Ath entry only', E.equals(() => {
					const testObject = [ testValue1, testValue2, testValue3, testValue4 ]
					return query(testObject, '2%')
				}, [testValue3])),
				// D('Number Wildcards with a negative number before the % symbol match the Ath entry from the end only', E.equals(() => {
				// 	const testObject = [ testValue1, testValue2, testValue3, testValue4 ]
				// 	return query(testObject, '-1%')
				// }, [testValue2])),
				D('Number Wildcards with a number after the % symbol match every Bth entry, starting with the first', E.equals(() => {
					const testObject = [ testValue1, testValue2, testValue3, testValue4 ]
					return query(testObject, '%2')
				}, [testValue1, testValue3])),
				D('Number Wildcards with a number before and after the % symbol match every A+BNth entry', E.equals(() => {
					const testObject = [ testValue1, testValue2, testValue3, testValue4, testValue5, testValue6, testValue7 ]
					return query(testObject, '1%3')
				}, [testValue2, testValue5])),
			),
		),
		D('Square Brackets', 
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
		),
		D('Regex',
			D('Regex can be used to match keys', E.equals(() => {
				const testObject = {  someComplexKey: testValue1, someOtherKey: testValue2, notTheSameKey: testValue3 }
				return query(testObject, '/some[a-zA-Z]+Key/')
			}, [testValue1, testValue2])),
			D('Flags can be used in regex', E.equals(() => {
				const testObject = {  someComplexKey: testValue1, someOtherKey: testValue2, notTheSameKey: testValue3 }
				return query(testObject, '/some[a-z]+key/i')
			}, [testValue1, testValue2])),
		),
		D('Quotes', 
			D('Double quotes can be used to allow reserved charachters in a key selector', E.equals(() => {
				const testObject = {
					"!£$%^*&~()[]{}": testValue1
				}
				return query(testObject, '"!£$%^*&~()[]{}"')
			}, [ testValue1 ])),
			D('Single quotes can be used to allow reserved charachters in a key selector', E.equals(() => {
				const testObject = {
					"!£$%^*&~()[]{}": testValue1
				}
				return query(testObject, "'!£$%^*&~()[]{}'")
			}, [ testValue1 ])),
			D('Backtick quotes can be used to allow reserved charachters in a key selector', E.equals(() => {
				const testObject = {
					"!£$%^&~()[]{}": testValue1
				}
				return query(testObject, '`!£$%^&~()[]{}`')
			}, [ testValue1 ])),
			D('Wildcards can be used inside backtick quotes', E.equals(() => {
				const testObject = {
					"!£$%^&~()[]{}": testValue1
				}
				return query(testObject, '`*&~()[]{}`')
			}, [ testValue1 ])),
			D('Wildcards cannot be used inside other quotes', E.equals(() => {
				const testObject = {
					"!£$%^&~()[]{}": testValue1
				}
				return query(testObject, '"*&~()[]{}"')
			}, [ ])),
		),
		D('Siblings',
			D('Next Sibling',
				D('The plus operator can be used to get the direct next sibling', E.equals(() => {
					const testObject = [
						'myValue',
						'other',
						'not',
						'myValue',
						'another',
					]
					return query(testObject, '*=myValue + *')
				}, ['other', 'another'])),
				D('The plus operator will also work on objects using the order of the keys', E.equals(() => {
					const testObject = {
						firstKey: 'a',
						secondKey: 'b',
						thirdKey: 'c',
						fourthKey: 'd',
						fifthKey: 'e',
					}
					return query(testObject, 'thirdKey + *')
				}, ['d'])),
				D('The double plus operator can be used to get any next sibling', E.equals(() => {
					const testObject = [
						'not',
						'myValue',
						'other',
						'another',
					]
					return query(testObject, '*=myValue ++ *')
				}, ['other', 'another'])),
				D('The double plus operator will also work on objects using the order of the keys', E.equals(() => {
					const testObject = {
						firstKey: 'a',
						secondKey: 'b',
						thirdKey: 'c',
						fourthKey: 'd',
						fifthKey: 'e',
					}
					return query(testObject, 'thirdKey ++ *')
				}, ['d', 'e'])),
			),
			D('Previous Sibling',
				D('The minus operator can be used to get the previous sibling', E.equals(() => {
					const testObject = [
						'other',
						'myValue',
						'not',
						'another',
						'myValue',
					]
					return query(testObject, '*=myValue - *')
				}, ['other', 'another'])),
				D('The minus operator will also work on objects using the order of the keys', E.equals(() => {
					const testObject = {
						firstKey: 'a',
						secondKey: 'b',
						thirdKey: 'c',
						fourthKey: 'd',
						fifthKey: 'e',
					}
					return query(testObject, 'thirdKey - *')
				}, ['b'])),
				D('The double minus operator can be used to get any previous sibling', E.equals(() => {
					const testObject = [
						'other',
						'another',
						'myValue',
						'not',
					]
					return query(testObject, '*=myValue -- *')
				}, ['other', 'another'])),
				D('The double minus operator will also work on objects using the order of the keys', E.equals(() => {
					const testObject = {
						firstKey: 'a',
						secondKey: 'b',
						thirdKey: 'c',
						fourthKey: 'd',
						fifthKey: 'e',
					}
					return query(testObject, 'thirdKey -- *')
				}, ['a','b'])),
			),
			D('Any Sibling',
				D('The tilde operator will match either the previous or next sibling', E.equals(() => {
					const testObject = [
						'not',
						'other',
						'myValue',
						'another',
						'neither',
					]
					return query(testObject, '*=myValue ~ *')
				}, ['other', 'another'])),
				D('The tilde operator will also work on objects using the order of the keys', E.equals(() => {
					const testObject = {
						firstKey: 'a',
						secondKey: 'b',
						thirdKey: 'c',
						fourthKey: 'd',
						fifthKey: 'e',
					}
					return query(testObject, 'thirdKey ~ *')
				}, ['b','d'])),
				D('The double tilde operator will match any sibling', E.equals(() => {
					const testObject = [
						'also',
						'other',
						'myValue',
						'another',
						'and this',
					]
					return query(testObject, '>*=myValue ~~ *')
				}, ['also', 'other', 'another', 'and this'])),
				D('The double tilde operator will also work on objects using the order of the keys', E.equals(() => {
					const testObject = {
						firstKey: 'a',
						secondKey: 'b',
						thirdKey: 'c',
						fourthKey: 'd',
						fifthKey: 'e',
					}
					return query(testObject, 'thirdKey ~~ *')
				}, ['a','b','d','e'])),
			),
		),
		D('ID & Class',
			D('', E.equals(() => {
			
			})),
			D('', E.equals(() => {
			
			})),
			D('', E.equals(() => {
			
			})),
		),
		// D('', E.equals(() => {
		// })),
	),

	D('Snapshots',
		D(`Snapshot: 'hi > (hi, > ho) > do << hi'`,
			D('Object Selection',
				E.equals(() => {
					return query(testStruc, 'hi > (hi, > ho) > do << hi')
				}, [{"you":"HI","hi":{"how":{"you":"HI HI HOW"},"do":{"you":"HI HI DO","go":{},"Go":{},"po":{},"do":{},"grow":{"you":"HI HI DO GROW"}},"you":{"go":{},"po":{},"do":{},"grow":{}}}},{"how":{"you":"HI HI HOW"},"do":{"you":"HI HI DO","go":{},"Go":{},"po":{},"do":{},"grow":{"you":"HI HI DO GROW"}},"you":{"go":{},"po":{},"do":{},"grow":{}}}]),
			),
			D('Path Parsing',
				E.equals(() => {
					return selectorAST('hi > (hi, > ho) > do << hi')
				}, {"selectors":[[[{"operator":"none","children":[],"notted":false,"name":"hi"},{"selectors":[[[{"operator":"child","children":[],"notted":false,"name":"hi"}],[{"operator":"child","children":[],"notted":false,"name":"ho"}]]],"operator":"child"},{"operator":"child","children":[],"notted":false,"name":"do"},{"operator":"ancestor","children":[],"notted":false,"name":"hi"}]]],"operator":"none"}),
			),
			D('Path Selection',
				E.equals(() => {
					return queryPaths(testStruc, 'hi > (hi, > ho) > do << hi')
				}, [["hi"],["hi","hi"]]),
			),
		),
		D(`Snapshot: 'hi > (hi, > ho) > do, he ha (ho ho ho, hi > hi) > do'`,
			D('Object Selection',
				E.equals(() => {
					return query(testStruc, 'hi > (hi, > ho) > do, he ha (ho ho ho, hi > hi) > do')
				}, [{"you":"HI HI DO","go":{},"Go":{},"po":{},"do":{},"grow":{"you":"HI HI DO GROW"}}]),
			),
			D('Path Parsing',
				E.equals(() => {
					return selectorAST('hi > (hi, > ho) > do, he ha (ho ho ho, hi > hi) > do')
				}, {"selectors":[[[{"operator":"none","children":[],"notted":false,"name":"hi"},{"selectors":[[[{"operator":"child","children":[],"notted":false,"name":"hi"}],[{"operator":"child","children":[],"notted":false,"name":"ho"}]]],"operator":"child"},{"operator":"child","children":[],"notted":false,"name":"do"}],[{"operator":"none","children":[],"notted":false,"name":"he"},{"operator":"none","children":[],"notted":false,"name":"ha"},{"selectors":[[[{"operator":"none","children":[],"notted":false,"name":"ho"},{"operator":"none","children":[],"notted":false,"name":"ho"},{"operator":"none","children":[],"notted":false,"name":"ho"}],[{"operator":"none","children":[],"notted":false,"name":"hi"},{"operator":"child","children":[],"notted":false,"name":"hi"}]]],"operator":"none"},{"operator":"child","children":[],"notted":false,"name":"do"}]]],"operator":"none"}),
			),
			D('Path Selection',
				E.equals(() => {
					return queryPaths(testStruc, 'hi > (hi, > ho) > do, he ha (ho ho ho, hi > hi) > do')
				}, [["hi","hi","do"]]),
			),
		),
		D(`Snapshot: 'hi > hi > (you to > (>> erg, dfg) > fo,do) > g* << *h, > hi > hi >> do'`,
			D('Object Selection',
				E.equals(() => {
					return query(testStruc, 'hi > hi > (you to > (>> erg, dfg) > fo,do) > g* << *h, > hi > hi >> do')
				}, [{"you":"HI HI DO","go":{},"Go":{},"po":{},"do":{},"grow":{"you":"HI HI DO GROW"}},{},{}]),
			),
			D('Path Parsing',
				E.equals(() => {
					return selectorAST('hi > hi > (you to > (>> erg, dfg) > fo,do) > g* << *h, > hi > hi >> do')
				}, {"selectors":[[[{"operator":"none","children":[],"notted":false,"name":"hi"},{"operator":"child","children":[],"notted":false,"name":"hi"},{"selectors":[[[{"operator":"child","children":[],"notted":false,"name":"you"},{"operator":"none","children":[],"notted":false,"name":"to"},{"selectors":[[[{"operator":"descendent","children":[],"notted":false,"name":"erg"}],[{"operator":"child","children":[],"notted":false,"name":"dfg"}]]],"operator":"child"},{"operator":"child","children":[],"notted":false,"name":"fo"}],[{"operator":"child","children":[],"notted":false,"name":"do"}]]],"operator":"child"},{"operator":"child","children":[],"notted":false,"name":"g*"},{"operator":"ancestor","children":[],"notted":false,"name":"*h"}],[{"operator":"child","children":[],"notted":false,"name":"hi"},{"operator":"child","children":[],"notted":false,"name":"hi"},{"operator":"descendent","children":[],"notted":false,"name":"do"}]]],"operator":"none"}),
			),
			D('Path Selection',
				E.equals(() => {
					return queryPaths(testStruc, 'hi > hi > (you to > (>> erg, dfg) > fo,do) > g* << *h, > hi > hi >> do')
				}, [["hi","hi","do"],["hi","hi","do","do"],["hi","hi","you","do"]]),
			),
		),
		D(`Snapshot: '> hi > hi > you,  hi > hi > (do)'`,
			D('Object Selection',
				E.equals(() => {
					return query(testStruc, '> hi > hi > you,  hi > hi > (do)')
				}, [{"you":"HI HI DO","go":{},"Go":{},"po":{},"do":{},"grow":{"you":"HI HI DO GROW"}},{"go":{},"po":{},"do":{},"grow":{}}]),
			),
			D('Path Parsing',
				E.equals(() => {
					return selectorAST('> hi > hi > you,  hi > hi > (do)')
				}, {"selectors":[[[{"operator":"child","children":[],"notted":false,"name":"hi"},{"operator":"child","children":[],"notted":false,"name":"hi"},{"operator":"child","children":[],"notted":false,"name":"you"}],[{"operator":"none","children":[],"notted":false,"name":"hi"},{"operator":"child","children":[],"notted":false,"name":"hi"},{"selectors":[[[{"operator":"child","children":[],"notted":false,"name":"do"}]]],"operator":"child"}]]],"operator":"none"}),
			),
			D('Path Selection',
				E.equals(() => {
					return queryPaths(testStruc, '> hi > hi > you,  hi > hi > (do)')
				}, [["hi","hi","do"],["hi","hi","you"]]),
			),
		),
		D(`Snapshot: '> hi > hi > do > /g.+/i'`,
			D('Object Selection',
				E.equals(() => {
					return query(testStruc, '> hi > hi > do > /g.+/i')
				}, [{},{},{"you":"HI HI DO GROW"}]),
			),
			D('Path Parsing',
				E.equals(() => {
					return selectorAST('> hi > hi > do > /g.+/i')
				}, {"selectors":[[[{"operator":"child","children":[],"notted":false,"name":"hi"},{"operator":"child","children":[],"notted":false,"name":"hi"},{"operator":"child","children":[],"notted":false,"name":"do"},{"operator":"child","children":[],"notted":false,"name":'/g.+/i'}]]],"operator":"none"}),
			),
			D('Path Selection',
				E.equals(() => {
					return queryPaths(testStruc, '> hi > hi > do > /g.+/i')
				}, [["hi","hi","do","go"],["hi","hi","do","Go"],["hi","hi","do","grow"]]),
			),
		),
		D(`Snapshot: '> hi > hi > do < hi'`,
			D('Object Selection',
				E.equals(() => {
					return query(testStruc, '> hi > hi > do < hi')
				}, [{"how":{"you":"HI HI HOW"},"do":{"you":"HI HI DO","go":{},"Go":{},"po":{},"do":{},"grow":{"you":"HI HI DO GROW"}},"you":{"go":{},"po":{},"do":{},"grow":{}}}]),
			),
			D('Path Parsing',
				E.equals(() => {
					return selectorAST('> hi > hi > do < hi')
				}, {"selectors":[[[{"operator":"child","children":[],"notted":false,"name":"hi"},{"operator":"child","children":[],"notted":false,"name":"hi"},{"operator":"child","children":[],"notted":false,"name":"do"},{"operator":"parent","children":[],"notted":false,"name":"hi"}]]],"operator":"none"}),
			),
			D('Path Selection',
				E.equals(() => {
					return queryPaths(testStruc, '> hi > hi > do < hi')
				}, [["hi","hi"]]),
			),
		),
		D(`Snapshot: '> hi > hi >> do << hi'`,
			D('Object Selection',
				E.equals(() => {
					return query(testStruc, '> hi > hi >> do << hi')
				}, [{"you":"HI","hi":{"how":{"you":"HI HI HOW"},"do":{"you":"HI HI DO","go":{},"Go":{},"po":{},"do":{},"grow":{"you":"HI HI DO GROW"}},"you":{"go":{},"po":{},"do":{},"grow":{}}}},{"how":{"you":"HI HI HOW"},"do":{"you":"HI HI DO","go":{},"Go":{},"po":{},"do":{},"grow":{"you":"HI HI DO GROW"}},"you":{"go":{},"po":{},"do":{},"grow":{}}}]),
			),
			D('Path Parsing',
				E.equals(() => {
					return selectorAST('> hi > hi >> do << hi')
				}, {"selectors":[[[{"operator":"child","children":[],"notted":false,"name":"hi"},{"operator":"child","children":[],"notted":false,"name":"hi"},{"operator":"descendent","children":[],"notted":false,"name":"do"},{"operator":"ancestor","children":[],"notted":false,"name":"hi"}]]],"operator":"none"}),
			),
			D('Path Selection',
				E.equals(() => {
					return queryPaths(testStruc, '> hi > hi >> do << hi')
				}, [["hi"],["hi","hi"]]),
			),
		),
		D(`Snapshot: '> hi > (you)'`,
			D('Object Selection',
				E.equals(() => {
					return query(testStruc, '> hi > (you)')
				}, ["HI"]),
			),
			D('Path Parsing',
				E.equals(() => {
					return selectorAST('> hi > (you)')
				}, {"selectors":[[[{"operator":"child","children":[],"notted":false,"name":"hi"},{"selectors":[[[{"operator":"child","children":[],"notted":false,"name":"you"}]]],"operator":"child"}]]],"operator":"none"}),
			),
			D('Path Selection',
				E.equals(() => {
					return queryPaths(testStruc, '> hi > (you)')
				}, [["hi","you"]]),
			),
		),
		D(`Snapshot: '> hi > (> you)'`,
			D('Object Selection',
				E.equals(() => {
					return query(testStruc, '> hi > (> you)')
				}, ["HI"]),
			),
			D('Path Parsing',
				E.equals(() => {
					return selectorAST('> hi > (> you)')
				}, {"selectors":[[[{"operator":"child","children":[],"notted":false,"name":"hi"},{"selectors":[[[{"operator":"child","children":[],"notted":false,"name":"you"}]]],"operator":"child"}]]],"operator":"none"}),
			),
			D('Path Selection',
				E.equals(() => {
					return queryPaths(testStruc, '> hi > (> you)')
				}, [["hi","you"]]),
			),
		),
		D(`Snapshot: '> hi > (>> you)'`,
			D('Object Selection',
				E.equals(() => {
					return query(testStruc, '> hi > (>> you)')
				}, ["HI","HI HI HOW","HI HI DO","HI HI DO GROW",{"go":{},"po":{},"do":{},"grow":{}}]),
			),
			D('Path Parsing',
				E.equals(() => {
					return selectorAST('> hi > (>> you)')
				}, {"selectors":[[[{"operator":"child","children":[],"notted":false,"name":"hi"},{"selectors":[[[{"operator":"descendent","children":[],"notted":false,"name":"you"}]]],"operator":"child"}]]],"operator":"none"}),
			),
			D('Path Selection',
				E.equals(() => {
					return queryPaths(testStruc, '> hi > (>> you)')
				}, [["hi","you"],["hi","hi","how","you"],["hi","hi","do","you"],["hi","hi","do","grow","you"],["hi","hi","you"]]),
			),
		),
		D(`Snapshot: 'hello "hi  ho"'`,
			D('Object Selection',
				E.equals(() => {
					return query(testStruc, 'hello "hi  ho"')
				}, []),
			),
			D('Path Parsing',
				E.equals(() => {
					return selectorAST('hello "hi  ho"')
				}, {"selectors":[[[{"operator":"none","children":[],"notted":false,"name":"hello"},{"operator":"none","children":[],"notted":false,"name":"hi  ho"}]]],"operator":"none"}),
			),
			D('Path Selection',
				E.equals(() => {
					return queryPaths(testStruc, 'hello "hi  ho"')
				}, []),
			),
		),
		D(`Snapshot: '> hi > you ~~ hi'`,
			D('Object Selection',
				E.equals(() => {
					return query(testStruc, '> hi > you ~~ hi')
				}, [{"how":{"you":"HI HI HOW"},"do":{"you":"HI HI DO","go":{},"Go":{},"po":{},"do":{},"grow":{"you":"HI HI DO GROW"}},"you":{"go":{},"po":{},"do":{},"grow":{}}}]),
			),
			D('Path Parsing',
				E.equals(() => {
					return selectorAST('> hi > you ~~ hi')
				}, {"selectors":[[[{"operator":"child","children":[],"notted":false,"name":"hi"},{"operator":"child","children":[],"notted":false,"name":"you"},{"operator":"siblings","children":[],"notted":false,"name":"hi"}]]],"operator":"none"}),
			),
			D('Path Selection',
				E.equals(() => {
					return queryPaths(testStruc, '> hi > you ~~ hi')
				}, [["hi","hi"]]),
			),
		),
		D(`Snapshot: '> hi > you=HI'`,
			D('Object Selection',
				E.equals(() => {
					return query(testStruc, '> hi > you=HI')
				}, ["HI"]),
			),
			D('Path Parsing',
				E.equals(() => {
					return selectorAST('> hi > you=HI')
				}, {"selectors":[[[{"operator":"child","children":[],"notted":false,"name":"hi"},{"operator":"child","children":[],"notted":false,"name":"you","value":"HI","vaueNotted":false}]]],"operator":"none"}),
			),
			D('Path Selection',
				E.equals(() => {
					return queryPaths(testStruc, '> hi > you=HI')
				}, [["hi","you"]]),
			),
		),
		D(`Snapshot: '> hi > you=hi'`,
			D('Object Selection',
				E.equals(() => {
					return query(testStruc, '> hi > you=hi')
				}, []),
			),
			D('Path Parsing',
				E.equals(() => {
					return selectorAST('> hi > you=hi')
				}, {"selectors":[[[{"operator":"child","children":[],"notted":false,"name":"hi"},{"operator":"child","children":[],"notted":false,"name":"you","value":"hi","vaueNotted":false}]]],"operator":"none"}),
			),
			D('Path Selection',
				E.equals(() => {
					return queryPaths(testStruc, '> hi > you=hi')
				}, []),
			),
		),
		D(`Snapshot: 'hi > you=HI < *'`,
			D('Object Selection',
				E.equals(() => {
					return query(testStruc, 'hi > you=HI < *')
				}, [{"you":"HI","hi":{"how":{"you":"HI HI HOW"},"do":{"you":"HI HI DO","go":{},"Go":{},"po":{},"do":{},"grow":{"you":"HI HI DO GROW"}},"you":{"go":{},"po":{},"do":{},"grow":{}}}}]),
			),
			D('Path Parsing',
				E.equals(() => {
					return selectorAST('hi > you=HI < *')
				}, {"selectors":[[[{"operator":"none","children":[],"notted":false,"name":"hi"},{"operator":"child","children":[],"notted":false,"name":"you","value":"HI","vaueNotted":false},{"operator":"parent","children":[],"notted":false,"name":"*"}]]],"operator":"none"}),
			),
			D('Path Selection',
				E.equals(() => {
					return queryPaths(testStruc, 'hi > you=HI < *')
				}, [["hi"]]),
			),
		),
		D(`Snapshot: 'hi[you=HI]'`,
			D('Object Selection',
				E.equals(() => {
					return query(testStruc, 'hi[you=HI]')
				}, [{"you":"HI","hi":{"how":{"you":"HI HI HOW"},"do":{"you":"HI HI DO","go":{},"Go":{},"po":{},"do":{},"grow":{"you":"HI HI DO GROW"}},"you":{"go":{},"po":{},"do":{},"grow":{}}}}]),
			),
			D('Path Parsing',
				E.equals(() => {
					return selectorAST('hi[you=HI]')
				}, {"selectors":[[[{"operator":"none","children":[[[{"operator":"none","children":[],"notted":false,"name":"you","value":"HI","vaueNotted":false}]]],"notted":false,"name":"hi"}]]],"operator":"none"}),
			),
			D('Path Selection',
				E.equals(() => {
					return queryPaths(testStruc, 'hi[you=HI]')
				}, [["hi"]]),
			),
		),
		D(`Snapshot: 'hi[>you=HI]'`,
			D('Object Selection',
				E.equals(() => {
					return query(testStruc, 'hi[>you=HI]')
				}, [{"you":"HI","hi":{"how":{"you":"HI HI HOW"},"do":{"you":"HI HI DO","go":{},"Go":{},"po":{},"do":{},"grow":{"you":"HI HI DO GROW"}},"you":{"go":{},"po":{},"do":{},"grow":{}}}}]),
			),
			D('Path Parsing',
				E.equals(() => {
					return selectorAST('hi[>you=HI]')
				}, {"selectors":[[[{"operator":"none","children":[[[{"operator":"child","children":[],"notted":false,"name":"you","value":"HI","vaueNotted":false}]]],"notted":false,"name":"hi"}]]],"operator":"none"}),
			),
			D('Path Selection',
				E.equals(() => {
					return queryPaths(testStruc, 'hi[>you=HI]')
				}, [["hi"]]),
			),
		),
		D(`Snapshot: '*[>yes=yes,dif=dif][>and=and]'`,
			D('Object Selection',
				E.equals(() => {
					return query(testStruc2, '*[>yes=yes,dif=dif][>and=and]')
				}, [{"dif":"dif","and":"and"},{"yes":"yes","and":"and"}]),
			),
			D('Path Parsing',
				E.equals(() => {
					return selectorAST('*[>yes=yes,dif=dif][>and=and]')
				}, {"selectors":[[[{"operator":"none","children":[[[{"operator":"child","children":[],"notted":false,"name":"yes","value":"yes","vaueNotted":false}],[{"operator":"none","children":[],"notted":false,"name":"dif","value":"dif","vaueNotted":false}]],[[{"operator":"child","children":[],"notted":false,"name":"and","value":"and","vaueNotted":false}]]],"notted":false,"name":"*"}]]],"operator":"none"}),
			),
			D('Path Selection',
				E.equals(() => {
					return queryPaths(testStruc2, '*[>yes=yes,dif=dif][>and=and]')
				}, [["1"],["2"]]),
			),
		),
		D(`Snapshot: '*[>yes=yes,>dif=dif][and=and]'`,
			D('Object Selection',
				E.equals(() => {
					return query(testStruc2, '*[>yes=yes,>dif=dif][and=and]')
				}, [{"dif":"dif","and":"and"},{"yes":"yes","and":"and"}]),
			),
			D('Path Parsing',
				E.equals(() => {
					return selectorAST('*[>yes=yes,>dif=dif][and=and]')
				}, {"selectors":[[[{"operator":"none","children":[[[{"operator":"child","children":[],"notted":false,"name":"yes","value":"yes","vaueNotted":false}],[{"operator":"child","children":[],"notted":false,"name":"dif","value":"dif","vaueNotted":false}]],[[{"operator":"none","children":[],"notted":false,"name":"and","value":"and","vaueNotted":false}]]],"notted":false,"name":"*"}]]],"operator":"none"}),
			),
			D('Path Selection',
				E.equals(() => {
					return queryPaths(testStruc2, '*[>yes=yes,>dif=dif][and=and]')
				}, [["1"],["2"]]),
			),
		),
		D(`Snapshot: '*[yes=yes][>and=and]'`,
			D('Object Selection',
				E.equals(() => {
					return query(testStruc2, '*[yes=yes][>and=and]')
				}, [{"yes":"yes","and":"and"}]),
			),
			D('Path Parsing',
				E.equals(() => {
					return selectorAST('*[yes=yes][>and=and]')
				}, {"selectors":[[[{"operator":"none","children":[[[{"operator":"none","children":[],"notted":false,"name":"yes","value":"yes","vaueNotted":false}]],[[{"operator":"child","children":[],"notted":false,"name":"and","value":"and","vaueNotted":false}]]],"notted":false,"name":"*"}]]],"operator":"none"}),
			),
			D('Path Selection',
				E.equals(() => {
					return queryPaths(testStruc2, '*[yes=yes][>and=and]')
				}, [["2"]]),
			),
		),
		D(`Snapshot: '*[>yes=yes][and=and]'`,
			D('Object Selection',
				E.equals(() => {
					return query(testStruc2, '*[>yes=yes][and=and]')
				}, [{"yes":"yes","and":"and"}]),
			),
			D('Path Parsing',
				E.equals(() => {
					return selectorAST('*[>yes=yes][and=and]')
				}, {"selectors":[[[{"operator":"none","children":[[[{"operator":"child","children":[],"notted":false,"name":"yes","value":"yes","vaueNotted":false}]],[[{"operator":"none","children":[],"notted":false,"name":"and","value":"and","vaueNotted":false}]]],"notted":false,"name":"*"}]]],"operator":"none"}),
			),
			D('Path Selection',
				E.equals(() => {
					return queryPaths(testStruc2, '*[>yes=yes][and=and]')
				}, [["2"]]),
			),
		),
		D(`Snapshot: '*[>yes=yes,>dif=dif][and=and]'`,
			D('Object Selection',
				E.equals(() => {
					return query(testStruc2, '*[>yes=yes,>dif=dif][and=and]')
				}, [{"dif":"dif","and":"and"},{"yes":"yes","and":"and"}]),
			),
			D('Path Parsing',
				E.equals(() => {
					return selectorAST('*[>yes=yes,>dif=dif][and=and]')
				}, {"selectors":[[[{"operator":"none","children":[[[{"operator":"child","children":[],"notted":false,"name":"yes","value":"yes","vaueNotted":false}],[{"operator":"child","children":[],"notted":false,"name":"dif","value":"dif","vaueNotted":false}]],[[{"operator":"none","children":[],"notted":false,"name":"and","value":"and","vaueNotted":false}]]],"notted":false,"name":"*"}]]],"operator":"none"}),
			),
			D('Path Selection',
				E.equals(() => {
					return queryPaths(testStruc2, '*[>yes=yes,>dif=dif][and=and]')
				}, [["1"],["2"]]),
			),
		),
		D(`Snapshot: '/[0-9]+/[>yes=yes,>dif=dif]'`,
			D('Object Selection',
				E.equals(() => {
					return query(testStruc2, '/[0-9]+/[>yes=yes,>dif=dif]')
				}, [{"dif":"dif","and":"and"},{"yes":"yes","and":"and"},{"yes":"yes"}]),
			),
			D('Path Parsing',
				E.equals(() => {
					return selectorAST('/[0-9]+/[>yes=yes,>dif=dif]')
				}, {"selectors":[[[{"operator":"none","children":[[[{"operator":"child","children":[],"notted":false,"name":"yes","value":"yes","vaueNotted":false}],[{"operator":"child","children":[],"notted":false,"name":"dif","value":"dif","vaueNotted":false}]]],"notted":false,"name":'/[0-9]+/'}]]],"operator":"none"}),
			),
			D('Path Selection',
				E.equals(() => {
					return queryPaths(testStruc2, '/[0-9]+/[>yes=yes,>dif=dif]')
				}, [["1"],["2"],["3"]]),
			),
		),
		D(`Snapshot: '*[>dif=dif][>and=and]'`,
			D('Object Selection',
				E.equals(() => {
					return query(testStruc2, '*[>dif=dif][>and=and]')
				}, [{"dif":"dif","and":"and"}]),
			),
			D('Path Parsing',
				E.equals(() => {
					return selectorAST('*[>dif=dif][>and=and]')
				}, {"selectors":[[[{"operator":"none","children":[[[{"operator":"child","children":[],"notted":false,"name":"dif","value":"dif","vaueNotted":false}]],[[{"operator":"child","children":[],"notted":false,"name":"and","value":"and","vaueNotted":false}]]],"notted":false,"name":"*"}]]],"operator":"none"}),
			),
			D('Path Selection',
				E.equals(() => {
					return queryPaths(testStruc2, '*[>dif=dif][>and=and]')
				}, [["1"]]),
			),
		),
	),
)

await test(description)

const printSnapshots = (testPaths, struc) => {
	const strucName = Object.keys(struc)[0]
	const strucObj = struc[strucName]
	testPaths.forEach(path => {
		const queryPathResults = queryPaths(strucObj, path)
		const queryResult = query(strucObj, path)
		const astResult = selectorAST(path)
		console.log(`D(\`Snapshot: '${path}'\`,\n\tD('Object Selection',
		E.equals(() => {
			return query(${strucName}, '${path}')
		}, ${JSON.stringify(queryResult)}),\n\t),\n\tD('Path Parsing',
		E.equals(() => {
			return selectorAST('${path}')
		}, ${JSON.stringify(astResult)}),\n\t),\n\tD('Path Selection',
		E.equals(() => {
			return queryPaths(${strucName}, '${path}')
		}, ${JSON.stringify(queryPathResults)}),\n\t),\n),`)
	})
}


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
	'hello "hi  ho"',
	'> hi > you ~~ hi',
	'> hi > you=HI',
	'> hi > you=hi',
	'hi > you=HI < *',
	'hi[you=HI]',
	'hi[>you=HI]',
]
const testPaths2 = [
	'*[>yes=yes,dif=dif][>and=and]',
	'*[>yes=yes,>dif=dif][and=and]',
	'*[yes=yes][>and=and]',
	'*[>yes=yes][and=and]',
	'*[>yes=yes,>dif=dif][and=and]',
	'/[0-9]+/[>yes=yes,>dif=dif]',
	'*[>dif=dif][>and=and]',
]
// printSnapshots(testPaths, { testStruc })
// printSnapshots(testPaths2, { testStruc2 })
