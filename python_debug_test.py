from viz.debug import set_trace
import viz.graphtracker as gt
from sandbox.vgg import vgg16
from sandbox.stack_lstm import StackLSTM, PseudoLogLSTM
from torch.autograd import Variable
import torch

myInt = 86
myFloat = 3.14159
myBool = True
myString = "The quick brown fox jumps over the lazy dog"
myNone = None

myList = [1, 2.3, False, "hello", None, [10, 11, ["This", "is", "the", "end"]]]
myDict = {"key1": "value1"}
myTensor1 = (torch.rand(15,20) - 0.5) * 10
myTensor2 = torch.rand(6,7) - 0.5
myTensor3 = (torch.randn(100, 100))

def myFn(arg1):
    return arg1 + 5

myVGGInput = gt.track_data(Variable(torch.ones(1, 3, 32, 32)), {})
myVGG = vgg16()
myVGGOutput = myVGG(myVGGInput)

myRNNBatchSize = 5
myRNNDims = [10, 10, 10, 10]
myRNNInput = [gt.track_data(Variable(torch.ones(5, myRNNDims[0])), {'self': None}) for _ in range(4)]
myRNN = StackLSTM(myRNNBatchSize, myRNNDims)
myRNNOutput = myRNN(myRNNInput)

myPseudoLogLSTM = PseudoLogLSTM(myRNNBatchSize, myRNNDims)
myPseudoLogLSTMOutput = myPseudoLogLSTM(myRNNInput)

set_trace()
print('Goodbye!')
