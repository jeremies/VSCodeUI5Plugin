import * as vscode from "vscode";
import { CompletionItemFactory } from "../../CompletionItems/CompletionItemFactory";
import { GeneratorFactory } from "../../CodeGenerators/GeneratorFactory";
import { DefineGenerator } from "../../CodeGenerators/define/UIDefineCompletionItemGenerator";
import { FileWatcher } from "../FileWatcher";
import { UI5Plugin } from "../../../UI5Plugin";

export class CompletionItemRegistrator {
	static async register() {
		/* Completion Items */
		const XMLCompletionItemFactory = new CompletionItemFactory(GeneratorFactory.language.xml);
		const XMLCompletionItems = await XMLCompletionItemFactory.getLanguageSpecificCompletionItems();
		console.log("XML Completion Items generated");

		const JSCompletionItemDAO = new CompletionItemFactory(GeneratorFactory.language.js);
		await JSCompletionItemDAO.getLanguageSpecificCompletionItems();
		console.log("JS Completion Items generated");

		const JSMethodPropertyProvider = vscode.languages.registerCompletionItemProvider({language: "javascript", scheme: "file"}, {
			async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {
				let itemsToReturn:vscode.CompletionItem[] = [];
				try {
					if (DefineGenerator.getIfCurrentPositionIsInDefine(position)) {
						itemsToReturn = await JSCompletionItemDAO.getLanguageSpecificCompletionItems();
					} else {
						itemsToReturn = JSCompletionItemDAO.generateUIClassCompletionItems();
					}

				} catch (error) {
					console.log(error);
				}
				return itemsToReturn;
			}
		}, ".");

		const JSViewIDProvider = vscode.languages.registerCompletionItemProvider({language: "javascript", scheme: "file"}, {
			provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {
				return JSCompletionItemDAO.generateIdCompletionItems();
			}
		}, "this.getView().byId(");

		const XMLProvider = vscode.languages.registerCompletionItemProvider({language: "xml", scheme: "file"}, {
			provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {
				const XMLDynamicCompletionItems = XMLCompletionItemFactory.generateXMLDynamicCompletionItems();

				return XMLDynamicCompletionItems.length > 0 ? XMLDynamicCompletionItems : XMLCompletionItems;
			}
		});

		UI5Plugin.getInstance().addDisposable(XMLProvider);
		UI5Plugin.getInstance().addDisposable(JSMethodPropertyProvider);
		UI5Plugin.getInstance().addDisposable(JSViewIDProvider);

		FileWatcher.syncrhoniseJSDefineCompletionItems(CompletionItemFactory.JSDefineCompletionItems);
	}
}