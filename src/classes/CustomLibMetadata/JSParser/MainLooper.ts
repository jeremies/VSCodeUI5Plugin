import { JSFunctionCall } from "./types/FunctionCall";
import { AbstractType } from "./types/AbstractType";
import { JSArray } from "./types/Array";
import { JSString } from "./types/String";
import { JSFunction } from "./types/Function";
import { JSObject } from "./types/Object";
import { JSClass } from "./types/Class";
import { JSVariable } from "./types/Variable";
import { IfStatement } from "./types/IfStatement";
import { WhileLoop } from "./types/WhileLoop";
import { ForLoop } from "./types/ForLoop";
import { TryCatchFinally } from "./types/TryCatchFinally";
import { JSSwitch } from "./types/JSSwitch";
import { JSComment } from "./types/JSComment";
import { JSUnknown } from "./types/JSUnknown";
import { JSTernaryOperation } from "./types/TernaryOperation";
import { JSIncrement } from "./types/JSIncrement";
import { EndlessLoopLocker } from "../../Util/EndlessLoopLocker";
import { JSReturnKeyword } from "./types/ReturnKeyword";

export class MainLooper {
	static startAnalysing(javascript: string, runBeforeChar?: string) {
		let currentText = "";
		let shouldContinueLoop = true;
		let currentIndex = 0;
		const parts:AbstractType[] = [];
		let emergencyStop = false;

		while (shouldContinueLoop) {
			EndlessLoopLocker.checkForTimeout();
			const currentChar = javascript[currentIndex];
			let syntaxType: AbstractType | undefined;

			if (JSClass.isAClass(currentText, currentChar)) {
				//needed before function call
				syntaxType = new JSClass(currentText, javascript);
			} else if (JSFunction.isAFunction(currentText, javascript)) {
				//need to be before Function Call
				syntaxType = new JSFunction(currentText, javascript);

				if (runBeforeChar && (<JSFunction>syntaxType).functionText.endsWith(runBeforeChar)) {
					emergencyStop = true;
				}
			} else if (IfStatement.isAnIfStatement(currentText)) {
				syntaxType = new IfStatement("", javascript);

			} else if (JSTernaryOperation.isATernaryOperation(currentText, javascript[currentIndex + 1])) {
				syntaxType = new JSTernaryOperation("", javascript);

			} else if (WhileLoop.isAWhileLoop(currentText)) {
				syntaxType = new WhileLoop("", javascript);

			} else if (ForLoop.isAForLoop(currentText)) {
				syntaxType = new ForLoop("", javascript);

			} else if (TryCatchFinally.isATryCatchFinally(currentText)) {
				syntaxType = new TryCatchFinally("", javascript);

			} else if (JSIncrement.isAnIncrement(currentText)) {
				syntaxType = new JSIncrement("", javascript);

			} else if (JSSwitch.isASwitchStatement(currentText)) {
				syntaxType = new JSSwitch("", javascript);

			} else if (JSComment.isAComment(currentText)) {
				syntaxType = new JSComment("", javascript);

			} else if (JSFunctionCall.isAFunctionCall(currentChar)) {
				syntaxType = new JSFunctionCall(currentText, javascript);

			} else if (JSArray.isAnArray(currentChar)) {
				syntaxType = new JSArray(currentText, javascript);

			} else if (JSObject.isAnObject(currentChar)) {
				syntaxType = new JSObject(currentText, javascript);

			} else if (JSString.isAString(currentChar)) {
				syntaxType = new JSString("", javascript);

			} else if (JSReturnKeyword.isReturnKeyword(currentText)) {
				syntaxType = new JSReturnKeyword("", javascript);
			}
			if (syntaxType) {
				parts.push(syntaxType);

				javascript = javascript.substring(syntaxType.getContentLength(), javascript.length);
				currentIndex = 0;
				currentText = "";

				if (runBeforeChar && syntaxType.body.endsWith(runBeforeChar)) {
					emergencyStop = true;
				}
				syntaxType = undefined;
			} else {
				if (JSVariable.isVariable(currentText)) {
					let definitions;
					let definitionBody;
					if (!currentText.endsWith(";")) {
						definitions = this.startAnalysing(javascript.substring(currentIndex, javascript.length), ";");
						definitionBody = definitions.reduce((accumulator, definition) => accumulator += definition.getFullBody(), "");
					} else {
						currentText = currentText.substring(0, currentText.length - 1);
					}
					const jsVariable = new JSVariable(currentText, definitionBody || "");
					parts.push(jsVariable);

					javascript = javascript.substring(currentText.length + (definitionBody ? definitionBody.length : 0) + 1, javascript.length);
					currentIndex = 0;
					currentText = "";

					if (runBeforeChar && jsVariable.body.endsWith(runBeforeChar)) {
						emergencyStop = true;
					}
				} else {
					currentText += currentChar;
					currentIndex++;
				}
			}

			shouldContinueLoop = emergencyStop ? false : (runBeforeChar ? (currentIndex < javascript.length && (currentText ? currentText[currentText.length - 1] !== runBeforeChar : true) ) : (currentIndex < javascript.length));
		}

		if (javascript && currentText && parts.length === 0) {
			if (currentText.split(",").length > 1 && !!currentText.split(",")[1]) {
				parts.push(new JSUnknown(currentText, ""));
			} else {
				parts.push(new JSVariable(currentText, ""));
			}
		} else if (javascript && currentText.trim()) {
			parts.push(new JSUnknown(currentText, ""));
		}

		parts.forEach(part => {
			part.parseBody();
		});
		return parts;
	}

	static getEndOfChar(charBegin: string, charEnd: string, text: string) {
		let body: string = "";
		let charOpened = false;
		let charBeginQuantity = 0;
		let charEndQuantity = 0;
		let openingCharIndex = 0;
		let index = 0;
		const commentIndexRanges = this.getCommentRanges(text);

		while((!charOpened || (charBeginQuantity - charEndQuantity !== 0)) && index < text.length) {
			if (!this.checkIfIndexIsInCommentRange(commentIndexRanges, index)) {
				if (text[index] === charBegin) {
					if (!charOpened) {
						charOpened = true;
						openingCharIndex = index;
					}
					charBeginQuantity++;
				} else if (text[index] === charEnd) {
					charEndQuantity++;
				}
			}
			index++;
		}

		if (text[index] === ";" || text[index] === ",") {
			index++;
		}
		body = text.substring(openingCharIndex, index);

		return body;
	}

	static getCharPair(char: string, text: string) {
		let body: string = "";
		let charOpened = false;
		let charQuantity = 0;
		let openingCharIndex = 0;
		let index = 0;
		const commentIndexRanges = this.getCommentRanges(text);

		while((!charOpened || (charQuantity !== 2)) && index < text.length) {
			if (!this.checkIfIndexIsInCommentRange(commentIndexRanges, index) && text[index] === char && text[index - 1] !== "\\") {
				if (!charOpened) {
					charOpened = true;
					openingCharIndex = index;
				}
				charQuantity++;
			}

			index++;
		}

		if (text[index] === ";" || text[index] === ",") {
			index++;
		}
		body = text.substring(openingCharIndex, index);

		return body;
	}

	private static getCommentRanges(text: string) {
		const ranges: CommentRanges[] = [];

		if (this.areAllOpenedCommendsClosed(text)) {
			const rComments = /(\/\*(.|\s)*?\*\/)|(\/\/.*)/g;
			let results = rComments.exec(text);
			while (results) {
				const from = results.index;
				const to = from + results[0].length;
				ranges.push({
					from: from,
					to: to
				});

				results = rComments.exec(text);
			}
		} else {
			ranges.push({
				from: 0,
				to: text.length
			});
		}

		return ranges;
	}

	private static areAllOpenedCommendsClosed(text: string) {
		let iOpenedCommendCount = 0;
		let iClosedCommentCount = 0;

		for (let i = 0; i < text.length - 1; i++) {
			const nextTwoChars = text.substring(i, i + 2);
			if (nextTwoChars === "/*") {
				iOpenedCommendCount++;
				i++;
			} else if (nextTwoChars === "*/") {
				iClosedCommentCount++;
				i++;
			}
		}

		return (iOpenedCommendCount - iClosedCommentCount) === 0;
	}

	private static checkIfIndexIsInCommentRange(commentRanges: CommentRanges[], index: number) {
		return !!commentRanges.find(commentRange => {
			return index >= commentRange.from && index < commentRange.to;
		});
	}
}

export interface CommentRanges {
	from: number;
	to: number;
}