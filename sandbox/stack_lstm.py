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
    def _bundle_hc(h, c):
        return [h, c]

    def forward(self, input_seq):
        hiddens = [gt.track_data(Variable(torch.randn(self.batch_size, dim)), {'obj': None}) for dim in self.dims[1:]]
        states = [gt.track_data(Variable(torch.randn(self.batch_size, dim)), {'obj': None}) for dim in self.dims[1:]]
        for token in input_seq:
            new_hiddens = []
            new_states = []
            x = token
            for i, l in enumerate(self.layers):
                h, c = l(x, self.bundle(hiddens[i], states[i]))
                new_hiddens.append(h)
                new_states.append(c)
                x = h
                # gt.tick(h, 0)
            hiddens = new_hiddens
            states = new_states
        print(x.xnode_graphdata.creator_op.args)
        return x
