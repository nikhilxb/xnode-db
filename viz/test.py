from viz.debug import set_trace as T


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
T()
fn1()
print(x)