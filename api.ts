import * as ts from 'typescript';

function getReturnTypeAsString(node: ts.Node, checker: ts.TypeChecker): string {
    const type = checker.getTypeAtLocation(node);
    const returnTypes = type.getCallSignatures().map((signature) => {
        return checker.typeToString(signature.getReturnType());
    });
    return returnTypes.join(' | ');
}

function getReturnTypesForExportedMembers(fileName: string) {
    const program = ts.createProgram([fileName], ts.getDefaultCompilerOptions());
    const checker = program.getTypeChecker();
    const sourceFile = program.getSourceFile(fileName);
    
    if (sourceFile) {
        const sourceFileSymbol = checker.getSymbolAtLocation(sourceFile)!;

        checker.getExportsOfModule(sourceFileSymbol).forEach((exportSymbol) => {
            const exportType: ts.Type = checker.getTypeOfSymbolAtLocation(
                exportSymbol,
                exportSymbol.declarations![0],
            );
            const callSignatures = exportType.getCallSignatures(); //only function and arrow function have call signatures so this ignores variables, classes, and objects
            callSignatures.forEach((signature) => {
                console.log(exportSymbol.getName(), checker.typeToString(signature.getReturnType())); // string
            });
        });
    }
}

function getReturnTypesForAllFunctionLikes(fileName: string) {
    const program = ts.createProgram([fileName], ts.getDefaultCompilerOptions());
    const checker = program.getTypeChecker();
    const sourceFile = program.getSourceFile(fileName);
    
    if (sourceFile) {
        const sourceFileSymbol = checker.getSymbolAtLocation(sourceFile)!;

        checker.getExportsOfModule(sourceFileSymbol).forEach((exportSymbol) => {
            const exportType: ts.Type = checker.getTypeOfSymbolAtLocation(
                exportSymbol,
                exportSymbol.declarations![0],
            );
            const callSignatures = exportType.getCallSignatures(); //only function and arrow function have call signatures so this ignores variables, classes, and objects
            callSignatures.forEach((signature) => {
                console.log(exportSymbol.getName(), checker.typeToString(signature.getReturnType())); // string
            });
        });
        sourceFile.forEachChild((node) => {         
            // function
            if (ts.isFunctionLike(node)) {
                console.log("Function name:", node.name?.getText(), "Return type:", getReturnTypeAsString(node, checker));
            }
            // arrow function
            if (ts.isVariableStatement(node)) {
                node.declarationList.declarations.forEach((declaration: ts.VariableDeclaration) => {
                    if (ts.isVariableDeclaration(declaration)) {
                        const returnType = getReturnTypeAsString(declaration, checker);
                        if (returnType) {
                            console.log("Variable name:", declaration.name.getText(), "Type:", returnType);
                        }
                    }
                });
            }
        });
    }
}

console.log("All function likes:");
getReturnTypesForAllFunctionLikes('./sample.ts');
console.log("All exported members:");
getReturnTypesForExportedMembers('./sample.ts');