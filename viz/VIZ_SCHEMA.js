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