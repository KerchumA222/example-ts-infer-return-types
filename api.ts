import * as ts from "typescript";

function getReturnTypeAsString(node: ts.Node, checker: ts.TypeChecker): string {
  const type = checker.getTypeAtLocation(node);
  const returnTypes = type.getCallSignatures().map((signature) => {
    return checker.typeToString(signature.getReturnType());
  });
  return returnTypes.join(" | ");
}

function getReturnTypeNode(node: ts.Node, checker: ts.TypeChecker): ts.TypeNode | undefined {
  const functionLikeType = checker.getTypeAtLocation(node);
  const returnType = functionLikeType.getCallSignatures()[0].getReturnType();

  return checker.typeToTypeNode(returnType, node, undefined);
}

/*
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
        const printer = ts.createPrinter();
        sourceFile.forEachChild((node) => {         
            // function
            if (ts.isFunctionLike(node)) {
                node.forEachChild(child => console.log(child.getText(), '/n'));
                //console.log(printer.printNode(ts.EmitHint.Unspecified, node, sourceFile));

                // console.log("Function name:", node.name?.getText(), "Return type:", getReturnTypeAsString(node, checker));
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
}*/

//console.log("All function likes:");
//getReturnTypesForAllFunctionLikes('./sample.ts');
//console.log("All exported members:");
//getReturnTypesForExportedMembers('./sample.ts');
function transformationFactory(checker: ts.TypeChecker): ts.TransformerFactory<ts.Node> {
  return function transformReturnTypeToExplicit(
    context: ts.TransformationContext,
  ): ts.Transformer<ts.Node> {
    return (sourceFile: ts.Node) => {
      function visitor(node: ts.Node): ts.Node {
        if (ts.isFunctionDeclaration(node)) {
          // get the inferred type from the typechecker
          const returnType = getReturnTypeNode(node, checker);
          if (!returnType) { // type could not be inferred?
            return node;
          }

          return ts.factory.updateFunctionDeclaration(
            node,
            node.modifiers,
            node.asteriskToken,
            node.name,
            node.typeParameters,
            node.parameters,
            returnType,
            node.body,
          );
        }

        return ts.visitEachChild(node, visitor, context);
      }

      return ts.visitNode(sourceFile, visitor);
    };
  };
}

const fileName = "sample.ts";
const program = ts.createProgram([fileName], ts.getDefaultCompilerOptions());
const typeChecker = program.getTypeChecker();
const sourceFile = program.getSourceFile(fileName);

if (!sourceFile) {
    throw "Can't open source file";
}
// Apply the transformer
const result = ts.transform(sourceFile, [transformationFactory(typeChecker)]);
const transformedSourceFile = result.transformed[0];

// Print the transformed code
console.log(ts.createPrinter().printNode(ts.EmitHint.Unspecified, transformedSourceFile, sourceFile));
