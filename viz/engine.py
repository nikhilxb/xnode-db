import json
from collections import defaultdict
import inspect


class VisualizationType:
    """Encapsulates the visualization-relevant properties of a specific object type (string, number, etc).

    The `VisualizationEngine` can output schemas for many different types of objects, such as dictionaries, lists,
    strings, and so on. Each of these schemas is different; the information needed to render a dict in the client will
    not be of the same format as that needed to render a list. Thus, the `VisualizationEngine`, when generating
    object schemas, needs to be able to identify the object's type and create the proper schema for it. This could in
    theory be done with long switch statements, where an object of unknown type is passed from conditional to
    conditional until its type is identified, at which point some type-specific behavior occurs. This is ugly,
    and becomes problematic when multiple functions (such as get_symbol_shell and get_symbol_data) must all make the
    same type checks. Rather than have to copy switch statements around and make things difficult when we want to add
    new recognizable types, we instead create a single `VisualizationType` object for each type understood by the
    engine. Each `VisualizationType` object is associated with one type, and can determine if other objects belong to
    that type as well as produce their data objects for visualization. For example, let us say
        `BOOL = VisualizationType(type_name='bool', test_fn=lambda x: type(x) is bool, is_primitive=True)`
    Now, when the engine is asked to produce a string describing a new object `obj`, it can call `BOOL.test_fn(obj)`.
    If it returns True, then `obj` is a boolean, and the engine can produce its string with `BOOL.str_fn(obj)`.
    Otherwise, it can repeat the process with other `VisualizationType` objects until a matching type is found.
    """
    def __init__(self, type_name, test_fn, data_fn=None, str_fn=str, is_primitive=False):
        """Stores the given parameters as fields.

        Fields should not be changed after instantiation, as only one `VisualizationType` should exist for each object
        type and multiple symbols will reference the same `VisualizationType`.
        Args:
            type_name (str): The string name of the object type, as understood by the client.
            test_fn (fn): A function of the form (obj) => boo, which indicates whether obj belongs to the type
                governed by this `VisualizationType` instance.
            data_fn (fn): A function of the form (`VisualizationEngine`, obj) => (object, set), which takes an engine
                (typically passed from within an engine as `self`) and an object and returns the data object for obj
                and the set of all symbol IDs referred to in that data object. obj should be of the type represented
                by the `VisualizationType`. Can be None for primitives.
            str_fn (fn): A function of the form (obj) => str, which translates the given object to a string that can
                be rendered in the client. obj should be of the type represented by the `VisualizationType`.
            is_primitive (bool): Whether the data type represented by the `VisualizationType` is primitive.
        """
        self.type_name = type_name
        self.test_fn = test_fn
        self.data_fn = data_fn
        self.str_fn = str_fn
        self.is_primitive = is_primitive
        assert is_primitive or self.data_fn is not None, 'Non-primitive types must define a data_fn.'


class VisualizationEngine:
    """This object translates Python variable symbols into visualization schema.

    The `VisualizationEngine` encapsulates the visualization tasks needed by the `VisualDebugger`.
    It is stateful, so it may implement caching in the future to improve performance.
    """

    # ==================================================================================================================
    # Information cached about each symbol.
    # ----------------------------------
    # The `VisualizationEngine` cache is of the form symbol_id -> {key -> value}, where the keys are exactly those
    # below and the value types are dependent on the key; those values are described below.
    # ==================================================================================================================

    # Key associated with a symbol's shell representation, a dictionary of the form:
    # {
    #   'type': The type of the symbol; this matches the `VisualizationType.type_name` field and must be understood by
    #           the client. Any change to the type_names of the `VisualizationType` objects must be reflected in the
    #           client.
    #   'str': A string representation of the symbol that can be showed in the client, particularly in the variable list
    #           and when the object has not been expanded.
    #   'name': A string name, possibly null, for the object, to be shown in the client.
    #   'data': Either the value of the object (for primitives) or None (for non-primitives). When the client seeks
    #           to "fill" a schema shell, they will have to request that data from the debugger first.
    # }
    SHELL = 'shell'

    # Key associated with a symbol's data object. Undefined until get_symbol_data has cached a value. The value
    # after caching depends on the type of the symbol, but generally contains all potentially useful information
    # about the symbol. This value is returned when a client seeks to "fill" a shell.
    DATA = 'data'

    # Key associated with a set of strings of the form "REF_PREFIX" + ID, where ID is a symbol ID. This set contains
    # the symbol IDs all of the objects referenced in the symbol's data object, and is defined in get_symbol_data
    # along with the data object.
    REFS = 'refs'

    # Key associated with a reference to the symbol's Python object.
    OBJ = 'obj'

    # Key associated with the `VisualizationType` instance corresponding to the symbol's type. There exists only one
    # `VisualizationType` object for each data type, so two different symbols of the same type reference the same
    # `VisualizationType`.
    TYPE_INFO = 'type-info'

    # ==================================================================================================================
    # Type-specific information.
    # ----------------------------------
    # The engine must act differently when visualizing objects of different types, including generating different
    # string representations and different data objects. Rather than litter the code with switch statements,
    # we retain information about each type in `VisualizationType` objects, initialized here.
    # ==================================================================================================================

    # Data generation functions for each data type.
    # --------------------------------
    # A symbol's data object is generated differently based on the symbol's type. We define those generation functions
    # here; each takes as input a `VisualizationEngine` and the symbol's Python object and returns the data object
    # and a set of string IDs of those symbols referenced in the data object.

    # TODO formalize these schemas, and potentially send all information
    def _genereate_data_dict(self, obj):
        """Data generation function for dictionaries."""
        data = dict()
        refs = set()
        for key, value in obj.items():
            data[self._datafy_obj(key, refs)] = self._datafy_obj(value, refs)
        return data, refs

    def _generate_data_sequence(self, obj):
        """Data generation function for sequential objects (list, tuple, set)."""
        data = list()
        refs = set()
        for item in obj:
            data.append(self._datafy_obj(item, refs))
        return data, refs

    def _generate_data_fn(self, obj):
        """Data generation function for functions."""
        data_unformatted = dict()
        data_unformatted['varnames'] = obj.__code__.co_varnames
        data_unformatted['argcount'] = obj.__code__.co_argcount
        data_unformatted['constants'] = obj.__code__.co_consts
        data_unformatted['filename'] = obj.__code__.co_filename

        data = dict()
        refs = set()
        for key, value in data_unformatted:
            data[self._datafy_obj(key, refs)] = self._datafy_obj(value, refs)
        return data, refs

    def _generate_data_module(self, obj):
        """Data generation function for modules."""
        data = dict()
        refs = set()
        for key in dir(obj):
            data[self._datafy_obj(key, refs)] = self._datafy_obj(getattr(obj, key), refs)
        return data, refs

    def _generate_data_class(self, obj):
        """Data generation function for classes."""
        data = dict()
        refs = set()
        for key in dir(obj):
            data[self._datafy_obj(key, refs)] = self._datafy_obj(getattr(obj, key), refs)
        return data, refs

    def _generate_data_instance(self, obj):
        """Data generation function for object instances which do not fall into other categories."""
        data = dict()
        refs = set()
        for key in dir(obj):
            data[self._datafy_obj(key, refs)] = self._datafy_obj(getattr(obj, key), refs)
        return data, refs

    # `VisualizationType` object constants.
    # --------------------------------

    NUMBER = VisualizationType('number', test_fn=lambda obj: type(obj) is int or type(obj) is float, is_primitive=True)
    STRING = VisualizationType('string', test_fn=lambda obj: type(obj) is str, is_primitive=True)
    BOOL = VisualizationType('bool', test_fn=lambda obj: type(obj) is bool, is_primitive=True)
    DICT = VisualizationType('dict', test_fn=lambda obj: type(obj) is dict, data_fn=_genereate_data_dict)
    LIST = VisualizationType('list', test_fn=lambda obj: type(obj) is list, data_fn=_generate_data_sequence)
    SET = VisualizationType('set', test_fn=lambda obj: type(obj) is set, data_fn=_generate_data_sequence)
    TUPLE = VisualizationType('tuple', test_fn=lambda obj: type(obj) is tuple, data_fn=_generate_data_sequence)
    FUNCTION = VisualizationType('fn', test_fn=inspect.isfunction, data_fn=_generate_data_fn)
    MODULE = VisualizationType('module', test_fn=inspect.ismodule, data_fn=_generate_data_module)
    CLASS = VisualizationType('class', test_fn=inspect.isclass, data_fn=_generate_data_class)
    INSTANCE = VisualizationType('obj', test_fn=lambda obj: True, data_fn=_generate_data_instance)

    # A list of all `VisualizationType` objects, in the order in which identity should be determined. Notably,
    # our catchall INSTANCE should be last, as it returns True on any object.
    TYPES = [NUMBER, STRING, BOOL, DICT, LIST, SET, TUPLE, FUNCTION, MODULE, CLASS, INSTANCE]

    # Utility functions for data generation.
    # --------------------------------

    def _is_primitive(self, obj):
        """Returns True if obj is of a primitive type, as defined by the engine's `VisualizationType` objects."""
        for type_info in self.TYPES:
            if type_info.test_fn(obj):
                return type_info.is_primitive
        return False

    # TODO we need to have a system for escaping strings, to ensure that strings starting with REF_PREFIX are not
    # considered references mistakenly.
    def _escape_str(self, s):
        """Reformats a string to eliminate ambiguity between strings and symbol ID references."""
        return s

    def _datafy_obj(self, obj, refs):
        """Escape and return an object if primitive, or otherwise convert the object to a symbol ID reference.

        When generating data objects for symbols, we need to replace object pointers with symbol IDs so clients can
        ask for more information about those objects if they choose. Data generation functions call _datafy_obj to
        make an object "safe" to include in the data object, which might be sent as JSON to the client. This means
        escaping strings so as not to confuse them with symbol ID references and converting Python object pointers to
        symbol IDs. Any new symbol IDs are associated with their respective Python objects in the `VisualizationEngine`
        cache.
        Args:
            obj (object): An object to make safe for inclusion in the data object.
            refs (set): A set of symbol reference strings to which encountered object references should be added.

        Returns:
            str or int or float: Serializable-safe representation of obj, possibly as a symbol ID reference.
        """
        if self._is_primitive(obj):
            return self._escape_str(obj) if self.STRING.test_fn(obj) else obj
        else:
            symbol_id = self._get_symbol_id(obj)
            self.cache[symbol_id][self.OBJ] = obj
            refs.add(symbol_id)
            return self.REF_PREFIX + symbol_id

    # ==================================================================================================================
    # Escaping constants.
    # ----------------------------------
    # The `VisualizationEngine` must communicate in a way the client can understand, but the Python -> JSON string
    # conversion introduces sources of potential confusion. It is not clear whether a string in a schema's 'data'
    # field is a symbol ID reference or an actual string object, and so some escaping must be done to remove ambiguity.
    # ==================================================================================================================

    # A prefix to be appended to strings in data objects which are symbol ID references.
    # TODO come up with a better system for this
    REF_PREFIX = '@id:'

    def __init__(self):
        """Initializes any internal state needed by the VisualizationEngine.

        State is maintained via a dictionary (a defaultdict for convenience) that maps symbol IDs to dictionaries
        containing information about those symbols. See above for more detail.
        """
        self.cache = defaultdict(dict)

    def _get_symbol_id(self, obj):
        """Returns the symbol ID (a string unique for the object's lifetime) of a given object.

        Care must be taken when objects are allowed to die and the engine's state is not accordingly updated,
        as new objects can assume the IDs of destroyed ones.
        Args:
            obj (object): A Python object to be identified.

        Returns:
            (str): symbol ID.
        """
        return str(id(obj))

    def reset_cache(self):
        """Clear the cache completely, resetting the engine to its starting state."""
        self.cache.clear()

    def get_namespace_shells(self, namespace):
        """Get shells for all objects defined in the given namespace dict.

        The cache is updated to associate the objects in the given namespace with their symbol IDs.

        This function should generally be used when the state of the runtime has changed. Future implementations may
        retain information from step to step, but currently the cache is wiped when this function is called to
        prevent accidental ID collisions between destroyed objects and new objects with the same ID.
        Args:
            namespace (dict): A mapping of string names to Python objects.

        Returns:
            (dict): A dictionary mapping symbol ID strings to shell dictionaries (see get_symbol_shell and above
                documentation for more info).
        """
        self.reset_cache()
        namespace_shells = dict()
        for obj_name, obj in namespace.items():
            symbol_id = self._get_symbol_id(obj)
            self.cache[symbol_id][self.OBJ] = obj
            namespace_shells[symbol_id] = self.get_symbol_shell(symbol_id, name=obj_name)
        return namespace_shells

    def get_symbol_shell(self, symbol_id, name=None):
        """Builds the shell dictionary of a given symbol for visualization.

        The shell dictionary (described above) is used to store lightweight information about an object. Except for
        primitives, the contents of the object are not generally reflected in the shell representation (though some
        may be present in the 'str' field).

        The function assumes that symbol_id exists already within the cache (added via either a get_symbol_data call
        or a get_namespace_shells call) and that cache[symbol_id][OBJ] points to the symbol's associated Python
        object. If the shell has already been cached, it is simply returned; otherwise, this function will fill the
        cache[symbol_id][SHELL] field.

        The returned dictionary is a Python object, which needs to be transformed to a string via to_json if sent over a
        socket to a server. get_symbol_shell is decomposed from to_json so that the dict can be used within the
        Python environment as well.
        Args:
            symbol_id (str): A unique identifier for the symbol, as defined by self._get_symbol_id.
            name (str): An optional name for the symbol, to be displayed in the client.

        Returns:
            (dict): The symbol's shell dictionary.
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
                                                'data': symbol_obj if symbol_type_info.is_primitive else None,
                                              }
        return self.cache[symbol_id][self.SHELL]

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

    def get_symbol_data(self, symbol_id):
        """Returns the symbol data object for a particular symbol, as well as the shells of any referenced symbols.

        The data object encapsulates all potentially useful information about a symbol. For a dictionary, this would
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
            (dict): A dictionary mapping symbol IDs (particuarly, those found in the data object) to shells.
        """
        if self.SHELL not in self.cache[symbol_id]:
            raise KeyError('Attempted to load data for {} before shell loaded.'.format(symbol_id))
        if self.DATA not in self.cache[symbol_id]:
            self.cache[symbol_id][self.DATA], self.cache[symbol_id][self.REFS] = self._load_symbol_data(symbol_id)
        shells = dict()
        for ref in self.cache[symbol_id][self.REFS]:
            shells[ref] = self.get_symbol_shell(ref)
        return self.cache[symbol_id][self.DATA], shells

    def _load_symbol_data(self, symbol_id):
        """Builds the data object for a symbol.

        This function does not cache its output and will not check the cache before generating.
        Args:
            symbol_id (str): A string ID for the requested symbol, as defined by self._get_symbol_id.

        Returns:
            (object): The symbol's data object.
        """
        symbol_type_info = self._get_type_info(symbol_id)
        symbol_obj = self.cache[symbol_id][self.OBJ]
        return symbol_type_info.data_fn(self, symbol_obj)

    def to_json(self, obj):
        """Converts a visualization dictionary to its corresponding JSON string.

        obj can be any output of the engine's exposed calls -- in particular, it can be either a symbol's shell or a
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
