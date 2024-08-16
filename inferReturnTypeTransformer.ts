import ts from 'typescript';
import { getReturnTypeNode } from './utils';

export function inferReturnTypeTransformerFactory(
  checker: ts.TypeChecker,
  shouldProcessNode: (node: ts.Node) => boolean = () => false,
): ts.TransformerFactory<ts.Node> {
  return function transformReturnTypeToExplicit(
    context: ts.TransformationContext,
  ): ts.Transformer<ts.Node> {
    return (sourceFile: ts.Node) => {
      function visitor(node: ts.Node): ts.Node {
        if (!shouldProcessNode(node)) {
          return ts.visitEachChild(node, visitor, context);
        }
        // TODO: make these branches into separate transformers

        if (ts.isVariableDeclaration(node) && node.initializer) {
          // get the inferred type from the typechecker
          const returnType = getReturnTypeNode(node.initializer, checker);
          if (!returnType) {
            // type could not be inferred?
            return ts.visitEachChild(node, visitor, context);
          }
          let initializer: ts.Expression | undefined = undefined;
          if (ts.isFunctionExpression(node.initializer)) {
            initializer = ts.factory.updateFunctionExpression(
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
            initializer = ts.factory.updateArrowFunction(
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
            return ts.factory.updateVariableDeclaration(node, node.name, node.exclamationToken, node.type, initializer)
          }
        }

        // get the inferred type from the typechecker
        const returnType = getReturnTypeNode(node, checker);
        if (!returnType) {
          // type could not be inferred?
          return ts.visitEachChild(node, visitor, context);
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