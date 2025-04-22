import description from "./description.js";
import { matches, test } from "./d/index.js";
import S, {  list_path_object,  get_closest_path, named, inc, or, forIn, SuperSmallStateMachineReferenceError, NodeTypeError, PathReferenceError, Return, Goto, StrictTypes, Changes, Stack, Trace, Continue, Break, SuperSmallStateMachineTypeError, SuperSmallStateMachineError, not, and, ident, name, shallow_merge_object, update_path_object, set_path_object, clone_object, Node, normalise_function, StateReferenceError, StateTypeError, wait_time, get_path_object, deep_merge_object, NodeReferenceError, MaxIterationsError, Symbols, ConditionNode, SequenceNode, BreakNode, ContinueNode, ReturnNode, AbsoluteGotoNode, AbsoluteGoto, InterruptGotoNode, InterruptGoto, MachineGotoNode, MachineGoto, SequenceGotoNode, SequenceGoto, GotoNode, MachineNode, WhileNode, While, SwitchNode, Switch, Condition, EmptyNode, Empty, UndefinedNode, Undefined, FunctionNode, FunctionN, Sequence, ChangesNode, ErrorNode, ErrorN, Machine } from './index.ts'
import asyncPlugin, { Wait } from "./plugin/async.js";


const testSymbol = Symbol('test symbol')
const testSymbol2 = Symbol('test symbol 2')
const symbols = {
	Stack,
	Trace,
	StrictTypes,
	testSymbol,
	testSymbol2,
	Changes,
	Sequence,
	FunctionN,
	Condition,
	Switch,
	While,
	Machine,
	Goto,
	InterruptGoto,
	AbsoluteGoto,
	MachineGoto,
	SequenceGoto,
	ErrorN,
	Undefined,
	Empty,
	Continue,
	Break,
	Return,
}
await test(description)
