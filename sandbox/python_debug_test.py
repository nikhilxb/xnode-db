from viz.debug import set_trace

import viz.graphtracker as gt


myInt = 86
myFloat = 3.14159
myBool = True
myString = "The quick brown fox jumps over the lazy dog"
myNone = None

myList = [1, 2.3, False, "hello", None, [10, 11, ["This", "is", "the", "end"]]]


def myFn(arg1, arg2, kwarg1="foo", kwarg2="bar"):
    return arg1

myGraphData = gt.GraphData(myInt, {"Value": None},
                           creator_op=gt.GraphOp(myFn,
                                                 (gt.GraphData(myFloat, {"Value": None}), myString),
                                                 {
                                                     "kwarg1": gt.GraphData(myBool, {"Value": None}),
                                                     "kwarg2": myNone,
                                                 }),
                           creator_pos=0)
set_trace()
print('Goodbye!')