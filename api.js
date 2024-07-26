"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts = require("typescript");
function getCompilerOptions() {
    var compilerOptions = {
        target: ts.ScriptTarget.ESNext,
        module: ts.ModuleKind.ESNext,
        strict: false,
        esModuleInterop: true,
    };
    return compilerOptions;
}
// function getDiagnostics(fileName: string): readonly ts.Diagnostic[] {
//     const program = ts.createProgram([fileName], getCompilerOptions());
//     console.debug(program);
//     const diagnostics = ts.getPreEmitDiagnostics(program);
//     return diagnostics;
// }
// function formatDiagnostics(diagnostics: readonly ts.Diagnostic[]): string {
//     return ts.formatDiagnosticsWithColorAndContext(diagnostics, {
//         getCurrentDirectory: ts.sys.getCurrentDirectory,
//         getNewLine: () => ts.sys.newLine,
//         getCanonicalFileName: ts.sys.useCaseSensitiveFileNames ? (fileName) => fileName : (fileName) => fileName.toLowerCase()
//     });
// }
// Usage example
var fileName = './sample.ts';
// const diagnostics = getDiagnostics(fileName);
// const formattedDiagnostics = formatDiagnostics(diagnostics);
// console.log(formattedDiagnostics);
console.debug(getCompilerOptions());
