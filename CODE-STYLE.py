"""Short description of file/module.

This module lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis semper velit ante, et aliquet leo aliquet non.
nec sem magna. Phasellus hendrerit neque dui, at lobortis ipsum fermentum non. Aenean egestas velit felis, vel
interdum neque volutpat at. Nulla facilisi. Pellentesque porttitor, erat id congue sollicitudin, arcu nulla porttitor
eros, vel porta velit purus a magna. Class aptent taciti sociosqu ad litora torquent per conubia stra,  per inceptos
himenaeos. Nam pretium ipsum ex, ac aliquet lectus ultrices a.

The following is an example of writing things `in code`, which is displayed with monospace font.

Example:
    The following is an example of formatted code::
    
        print "Here is where you put an example."
        print "This code is already formatted due to 'example' header.

Notes:
    Pellentesque congue interdum mauris sed pretium. Pellentesque mollis accumsan arcu, ut pellentesque nisl convlis
    sed. Maecenas orci dolor, tempor id tristique sed, vestibulum ut risus. Maecenas eu mi molestie, hendrerit velit
    quis, consequat lorem. Phasellus eget risus vel sapien suscipit fermentum nec quis augue.

Todo:
    (Name) Curabitur es ipsum, tincidunt malesuada porta vitae, placerat congue velit.
"""


# ======================================================================================================================
# Section summary for block of code.
# ----------------------------------
# Add optional notes here.  Pellentesque congue interdum mauris sed pretium. Pellentesque mollis accumsan arcu,
# ut pellentesque nisl convallis sed.
#
# Maecenas orci dolor, tempor id tristique sed, vestibulum ut risus. Maecenas eu mi molestie, hendrerit velit
# quis, consequat lorem. Phasellus eget risus vel sapien suscipit fermentum nec quis augue.
# ======================================================================================================================


# Subsection praesent a ex ligula.
# --------------------------------


# ======================================================================================================================


def func1(arg1, arg2=None):
    """Short description of function.

    Longer description of function. Class aptent taciti sociosqu ad litora torquent per conubia stra, per inceptos
    himenaeos. Nam pretium ipsum ex, ac aliquet lectus ultrices a.

    Args:
        arg1 (int): Description of argument 1.
        arg2 (mod.ExampleClass, optional): Description of argument 2. Defaults to ``None``.

    Return:
        (bool): Description of return value 1.
    """
    # This is how to write longer style comments within method bodies.
    # Docstrings are used for interface comments and hash symbols are used for
    # for implementation comments.
    return True  # Capitalize first word.


def _func2():
    """Simple one-liner private function."""
    pass


class ClassName(object):
    """Short description of class.

    Longer description of class. Class aptent taciti sociosqu ad litora torquent per conubia stra,  per inceptos
    himenaeos. Nam pretium ipsum ex, ac aliquet lectus ultrices a.

    Attributes:
        attr1 (int): Description of attribute 1.
    """

    def __init__(self, arg1):
        """Constructor method, required.

        Args:
            arg1 (type): Description of argument 1.
        """
        super(ClassName, self).__init__()
        pass
        

"""In docstrings, can include richer reStructuredText (reST) directives.

To write inline code, simply us special brackets, like ``hello_world()``.

To write display code::

    int i = 1
    if i > 0:
        print('Hello world.')

To write display code with output::

    >>> int i = 1
    >>> if i > 0:
    >>>     print('Hello world.')
    'Hello world.'

To cross-reference, have many different options:

    - attributes as :attr:`name`
    - classes as :class:`mod.ExampleClass` (display link ``mod.ExampleClass``) or as :class:`~mod.ExampleClass` (
    display link ``ExampleClass``)
    - functions as :func:`mod.func1` (not associated with object)
    - methods as :meth:`mod.ExampleClass.func1` (associated with object)

To write math, can create inline :math:`\mathbf{h} = \sigma (\mathbf{W_{hx} x} + \mathbf{b_{hx}})`, or display

.. math::
    \mathbf{h} = \sigma (\mathbf{W_{hx} x} + \mathbf{b_{hx}})

To add special comment boxes:

.. seealso:: Link to other module :class:`mod.ExampleClass`.
.. warning:: Do not run code, lest your computer will catch on fire.
.. note:: This is a note. Let what it says be noted.
"""