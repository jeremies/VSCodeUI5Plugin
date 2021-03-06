import { AbstractType } from "./AbstractType";
import { MainLooper } from "../MainLooper";

export class JSSwitch extends AbstractType {
	public parseBodyText() {
		const parsedBodyText = this.body;

		//if body
		const bracketBodyOfWhile = MainLooper.getEndOfChar("{", "}", parsedBodyText);
		const bodyOfWhile = parsedBodyText.substring(0, parsedBodyText.indexOf(bracketBodyOfWhile) + bracketBodyOfWhile.length);

		this.body = bodyOfWhile;

		this.parsedBody = this.body.trim();
	}
	public parseBody() {}

	static isASwitchStatement(text: string) {
		return /\sswitch(\s|{)/.test(text);
	}
}