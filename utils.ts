import { ts, TypeFlags } from "ts-morph";

export function getReturnTypeNode(
  node: ts.Node,
  checker: ts.TypeChecker,
): ts.TypeNode | undefined {
  const functionLikeType = checker.getTypeAtLocation(node);
  const returnType = functionLikeType.getCallSignatures()[0].getReturnType();
  if (returnType.flags & TypeFlags.Any) {
    return;
  }

  return checker.typeToTypeNode(returnType, node, undefined);
}

export const nodeIsExported = (node: ts.Declaration): boolean => {
  return !!(ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export);
};

/**
 * This function determines if a node is a module boundary
 * A module boundary is a callable that is exported from a module or is a public method of a class
 */
export const isModuleBoundary = (node: ts.Node): boolean => {
  // directly exported function
  if (ts.isFunctionDeclaration(node)) {
    return nodeIsExported(node);
  }
  // arrow function or function expression as an exported variable
  if (ts.isVariableDeclaration(node)) {
    if (
      node.initializer &&
      (ts.isFunctionExpression(node.initializer) ||
        ts.isArrowFunction(node.initializer))
    ) {
      return nodeIsExported(node);
    }
  }
  // public method (including static methods) of a class
  if (ts.isMethodDeclaration(node)) {
    const modifierFlags = ts.getCombinedModifierFlags(node)
    return !(modifierFlags & (ts.ModifierFlags.Private | ts.ModifierFlags.Protected));
  }

  // something else
  return false;
};

// apply to all functions, arrow functions, function expressions, and methods
export const isFunctionLike = (node: ts.Node): boolean => {
  return (
    ts.isFunctionDeclaration(node) ||
    ts.isFunctionExpression(node) ||
    ts.isArrowFunction(node) ||
    ts.isMethodDeclaration(node)
  );
};
