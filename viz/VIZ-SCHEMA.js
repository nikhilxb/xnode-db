/**
 * Visualization schema.
 *
 * If named, then can show in var list. Else:
 *     If primitive (id(x) == id(y) iff eval(x) == eval(y); e.g. number, string, bool), direct representation.
 *     If non-primitive (e.g. list, set, dict), indirect representation.
 */

{
    [ID]: {
        "type": [TYPE],
        "str": "86",
        "name": "myset",  // optional, else just exist in symbol table not var list or is in dropdown
        "data": null  // optional: starts null if is non-primitive, otherwise loaded by default if primitive
    }
}

// [ID] = "xnode$12345"
// [TYPE] = number (int, float), string, bool
//        = list, tuple, set, dict, class, module, object, function
//        = tensor, GraphData, GraphOp

// We separate "viewer" from "attributes" because the Python object might have a field with the same name as one of the keywords
// used by the data viewer in the client. For example, a subclass of list could define a value for a field "contents", causing
// a collision with the viewer-reserved keyword.

{
	"type": "list", // tuple, set
    "str": "List[3]",
	"data": {
		// Python-independent information needed to render visualization
		"viewer": {
			"contents": [1, 2, 3],
			"length": 3,
		},
		// Curated Python object attributes that might be seen or used by client but not used in viewer visualization
		"attributes": {
			// every non function attribute of the object
		}
	}
}


// CONSTRAINT: Since storing numbers directly, any subclass of, say, `int` will not display instance fields when loaded
// in-plae (outside of the namespace).
{
    "type": "number",
    "str": "3.14",
    "data": {
	    "viewer": {
	        "contents": 3.14,
	    },
	    "attributes": {
			// every non function attribute of the object
	    }
	}
}

{
    "type": "string",  // bool
    "str": "Hello world!"
    "data": {
    "viewer": {
        "contents": "Hello world!",
    },
    "attributes": {
		// every non function attribute of the object
    }
}

{
    "type": "dict",
    "str": "Dict[4]"
    "data": {
    "viewer": {
        "contents": {
        	"stringkey":"value",
        	"xnode$1234":[1, 2, 3], // any non-string key, must have indirection
    	},
    	"length": 2
    },
    "attributes": {
        // every non function attribute of the object
    }
}

{
    "type": "class",
    "str": "ClassName"
    "data": {
    "viewer": {
        "contents": {
        	"functions": {
        		"name": "xnode$1234fnobject",
        	},
        	"staticfields": {
        		"name": "xnode$1234"
        	}
    	},
    },
    "attributes": {
    	// ALL attributes, including functions
    }
}

{
    "type": "module",
    "str": "module<torch.autograd>"  // str of object
    "data": {
    "viewer": {
        "contents": {
            // every non function attribute of the object
    	},
    },
    "attributes": {
        // every non function attribute of the object
    }
}

{
    "type": "object",
    "str": "<class whatever>"  // str of object
    "data": {
    "viewer": {
        "contents": {
            // every attribute of the object that differs from its parent
    	},
    },
    "attributes": {
        // every non function attribute of the object
    }
}

{
    "type": "function",
    "str": "<fn function_name>"
    "data": {
    "viewer": {
        "args":["hi", "hi"],
        "kwargs":{"kwarg1": "xnode$1234"},
        "filename": "hihi.py",
        "lineno": 2,
    },
    "attributes": {
		// every non function attribute of the object
    }
}

// is tensor primitive? no
{
	"type": "tensor",
	"str": "Tensor[3,2,1](float32)"
	"data": {
		// Python-independent information needed to render visualization
		"viz": {
			"contents": [[1,2,3],[2,3,4]],
			"size": [1,2,3],
			"type": "float32", // "float16", "float32", "float64", "uint8", "int8", "int16", "int32", "int64"
		},
		"attributes": {
			// every non function attribute
		}
		

	}
}

// bound-to some pyton GraphData object
{
	"type": "graphdata",
	"data": {
		"viewer": {
			"creatorop": null, //reference to graphop symbol, or None if leaf,
			"creatorpos"
            "kvpairs": {
                // user-defined key-value pairs
            }
		},
		"attributes": {
			// every non function attribute of the GraphData object
		}
	}
}

{
	"type": "graphop"
	"data": {
		"viewer": {
            "function": "xnode$98750897202" // reference to function which performed the operation represented by graphop
			"args": [None, "xnode$02395897342"] // list of arguments to the op, containing only None or references to graphdata
			"argnames": ["arg1", "arg2"]
			"kwargs": {
				"dim": "xnode$3032099235" // keyword : graphdata ref pairs for each keyword argument input; assumed None for any keys not present
			},
			"container":"xnode$98750897202",
			"functionname": "funky_the_function",
			"outputs": ["xnode$23509321590"] // list of graphdata objects output by the op
		},
		"attributes": {
			// every non function attribute
		}
	}
}

{
	"type": "graphcontainer"
	"data": {
		"viewer": {
            "contents": ["xnode$98750", "xnode$97750"], // list of graphop.graphcontainer grouped by this container.
            "container": "xnode$3032099235",
            "temporalstep": 1,  // -1 for abstractive containers, >=0 for temporal
            "height": 5,
			"functionname": "funky_the_function",
		},
		"attributes": {
			// every non function attribute
		}
	}
}

