import torch
from torch.autograd import Variable

class Herro(object):
    classprop = [1, 2, 3]
    def __init__(self, prop1):
        super(self.__class__)
        self.prop1 = prop1
        self.prop2 = 5

    def classfn():
        pass
    
    def instancefn(self):
        pass
    
    def _underscore1():
        pass

f = Herro.classfn
f = Herro.instancefn

def testfn(arg1):
    print("Herro")
    return 1

x = "string"
y = 4.0
z = [1,2, x, testfn]
x += "herro"
a = [1,2,z]
s = [Herro.classprop, 10]
s2 = [Herro.classprop, 5]
z[0] = 86
b = {"hi": 5, "bye": a, (1,2,3):z}

herro = Herro(a)