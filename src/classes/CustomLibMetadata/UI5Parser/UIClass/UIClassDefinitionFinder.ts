import { SyntaxAnalyzer } from "../../SyntaxAnalyzer";
import * as vscode from "vscode";
import { UIClassFactory } from "./UIClassFactory";
import { CustomUIClass } from "./CustomUIClass";
import { FileReader } from "../../../Util/FileReader";
import LineColumn from 'line-column';
import { StandardUIClass } from "./StandardUIClass";
import { DifferentJobs } from "../../JSParser/DifferentJobs";
import { JSFunctionCall } from "../../JSParser/types/FunctionCall";
import { AbstractUIClass } from "./AbstractUIClass";
import { URLBuilder } from "../../../Util/URLBuilder";

export class UIClassDefinitionFinder {
	public static getPositionAndUriOfCurrentVariableDefinition(classNameDotNotation?: string, methodName?: string, openInBrowserIfStandardMethod?: boolean) : vscode.Location | undefined {
		let location: vscode.Location | undefined;

		if (!classNameDotNotation) {
			classNameDotNotation = SyntaxAnalyzer.getClassNameOfTheVariable();
		}

		const textEditor = vscode.window.activeTextEditor;
		if (textEditor && !methodName) {

			const document = textEditor.document;
			const position = textEditor.selection.start;
			methodName = document.getText(document.getWordRangeAtPosition(position));
		}

		if (classNameDotNotation && methodName) {
			if (classNameDotNotation.startsWith("sap.") && openInBrowserIfStandardMethod) {
				this.openClassMethodInTheBrowser(classNameDotNotation, methodName);
			} else {
				location = this.getVSCodeMethodLocation(classNameDotNotation, methodName);
				if (!location) {
					const UIClass = UIClassFactory.getUIClass(classNameDotNotation);
					if (UIClass.parentClassNameDotNotation) {
						location = this.getPositionAndUriOfCurrentVariableDefinition(UIClass.parentClassNameDotNotation, methodName, openInBrowserIfStandardMethod);
					}
				}
			}
		}

		return location;
	}

	private static getVSCodeMethodLocation(classNameDotNotation: string, methodName: string) {
		let location: vscode.Location | undefined;
		const UIClass = UIClassFactory.getUIClass(classNameDotNotation);

		if (UIClass instanceof CustomUIClass && UIClass.classBody) {
			const currentMethod = UIClass.methods.find(method => method.name === methodName);
			if (currentMethod) {
				const classPath = FileReader.getClassPathFromClassName(UIClass.className);
				if (classPath) {
					const classUri = vscode.Uri.file(classPath);
					if (currentMethod.position) {
						const position = LineColumn(UIClass.classText).fromIndex(currentMethod.position);
						if (position) {
							const methodPosition = new vscode.Position(position.line - 1, position.col - 1);
							location = new vscode.Location(classUri, methodPosition);
						}
					}
				}
			}

		}

		return location;
	}

	static getVariableClass(variable?: string) {
		let UIClassName: string | undefined;
		if (!variable) {
			variable = SyntaxAnalyzer.getCurrentVariable();
		}
		const textEditor = vscode.window.activeTextEditor;

		if (textEditor) {
			const document = textEditor.document;
			const currentPositionOffset = document.offsetAt(textEditor.selection.start);
			const currentClassName = SyntaxAnalyzer.getClassNameOfTheCurrentDocument();

			if (currentClassName) {
				const currentClass = UIClassFactory.getUIClass(currentClassName);
				const variableParts = SyntaxAnalyzer.splitVariableIntoParts(variable);
				UIClassName = SyntaxAnalyzer.getClassNameFromVariableParts(variableParts, currentClass, undefined, currentPositionOffset);
			}
		}

		return UIClassName;
	}

	private static openClassMethodInTheBrowser(classNameDotNotation: string, methodName: string) {
		const UIClass = UIClassFactory.getUIClass(classNameDotNotation);
		if (UIClass instanceof StandardUIClass) {
			const methodFromClass = UIClass.methods.find(method => method.name === methodName);
			if (methodFromClass) {
				if (methodFromClass.isFromParent) {
					this.openClassMethodInTheBrowser(UIClass.parentClassNameDotNotation, methodName);
				} else {
					const UIClass = UIClassFactory.getUIClass(classNameDotNotation);
					const linkToDocumentation = URLBuilder.getInstance().getUrlForMethodApi(UIClass, methodName);
					vscode.env.openExternal(vscode.Uri.parse(linkToDocumentation));
				}
			} else if (UIClass.parentClassNameDotNotation) {
				this.openClassMethodInTheBrowser(UIClass.parentClassNameDotNotation, methodName);
			}
		}
	}

	public static getAdditionalJSTypesHierarchically(UIClass: AbstractUIClass) {
		if (UIClass instanceof CustomUIClass &&  UIClass.classBody) {
			const variables = DifferentJobs.getAllVariables(UIClass.classBody);
			variables.forEach(variable => {
				if (!variable.jsType && variable.parts.length > 0) {
					const allPartsAreFunctionCalls = !variable.parts.find(part => !(part instanceof JSFunctionCall));
					if (allPartsAreFunctionCalls) {
						const variableParts = SyntaxAnalyzer.splitVariableIntoParts(variable.parsedBody);
						variable.jsType = SyntaxAnalyzer.getClassNameFromVariableParts(variableParts, UIClass, undefined, variable.positionEnd);
					}
				}
			});
		}
	}
}