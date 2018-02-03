import json


class VisualizationEngine:
    """An object which statefully translates symbols corresponding to Python objects into a schema for visualization.

    The VisualizationEngine is separated from the VisualDebugger so that all visualization tasks can be managed here.
    Depending on the ultimate implementation, VisualizationEngine instances may persist between VisualDebugger
    instances, making this decomposition useful not only for abstraction purposes.
    """
    def __init__(self):
        """Initializes any internal state needed by the VisualizationEngine.

        Behavior here is subject to how the VisualizationEngine is ultimately implemented and used; it may be that many
        VisualizationEngine instances are created in a single run, or that only one is created and reused throughout
        the run.
        """
        self.id_to_obj = dict()
        self.id_to_schema = dict()

    def generate_namespace(self, namespace):
        vizschema = dict()
        for key, value in namespace.items():
            self.cache[id(key)] = key
            vizschema.append(id(key))
        for key, value in namespace


    def generate(self, symbol_id):
        """Builds the VizSchema dictionary of a symbol with given ID for visualization purposes.

        The dictionary is a Python object, which needs to be transformed to a string via to_json if sent over a
        socket to a server. generate is decomposed from to_json so that the VizSchema can be used within the Python
        environment as well.
        Args:
            symbol_id (str): A unique identifier for the symbol.

        Returns:
            dict: A VizSchema representation of the symbol.
        """
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
