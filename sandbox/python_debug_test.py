from viz.debug import set_trace

import torch


class DummyClass(object):
    class_primitive = 5
    class_obj = [1, 2, 3]

    def __init__(self, prop1, prop2=None):
        super(self.__class__)
        self.prop1 = prop1
        self.prop2 = prop2
        self.prop3 = 'meow'

    @staticmethod
    def classfn():
        pass
    
    def instancefn(self, arg1):
        pass
    
    def _underscore1(self, arg1):
        pass


class ListSubclass(list):
    static_field = 'woop'

    def __init__(self):
        super(ListSubclass, self).__init__()
        self.instance_field = 'hello world!'


def anon_fn(arg1):
    pass

fn = anon_fn
instance = DummyClass(5, prop2='cat')
string = "str"
number = 10
boolean = True
l = [1, number, instance]
s = {1, string, instance.prop1}
t = (1, boolean, instance.prop2)
d = {
    "k1": instance.prop3,
    "k2": DummyClass,
    "k3": DummyClass.class_primitive,
}

lst = ListSubclass()
lst += [d, DummyClass.classfn, DummyClass.class_obj]

set_trace()
print('Goodbye!')
