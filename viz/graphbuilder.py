import wrapt

# to track a call of f, which returns ret1, ret2, with args a, b and kw=c:
# GraphData(ret1), GraphData(ret2), GraphOp = atomic_call(f, a, b, kw=c)


def atomic_call(fn, viz_kvs, *args, **kwargs):
    retval = atomic_call_withop(fn, viz_kvs, *args, **kwargs)[:-1]
    return retval if len(retval) != 1 else retval[0]


def atomic_call_withop(fn, viz_kvs, *args, **kwargs):
    op = GraphOp(fn, args, kwargs)
    ret = fn(*args, **kwargs)
    if not isinstance(ret, tuple):
        ret = (ret,)
    output = tuple([GraphData(r, viz_kvs[i], creator_op=op, creator_pos=i) for i, r in enumerate(ret)])
    _TOP_LEVEL_FOR_TICK.append(op)
    return output + (op, )


# TODO handle paralellism
def abstract(ops):
    container = GraphContainer(ops)
    for op in ops:
        assert op.container is None
        _TOP_LEVEL_FOR_TICK.remove(op)
        op.container = container
    _TOP_LEVEL_FOR_TICK.append(container)
    return container

_TOP_LEVEL_FOR_TICK = list()


# calling tick across threads is a very bad idea
def tick():
    container = GraphContainer(temporal=True)
    for op in _TOP_LEVEL_FOR_TICK:
        assert op.container is None
        op.container = container
        container.contents.append(op)
    _TOP_LEVEL_FOR_TICK.clear()
    return container


class AtomicTrackedCallable(wrapt.ObjectProxy):
    def __init__(self, obj, viz_kvs):
        super(AtomicTrackedCallable, self).__init__(obj)
        self._self_viz_kvs = viz_kvs

    def __call__(self, *args, **kwargs):
        return atomic_call(self.__wrapped__, self._self_viz_kvs, *args, **kwargs)


class GraphData(wrapt.ObjectProxy):
    def __init__(self, obj, viz_dict, creator_op=None, creator_pos=-1):
        super(GraphData, self).__init__(obj)
        self._self_creator_op = creator_op
        self._self_creator_pos = creator_pos
        self._self_viz_dict = {key: getattr(obj, attr) if attr is not None else obj for key, attr in viz_dict.items()}

    def get_creator_op(self):
        return self._self_creator_op

    def get_creator_pos(self):
        return self._self_creator_pos

    def get_container(self):
        return self._self_container

    def get_visualization_dict(self):
        return self._self_viz_dict


class GraphOp:
    def __init__(self, fn, args, kwargs, container=None):
        self.fn = fn
        self.args = [obj if type(obj) is GraphData else None for obj in args]
        self.kwargs = {
            kw: arg for kw, arg in kwargs.items() if type(arg) is GraphData
        }
        self.container = container


class GraphContainer:
    def __init__(self, contents=None, temporal=False, container=None):
        self.contents = contents if contents is not None else list()
        self.container = container
        self.temporal = temporal


def test():
    def fn1(arg1, arg2, kwarg1='cat', kwarg2='dog'):
        return arg1, kwarg1, arg2, kwarg2

    def fn2(*args, **kwargs):
        return tuple(arg for arg in args) + tuple((kwarg, value) for kwarg, value in kwargs.items())

    in1 = GraphData('pill')
    in2 = GraphData('pez')
    r1, r2, r3, r4, op = atomic_call_withop(fn2, in1, in2, kwarg1='filbert', kwarg2=in2)
    print(op.args, op.kwargs)
    print(isinstance(r1, str))

if __name__ == '__main__':
    test()
