import { operator, FTokenType } from "./enums.js";
import { FToken } from "./interfaces.js";

function chunk(code: string): string[] {
	let chunks: string[] = [];
	let currentChunk = "";
	let comment = false;
	let blockComment = false;
	let i = 0;

	let inString = false;

	function split() {
		chunks.push(currentChunk);
		currentChunk = "";
	}

	for (const char of code) {
		if ((char === " " || char === "	" || char === "\n") && !inString) {
			split();
			if (char === "\n") {
				comment = false;
			}
		} else if (char === "*") {
			if (code[i + 1] === "*" && code[i - 1] !== "*") {
				blockComment = !blockComment;
			} else if (code[i - 1] !== "*") comment = true;
		} else if (comment || blockComment) {
			// nothing.
		} else if (char === '"') {
			if (!inString) {
				split();
				currentChunk += char;
				inString = true;
			} else {
				currentChunk += char;
				inString = false;
				split();
			}
		} else if (char === "-" && code[i + 1] === ">" && !inString) {
			split();
			currentChunk += char;
		} else if (char === ">" && code[i - 1] === "-" && !inString) {
			currentChunk += char;
			split();
		} else if (
			(Object.values(operator)
				.flatMap((o) => (typeof o === "object" ? Object.values(o) : o))
				.includes(char) ||
				char === ";") &&
			!inString
		) {
			split();
			currentChunk += char;
			split();
		} else if (char === "<" && !inString) {
			split();
			currentChunk += char;
		} else if (char === ">" && !inString) {
			currentChunk += char;
			split();
		} else currentChunk += char;

		i++;
	}

	split();

	return chunks.map((x) => x.trim()).filter((x) => x.length);
}

export function lexer(code) {
	let chunks = chunk(code);
	let tokens: FToken[] = [];

	chunks.forEach((chunk) => {
		switch (true) {
			case /^-?[\d.]*\d$/g.test(chunk):
				tokens.push({ type: FTokenType.NUMBER, value: parseFloat(chunk) });
				break;

			case /^"[^"]*"$/g.test(chunk):
				tokens.push({ type: FTokenType.STRING, value: chunk.slice(1, -1) });
				break;

			case /^true|false$/g.test(chunk):
				tokens.push({ type: FTokenType.BOOLEAN, value: chunk === "true" });
				break;

			case /^null$/g.test(chunk):
				tokens.push({ type: FTokenType.NULL });
				break;

			case /^<[^>]+>$/g.test(chunk):
				tokens.push({ type: FTokenType.MEMORY, value: chunk.slice(1, -1) });
				break;

			case Object.values(operator)
				.flatMap((o) => (typeof o === "object" ? Object.values(o) : o))
				.includes(chunk):
				tokens.push({ type: FTokenType.OPERATOR, value: chunk.trim() });
				break;

			case chunk === ";":
				tokens.push({ type: FTokenType.NEWLINE });
				break;

			default:
				tokens.push({ type: FTokenType.VALUE, value: chunk.trim() });
		}
	});

	return tokens;
}