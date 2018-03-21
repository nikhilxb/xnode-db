"""
Allows users to track their computation graph for visualization. Data is "tracked" by wrapping it in a `GraphData`
object, which acts as a passthrough wrapper that records the op that created the data and the values of the data that
should be visualized. Function calls are "tracked" by `GraphOp` objects, which record the function that was called
and the arguments it was given. Finally, containers are "tracked" with `GraphContainer` objects, which record their
contents.

See viz.md for underlying principles and concepts.
"""
import wrapt
import inspect
from collections import deque


class Nestable:
    """A parent class to `GraphOp` and `GraphContainer`, representing an object which might be nested in a hierarchy of
    containers."""
    def __init__(self):
        # Each `Nestable` may have either 0 or 1 containers, though that container might have many items and a
        # container of its own. Containers should also be `Nestable` instances.
        self.container = None

    def get_outermost_parent(self):
        """Returns the first `Nestable` with no container, found by iterating through this `Nestable`'s container
        hierarchy.

        The "outermost parent" of a `Nestable` n is the first `Nestable` with no container found in the hierarchy of
        n. This could be n itself, if n has no container.

        Returns:
            (Nestable): This instance's outermost parent.
        """
        return self if self.container is None else self.container.get_outermost_parent()


# ======================================================================================================================
# Graph operations.
# -----------------
# A `GraphOp` object records a single function call and is created whenever a function wrapped by an `OpGenerator`
# object is called.
# ======================================================================================================================

class GraphOp(Nestable):
    """A record of a single function execution."""
    def __init__(self, fn, args, kwargs):
        """Constructor.

        Args:
            fn (Callable): The function executed in the op.
            args (tuple): A sequence of positional arguments that were passed to the function at execution.
            kwargs (dict): A dictionary of keyword arguments passed to the function at execution.
        """
        super(GraphOp, self).__init__()
        self.fn = fn

        try:
            self.fn_name = fn.__name__
        except AttributeError:
            self.fn_name = fn.__class__.__name__

        # built-in functions don't have signatures, so we make them up
        try:
            if hasattr(fn, 'forward'):
                # `getfullargspec` will work on PyTorch modules, but won't get arg names. Need to get from `forward`
                # directly.
                fn_spec = inspect.getfullargspec(fn.forward)
            else:
                fn_spec = inspect.getfullargspec(fn)
            arg_names = fn_spec.args
            varargs = fn_spec.varargs
        except TypeError:
            arg_names = ['{}[{}]'.format(self.fn_name, i) for i in range(len(args))]
            varargs = 'args'

        arg_names = arg_names[(len(arg_names) - len(args)):] + [varargs for _ in range(len(args) - len(arg_names))]

        # Pytorch modules don't have a `__name__` field
        try:
            self.name = self.fn.__name__
        except AttributeError:
            self.name = self.fn.__class__.__name__

        # Arguments which were tracked via a call to `track_data()` (that is, should be shown in the graph) have a
        # `GraphData` object associated with them. We only record these objects (if they exist) in `self.args`,
        # as these contain all of the information needed to visualize the data in the client. Untracked objects are
        # represented by `None` to maintain position.
        self.args = self._make_arg_list(args, arg_names)

        # Only k-v pairs where the value is "tracked" are saved in `self.kwargs`.
        kwarg_keys = list(kwargs.keys())
        self.kwargs = self._make_arg_list([kwargs[k] for k in kwarg_keys], kwarg_keys)

        # A `GraphOp` object always has temporal level 0, so any new temporal container will be able to encapsulate
        # it (unless it is already in a temporal container of the same level). The concept is explained more in the
        # Containers section.
        self.temporal_level = 0

        self.outputs = []

    def _make_arg_list(self, args, arg_names):
        # len(args) == len(arg_names)
        arg_list = []
        for i, arg in enumerate(args):
            if has_graphdata(arg):
                arg_list.append([arg_names[i], get_graphdata(arg)])
            elif hasattr(arg, '__iter__'):
                arg_list.append([arg_names[i], [get_graphdata(obj) for obj in arg if has_graphdata(obj)]])
            else:
                arg_list.append([arg_names[i]])
        return arg_list

    def get_tracked_args(self):
        """Return a list of all recorded positional and keyword arguments that are wrapped in `GraphData`.

        This is used to build the DAG, collecting all `GraphData` inputs so that their ancestors can be iterated over
        and added to the graph.

        Returns:
            (list): All positional and keyword argument values that are tracked in `GraphData`.
        """
        tracked_args = []
        for arg_list in [self.args, self.kwargs]:
            tracked_args.extend([arg[1] for arg in arg_list if len(arg) > 1 and not isinstance(arg[1], list)])
            for arg in arg_list:
                if len(arg) > 1 and isinstance(arg[1], list):
                    tracked_args.extend([arg_item for arg_item in arg[1] if arg_item is not None])
        return tracked_args


# ======================================================================================================================
# Graph data.
# -----------
# A `GraphData` object records a single immutable function input or output in the computation graph. `GraphData` can
# be used as if they were their wrapped object.
# ======================================================================================================================

class GraphData:
    """A record of a tracked function input or output."""
    def __init__(self, obj, props_to_surface=None, creator_op=None, creator_pos=-1):
        """Constructor. Stores the properties of the tracked object which should be visualized in the graph.

        `GraphData` is a "dumb" container, simply recording internally an object which was input or output to a
        `GraphOp` or tracked via `track_data()`. `obj` should be immutable; if it changes, then the graph will be
        rendered incorrectly.

        Args:
            obj (object): The immutable object wrapped by the `GraphData`.
            props_to_surface (dict or None): A dict whose keys are user-selected names and whose values are the names
                of attributes of the wrapped Python object. The value of the named attribute will be shown under the
                user-selected name when the `GraphData` is inspected in the client. See
                `GraphData.surface_prop_in_client()` for more info and `OpGenerator.__call__()` for an example of usage.
            creator_op (GraphOp): The `GraphOp` which created the wrapped object.
            creator_pos (int): The position of the object in the `creator_op`'s output tuple.
        """
        self.obj = obj
        self.creator_op = creator_op
        self.creator_pos = creator_pos
        self.props_to_surface = dict()
        if props_to_surface is not None:
            for name_in_client, attr_name in props_to_surface.items():
                self.surface_prop_in_client(name_in_client, attr_name)

    def surface_prop_in_client(self, name_in_client, attr_name):
        """Add a new property to the `GraphData`'s visualization in the client.

        The client by default does not show all attributes of the wrapped object; this is helpful for objects like
        `torch.Variable`, which have many unnecessary fields. These fields also do not have names that are useful for
        the client to see. Instead, the `GraphData` object maintains a dictionary mapping descriptive property names
        to names of the wrapped object's attributes. When the `GraphData` is visualized, only these attribute values
        are shown, and under the user-selected name.

        Args:
            name_in_client (str): The property name, as will be shown in the client.
            attr_name (str or None): The name of the wrapped Python object's attribute, whose value will be shown
                associated with `name_in_client`. A value of `None` will associate the wrapped object itself with
                `name_in_client`, rather than a single one of its attributes.
        """
        self.props_to_surface[name_in_client] = attr_name

    def get_visualization_dict(self):
        """Returns a mapping of user-selected names to attributes of the wrapped Python object.

        The dict values will not be string names of the attributes, but rather the values of the attributes themselves.

        Returns:
            (dict): A dict of the form {user-selected name: value to visualize}.
        """
        return {
            key: getattr(self.obj, attr) if attr is not None else self.obj
            for key, attr in self.props_to_surface.items()
        }


# ======================================================================================================================
# Graph containers.
# -----------------
# A `GraphContainer` groups together `GraphOp` and other `GraphContainer` objects to provide abstraction in
# visualization. Containers are either abstractive, which collapses a subnetwork into a "black box" function,
# or temporal, which conceals everything outside of it, showing only the single "flow" it contains. See viz.md for
# information about the difference between the two, as well as the concept of "temporal subdivision" and "temporal
# level".
# ======================================================================================================================

# TODO handle paralellism
class GraphContainer(Nestable):
    """Represents a collection of grouped `GraphOp` and `GraphContainer` objects."""
    def __init__(self, contents, name='null', temporal_level=0, temporal_step=-1):
        """Constructor.
        Args:
            contents (set): A list of `GraphOp` and `GraphContainer` objects grouped by the instance,
                or None if no items are grouped yet.
            temporal_level (int): The temporal "height" of the container. Abstractive containers have temporal level
                0, and temporal containers have level > 0. New temporal containers can encapsulate only containers of
                level `temporal_level-1`.
        """
        super(GraphContainer, self).__init__()
        self.contents = contents
        self.temporal_level = temporal_level
        self.height = max([getattr(c, 'height', 0) + 1 for c in self.contents])
        self.temporal_step = temporal_step
        self.fn_name = name


def _build_abstractive_container(outputs, inputs, container_name):
    """Creates an abstractive container enveloping all ops between the container's proposed outputs and inputs.

    Builds the DAG backwards from the outputs in a breadth-first search, stopping beams at any encountered
    `GraphData` which is in the set of inputs. Whenever a new `GraphOp` is found during search, its outermost parent
    is added to the new container (see the definition of "outermost parent" in `Nestable.get_outermost_parent()`. After
    search terminates, all of the new container's contents have their `container` field updated to point to the new
    container.

    Args:
        outputs (list): `GraphData` objects which serve as the outputs of the new abstractive container.
        inputs (set): `GraphData` objects which serve as the inputs of the new abstractive container.
        container_name (str): The name that should be shown when the container is collapsed in the client.
    """
    contents = set()
    ops_checked = set()
    data_to_check = deque(outputs)
    while len(data_to_check) > 0:
        data = data_to_check.popleft()
        if data in inputs:
            continue
        creator_op = data.creator_op
        if creator_op is not None and creator_op not in ops_checked:
            outermost_parent = creator_op.get_outermost_parent()
            contents.add(outermost_parent)
            data_to_check.extend(creator_op.get_tracked_args())
            ops_checked.add(creator_op)
    container = GraphContainer(contents, name=container_name)
    # Update newly contained objects after iterating through the graph to prevent the new container from containing
    # itself (consider ops op1, op2, which share container c1. We are adding a new container c2. If we update the
    # container of op1 during iteration, then c1's container becomes c2. When we check op2, its outermost container
    # is now c2, meaning c2's container would become c2).
    for item in container.contents:
        item.container = container


# ======================================================================================================================
# Public API.
# -----------------
# The canonical ways of creating `GraphData`, `GraphOp`, and `GraphContainer` instances. Instances should not be
# directly created, and should be created only using the following methods.
# ======================================================================================================================

def track_data(obj, props_to_surface, creator_op=None, creator_pos=-1):
    """Creates a `GraphData` object which records the properties of `obj` and allows it to be shown in the graph.

    Any object which is not the output of a tracked function (see `OpGenerator`) is not, by default, shown in the
    computation graph. Leaf data nodes can be added to the graph via `track_data()`.

    Args:
        obj (object): Python object to add to the graph.
        props_to_surface (dict or None): A dict whose keys are user-selected names and whose values are the names
            of attributes of the wrapped Python object. The value of the named attribute will be shown under the
            user-selected name when the `GraphData` is inspected in the client. See
            `GraphData.surface_prop_in_client()` for more info and `OpGenerator.__call__()` for an example of usage.
        creator_op (GraphOp or None): The `GraphOp` object recording the function call which outputted `obj`. If
            `obj` is a leaf, `creator_op = None`.

    Returns:
        (GraphData): A wrapped version of the object, which can be used as if it were unwrapped.
    """
    try:
        obj.xnode_graphdata = GraphData(obj, props_to_surface, creator_op, creator_pos)
    except AttributeError:
        # Built-in types, like `dict` and `list`, cannot have new properties added to them unless subclassed
        class WrapperClass(type(obj)):
            pass
        obj = WrapperClass(obj)
        obj.xnode_graphdata = GraphData(obj, props_to_surface, creator_op, creator_pos)
    return obj


def has_graphdata(obj):
    """Returns `True` if an object has an associated `GraphData` object.

    Objects which are tracked in the computation graph via a call to `track_data()` have `GraphData` objects associated
    with them to contain information about the op which created the object and how it should be rendered.

    Args:
        obj (object): An object which might be tracked (and, thus, have a `GraphData` object).

    Returns:

    """
    try:
        return hasattr(obj, 'xnode_graphdata')
    except NotImplementedError:
        # PyTorch variables throw a NotImplementedError if you do a `getattr` on a non-existent attribute,
        # which breaks hasattr.
        return False


def get_graphdata(obj):
    """Returns the `GraphData` object associated with an object.

    This function assumes that `has_graphdata(obj) == True`.

    Args:
        obj (object): An object which has been tracked

    Returns:

    """
    return getattr(obj, 'xnode_graphdata')


class OpGenerator(wrapt.ObjectProxy):
    """Wraps a callable object, creating a `GraphOp` whenever called and wrapping each output in a `GraphData`."""
    def __init__(self, obj, output_props_to_surface=None):
        """Constructor.

        Args:
            obj (callable): A callable object, such as a function, whose executions should be recorded in the
                computation graph.
            output_props_to_surface (list or None): A dict determining what properties of each `GraphData`
                created by the callable should be surfaced in visualization. The i-th entry of `output_props_to_surface`
                is passed to the i-th output of the callable. For example:
                `
                a, b = Foo(), Foo()  # Foo is any arbitrary class
                a.prop1 = 10
                b.prop2 = 5

                def f(x, y):
                  new_x = Foo()
                  new_x.prop1 += 10
                  new_y = Foo()
                  new_y.prop2 -= 5
                  return new_x, new_y

                c = OpGenerator(f, output_props_to_surface=[{'Arbitrary Value': 'prop1'}, {'Another Value': 'prop2'}])
                x, y = c(a, b)  # x and y are GraphData wrappers around Foo instances
                `
                Now, when `x` is visualized and inspected in the client, it shows "Arbitrary Value": 10. When `y` is
                visualized and inspected, it shows "Another Value": 0. For functions whose outputs have different
                types under different conditions, or may output different numbers of values,
                setting `output_props_to_surface` to `None` will leave all `GraphData` outputs without any fields
                visualized. Fields can then be set after creation with `GraphData.surface_prop_in_client()`.
        """
        super(OpGenerator, self).__init__(obj)
        # wrapt requires all wrapper properties to start with _self_
        self._self_output_props = output_props_to_surface

    def __call__(self, *args, **kwargs):
        """Executes the wrapped function and creates a `GraphOp` recording the execution.

        A single `GraphOp` is created to record the function's execution. The wrapped function should not in its
        internals create any additional `GraphOp` objects; functions which create more `GraphOp` objects should be
        wrapped with `AbstractContainerGenerator` instead.

        Args:
            args (tuple): A sequence of positional arguments to pass to the wrapped function.
            kwargs (dict): Keyword arguments to pass to the wrapped function.

        Returns:
            The outputs of the wrapped function, each wrapped in a `GraphData` instance.
        """
        # TODO: should we dive into sequences and look for nested GraphData? If not, torch.cat doesn't really work
        # (since it takes as argument a list), but could be made to work with a wrapper that takes in any number of
        # inputs and collects them into a list before calling cat. If we do, how do we know when to stop diving,
        # and what do we do about output_props?
        ret = self.__wrapped__(*args, **kwargs)
        multiple_returns = isinstance(ret, tuple) and len(ret) > 1
        op = GraphOp(self.__wrapped__, args, kwargs)
        # TODO handle passthrough returns
        if multiple_returns:
            ret_graphdata = tuple([track_data(r,
                                     self._self_output_props[i] if self._self_output_props is not None else None,
                                     creator_op=op,
                                     creator_pos=i)
                          for i, r in enumerate(ret)])
        else:
            ret_graphdata = track_data(ret,
                              self._self_output_props[0] if self._self_output_props is not None else None,
                              creator_op=op,
                              creator_pos=0)
        op.outputs = ret_graphdata if isinstance(ret_graphdata, tuple) else (ret_graphdata, )
        return ret_graphdata


class AbstractContainerGenerator(wrapt.ObjectProxy):
    """Wraps a callable object, causing all `GraphOp` and `GraphContainer` objects created during its execution to be
    contained in a new abstractive `GraphContainer`."""
    def __call__(self, *args, **kwargs):
        """Executes the wrapped function and nests every `GraphOp` and `GraphContainer` it creates inside a new
        `GraphContainer`.

        `AbstractContainerGenerator` expects that its wrapped function contains (perhaps further nested within other
        functions) some `OpGenerator` functions that will produce `GraphOp` objects when called. Further, it expects
        that at least some of the inputs and outputs of the wrapped function have `GraphData` objects.
        These objects are then used to identify every `GraphOp` that exists between the inputs and the outputs in the
        DAG, and wraps their outermost parents in a new abstractive container.

        Args:
            args (tuple): Positional arguments to the wrapped function.
            kwargs (dict): Keyword arguments to the wrapped function.

        Returns:
            The unchanged output of the wrapped function.
        """
        inputs = set(get_graphdata(obj) for obj in args + tuple(kwargs.values()) if has_graphdata(obj))
        ret = self.__wrapped__(*args, **kwargs)
        output_graphdata = [get_graphdata(obj) for obj in ret if has_graphdata(obj)] \
            if isinstance(ret, tuple) and len(ret) > 1 else [get_graphdata(ret)]
        _build_abstractive_container(output_graphdata, inputs, self.get_fn_name())
        return ret

    def get_fn_name(self):
        try:
            return self.__wrapped__.__name__
        except AttributeError:
            return self.__wrapped__.__class__.__name__


def tick(output, temporal_level):
    """Create a temporal container extending backwards from output and encapsulating any outer-level op or container
    with `temporal_level`.

    Every op and container has a temporal level; abstractive containers and ops have level 0, and temporal containers
    have level > 0. Temporal containers of level n contain only items of temporal level n-1. If
    `output`'s outermost parent (see `Nestable.get_outermost_parent()` for definition) is of temporal level
    lower than  `temporal_level`, then `_tick(output, temporal_level-1)` is called before execution. This ensures that
    the concept of "temporal subdivision" is maintained, and that temporal containers only contain items at exactly one
    level below them.

    Args:
        output (GraphData): A `GraphData` from which to build the new temporal container.
        temporal_level (int): The temporal level of ops and containers that should be encapsulated by the new temporal
            container.
    """
    output = get_graphdata(output)
    if output.creator_op is not None \
            and output.creator_op.get_outermost_parent().temporal_level < temporal_level:
        tick(output, temporal_level - 1)

    contents = set()
    ops_checked = set()
    ops_to_check = deque([output.creator_op])
    max_temporal_step = -1

    while len(ops_to_check) > 0:
        op = ops_to_check.popleft()
        if op not in ops_checked and op is not None:
            ops_checked.add(op)
            highest = op.get_outermost_parent()
            assert highest.temporal_level >= temporal_level
            if highest.temporal_level == temporal_level:
                contents.add(highest)
                ops_to_check.extend([arg.creator_op for arg in op.get_tracked_args()])
            else:
                max_temporal_step = max(max_temporal_step, highest.temporal_step)
    container = GraphContainer(contents, temporal_level=temporal_level+1, temporal_step=max_temporal_step+1)
    # Update container fields of new container's contents after iteration to prevent premature exiting (consider ops
    # op1, op2, which are in temporal container c1 of level 1. We now are adding a temporal container c2 of height 2. If
    # we update the container of c1 during iteration, then when iteration reaches op2, its outermost parent would be
    # c2. Thus,it would not be enqueued and its ancestors would not be added to c2).
    for item in container.contents:
        item.container = container