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
        "name": "myset",  // optional
        "data": null  // optional: starts null if is non-primitive, nonexistent if string, existent if primitive
    }
}

// [ID] = ""
// [TYPE] = number (int, float), string, bool
//        = list, tuple, set, dict, class, module, object, function
//        = tensor, 

{
	"type": "list",
	"data": {
		"viz": {
			"contents": [1, 2, 3],
			"length": 3,
		},
		"attributes": {
			// every non function attribute
		}
	}
}

// attributes: how much to send? dir vs. only those that have changed

{
	"type": "tensor"
	"data": {
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

{
	"type": "variable"
	"data": {
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

/// will 2*x + 1 be shown in comp graph?

{
	"type": "op"
	"data": {
		"viz": {
			"contents": [[1,2,3],[2,3,4]],
			"size": [1,2,3],
			"type": "float32", // "float16", "float32", "float64", "uint8", "int8", "int16", "int32", "int64"
		},
		"attributes": None
		

	}
}