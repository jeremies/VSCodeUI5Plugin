import * as vscode from "vscode";
import { SyntaxAnalyzer } from "../../CustomLibMetadata/SyntaxAnalyzer";
import { UIClassFactory } from "../../CustomLibMetadata/UI5Parser/UIClass/UIClassFactory";
import { UIMethod } from "../../CustomLibMetadata/UI5Parser/UIClass/AbstractUIClass";
import { CustomClassUIMethod } from "../../CustomLibMetadata/UI5Parser/UIClass/CustomUIClass";

export class JSCodeLensProvider {
	static getCodeLenses() : Promise<vscode.CodeLens[]> {
		return new Promise(resolve => {
			let codeLenses: vscode.CodeLens[] = [];
			setTimeout(() => {
				// SyntaxAnalyzer.setNewContentForCurrentUIClass();
				const currentClass = SyntaxAnalyzer.getClassNameOfTheCurrentDocument();
				if (currentClass) {
					const UIClass = UIClassFactory.getUIClass(currentClass);
					const rootMethods = UIClass.methods;
					if (UIClass.parentClassNameDotNotation) {
						const overridenMethods: UIMethod[] = [];
						const parentMethods = this.getAllParentMethods(UIClass.parentClassNameDotNotation);

						rootMethods.forEach(method => {
							const methodFromParent = parentMethods.find(methodFromparent => methodFromparent.name === method.name);
							if (methodFromParent) {
								overridenMethods.push(method);
							}
						});

						codeLenses = this.generateCodeLensesForMethods(overridenMethods);

						resolve(codeLenses);
					}
				}
			}, 200);
		});
	}

	private static getAllParentMethods(className: string) {
		const UIClass = UIClassFactory.getUIClass(className);
		let methods = UIClass.methods;

		if (UIClass.parentClassNameDotNotation) {
			methods = methods.concat(this.getAllParentMethods(UIClass.parentClassNameDotNotation));
		}

		return methods;
	}

	private static generateCodeLensesForMethods(methods: CustomClassUIMethod[]) {
		const codeLenses: vscode.CodeLens[] = [];
		const document = vscode.window.activeTextEditor?.document;

		if (document) {
			methods.forEach(method => {
				if (method.position) {
					const positionBegin = document.positionAt(method.position);
					const range = new vscode.Range(positionBegin, positionBegin);

					codeLenses.push(
						new vscode.CodeLens(range, {
							command: "",
							tooltip: "",
							arguments: [],
							title: "override"
						})
					);
				}
			});
		}

		return codeLenses;
	}
}