import json
from collections import defaultdict
import inspect


class VisualizationEngine:
    """This object translates Python variable symbols into visualization schema.

    The `VisualizationEngine` encapsulates the visualization tasks needed by the `VisualDebugger`.
    It is stateful, so it may implement caching in the future to improve performance.
    """
    def __init__(self):
        """Initializes any internal state needed by the VisualizationEngine.

        Behavior here is subject to how the VisualizationEngine is ultimately implemented and used; it may be that many
        VisualizationEngine instances are created in a single run, or that only one is created and reused throughout
        the run.
        """
        self.cache = defaultdict(dict)

    def generate_namespace_schemas(self, namespace):
        namespace_schemas = dict()
        for key, value in namespace.items():
            print(key, value)
            obj_id = id(value)
            self.cache[obj_id]['obj'] = value
            namespace_schemas[obj_id] = self.generate_schema(obj_id, key)
        return namespace_schemas

    def generate_schema(self, symbol_id, name=None):
        """Builds the VizSchema dictionary of a symbol with given ID for visualization purposes.

        The dictionary is a Python object, which needs to be transformed to a string via to_json if sent over a
        socket to a server. generate is decomposed from to_json so that the VizSchema can be used within the Python
        environment as well.
        Args:
            symbol_id (int): A unique identifier for the symbol.

        Returns:
            dict: A VizSchema representation of the symbol.
        """
        if 'schema' not in self.cache[symbol_id]:
            symbol_type, symbol_str, is_primitive = self._type_str(symbol_id)
            self.cache[symbol_id]['schema'] = {
                                                'type': symbol_type,
                                                'str': symbol_str,
                                                'name': name,
                                                'data': self.cache[symbol_id]['obj'] if is_primitive else None,
                                              }
        return self.cache[symbol_id]['schema']

    def _type_str(self, symbol_id):
        obj = self.cache[symbol_id]['obj']
        if type(obj) is int or type(obj) is float:
            return 'number', str(obj), True
        elif type(obj) is str:
            return 'str', obj, True
        elif type(obj) is bool:
            return 'bool', str(obj), True
        elif type(obj) is dict:
            return 'dict', 'dict[{}]:{}'.format(len(obj), symbol_id), False
        elif type(obj) is list:
            return 'list', 'list[{}]:{}'.format(len(obj), symbol_id), False
        elif type(obj) is set:
            return 'set', 'set[{}]:{}'.format(len(obj), symbol_id), False
        elif type(obj) is tuple:
            return 'tuple', 'tuple[{}]:{}'.format(len(obj), symbol_id), False
        elif inspect.isfunction(obj):
            return 'fn', 'fn {}:{}'.format(obj.__name__, symbol_id), False
        elif inspect.ismodule(obj):
            return 'module', 'module {}:{}'.format(obj.__name__, symbol_id), False
        elif inspect.isclass(obj):
            return 'class', 'class {}:{}'.format(obj.__name__, symbol_id), False
        else:
            return 'obj', 'obj:{}'.format(symbol_id), False

    def load_symbol_data(self, symbol_id):
        raise NotImplementedError

    def to_json(self, symbol_dict):
        """Converts a VizSchema dictionary of a symbol into a corresponding JSON string.

        See comment on generate for explanation of decomposition. to_json a method of VisualizationEngine so that it
        can exploit the internal cache for object referencing, and must be called from the same VisualizationEngine
        where the dict was created.

        Args:
            symbol_dict (dict): The VizSchema dictionary of a symbol.

        Returns:
            str: The JSON representation of the VizSchema dictionary.
        """
        raise NotImplementedError
