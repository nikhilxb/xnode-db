import torch
import torch.nn as nn
import viz.graphtracker as gt
from torch.autograd import Variable
import operator


class StackLSTM(nn.Module):
    def __init__(self, batch_size, dims):
        super(StackLSTM, self).__init__()
        self.batch_size = batch_size
        self.dims = dims
        self.layers = [gt.OpGenerator(nn.LSTMCell(dims[0], dims[1]))]
        for i in range(1, len(dims) - 1):
            self.layers.append(gt.OpGenerator(nn.LSTMCell(dims[i], dims[i + 1]),
                                              output_props_to_surface=[{'self': None, 'data': 'data', 'grad': 'grad'},
                                                                       {'self': None, 'data': 'data', 'grad': 'grad'}]))
        for i, l in enumerate(self.layers):
            self.add_module('LSTM_{}'.format(i), l)

    def forward(self, input_seq):
        older_hiddens = []
        older_states = []
        hiddens = [gt.track_data(Variable(torch.randn(self.batch_size, dim)), {'self': None}) for dim in self.dims[1:]]
        states = [gt.track_data(Variable(torch.randn(self.batch_size, dim)), {'self': None}) for dim in self.dims[1:]]
        for token in input_seq:
            new_hiddens = []
            new_states = []
            x = token
            for i, l in enumerate(self.layers):
                h, c = l(x, (hiddens[i], states[i]))
                new_hiddens.append(h)
                new_states.append(c)
                x = h
            gt.tick(x, 0)
            older_hiddens = hiddens
            older_states = states
            hiddens = new_hiddens
            states = new_states
        return x


class PseudoLogLSTM(nn.Module):
    def __init__(self, batch_size, dims):
        super(PseudoLogLSTM, self).__init__()
        self.batch_size = batch_size
        self.dims = dims
        self.layers = [gt.OpGenerator(nn.LSTMCell(dims[0], dims[1]))]
        for i in range(1, len(dims) - 1):
            self.layers.append(gt.OpGenerator(nn.LSTMCell(dims[i], dims[i + 1])))
        for i, l in enumerate(self.layers):
            self.add_module('LSTM_{}'.format(i), l)

    def cell_forward(self, l, x, i, hidden_in, state_in, older_hiddens, older_states):
        hidden_in = gt.OpGenerator(operator.__add__)(hidden_in, older_hiddens)
        state_in = gt.OpGenerator(operator.__add__)(state_in, older_states)
        return l(x, (hidden_in, state_in))

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
                h, c = gt.AbstractContainerGenerator(self.cell_forward)(l, x, i, hiddens[i], states[i],
                                                                        older_hiddens[i] if len(older_hiddens) > 0
                                                                        else 0,
                                                                        older_states[i] if len(older_states) > 0 else 0)
                new_hiddens.append(h)
                new_states.append(c)
                x = h
            gt.tick(x, 0)
            older_hiddens = hiddens
            older_states = states
            hiddens = new_hiddens
            states = new_states
        return x
