import { createSelector } from 'reselect';

const getSymbolId = (state, props) => state.varlist.varListItems[props.itemId].symbolId;

const getSymbolTable = (state) => state.symboltable;

export const makeGetVarListItemStr = () => {
    return createSelector(
        [ getSymbolId, getSymbolTable ],
        (symbolId, symbolTable) => {
            if (symbolId in symbolTable) {
                return symbolTable[symbolId].str;
            }
            else {
                return null;
            }
        }
    )
}
