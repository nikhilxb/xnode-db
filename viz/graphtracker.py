"""
This module allows users to create graph op nodes, graph data nodes, and graph containers for visualization. Data is
"tracked" by wrapping it in a `GraphData` object, which acts as a passthrough wrapper that records the op that created
the data and the values of the data that should be visualized. Function calls are "tracked" by `GraphOp` objects,
which record the function that was called and the arguments it was given. Finally, containers are "tracked" with
`GraphContainer` objects, which record their contents.
"""
import wrapt


# A list of all ops and containers which do not currently have a parent container. This is used to identify ops added
# to the graph since the last call to tick() (and should therefore be part of the next temporal container).
_TOP_LEVELS = list()


# ======================================================================================================================
# Graph operations.
# -----------------
# A `GraphOp` object records a single function call, and is created in one of two ways:
#   1. A function and some arguments are passed to `atomic_call`, which executes the function with those arguments
#       and creates a `GraphOp` recording the execution.
#   2. A function is wrapped in an `AtomicTrackedCallable` object, which creates a new `GraphOp` every time the
#       function is executed.
# Newly created `GraphOp` instances are added to _TOP_LEVELS if they have no container.
# ======================================================================================================================

class GraphOp:
    """A record of a single function execution."""
    def __init__(self, fn, args, kwargs):
        """Constructor. Adds the newly-created `GraphOp` to _TOP_LEVELS if it has no parent container.

        Args:
            fn (fn): The function executed in the op.
            args (tuple): A sequence of positional arguments that were passed to the function at execution.
            kwargs (dict): A dictionary of keyword arguments passed to the function at execution.
        """
        self.fn = fn
        self.args = [obj if type(obj) is GraphData else None for obj in args]
        self.kwargs = {
            kw: arg for kw, arg in kwargs.items() if type(arg) is GraphData
        }
        self.container = None
        _TOP_LEVELS.append(self)


def atomic_call(fn, viz_kvs, *args, return_op=False, **kwargs):
    """Executes a function and creates a `GraphOp` recording the execution.

    A single `GraphOp` is created the function's execution. The function should not in its internals create any
    additional `GraphOp` objects; functions which create more `GraphOp` objects should be called with `abstract_call`
    instead. It should also not output `GraphData` objects.

    Args:
        fn (fn): The function to execute.
        viz_kvs (list): A list of visualization dicts for the outputs of `fn`. The i-th entry of `viz_kvs` is a dict
            whose values are attribute names of the i-th returned output of `fn` and whose keys are string names to
            show for those attributes in visualization. See `GraphData` for more info.
        args (tuple): A sequence of positional arguments to pass to fn.
        return_op (bool): `True` if the new `GraphOp` should be returned along with the outputs of `fn`.
        kwargs (dict): Keyword arguments to pass to `fn`.

    Returns:
        The outputs of `fn`, and the new `GraphOp` if `return_op` is `True`.
    """
    op = GraphOp(fn, args, kwargs)
    ret = fn(*args, **kwargs)
    if not isinstance(ret, tuple):
        ret = (ret,)
    output = tuple([GraphData(r, viz_kvs[i], creator_op=op, creator_pos=i) for i, r in enumerate(ret)])
    if return_op:
        return output + (op, )
    else:
        return output if len(output) > 1 else output[0]


class AtomicTrackedCallable(wrapt.ObjectProxy):
    """Wraps a callable object and tracks all calls of the object."""
    def __init__(self, obj, viz_kvs):
        super(AtomicTrackedCallable, self).__init__(obj)
        self._self_viz_kvs = viz_kvs

    def __call__(self, *args, **kwargs):
        return atomic_call(self.__wrapped__, self._self_viz_kvs, *args, **kwargs)


# ======================================================================================================================
# Graph data.
# -----------
# A `GraphData` object records a single immutable function input or output in the computation graph.
# ======================================================================================================================

class GraphData(wrapt.ObjectProxy):
    """Wraps a Python object, exposing all of its attributes while also creating new fields for graph visualization."""
    def __init__(self, obj, props_to_surface, creator_op=None, creator_pos=-1):
        """Constructor. Initializes the wrapper around the object and stores object properties for visualization.

        The wrapper is essentially a passthrough, thus allowing operations on the underlying object to be performed
        directly on the `GraphData` instance; that is, one can use the `GraphData` wrapper as they would its wrapper
        object. The wrapper just records the `GraphOp` which created the object, the object's position in the
        `GraphOp`'s output tuple, and a viz_dict.

        The viz_dict associates string keys with attributes of the wrapped object; only those attributes will be
        surfaced in visualization. For example, a `GraphData` wrapping a Variable would likely have a viz_dict
        containing {'forward': <wrapped Variable's forward tensor>, 'backward': <wrapped Variable's backward
        tensor>}. In the client, the `GraphData` node for that Variable would expose two fields, named 'forward` and
        `backward`, associated with those tensors.

        Both the wrapped object and the `GraphData` wrapper itself should be considered immutable, as any changes
        will not be recorded in the computation graph and thus the graph will be inaccurate.

        Args:
            obj (object): The immutable object wrapped by the `GraphData`.
            props_to_surface (dict): A dictionary whose keys are user-selected names and whose values are the names
                of attributes of the wrapped object. Only those attributes listed in this way are shown in the
                debugger. A value of None indicates that the key should point to the wrapped object itself,
                not any single attribute of it.
            creator_op (GraphOp): The `GraphOp` which created the wrapped object.
            creator_pos (int): The position of the object in the creator_op's output tuple.
        """
        super(GraphData, self).__init__(obj)
        self._self_creator_op = creator_op
        self._self_creator_pos = creator_pos
        self._self_viz_dict = {
            key: getattr(obj, attr) if attr is not None else obj
            for key, attr in props_to_surface.items()
        }

    # Getters for the wrapper fields, since they have to have unusual names to comply with wrapt.ObjectProxy.
    def get_creator_op(self):
        return self._self_creator_op

    def get_creator_pos(self):
        return self._self_creator_pos

    def get_container(self):
        return self._self_container

    def get_visualization_dict(self):
        return self._self_viz_dict


# ======================================================================================================================
# Graph containers.
# -----------------
# A `GraphContainer` groups together `GraphOp` and other `GraphContainer` objects to provide abstraction in
# visualization. Containers are either abstractive, grouping operations as a "black box," or temporal,
# grouping together sequential flows. Containers can generally contain operations and other containers,
# with some restrictions. Namely, a temporal container may contain either a combination of ops and abstractive
# containers, or a collection of temporal containers of the same temporal height.
# ======================================================================================================================

# TODO fill this section out better
# TODO handle paralellism
class GraphContainer:
    """Represents a collection of grouped `GraphOp` and `GraphContainer` objects."""
    def __init__(self, contents=None, temporal_level=-1, container=None):
        """Constructor.
        Args:
            contents (list or None): A list of `GraphOp` and `GraphContainer` objects grouped by the instance,
                or None if no items are grouped yet.
            temporal_level (int): The "height" of the container in terms of temporal subdivisions. Abstractive
                containers have temporal height -1, and the lowest-level temporal containers will have temporal height
                0. Only temporal containers of height 0 may contain ops and abstractive containers.
            container (GraphContainer or None): The parent container of the instance.
        """
        self.contents = contents if contents is not None else list()
        self.container = container
        self.temporal_level = temporal_level


def abstract(contents):
    """Wrap a list of uncontained `GraphOp` and `GraphContainer` instances in a new abstractive container.

    Args:
        contents:

    Returns:

    """
    container = GraphContainer(contents)
    for obj in contents:
        assert obj.container is None, 'All items to be abstracted must not already have a container.'
        _TOP_LEVELS.remove(obj)
    _TOP_LEVELS.append(container)
    return container


def abstract_call(fn, *args, return_container=False, **kwargs):
    """
    """
    start_abstract()
    ret = fn(*args, **kwargs)
    container = end_abstract()
    if return_container:
        return ret + (container, ) if isinstance(ret, tuple) else (ret, container)
    return ret

_ABSTRACT_STARTS = list()


def start_abstract():
    """
    """
    _ABSTRACT_STARTS.append(len(_TOP_LEVELS))


def end_abstract():
    start = _ABSTRACT_STARTS.pop()
    contents = list(_TOP_LEVELS[start:])
    return abstract(contents)


class AbstractTrackedCallable(wrapt.ObjectProxy):
    def __call__(self, *args, **kwargs):
        return abstract_call(self.__wrapped__, *args, **kwargs)


# Temporal.
# ---------

def tick(temporal_level=0):
    assert len(_ABSTRACT_STARTS) == 0, 'A new temporal container cannot be started in the middle of an abstractive ' \
                                       'container.'
    lowest_level_in_top = min([getattr(o, 'temporal_level', -1) for o in _TOP_LEVELS])
    if lowest_level_in_top >= temporal_level:
        return
    if lowest_level_in_top < temporal_level - 1:
        tick(temporal_level - 1)

    container = GraphContainer(temporal_level=temporal_level)
    for top in _TOP_LEVELS:
        if getattr(top, 'temporal_level', -1) < temporal_level:
            container.contents.append(top)
    for content in container.contents:
        _TOP_LEVELS.remove(content)
    _TOP_LEVELS.append(container)
    return container


def temporal_call(fn, *args, return_container=False, temporal_level=0, **kwargs):
    """
    """
    ret = fn(*args, **kwargs)
    container = tick(temporal_level)
    if return_container:
        return ret + (container, ) if isinstance(ret, tuple) else (ret, container)
    return ret


def test():
    def fn1(arg1, arg2, kwarg1='cat', kwarg2='dog'):
        return arg1, kwarg1, arg2, kwarg2

    def fn2(*args, **kwargs):
        return tuple(arg for arg in args) + tuple((kwarg, value) for kwarg, value in kwargs.items())

    in1 = GraphData('pill', {'obj': None})
    in2 = GraphData('pez', {'obj': None})
    for t in range(2):
        for i in range(2):
            for _ in range(2):
                atomic_call(fn2, [{'obj': None}] * 4, in1, in2, return_op=True, kwarg1='filbert', kwarg2=in2)
            tick(0)
        tick(1)
    tick(2)
    for i in range(2):
        for _ in range(2):
            atomic_call(fn2, [{'obj': None}] * 4, in1, in2, return_op=True, kwarg1='filbert', kwarg2=in2)
        tick(0)
    for _ in range(2):
        atomic_call(fn2, [{'obj': None}] * 4, in1, in2, return_op=True, kwarg1='filbert', kwarg2=in2)
    tick(2)
    print(_TOP_LEVELS)
    print(_TOP_LEVELS[1].contents)
    print(_TOP_LEVELS[1].contents[0].contents[2].contents)


if __name__ == '__main__':
    test()
