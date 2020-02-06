import * as vscode from "vscode";
import { SAPNode } from "../StandardLibMetadata/SAPNode";
import { AbstractUIClass } from "../CustomLibMetadata/UI5Parser/UIClass/AbstractUIClass";

let URLBuilderInstance: null | URLBuilder  = null;

export class URLBuilder {
	private readonly UI5Version: string;
	private readonly URLHost = "https://ui5.sap.com/";

	private constructor(UI5Version: string) {
		this.UI5Version = UI5Version;
	}

	static getInstance() {
		if (!URLBuilderInstance) {
			const UI5Version: any = vscode.workspace.getConfiguration("ui5.plugin").get("ui5version");
			URLBuilderInstance = new URLBuilder(UI5Version);
		}

		return URLBuilderInstance;
	}

	getMarkupUrlForClassApi(SAPClass: SAPNode | AbstractUIClass) {
		return this.wrapInMarkup(this.getUrlForClassApi(SAPClass));
	}

	getMarkupUrlForPropertiesApi(SAPClass: AbstractUIClass) {
		return this.wrapInMarkup(this.getUrlForPropertiesApi(SAPClass));
	}

	getMarkupUrlForEventsApi(SAPClass: AbstractUIClass) {
		return this.wrapInMarkup(this.geUrlForEventsApi(SAPClass));
	}

	getMarkupUrlForMethodApi(SAPClass: AbstractUIClass | SAPNode, methodName: string) {
		return this.wrapInMarkup(this.getUrlForMethodApi(SAPClass, methodName));
	}

	getUrlForClassApi(SAPClass: SAPNode | AbstractUIClass) {
		const className = SAPClass instanceof SAPNode ? SAPClass.getName() : SAPClass instanceof AbstractUIClass ? SAPClass.className : "";

		return this.getUrlClassApiBase(className);
	}

	getUrlForPropertiesApi(SAPClass: AbstractUIClass) {
		const urlBase = this.getUrlClassApiBase(SAPClass.className);
		return `${urlBase}/controlProperties`;
	}

	geUrlForEventsApi(SAPClass: AbstractUIClass) {
		const urlBase = this.getUrlClassApiBase(SAPClass.className);
		return `${urlBase}/events/Events`;
	}

	getUrlForMethodApi(SAPClass: AbstractUIClass | SAPNode, methodName: string) {
		const className = SAPClass instanceof SAPNode ? SAPClass.getName() : SAPClass instanceof AbstractUIClass ? SAPClass.className : "";
		const urlBase = this.getUrlClassApiBase(className);
		return `${urlBase}/methods/${methodName}`;
	}

	getAPIIndexUrl() {
		return `${this.getUrlBase()}/docs/api/api-index.json`;
	}

	getDesignTimeUrlForLib(libDotNotation: string) {
		const libPath = libDotNotation.replace(/\./g, "/");

		return `${this.getUrlBase()}/test-resources/${libPath}/designtime/apiref/api.json`;
	}

	private wrapInMarkup(url: string) {
		return `[UI5 API](${url})\n`;
	}

	private getUrlClassApiBase(className: string) {
		return `${this.getUrlBase()}#/api/${className}`;
	}

	private getUrlBase() {
		return `${this.URLHost}${this.UI5Version}`;
	}
}