import torch
import torch.autograd


def fn1():
    print('fn1')
    x = 2
    fn2()
    print('fn1 return')


def fn2():
    print('fn2')
    x = 3
    print('fn2 return')

x = 1
v = torch.autograd.Variable(torch.ones(3, 3), requires_grad=True)
v = v * v
out = torch.sum(v)
out.backward()