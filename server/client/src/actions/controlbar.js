import { updateNamespaceAction } from './program.js';
import { resetVarListAction } from './varlist.js';

function executeCommandAndFetchNewNamespace(commandName) {
    return fetch(`/api/debug/${commandName}`);
}

export function executeDebuggerCommand(commandName) {
    return (dispatch, getState) => {
        dispatch(updateNamespaceAction('running', null, {}));
        dispatch(resetVarListAction({}));
        // TODO clear the canvas
        executeCommandAndFetchNewNamespace(commandName).then(
            resp => resp.json().then(
                ({context, namespace}) => {
                    dispatch(updateNamespaceAction('waiting', context, namespace));
                    dispatch(resetVarListAction(namespace));
                }
            )
        ).catch(
            error => {
                dispatch(updateNamespaceAction('disconnected', null, {}))
            }
        )
    };
}
