import * as ts from "typescript";

function getReturnTypeNode(
  node: ts.Node,
  checker: ts.TypeChecker,
): ts.TypeNode | undefined {
  const functionLikeType = checker.getTypeAtLocation(node);
  const returnType = functionLikeType.getCallSignatures()[0].getReturnType();

  return checker.typeToTypeNode(returnType, node, undefined);
}

function transformationFactory(
  checker: ts.TypeChecker,
  shouldProcess: (node: ts.Node) => boolean = () => false,
): ts.TransformerFactory<ts.Node> {
  return function transformReturnTypeToExplicit(
    context: ts.TransformationContext,
  ): ts.Transformer<ts.Node> {
    return (sourceFile: ts.Node) => {
      function visitor(node: ts.Node): ts.Node {
        if (!shouldProcess(node)) {
          return ts.visitEachChild(node, visitor, context);
        }

        // get the inferred type from the typechecker
        const returnType = getReturnTypeNode(node, checker);
        if (!returnType) {
          // type could not be inferred?
          return ts.visitEachChild(node, visitor, context);;
        }

        if (ts.isFunctionDeclaration(node)) {
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

        if (ts.isFunctionExpression(node)) {
          return ts.factory.updateFunctionExpression(
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

        if (ts.isArrowFunction(node)) {
          return ts.factory.updateArrowFunction(
            node,
            node.modifiers,
            node.typeParameters,
            node.parameters,
            returnType,
            node.equalsGreaterThanToken,
            node.body,
          );
        }

        if (ts.isMethodDeclaration(node)) {
          return ts.factory.updateMethodDeclaration(
            node,
            node.modifiers,
            node.asteriskToken,
            node.name,
            node.questionToken,
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

const fileName = "sample.ts"; //TODO: pass in as argument
const program = ts.createProgram([fileName], ts.getDefaultCompilerOptions()); // or just build from tsconfig.json
const typeChecker = program.getTypeChecker();
const nodeIsExported = (node: ts.Declaration) => {
  return !!(ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export);
}

/**
 * This function determines if a node is a module boundary
 * A module boundary is a callable that is exported from a module or is a public method of a class
 */
const isModuleBoundary = (node: ts.Node): boolean => {
  // directly exported function
  if (ts.isFunctionDeclaration(node)) {
    return nodeIsExported(node);
  }
  // arrow function or function expression as an exported variable
  if (ts.isFunctionExpression(node) || ts.isArrowFunction(node)) {
    if (ts.isVariableDeclaration(node.parent)) {
      return nodeIsExported(node.parent);
    }
  }
  // public method (including static methods) of a class
  if (ts.isMethodDeclaration(node)) {
    return !!(ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Public);
  }

  // something else
  return false;
};

// apply to all functions, arrow functions, function expressions, and methods
const isFunctionLike = (node: ts.Node): boolean => {
  return ts.isFunctionDeclaration(node)
    || ts.isFunctionExpression(node)
    || ts.isArrowFunction(node)
    || ts.isMethodDeclaration(node);
};

// Main entry point
program
  .getSourceFiles()
  .filter((sourceFile) => !sourceFile.fileName.includes("node_modules"))
  .forEach((sourceFile) => {
    // Apply the transformer
    const result = ts.transform(sourceFile, [
      transformationFactory(typeChecker, isModuleBoundary),
    ]);
    const transformedSourceFile = result.transformed[0];

    // Print the transformed code
    console.log(
      ts
        .createPrinter()
        .printNode(ts.EmitHint.Unspecified, transformedSourceFile, sourceFile),
    );
  });
