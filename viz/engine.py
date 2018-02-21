import json
from collections import defaultdict
import types
import inspect
from torch import _TensorBase
from viz.graphtracker import GraphData, GraphContainer, GraphOp, get_graphdata, has_graphdata


class VisualizationType:
    """Encapsulates the visualization-relevant properties of a specific object type.

    The `VisualizationEngine` outputs data schemas for different types of objects (string, number, dict, etc). Each of
    these schemas is different, as different objects need to send different data. Rather than constructing each schema
    according to some monolithic switch condition, each object's unique properties/functions are encapsulated in a
    `VisualizationType` object. For instance,

        `BOOL = VisualizationType(type_name='bool', test_fn=lambda x: type(x) is bool, is_primitive=True)`

    encapsulates the unique properties/functions for the `boolean` type. This construction ultimately allows objects of
    different types to be treated in a generic manner in code.
    """
    def __init__(self, type_name, test_fn, data_fn, str_fn=str, is_primitive=False):
        """Constructor. Fields should not be changed after instantiation, and only one instance of a `VisualizationType`
        should exist for each object type.

        Args:
            type_name (str): The string name of the object type, as understood by the client.
            test_fn (fn): A function (obj) => bool, which returns true if `obj` is of the type handled by this
                `VisualizationType` instance.
            data_fn (fn): A function (`VisualizationEngine`, obj) => (object, set), which takes an engine
                (typically passed from within an engine as `self`) and a symbol object and creates the data object.
                Assumed that `test_fn(obj) == True`.
            str_fn (fn): A function (obj) => str, which translates the given symbol object to a human-readable string.
                Assumed that `test_fn(obj) == True`.
            is_primitive (bool): True if this `VisualizationType` is primitive.
        """
        self.type_name = type_name
        self.test_fn = test_fn
        self.data_fn = data_fn
        self.str_fn = str_fn
        self.is_primitive = is_primitive
        assert is_primitive or self.data_fn is not None, 'Non-primitive types must define a data_fn.'


class VisualizationEngine:
    """Encapsulates the translation of Python variable symbols into visualization schema. It is stateful, so it may
    implement caching in the future to improve performance.
    """
    def __init__(self):
        """Constructor. Initializes symbol cache to store and efficient serve generated data schemas and references.
        See "Symbol cache keys" section for more details.
        """
        self.cache = defaultdict(dict)

    # ==================================================================================================================
    # Symbol cache.
    # -------------
    # The `VisualizationEngine` cache is of the form {symbol_id -> {key -> value}}. Each `symbol_id` is mapped to a dict
    # of stored information, the keys for which are defined below.
    # ==================================================================================================================

    # Key for a symbol's shell representation, which is a dict of the form:
    # {
    #   'type': The type of the symbol; this matches the `VisualizationType.type_name` field and must be understood by
    #           the client. Any change to the type_name must be reflected in the client.
    #   'str': A string representation of the symbol that can be showed in the client, particularly in the variable list
    #           and when the object has not been expanded.
    #   'name': A string name, possibly null, for the object, to be shown in the client.
    #   'data': Either the value of the object (for primitives) or None (for non-primitives). When the client seeks
    #           to "fill" a schema shell, they will have to request that data from the debugger first. See
    #           VIZ-SCHEMA.js for more info about what these data objects will look like.
    # }
    SHELL = 'shell'

    # Key for a symbol's data schema. Undefined (not in the dict) until `get_symbol_data` has populated it. This lazy
    # population prevents extraneous work of generating a symbol's data schema (often a highly nested structure) until
    # it is specifically requested.
    DATA = 'data'

    # Key for a `set` of IDs for all symbols referenced in this symbol's data schema. Each symbol ID is a string of the
    # form "{REF_PREFIX}{id}", where id is a unique number for the symbol. Undefined (not in the dict) until
    # `get_symbol_data` has populated it.
    REFS = 'refs'

    # Key for this symbol's Python object handle, so that the object can manipulated and indexed when requested.
    OBJ = 'obj'

    # Key for this symbol's `VisualizationType` instance. There exists only one `VisualizationType` for each type, so
    # two symbols of the same type reference the same `VisualizationType`.
    TYPE_INFO = 'type-info'

    # ==================================================================================================================
    # Schema generation.
    # ------------------
    # Create the `VisualizationType` objects to represent each symbol type and write the logic which translates
    # Python objects into visualization schema dicts.
    # ==================================================================================================================

    # Data generation functions.
    # --------------------------
    # These type-specific functions generate the `data, refs` for a symbol object.

    def _generate_data_primitive(self, obj):
        """Data generation function for primitives."""
        refs = set()
        return {
            self.VIEWER_KEY: {
                'contents': self._sanitize_for_data_object(obj, refs),
            },
            self.ATTRIBUTES_KEY: self._get_data_object_attributes(obj, refs),
        }, refs

    def _generate_data_tensor(self, obj):
        """Data generation function for tensors."""
        refs = set()
        return {
            self.VIEWER_KEY: {
                # This is deliberately not datafied to prevent the lists from being turned into references.
                'contents': obj.cpu().numpy().tolist(),
                'type': list(obj.size()),
                'size': self._sanitize_for_data_object(self.TENSOR_TYPES[obj.type()], refs)
            },
            self.ATTRIBUTES_KEY: self._get_data_object_attributes(obj, refs)
        }, refs

    def _generate_data_graphdata(self, obj):
        """Data generation function for graph data nodes."""
        refs = set()
        # We consider both `GraphData` instances and objects which have associated `GraphData` instances to be
        # graphdata for schema purposes, so we need to figure out which one `obj` is
        try:
            graphdata_obj = get_graphdata(obj)
        except AttributeError:
            graphdata_obj = obj
            obj = graphdata_obj.obj
        print(type(obj), type(graphdata_obj))
        return {
            self.VIEWER_KEY: {
                'creatorop': self._sanitize_for_data_object(graphdata_obj.creator_op, refs),
                'creatorpos': self._sanitize_for_data_object(graphdata_obj.creator_pos, refs),
                'kvpairs': {
                    self._sanitize_for_data_object(key, refs): self._sanitize_for_data_object(value, refs)
                    for key, value in graphdata_obj.get_visualization_dict().items()
                }
            },
            self.ATTRIBUTES_KEY: self._get_data_object_attributes(obj, refs)
        }, refs

    def _generate_data_graphcontainer(self, obj):
        """Data generation function for graph containers."""
        refs = set()
        return {
            self.VIEWER_KEY: {
                'contents': [self._sanitize_for_data_object(op, refs) for op in obj.contents],
                'container': self._sanitize_for_data_object(obj.container, refs),
                'temporal': self._sanitize_for_data_object(obj.is_temporal(), refs),
            },
            self.ATTRIBUTES_KEY: self._get_data_object_attributes(obj, refs)
        }, refs

    def _generate_data_graphop(self, obj):
        """Data generation function for graph op nodes."""
        refs = set()
        return {
            self.VIEWER_KEY: {
                'function': self._sanitize_for_data_object(obj.fn, refs),
                'args': [self._sanitize_for_data_object(arg, refs) for arg in obj.args],
                'kwargs': {
                    self._sanitize_for_data_object(kwarg, refs): self._sanitize_for_data_object(value, refs)
                    for kwarg, value in obj.kwargs.items()
                },
                'container': self._sanitize_for_data_object(obj.container, refs),
            },
            self.ATTRIBUTES_KEY: self._get_data_object_attributes(obj, refs)
        }, refs

    def _generate_data_dict(self, obj):
        """Data generation function for dicts."""
        contents = dict()
        refs = set()
        for key, value in obj.items():
            contents[self._sanitize_for_data_object(key, refs)] = self._sanitize_for_data_object(value, refs)
        return {
            self.VIEWER_KEY: {
                'contents': contents,
                'length': self._sanitize_for_data_object(len(obj), refs),
            },
            self.ATTRIBUTES_KEY: self._get_data_object_attributes(obj, refs),
        }, refs

    def _generate_data_sequence(self, obj):
        """Data generation function for sequential objects (list, tuple, set)."""
        contents = list()
        refs = set()
        for item in obj:
            contents.append(self._sanitize_for_data_object(item, refs))
        return {
            self.VIEWER_KEY: {
                'contents': contents,
                'length': self._sanitize_for_data_object(len(obj), refs),
            },
            self.ATTRIBUTES_KEY: self._get_data_object_attributes(obj, refs),
        }, refs

    def _generate_data_function(self, obj):
        """Data generation function for functions."""
        refs = set()
        viewer_data = {
            'filename': self._sanitize_for_data_object(obj.__code__.co_filename, refs),
            'lineno': self._sanitize_for_data_object(obj.__code__.co_firstlineno, refs),
        }
        argnames = obj.__code__.co_varnames
        default_arg_values = obj.__defaults__
        viewer_data['args'] = argnames[:-len(default_arg_values)]
        viewer_data['kwargs'] = {
            self._sanitize_for_data_object(argname, refs): self._sanitize_for_data_object(value, refs)
            for argname, value in zip(argnames[-len(default_arg_values)], default_arg_values)
            if default_arg_values is not None
            }
        return {
            self.VIEWER_KEY: viewer_data,
            self.ATTRIBUTES_KEY: self._get_data_object_attributes(obj, refs)
        }, refs

    def _generate_data_module(self, obj):
        """Data generation function for modules."""
        refs = set()
        contents = self._get_data_object_attributes(obj, refs, exclude_fns=False)
        return {
            self.VIEWER_KEY: {
                'contents': contents,
            },
            self.ATTRIBUTES_KEY: contents,
        }, refs

    def _generate_data_class(self, obj):
        """Data generation function for classes."""
        contents = {
            'staticfields': dict(),
            'functions': dict(),
        }
        refs = set()
        for attr in dir(obj):
            value = getattr(obj, attr)
            if self.FUNCTION.test_fn(value):
                contents['functions'][self._sanitize_for_data_object(attr, refs)] = \
                    self._sanitize_for_data_object(value, refs)
            else:
                contents['staticfields'][self._sanitize_for_data_object(attr, refs)] = \
                    self._sanitize_for_data_object(value, refs)
        return {
            self.VIEWER_KEY: {
                'contents': contents,
            },
            self.ATTRIBUTES_KEY: self._get_data_object_attributes(obj, refs, exclude_fns=False)
        }, refs

    def _generate_data_instance(self, obj):
        """Data generation function for object instances which do not fall into other categories."""
        instance_class = type(obj)
        instance_class_attrs = dir(instance_class)
        contents = dict()
        refs = set()
        for attr in dir(obj):
            value = getattr(obj, attr)
            try:
                if not self.FUNCTION.test_fn(value) and (
                                attr not in instance_class_attrs or getattr(instance_class, attr, None) != value):
                    contents[self._sanitize_for_data_object(attr, refs)] = \
                        self._sanitize_for_data_object(getattr(obj, attr), refs)
            except TypeError:
                contents[self._sanitize_for_data_object(attr, refs)] = \
                    self._sanitize_for_data_object(getattr(obj, attr), refs)
        return {
            self.VIEWER_KEY: {
                'contents': contents,
            },
            self.ATTRIBUTES_KEY: self._get_data_object_attributes(obj, refs)
        }, refs

    # `VisualizationType` objects.
    # ----------------------------
    NUMBER          = VisualizationType('number', test_fn=lambda obj: isinstance(obj, (float, int)),
                                        data_fn=_generate_data_primitive, is_primitive=True)
    STRING          = VisualizationType('string', test_fn=lambda obj: isinstance(obj, str),
                                        data_fn=_generate_data_primitive, is_primitive=True)
    BOOL            = VisualizationType('bool', test_fn=lambda obj: isinstance(obj, bool),
                                        data_fn=_generate_data_primitive, is_primitive=True)
    NONE            = VisualizationType('none', test_fn=lambda obj: obj is None,
                                        data_fn=_generate_data_primitive, is_primitive=True)
    TENSOR          = VisualizationType('tensor', test_fn=lambda obj: isinstance(obj, _TensorBase),
                                        str_fn=lambda obj: 'Tensor{}({})'.format(list(obj.size()),
                                                                                 VisualizationEngine.TENSOR_TYPES),
                                        data_fn=_generate_data_tensor)
    GRAPH_DATA      = VisualizationType('graphdata',
                                        test_fn=lambda obj: isinstance(obj, GraphData) or has_graphdata(obj),
                                        data_fn=_generate_data_graphdata)
    GRAPH_CONTAINER = VisualizationType('graphcontainer', test_fn=lambda obj: isinstance(obj, GraphContainer),
                                        data_fn=_generate_data_graphcontainer)
    GRAPH_OP        = VisualizationType('graphop', test_fn=lambda obj: isinstance(obj, GraphOp),
                                        str_fn=lambda obj: obj.name,
                                        data_fn=_generate_data_graphop)
    DICT            = VisualizationType('dict', test_fn=lambda obj: isinstance(obj, dict),
                                        str_fn=lambda obj: 'Dict[{}]'.format(len(obj)),
                                        data_fn=_generate_data_dict)
    LIST            = VisualizationType('list', test_fn=lambda obj: isinstance(obj, list),
                                        str_fn=lambda obj: 'List[{}]'.format(len(obj)),
                                        data_fn=_generate_data_sequence)
    SET             = VisualizationType('set', test_fn=lambda obj: isinstance(obj, set),
                                        str_fn=lambda obj: 'Set[{}]'.format(len(obj)),
                                        data_fn=_generate_data_sequence)
    TUPLE           = VisualizationType('tuple', test_fn=lambda obj: isinstance(obj, tuple),
                                        data_fn=_generate_data_sequence)
    FUNCTION        = VisualizationType('fn', test_fn=lambda obj: isinstance(obj, (types.FunctionType, types.MethodType,
                                                                                   types.BuiltinFunctionType,
                                                                                   types.BuiltinFunctionType,
                                                                                   type(all.__call__))),
                                        data_fn=_generate_data_function)
    MODULE          = VisualizationType('module', test_fn=inspect.ismodule,
                                        data_fn=_generate_data_module)
    CLASS           = VisualizationType('class', test_fn=inspect.isclass,
                                        data_fn=_generate_data_class)
    INSTANCE        = VisualizationType('obj', test_fn=lambda obj: True,
                                        data_fn=_generate_data_instance)

    # A list of all `VisualizationType` objects, in the order in which type should be tested. For example, the
    # INSTANCE should be last, as it returns `True` on any object and is the most general type. `BOOL` should be
    # before `NUMBER`, as bool is a subclass of number. `GRAPH_DATA` should be first, as it can wrap any type and
    # will be mistaken for those types.
    TYPES = [GRAPH_DATA, GRAPH_CONTAINER, GRAPH_OP, NONE, BOOL, NUMBER, STRING, TENSOR, DICT, LIST, SET, TUPLE, MODULE,
             FUNCTION, CLASS, INSTANCE]

    # Utility functions for data generation.
    # --------------------------------------

    def _get_data_object_attributes(self, obj, refs, exclude_fns=True):
        """Creates the dict containing a symbol's attributes to be sent in the symbol's data object.

        Each symbol is a single Python object, which has attributes beyond those used for visualization.
        For completeness, the debugger surfaces these key-value pairs of these attributes. Those
        pairs are generated here and escaped for safe communication with the client.

        Args:
            obj (object): Python object whose attributes dict should be generated.
            refs (set): A set to save new symbol ID reference strings created during generation.
            exclude_fns (bool): Exclude functions (both instance and static) if `True`.

        Returns:

        """
        attributes = dict()
        for attr in dir(obj):
            # There are some functions, like torch.Tensor.data, which exist just to throw errors. Testing these
            # fields will throw the errors. We should consume them and keep moving if so.
            try:
                if exclude_fns and self.FUNCTION.test_fn(getattr(obj, attr)):
                    continue
            except RuntimeError:
                continue
            attributes[self._sanitize_for_data_object(attr, refs)] = \
                self._sanitize_for_data_object(getattr(obj, attr), refs)
        return attributes

    def _is_primitive(self, obj):
        """Returns `True` if `obj` is primitive, as defined by the engine's `VisualizationType` objects."""
        for type_info in self.TYPES:
            if type_info.test_fn(obj):
                return type_info.is_primitive
        return False

    def _escape_str(self, s):
        # TODO: We need to have a system for escaping strings, to ensure that strings starting with REF_PREFIX are not
        # considered references mistakenly.
        """Reformats a string to eliminate ambiguity between strings and symbol ID references."""
        return s

    def _sanitize_for_data_object(self, key_or_value, refs):
        """Takes in a Python object and returns a version which is safe to use in a data object.

        _sanitize_for_data_object translates any key or value which needs to be in a symbol's data object into a JSON-safe version.
        Everything put into a symbol's data object must be data-fied first. For primitives, this does nothing but
        escapes strings so that they are not confused with symbol references. For non-primitive objects, a symbol ID
        reference string which refers to the input object is returned.

        Non-primitive objects are added to the cache, so that the returned symbol ID is associated with that object
        for future use.

        Args:
            key_or_value (object): An object to make safe for inclusion in the data object.
            refs (set): A set to save new symbol ID reference strings created during generation.

        Returns:
            (str or int or float): Serializable-safe representation of obj, possibly as a symbol ID reference.
        """
        if self._is_primitive(key_or_value):
            return self._escape_str(key_or_value) if self.STRING.test_fn(key_or_value) else key_or_value
        else:
            symbol_id = self._get_symbol_id(key_or_value)
            self.cache[symbol_id][self.OBJ] = key_or_value
            refs.add(symbol_id)
            return self.REF_PREFIX + symbol_id

    # Schema constants.
    # -----------------
    # Shared knowledge between the `VisualizationEngine`. These strings describe the fields in the data representation
    # that will be consumed by the front-end client. Any changes on either side will need to be reflected in the other.

    # Prefix to append to strings to identify them as symbol ID references. The `VisualizationEngine`
    # must communicate in a way the client can understand, but the Python -> JSON string conversion introduces
    # sources of potential confusion. It is not clear whether a string in a schema's 'data' field is a symbol ID
    # reference or an actual string object, so some escaping must be done to remove ambiguity.
    # TODO: Come up with a better system for this that can't be tricked
    REF_PREFIX = '@id:'

    # Key for a symbol data object's viewer dict (key-value pairs used by data viewers to render the object).
    # This dict follows the schema outlined in VIZ-SCHEMA.js.
    VIEWER_KEY = 'viewer'

    # Key for a symbol data object's attributes dict (key-value pairs to show in client's variable list. These
    # attributes often encompass more information than will be displayed in a viewer.
    # This dict follows the schema outlined in VIZ-SCHEMA.js.
    ATTRIBUTES_KEY = 'attributes'

    # We convey the data type of a tensor in a generic way to remove dependency on the tensor's implementation. We
    # need a way to look up the Python object's type to get the data type string the client will understand.
    TENSOR_TYPES = {
        'torch.HalfTensor': 'float16',
        'torch.FloatTensor': 'float32',
        'torch.DoubleTensor': 'float64',
        'torch.ByteTensor': 'uint8',
        'torch.CharTensor': 'int8',
        'torch.ShortTensor': 'int16',
        'torch.IntTensor': 'int32',
        'torch.LongTensor': 'int64',
        'torch.cuda.HalfTensor': 'float16',
        'torch.cuda.FloatTensor': 'float32',
        'torch.cuda.DoubleTensor': 'float64',
        'torch.cuda.ByteTensor': 'uint8',
        'torch.cuda.CharTensor': 'int8',
        'torch.cuda.ShortTensor': 'int16',
        'torch.cuda.IntTensor': 'int32',
        'torch.cuda.LongTensor': 'int64',
    }

    # ==================================================================================================================
    # Utility functions for public methods.
    # ==================================================================================================================

    def _get_symbol_id(self, obj):
        """Returns the symbol ID (a string unique for the object's lifetime) of a given object.

        As currently implemented, IDs are only guaranteed to be unique within a single snapshot of the namespace. At the
        next breakpoint, an object may have died and a new object reclaimed the ID (really implemented as just a base
        memory address).

        Args:
            obj (object): A Python object to be identified.

        Returns:
            (str): symbol ID.
        """
        return str(id(obj))

    def _get_type_info(self, symbol_id):
        """Returns the `VisualizationType` object associated with a particular symbol ID.

        If the symbol ID has not yet been associated with a `VisualizationType` object in the cache, the association is made
        here. Otherwise, the cached value is returned.
        Args:
            symbol_id (str): ID for a symbol, as defined by self._get_symbol_id.

        Returns:
            (VisualizationType): the `VisualizationType` object associated with the symbol's type.
        """
        if symbol_id not in self.cache:
            raise KeyError('Symbol id {} not found in cache.'.format(symbol_id))
        if self.TYPE_INFO not in self.cache[symbol_id]:
            obj = self.cache[symbol_id][self.OBJ]
            for type_info in self.TYPES:
                if type_info.test_fn(obj):
                    self.cache[symbol_id][self.TYPE_INFO] = type_info
                    break
        return self.cache[symbol_id][self.TYPE_INFO]

    def _load_symbol_data(self, symbol_id):
        """Builds the data object for a symbol.

        Used in `get_symbol_data` to build a symbol's data object if none was already cached. This function does not
        cache its output and will not check the cache before generating.

        Args:
            symbol_id (str): A string ID for the requested symbol, as defined by self._get_symbol_id.

        Returns:
            (object): The symbol's data object.
        """
        symbol_type_info = self._get_type_info(symbol_id)
        symbol_obj = self.cache[symbol_id][self.OBJ]
        return symbol_type_info.data_fn(self, symbol_obj)

    # ==================================================================================================================
    # Public functions.
    # -----------------
    # The functions which generate visualization-ready content about objects in the Python program. Typically,
    # a user will first acquire the "shell" of a symbol, its lightweight representation that encapsulates its basic
    # properties. If interested in visualizing the symbol fully, the user will then request its data, a dictionary
    # which exposes more data-heavy properties of the object needed for visualization, as well as debugging-useful
    # attributes of the Python object itself.
    # ==================================================================================================================

    def get_symbol_shell(self, symbol_id, name=None):
        """Builds the lightweight shell dict representation of a given symbol for visualization.

        The shell dict (described in "Symbol cache" above and in VIZ-SCHEMA.js) is used to store lightweight information
        about an object. Except for primitives, the data of the object are not generally reflected in the shell
        representation (though some may be present in the 'str' field).

        The function assumes that `symbol_id` exists already within the `cache` (added via `get_symbol_data()` or
        or `_get_namespace_shells()`) and that `cache[symbol_id][OBJ]` points to the symbol's associated Python
        object. If the shell has already been cached, it is simply returned; otherwise, this function will fill the
        cache[symbol_id][SHELL] field.

        The returned dict is a Python object, which needs conversion via `to_json()` for sending to a Javascript server.

        Args:
            symbol_id (str): A unique identifier for the symbol, as defined by `_get_symbol_id()`.
            name (str): Optional, a name for the symbol if defined, e.g. "myVar".

        Returns:
            (dict): The symbol's shell dict.
        """
        if symbol_id not in self.cache:
            raise KeyError('Symbol id {} not found in cache.'.format(symbol_id))
        if self.OBJ not in self.cache[symbol_id]:
            raise KeyError('No object reference found for symbol {}'.format(symbol_id))
        if self.SHELL not in self.cache[symbol_id]:
            symbol_type_info = self._get_type_info(symbol_id)
            symbol_obj = self.cache[symbol_id][self.OBJ]
            self.cache[symbol_id][self.SHELL] = {
                'type': symbol_type_info.type_name,
                'str': symbol_type_info.str_fn(symbol_obj),
                'name': name,
                'data': None,
            }
        return self.cache[symbol_id][self.SHELL]

    def get_namespace_shells(self, namespace):
        """Get lightweight shell representations for all objects defined in the given namespace dict.

        This function should generally be used when the state of the runtime has changed. The cache is updated to
        associate the objects in the given namespace with their symbol IDs. Future implementations may
        retain information from step to step, but currently the cache is wiped when this function is called to
        prevent accidental ID collisions between destroyed objects and new objects with the same ID.

        Args:
            namespace (dict): A mapping of string names to Python objects.

        Returns:
            (dict): A dict mapping symbol ID strings to shell dictionaries (see get_symbol_shell and above
                documentation for more info).
        """
        self.reset_cache()
        namespace_shells = dict()
        for obj_name, obj in namespace.items():
            symbol_id = self._get_symbol_id(obj)
            self.cache[symbol_id][self.OBJ] = obj
            namespace_shells[self.REF_PREFIX + symbol_id] = self.get_symbol_shell(symbol_id, name=obj_name)
            if self._is_primitive(obj):
                data_obj, new_shells = self.get_symbol_data(symbol_id)
                self.cache[symbol_id][self.SHELL]['data'] = data_obj
                namespace_shells.update(new_shells)
        return namespace_shells

    def get_symbol_data(self, symbol_id):
        """Returns the symbol data object for a particular symbol, as well as the shells of any referenced symbols.

        The data object encapsulates all potentially useful information about a symbol. For a dict, this would
        be its contents; for a class, this might be its static fields and functions. Regardless, the data object
        should be serializable, such that it can be sent via socket to clients, who can decide how to process the
        given information.

        This function requires a shell to have already been generated for symbol_id and stored at
        cache[symbol_id][SHELL]. It uses, and fills if empty, cache[symbol_id][DATA] and cache[symbol_id][REFS]. REFS
        stores all symbol IDs referenced by the data object, and the shells of each such symbol are returned along
        with the data object.

        Args:
            symbol_id (str): The requested symbol's ID, as defined by self._get_symbol_id.

        Returns:
            (object): A serializable representation of the given symbol.
            (dict): A dict mapping symbol IDs (particuarly, those found in the data object) to shells.
        """
        if self.SHELL not in self.cache[symbol_id]:
            raise KeyError('Attempted to load data for {} before shell loaded.'.format(symbol_id))
        if self.DATA not in self.cache[symbol_id]:
            self.cache[symbol_id][self.DATA], self.cache[symbol_id][self.REFS] = self._load_symbol_data(symbol_id)
        shells = dict()
        for ref in self.cache[symbol_id][self.REFS]:
            shells[self.REF_PREFIX + ref] = self.get_symbol_shell(ref)
        return self.cache[symbol_id][self.DATA], shells

    def to_json(self, obj):
        """Converts a visualization dict to its corresponding JSON string.

        `obj` can be any output of the engine's exposed calls -- in particular, it can be either a symbol's shell or a
        symbol's data object. There is currently no difference in behavior, but for some more complex types (like
        Tensors) it may be required.

        See comment on generate for explanation of decomposition. to_json is a method of `VisualizationEngine` so that
        it can exploit the internal cache for object referencing if need be, as well as understand the engine's
        string escaping protocol. It should be called on the same engine where the dict was created.

        Args:
            obj (object): A Python object output by the `VisualizationEngine`.

        Returns:
            (str): The JSON representation of the input object.
        """
        return json.dumps(obj)

    def reset_cache(self):
        """Clear the cache completely, resetting the engine to its starting state."""
        self.cache.clear()
