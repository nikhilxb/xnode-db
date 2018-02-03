import json
from collections import defaultdict


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
        self.cache = defaultdict()

    def generate_namespace_schemas(self, namespace):
        namespace_schemas = dict()
        for key, value in namespace.items():
            print(key, value)
            obj_id = id(value)
            self.cache[obj_id]['obj'] = value
            namespace_schemas[obj_id] = self.generate(obj_id, key)
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
            self.cache[symbol_id]['schema'] = {
                                                'type': self._type_str(symbol_id),
                                                'str': self._viz_str(symbol_id),
                                                'name': name,
                                                'data': None,
                                              }
        return self.cache[symbol_id]['schema']

    def _type_str(self, symbol_id):
        obj = self.cache[symbol_id]['obj']
        if type(obj) is int or type(obj) is float:
            return 'number'
        elif type(obj) is str:
            return 'str'
        elif type(obj) is dict:
            return 'dict'
        elif type(obj) is list:
            return 'list'
        elif type(obj) is set:
            return 'set'
        elif type()

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
