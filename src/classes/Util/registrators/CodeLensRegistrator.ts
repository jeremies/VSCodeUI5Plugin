import * as vscode from "vscode";
import { XMLCodeLensProvider } from "../providers/XMLCodeLensProvider";
import { JSCodeLensProvider } from "../providers/JSCodeLensProvider";
import { UI5Plugin } from "../../../UI5Plugin";

export class CodeLensRegistrator {
	static register() {
		if (vscode.workspace.getConfiguration("ui5.plugin").get("xmlCodeLens")) {
			const XMLCodeLens = vscode.languages.registerCodeLensProvider({language: "xml", scheme: "file"}, {
				provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken) {
					return XMLCodeLensProvider.getCodeLenses(document);
				}
			});

			const vscodeCommand = vscode.commands.registerCommand("ui5plugin.gotoresourcemodel", i18nId => {
				if (i18nId) {
					XMLCodeLensProvider.goToResourceModel(i18nId[0]);
				}
			});
			UI5Plugin.getInstance().addDisposable(XMLCodeLens);
			UI5Plugin.getInstance().addDisposable(vscodeCommand);

		}

		if (vscode.workspace.getConfiguration("ui5.plugin").get("jsCodeLens")) {
			const JSCodeLens = vscode.languages.registerCodeLensProvider({language: "javascript", scheme: "file"}, {
				provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken) {
					return JSCodeLensProvider.getCodeLenses();
				}
			});

			UI5Plugin.getInstance().addDisposable(JSCodeLens);
		}
	}
}