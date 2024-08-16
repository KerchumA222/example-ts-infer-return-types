import * as ts from "typescript";
import { isModuleBoundary } from "./utils";
import { inferReturnTypeTransformerFactory } from "./inferReturnTypeTransformer";

const fileName = process.argv[2] || "sample.ts";
const program = ts.createProgram([fileName], ts.getDefaultCompilerOptions()); // or just build from tsconfig.json
const typeChecker = program.getTypeChecker();

// pass in isModuleBoundary to only transform module boundaries
// pass in isFunctionLike to transform all functions, arrow functions, function expressions, and methods
// this should be done via configuration
const shouldProcessNode = isModuleBoundary;

// Main entry point
program
  .getSourceFiles()
  .filter((sourceFile) => !sourceFile.fileName.includes("node_modules"))
  .forEach((sourceFile) => {
    // Apply the transformer
    const result = ts.transform(sourceFile, [
      inferReturnTypeTransformerFactory(typeChecker, shouldProcessNode),
    ]);
    const transformedSourceFile = result.transformed[0];

    // Print the transformed code
    console.log(
      ts
        .createPrinter()
        .printNode(ts.EmitHint.Unspecified, transformedSourceFile, sourceFile),
    );
  });
