import torch.nn as nn
import math
import viz.graphtracker as gt


class VGG(nn.Module):
    '''
    VGG model
    '''
    def __init__(self, features):
        super(VGG, self).__init__()
        self.features = features
        self.classifier = gt.AbstractContainerGenerator(nn.Sequential(
            gt.OpGenerator(nn.Dropout()),
            gt.OpGenerator(nn.Linear(512, 512)),
            gt.OpGenerator(nn.ReLU()),
            gt.OpGenerator(nn.Dropout()),
            gt.OpGenerator(nn.Linear(512, 512)),
            gt.OpGenerator(nn.ReLU(True)),
            gt.OpGenerator(nn.Linear(512, 10)),
        ))
         # Initialize weights
        for m in self.modules():
            if isinstance(m, nn.Conv2d):
                n = m.kernel_size[0] * m.kernel_size[1] * m.out_channels
                m.weight.data.normal_(0, math.sqrt(2. / n))
                m.bias.data.zero_()

    def forward(self, x):
        x = self.features(x)
        x = gt.OpGenerator(lambda x: x.view(x.size(0), -1))(x)
        x = self.classifier(x)
        return x


def make_layers(cfg, batch_norm=False):
    layers = []
    in_channels = 3
    for v in cfg:
        if v == 'M':
            layers += [gt.OpGenerator(nn.MaxPool2d(kernel_size=2, stride=2))]
        else:
            conv2d = gt.OpGenerator(nn.Conv2d(in_channels, v, kernel_size=3, padding=1))
            if batch_norm:
                layers += [conv2d, gt.OpGenerator(nn.BatchNorm2d(v)), gt.OpGenerator(nn.ReLU())]
            else:
                layers += [conv2d, gt.OpGenerator(nn.ReLU())]
            in_channels = v
    return nn.Sequential(*layers)


cfg = {
    'A': [64, 'M', 128, 'M', 256, 256, 'M', 512, 512, 'M', 512, 512, 'M'],
    'B': [64, 64, 'M', 128, 128, 'M', 256, 256, 'M', 512, 512, 'M', 512, 512, 'M'],
    'D': [64, 64, 'M', 128, 128, 'M', 256, 256, 256, 'M', 512, 512, 512, 'M', 512, 512, 512, 'M'],
    'E': [64, 64, 'M', 128, 128, 'M', 256, 256, 256, 256, 'M', 512, 512, 512, 512, 'M',
          512, 512, 512, 512, 'M'],
}


def vgg16():
    """VGG 16-layer model (configuration "D")"""
    return VGG(make_layers(cfg['D']))
