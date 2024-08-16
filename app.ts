import { Project, ts } from "ts-morph";
import { getReturnTypeNode, isModuleBoundary } from "./utils";

const project = new Project({
  compilerOptions: {
    target: ts.ScriptTarget.ESNext,
  },
});

const sourceFile = project.addSourceFileAtPath("sample.ts");
const typeChecker = project.getTypeChecker();

// pass in isModuleBoundary to only transform module boundaries
// pass in isFunctionLike to transform all functions, arrow functions, function expressions, and methods
// this should be done via configuration
const shouldProcessNode = isModuleBoundary;

sourceFile.transform((traversal) => {
  const node = traversal.visitChildren();
  if (!shouldProcessNode(node)) {
    return node;
  }

  if (ts.isVariableDeclaration(node) && node.initializer) {
    // get the inferred type from the typechecker
    const returnType = getReturnTypeNode(
      node.initializer,
      typeChecker.compilerObject,
    );
    if (!returnType) {
      // type could not be inferred?
      return node;
    }
    let initializer: ts.Expression | undefined = undefined;
    if (ts.isFunctionExpression(node.initializer)) {
      initializer = traversal.factory.updateFunctionExpression(
        node.initializer,
        node.initializer.modifiers,
        node.initializer.asteriskToken,
        node.initializer.name,
        node.initializer.typeParameters,
        node.initializer.parameters,
        returnType,
        node.initializer.body,
      );
    } else if (ts.isArrowFunction(node.initializer)) {
      initializer = traversal.factory.updateArrowFunction(
        node.initializer,
        node.initializer.modifiers,
        node.initializer.typeParameters,
        node.initializer.parameters,
        returnType,
        node.initializer.equalsGreaterThanToken,
        node.initializer.body,
      );
    }
    if (initializer) {
      return traversal.factory.updateVariableDeclaration(
        node,
        node.name,
        node.exclamationToken,
        node.type,
        initializer,
      );
    }
  }

  // get the inferred type from the typechecker
  const returnType = getReturnTypeNode(node, typeChecker.compilerObject);
  if (!returnType) {
    // type could not be inferred?
    return node;
  }

  if (ts.isFunctionDeclaration(node)) {
    return traversal.factory.updateFunctionDeclaration(
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
    return traversal.factory.updateFunctionExpression(
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
    return traversal.factory.updateArrowFunction(
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
    return traversal.factory.updateMethodDeclaration(
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
  return node;
});

await sourceFile.save();
