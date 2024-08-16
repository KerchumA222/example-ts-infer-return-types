#!/usr/bin/env bun

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { inferReturnTypeTransformerFactory } from "./transformer";
import { isFunctionLike, isModuleBoundary } from "./utils";
import { Project, ProjectOptions, ts } from "ts-morph";

const options = yargs(hideBin(process.argv))
  .usage("Usage: --tsconfig|-c <path to tsconfig> --files|-f <glob>")
  .option("c", {
    alias: "tsconfig",
    describe:
      "Relative path to the tsconfig.json",
    type: "string",
    demandOption: false,
  })
  .option("f", {
    alias: "files",
    describe: "Glob of files to add for processing",
    type: "string",
    demandOption: false,
  })
  .option("a", {
    alias: "allFunctions",
    describe:
      "Set this flag to attempt to add return types to all function-likes, not just module boundaries",
    type: "boolean",
    demandOption: false,
  })
  .default("a", false)
  .check((argv, options) => {
    if (options.files || options.tsconfig) {
        return true;
    } 
    throw new Error("No files to process!")
  })
  .argv as any;

const projectOptions: ProjectOptions = {};
if (options.tsconfig) {
  projectOptions.tsConfigFilePath = options.tsconfig;
}

const project = new Project({
  compilerOptions: {
    target: ts.ScriptTarget.ESNext,
  },
  ...projectOptions,
});

if (options.files) {
  project.addSourceFilesAtPaths(options.files);
}

const typeChecker = project.getTypeChecker();

// pass in isModuleBoundary to only transform module boundaries
// pass in isFunctionLike to transform all functions, arrow functions, function expressions, and methods
const shouldProcessNode = options.allFunctions
  ? isFunctionLike
  : isModuleBoundary;

project
  .getSourceFiles()
  .forEach((sourceFile) =>
    sourceFile.transform(
      inferReturnTypeTransformerFactory(typeChecker, shouldProcessNode),
    ),
  );

await project.save();
