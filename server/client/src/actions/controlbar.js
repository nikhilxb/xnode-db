import { updateNamespaceAction } from './program.js';
import { resetVarListAction } from './varlist.js';

function executeCommandAndFetchNewNamespace(commandName) {
    return fetch(`/api/debug/${commandName}`);
}

export function executeDebuggerCommand(commandName) {
    return (dispatch, getState) => {
        dispatch(updateNamespaceAction('', {}));
        dispatch(resetVarListAction({}));
        // TODO clear the canvas
        executeCommandAndFetchNewNamespace(commandName).then(
            resp => resp.json().then(
                ({context, namespace}) => {
                    dispatch(updateNamespaceAction(context, namespace));
                    dispatch(resetVarListAction(namespace));
                },
                error => {
                    // TODO handle end-of-program here
                }
            )
        )
    };
}
