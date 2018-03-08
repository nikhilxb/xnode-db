import torch
import torch.nn as nn
import viz.graphtracker as gt
from torch.autograd import Variable


class StackLSTM(nn.Module):
    def __init__(self, batch_size, dims):
        super(StackLSTM, self).__init__()
        self.batch_size = batch_size
        self.dims = dims
        self.layers = [gt.OpGenerator(nn.LSTMCell(dims[0], dims[1]))]
        for i in range(1, len(dims) - 1):
            self.layers.append(gt.OpGenerator(nn.LSTMCell(dims[i], dims[i + 1])))
        for i, l in enumerate(self.layers):
            self.add_module('LSTM_{}'.format(i), l)
        self.bundle = gt.OpGenerator(self._bundle_hc)

    @staticmethod
    def _bundle_hc(h, c, dummy_h, dummy_c):
        return [h, c]

    def forward(self, input_seq):
        older_hiddens = []
        older_states = []
        hiddens = [gt.track_data(Variable(torch.randn(self.batch_size, dim)), {'obj': None}) for dim in self.dims[1:]]
        states = [gt.track_data(Variable(torch.randn(self.batch_size, dim)), {'obj': None}) for dim in self.dims[1:]]
        for token in input_seq:
            new_hiddens = []
            new_states = []
            x = token
            for i, l in enumerate(self.layers):
                if len(older_hiddens) > 0:
                    h, c = gt.AbstractContainerGenerator(lambda x, h, c, h2, c2: l(x, self.bundle(h, c, h2, c2,
                                                                                          )))(x, hiddens[i],
                                                                                              states[i],
                                                                                              older_hiddens[i],
                                                                                              older_states[i])
                else:
                    h, c = gt.AbstractContainerGenerator(lambda x, h, c: l(x, self.bundle(h, c, h, c)))(x, hiddens[i], states[i])
                new_hiddens.append(h)
                new_states.append(c)
                x = h
            gt.tick(x, 0)
            older_hiddens = hiddens
            older_states = states
            hiddens = new_hiddens
            states = new_states
        return x
