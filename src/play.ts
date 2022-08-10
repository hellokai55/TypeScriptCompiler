enum TokenKind { Keyword, Identifier, StringLiteral, Seperator, Operator, EOF };

// 代表一个Token的数据结构
interface Token {
    kind: TokenKind;
    text: string;
}

class CharStream {
    data: string;
    pos: number = 0;
    line: number = 1;
    col: number = 0;
    constructor(data: string) {
        this.data = data;
    }
    peek(): string {
        return this.data.charAt(this.pos);
    }
    next(): string {
        let ch = this.data.charAt(this.pos++);
        if (ch == '\n') {
            this.line++;
            this.col = 0;
        } else {
            this.col++;
        }
        return ch;
    }
    eof(): boolean {
        return this.peek() == '';
    }
}

class Tokenizer {

    stream: CharStream;
    nextToken: Token = { kind: TokenKind.EOF, text: "" };

    constructor(stream: CharStream) {
        this.stream = stream;
    }
    next(): Token {
        if (this.nextToken.kind == TokenKind.EOF && !this.stream.eof()) {
            this.nextToken = this.getAToken();
        }
        let lastToken = this.nextToken;
        this.nextToken = this.getAToken();
        return lastToken;
    }
    peek(): Token {
        if (this.nextToken.kind == TokenKind.EOF && !this.stream.eof()) {
            this.nextToken = this.getAToken();
        }
        return this.nextToken;
    }
    private getAToken(): Token {
        this.skipWhiteSpace();
        if (this.stream.eof()) {
            return { kind: TokenKind.EOF, text: "" };
        } else {
            let ch: string = this.stream.peek();
            if (this.isLetter(ch) || this.isDigit(ch)) {
                return this.parseIdentifier();
            } else if (ch == '"') {
                return this.parseStringLiteral();
            } else if (ch == '(' || ch == ')' || ch == '{' || ch == '}' || ch == ',' || ch == ';') {
                this.stream.next();
                return { kind: TokenKind.Seperator, text: ch };
            } else if (ch == '/') {
                this.stream.next()
                let ch1 = this.stream.peek();
                if (ch1 == '*') {
                    this.skipMultipleLineComments();
                    return this.getAToken();
                } else if (ch1 == '/') {
                    this.skipSingleLineComment();
                    return this.getAToken();
                } else if (ch1 == '=') {
                    this.stream.next();
                    return { kind: TokenKind.Operator, text: '/=' };
                } else {
                    return { kind: TokenKind.Operator, text: '/' };
                }
            } else if (ch == '+') {
                this.stream.next();
                let ch1 = this.stream.peek();
                if (ch1 == '+') {
                    this.stream.next();
                    return { kind: TokenKind.Operator, text: '++' };
                } else if (ch1 == '=') {
                    this.stream.next();
                    return { kind: TokenKind.Operator, text: '+=' };
                } else {
                    return { kind: TokenKind.Operator, text: '+' };
                }
            } else if (ch == '-') {
                this.stream.next();
                let ch1 = this.stream.peek();
                if (ch1 == '-') {
                    this.stream.next();
                    return { kind: TokenKind.Operator, text: '--' };
                } else if (ch1 == '=') {
                    this.stream.next();
                    return { kind: TokenKind.Operator, text: '-=' };
                } else {
                    return { kind: TokenKind.Operator, text: '-' };
                }
            } else if (ch == '*') {
                this.stream.next();
                let ch1 = this.stream.peek();
                if (ch1 == '=') {
                    this.stream.next();
                    return { kind: TokenKind.Operator, text: '*=' };
                } else {
                    return { kind: TokenKind.Operator, text: '*' };
                }
            } else {
                console.log("Unrecognized character: " + ch);
                this.stream.next();
                return this.getAToken();
            }
        }
    }
    private parseIdentifier(): Token {
        let token = { kind: TokenKind.Identifier, text: "" };
        token.text += this.stream.next();
        while (!this.stream.eof() && this.isLetterDigitOrUnderscore(this.stream.peek())) {
            token.text += this.stream.next();
        }
        if (token.text == 'function') {
            token.kind = TokenKind.Keyword;
        }
        return token;
    }

    private parseStringLiteral(): Token {
        let token = { kind: TokenKind.StringLiteral, text: '' };
        this.stream.next();
        while (!this.stream.eof() && this.stream.peek() != '"') {
            token.text += this.stream.next();
        }
        if (this.stream.peek() == '"') {
            this.stream.next();
        } else {
            console.log("Expecting an \" at line: " + this.stream.line + " col: " + this.stream.col);
        }
        return token;
    }
    private skipMultipleLineComments(): void {
        this.stream.next();
        if (!this.stream.eof()) {
            let ch1 = this.stream.next();
            while (!this.stream.eof()) {
                let ch2 = this.stream.next();
                if (ch1 == '*' && ch2 == '/') {
                    return;
                }
                ch1 = ch2;
            }
        }
        console.log("Failed to find a */ at line " + this.stream.line + " col " + this.stream.col);
    }
    private skipSingleLineComment(): void {
        this.stream.next();
        while (this.stream.peek() != '\n' && !this.stream.eof()) {
            this.stream.next();
        }
    }
    private skipWhiteSpace(): void {
        while (this.isWhiteSpace(this.stream.peek())) {
            this.stream.next();
        }
    }
    private isLetterDigitOrUnderscore(ch: string): boolean {
        return (ch >= 'A' && ch <= 'Z' ||
            ch >= 'a' && ch <= 'z' ||
            ch >= '0' && ch <= '9' ||
            ch == '_');
    }
    private isLetter(ch: string): boolean {
        return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z');
    }
    private isDigit(ch: string): boolean {
        return (ch >= '0' && ch <= '9');
    }
    private isWhiteSpace(ch: string): boolean {
        return (ch == ' ' || ch == '\n' || ch == '\t');
    }
}

abstract class AstNode {
    public abstract dump(prefix: String): void;
}

abstract class Statement extends AstNode {
    static isStatementNode(node: any): node is Statement {
        if (!node) {
            return false;
        } else {
            return true;
        }
    }
}

class Prog extends AstNode {
    stmts: Statement[] = [];
    constructor(stmts: Statement[]) {
        super();
        this.stmts = stmts;
    }
    public dump(prefix: String): void {
        console.log(prefix + 'Prog' + this.stmts.length);
        this.stmts.forEach(stmt => stmt.dump(prefix + '  '));
    }
}

class FunctionDecl extends Statement {
    name: string;
    body: FunctionBody;
    constructor(name: string, body: FunctionBody) {
        super();
        this.name = name;
        this.body = body;
    }
    public dump(prefix: String): void {
        console.log(prefix + 'FunctionDecl ' + this.name);
        this.body.dump(prefix + '  ');
    }
}

class FunctionBody extends Statement {
    stmts: FunctionCall[];
    constructor(stmts: FunctionCall[]) {
        super();
        this.stmts = stmts;
    }
    public dump(prefix: String): void {
        console.log(prefix + 'FunctionBody');
        this.stmts.forEach(x => x.dump(prefix + '  '));
    }
}

class FunctionCall extends Statement {
    name: string;
    parameters: string[];
    definition: FunctionDecl | null = null;
    constructor(name: string, parameters: string[]) {
        super();
        this.name = name;
        this.parameters = parameters;
    }
    public dump(prefix: String): void {
        console.log(prefix + 'FunctionCall ' + this.name);
        this.parameters.forEach(x => console.log(prefix + "\t" + "Parameter: " + x));
    }
}

class Parser {
    tokenizer: Tokenizer;
    constructor(tokenizer: Tokenizer) {
        this.tokenizer = tokenizer;
    }
    parseProg(): Prog {
        let stmts: Statement[] = [];
        let stmt: Statement | null = null;
        let token = this.tokenizer.peek();
        while (token.kind != TokenKind.EOF) {
            if (token.kind == TokenKind.Keyword && token.text == 'function') {
                stmt = this.parseFunctionDecl();
            } else if (token.kind == TokenKind.Identifier) {
                stmt = this.parseFunctionCall();
            }
            if (stmt != null) {
                stmts.push(stmt);
                console.log("success");
            } else {
                //  console.log("Unrecognized token: " + token.text);
            }
            token = this.tokenizer.peek();
        }
        return new Prog(stmts);
    }

    parseFunctionDecl(): FunctionDecl | null {
        this.tokenizer.next();
        let t: Token = this.tokenizer.next();
        console.log("parseFunctionDecl: " + t.text);
        if (t.kind == TokenKind.Identifier) {
            let t1 = this.tokenizer.next();
            if (t1.text == "(") {
                let t2 = this.tokenizer.next();
                if (t2.text == ")") {
                    let functionBody = this.parseFunctionBody();
                    if (functionBody != null) {
                        return new FunctionDecl(t.text, functionBody);
                    } else {
                        return null;
                    }
                } else {
                    return null;
                }
            } else {
                return null;
            }
        } else {
            console.log("Expecting 'function' in FunctionDecl, while we got a " + t.text);
            return null;
        }
        return null;
    }

    parseFunctionBody(): FunctionBody | null {
        let stmts: FunctionCall[] = [];
        let t: Token = this.tokenizer.next();
        if (t.text == "{") {
            while (this.tokenizer.peek().kind == TokenKind.Identifier) {
                let functionCall = this.parseFunctionCall();
                if (functionCall != null) {
                    stmts.push(functionCall);
                } else {
                    console.log("Error parsing a FunctionCall in FunctionBody");
                    return null;
                }
            }
            t = this.tokenizer.next();
            if (t.text == "}") {
                return new FunctionBody(stmts);
            } else {
                console.log("Expecting '}' in FunctionBody, while we got a " + t.text);
                return null;
            }
        } else {
            console.log("Expecting '{' in FunctionBody, while we got a " + t.text);
            return null;
        }
        return null;
    }

    parseFunctionCall(): FunctionCall | null {
        let param: string[] = [];
        let t: Token = this.tokenizer.next();
        if (t.kind == TokenKind.Identifier) {
            let t1 = this.tokenizer.next();
            if (t1.text == '(') {
                let t2 = this.tokenizer.next();
                while (t2.text != ")") {
                    if (t2.kind == TokenKind.StringLiteral) {
                        param.push(t2.text);
                    } else {
                        console.log("Expecting string literal in FunctionCall, while we got a " + t2.text);
                        return null;
                    }
                    t2 = this.tokenizer.next();
                    if (t2.text != ")") {
                        if (t2.text != ",") {
                            t2 = this.tokenizer.next();
                        } else {
                            console.log("Expecting ',' in FunctionCall, while we got a " + t2.text);
                            return null;
                        }
                    }
                }
                t2 = this.tokenizer.next();
                if (t2.text == ";") {
                    return new FunctionCall(t.text, param);
                } else {
                    console.log("Expecting ';' in FunctionCall, while we got a " + t2.text);
                    return null;
                }
            }
        }
        return null;
    }

}

abstract class AstVisitor {
    visitProg(prog: Prog): void {
        let retVal: any;
        for (let x of prog.stmts) {
            if (typeof (x as FunctionDecl).body === 'object') {
                retVal = this.visitFunctionDecl(x as FunctionDecl);
            } else {
                retVal = this.visitFunctionCall(x as FunctionCall);
            }
        }
        return retVal;
    }

    visitFunctionDecl(functionDecl: FunctionDecl): void {
        return this.visitFunctionBody(functionDecl.body);
    }

    visitFunctionBody(functionBody: FunctionBody): any {
        let retVal: any;
        for (let x of functionBody.stmts) {
            retVal = this.visitFunctionCall(x);
        }
        return retVal;
    }

    visitFunctionCall(functionCall: FunctionCall): any {
        return undefined;
    }
}

class RefResolver extends AstVisitor {
    prog: Prog | null = null;
    visitProg(prog: Prog): void {
        this.prog = prog;
        for (let x of prog.stmts) {
            let functionCall = x as FunctionCall;
            if (typeof functionCall.parameters === 'object') {
                this.resolveFunctionCall(prog, functionCall);
            } else {
                this.visitFunctionDecl(x as FunctionDecl);
            }
        }
    }

    visitFunctionBody(functionBody: FunctionBody): any {
        if (this.prog != null) {
            for (let x of functionBody.stmts) {
                this.resolveFunctionCall(this.prog, x);
            }
        }
    }

    private resolveFunctionCall(prog: Prog, functionCall: FunctionCall): void {
        let functionDecl = this.findFunctionDecl(prog, functionCall.name);
        if (functionDecl != null) {
            functionCall.definition = functionDecl;
        } else {
            if (functionCall.name != "println") {
                console.log("Function " + functionCall.name + " not found");
            }
        }
    }

    private findFunctionDecl(prog: Prog, name: string): FunctionDecl | null {
        for (let x of prog?.stmts) {
            let functionDecl = x as FunctionDecl;
            if (typeof functionDecl.body === 'object' && functionDecl.name == name) {
                return functionDecl;
            }
        }
        return null;
    }

}

class Interpretor extends AstVisitor {
    visitProg(prog: Prog): any {
        let retVal: any;
        for (let x of prog.stmts) {
            let functionCall = x as FunctionCall;
            if (typeof functionCall.parameters === 'object') {
                retVal = this.runFunction(functionCall);
            }
        };
        return retVal;
    }
    visitFunctionBody(functionBody: FunctionBody) {
        let retVal: any;
        for (let x of functionBody.stmts) {
            retVal = this.runFunction(x);
        };
    }
    runFunction(functionCall: FunctionCall): any {
        if (functionCall.name == "println") {
            if (functionCall.parameters.length > 0) {
                console.log(functionCall.parameters[0]);
            } else {
                console.log();
            }
            return 0;
        } else {
            if (functionCall.definition != null) {
                this.visitFunctionBody(functionCall.definition.body);
            }
        }
    }
}

function compileAndRun(program: string): void {
    console.log("源代码:");
    console.log(program);

    let tokenizer = new Tokenizer(new CharStream(program));

    while (tokenizer.peek().kind != TokenKind.EOF) {
        console.log(tokenizer.next());
    }

    tokenizer = new Tokenizer(new CharStream(program));

    //语法分析
    let prog: Prog = new Parser(tokenizer).parseProg();
    console.log("语法分析后的AST:");
    prog.dump("");

    //语义分析
    new RefResolver().visitProg(prog);
    console.log("语义分析后的AST:");
    prog.dump("");

    console.log("运行当前的程序");
    let retVal = new Interpretor().visitProg(prog);
    console.log("运行结果:" + retVal);
}

import * as process from 'process';

if (process.argv.length < 3) {
    console.log("Usage: " + process.argv[0] + " " + process.argv[1] + " <filename>");
    process.exit(1);
}

let fs = require('fs');
let filename = process.argv[2];
fs.readFile(filename, 'utf8', function (err: any, data: string) {
    if (err) throw err;
    compileAndRun(data);
})
