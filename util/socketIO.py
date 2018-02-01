from socketIO_client import SocketIO


class SingleCallbackSocketIO(SocketIO):
    def __init__(self, *args, **kwargs):
        self.has_called_back = False
        super(SingleCallbackSocketIO, self).__init__(*args, **kwargs)

    def _on_event(self, data_parsed, namespace):
        self.has_called_back = True
        super(SingleCallbackSocketIO, self)._on_event(data_parsed, namespace)

    def _should_stop_waiting(self, for_namespace=False, for_callbacks=False, one_callback=False):
        if one_callback and self.has_called_back:
            self.has_called_back = False
            return True
        return super(SingleCallbackSocketIO, self)._should_stop_waiting()
