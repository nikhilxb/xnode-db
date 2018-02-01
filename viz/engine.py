import json


class VisualizationEngine:
    def __init__(self):
        self.cache = None  # some representation of previously generated objects

    def generate(self, symbol_id):
        """
        Builds the VizSchema dictionary of a symbol with given ID for visualization purposes.
        Args:
            symbol_id (str): The ID of the requested symbol.

        Returns:
            dict: A VizSchema representation of the symbol for visualization.
        """
        return {symbol_id: 'hi nikhil'}
        raise NotImplementedError

    def to_json(self, symbol_dict):
        """
        Converts a VizSchema dictionary of a symbol into a corresponding JSON string.
        Notes:
            to_json must be called from the same VisualizationEngine as was used to produce symbol_dict.

        Args:
            symbol_dict (dict): The VizSchema dictionary of a symbol.

        Returns:
            str: The JSON representation of the VizSchema dictionary.
        """
        return json.dumps(symbol_dict)
        raise NotImplementedError
