import * as vscode from "vscode";
export class SAPUIDefineCommand {
	static insertUIDefine() {
		const editor = vscode.window.activeTextEditor;

		if (editor) {
			const document = editor.document;
			const documentText: string = document.getText();

			const regexDeleteStart = /sap\.ui\.define\(\[(.|\n|\r)*\],.?function.?\(/.exec(documentText);
			const regexDeleteEnd = /sap\.ui\.define\(\[(.|\n|\r)*\],.?function.?\((.|\n|\r)*?\)/.exec(documentText);
			if (regexDeleteStart && regexDeleteStart.length > 0 && regexDeleteEnd && regexDeleteEnd.length > 0) {
				const deleteIndexStart: number = regexDeleteStart.length > 0 ? regexDeleteStart[0].length : 0;
				const deleteIndexEnd: number = regexDeleteEnd.length > 0 ? regexDeleteEnd[0].length -1 : 0;

				const defineBegin: string = "sap.ui.define([";
				const indexDefineBegin = documentText.indexOf(defineBegin) + defineBegin.length;
				const indexDefineEnd = documentText.indexOf("], function");
				const classModulesInDefine: string[] = documentText.substring(indexDefineBegin, indexDefineEnd).split(",");
				const classNamesInDefine: string[] = classModulesInDefine.map((moduleName: string) => {
					if (moduleName.indexOf("// eslint") > -1) {
						moduleName = moduleName.substring(0, moduleName.indexOf("// eslint"));
					}
					let parts: string[] = moduleName.split("/");
					parts = parts.map(part => part.trim());
					return parts[parts.length - 1];
				});
				let insertText: string = "\n" + classNamesInDefine.reduce((accumulator: string, className: string) => {
					accumulator += "	" + className.substring(0, className.length - 1) + ",\n";
					return accumulator;
				}, "");

				const regexResult = /sap\.ui\.define\(\[(.|\n|\r)*\],.?function.?\(/.exec(documentText);
				if (regexResult && insertText) {
					insertText = insertText.substring(0, insertText.length - 2);
					insertText += "\n";
					const insertIndexStart: number = regexResult.length > 0 ? regexResult[0].length : 0;

					editor.edit(editBuilder => {
						if (editor) {
							editBuilder.delete(new vscode.Range(document.positionAt(deleteIndexStart), document.positionAt(deleteIndexEnd)));
							editBuilder.insert(document.positionAt(insertIndexStart), insertText);
						}
					});
				}
			}
		}
	}
}