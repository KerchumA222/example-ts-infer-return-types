#!/usr/bin/env bun

import { FileSink } from "bun";
import { createPatch } from "diff";
import { Project, ProjectOptions, SourceFile, ts } from "ts-morph";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { inferReturnTypeTransformerFactory } from "./transformer";
import { isFunctionLike, isModuleBoundary } from "./utils";
import { unlinkSync } from "node:fs";

const options = yargs(hideBin(process.argv))
  .usage("Usage: [options]")
  .option("c", {
    alias: "tsconfig",
    describe:
      "Relative path to the tsconfig.json. Defaults to './tsconfig.json'",
    type: "string",
    requiresArg: true,
    default: "./tsconfig.json",
  })
  .option("f", {
    alias: "files",
    describe: "Glob of files to add for processing",
    type: "string",
    requiresArg: true,
  })
  .option("a", {
    alias: "allFunctions",
    describe:
      "Set this flag to attempt to add return types to all function-likes, not just module boundaries",
    type: "boolean",
    default: false,
  })
  .option("p", {
    alias: "createPatch",
    describe: `Set this flag to create a patch instead of modifying files directly. This is especially useful to combine with wiggle: 'wiggle -p -r transforms.patch' It may also help to specify the tsconfig.json with the '-c  tsconfig.json' flag so that the transformed TS uses the same formatting rules that your project uses.`,
    type: "boolean",
    default: false,
  })
  .check((argv) => {
    if (argv.files || argv.tsconfig) {
      return true;
    }
    throw new Error("No files to process!");
  }).argv as any;

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

let patchFile: FileSink | null = null;
if (options.createPatch) {
  const path = "./transforms.patch";
  unlinkSync(path);
  const fileHandle = Bun.file(path);
  patchFile = fileHandle.writer();
}

project.getSourceFiles(options.files ?? "**/*.ts").forEach((sourceFile) => {
  sourceFile.applyTextChanges;
  const prev = sourceFile.print();
  sourceFile.onModified(async (sender: SourceFile) => {
    if (patchFile) {
      const filePath = sender.getFilePath().toString();
      // diff prev to new
      const fileDiff = createPatch(
        filePath,
        prev,
        sender.print(),
        "original",
        "transformed",
        {
          ignoreWhitespace: true,
        },
      );

      patchFile.write(fileDiff);
    } else {
      await sourceFile.save();
    }
  });
  sourceFile.transform(
    inferReturnTypeTransformerFactory(typeChecker, shouldProcessNode),
  );
});
