enum TokenKind { Keyword, Identifier, StringLiteral, Seperator, Operator, EOF };

// 代表一个Token的数据结构
interface Token {
    kind: TokenKind;
    text: string;
}

let tokenArray: Token[] = [
    { kind: TokenKind.Keyword, text: 'function' },
    { kind: TokenKind.Identifier, text: 'sayHello' },
    { kind: TokenKind.Seperator, text: '(' },
    { kind: TokenKind.Seperator, text: ')' },
    { kind: TokenKind.Seperator, text: '{' },
    { kind: TokenKind.Identifier, text: 'println' },
    { kind: TokenKind.Seperator, text: '(' },
    { kind: TokenKind.StringLiteral, text: 'Hello World!' },
    { kind: TokenKind.Seperator, text: ')' },
    { kind: TokenKind.Seperator, text: ';' },
    { kind: TokenKind.Seperator, text: '}' },
    { kind: TokenKind.Identifier, text: 'sayHello' },
    { kind: TokenKind.Seperator, text: '(' },
    { kind: TokenKind.Seperator, text: ')' },
    { kind: TokenKind.Seperator, text: ';' },
    { kind: TokenKind.EOF, text: '' }
];

class Tokenizer {
    private tokens: Token[];
    private pos: number = 0;

    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }
    next(): Token {
        if (this.pos >= this.tokens.length) {
            return { kind: TokenKind.EOF, text: '' };
        }
        return this.tokens[this.pos++];
    }

    position(): number {
        return this.pos;
    }

    traceBack(newPos: number): void {
        this.pos = newPos;
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
    static isFunctionBodyNode(node: any): node is FunctionBody {
        if (!node) {
            return false;
        }
        if (Object.getPrototypeOf(node) === FunctionBody.prototype) {
            return true;
        } else {
            return false;
        }
    }
    public dump(prefix: String): void {
        console.log(prefix + 'FunctionBody');
        for (let stmt of this.stmts) {
            stmt.dump(prefix + '  ');
        }
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
    static isFunctionCallNode(node: any): node is FunctionCall {
        if (!node) {
            return false;
        }
        if (Object.getPrototypeOf(node) === FunctionCall.prototype) {
            return true;
        } else {
            return false;
        }
    }
    public dump(prefix: String): void {
        console.log(prefix + 'FunctionCall ' + this.name);
        for (let param of this.parameters) {
            console.log(prefix + '  ' + param);
        }
    }
}

class Parser {
    tokenizer: Tokenizer;
    constructor(tokenizer: Tokenizer) {
        this.tokenizer = tokenizer;
    }
    parseProg(): Prog {
        let stmts: Statement[] = [];
        let stmt: Statement | null | void = null;
        while (true) {
            stmt = this.parseFunctionDecl();
            console.log("parseProg: unexpected token " + stmt);
            if (Statement.isStatementNode(stmt)) {
                stmts.push(stmt);
                continue;
            }
            stmt = this.parseFunctionCall();
            if (Statement.isStatementNode(stmt)) {
                stmts.push(stmt);
                continue;
            }
            if (stmt == null) {
                break;
            }
        }
        return new Prog(stmts);
    }

    parseFunctionDecl(): FunctionDecl | null | void {
        let oldPos: number = this.tokenizer.position();
        let t: Token = this.tokenizer.next();
        console.log("parseFunctionDecl: " + t.text);
        if (t.kind == TokenKind.Keyword && t.text == "function") {
            t = this.tokenizer.next();
            if (t.kind == TokenKind.Identifier) {
                let t1 = this.tokenizer.next();
                if (t1.text == '(') {
                    let t2 = this.tokenizer.next();
                    if (t2.text == ')') {
                        let functionBody = this.parseFunctionBody();
                        if (FunctionBody.isFunctionBodyNode(functionBody)) {
                            return new FunctionDecl(t.text, functionBody);
                        }
                    } else {
                        console.log("Expecting ')' in FunctionDecl, while we got a " + t.text);
                        return;
                    }
                } else {
                    console.log("Expecting '(' in FunctionDecl, while we got a " + t.text);
                    return;
                }
            }
        }
        this.tokenizer.traceBack(oldPos);
        return null;
    }

    parseFunctionBody(): FunctionBody | null | void {
        let oldPos: number = this.tokenizer.position();
        let stmts: FunctionCall[] = [];
        let t: Token = this.tokenizer.next();
        if (t.text == "{") {
            let functionCall = this.parseFunctionCall();
            while (FunctionCall.isFunctionCallNode(functionCall)) {
                stmts.push(functionCall);
                functionCall = this.parseFunctionCall();
            }
            t = this.tokenizer.next();
            if (t.text == "}") {
                return new FunctionBody(stmts);
            } else {
                console.log("Expecting '}' in FunctionBody, while we got a " + t.text);
                return;
            }
        } else {
            console.log("Expecting '{' in FunctionBody, while we got a " + t.text);
            return;
        }
        this.tokenizer.traceBack(oldPos);
        return null;
    }

    parseFunctionCall(): FunctionCall | null | void {
        let oldPos: number = this.tokenizer.position();
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
                        return;
                    }
                    t2 = this.tokenizer.next();
                    if (t2.text != ")") {
                        if (t2.text != ",") {
                            t2 = this.tokenizer.next();
                        } else {
                            console.log("Expecting ',' in FunctionCall, while we got a " + t2.text);
                            return;
                        }
                    }
                }
                t2 = this.tokenizer.next();
                if (t2.text == ";") {
                    return new FunctionCall(t.text, param);
                } else {
                    console.log("Expecting ';' in FunctionCall, while we got a " + t2.text);
                    return;
                }
            }
        }
        this.tokenizer.traceBack(oldPos);
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

function compileAndRun() {
    console.log("compile and run");
    let tokenizer = new Tokenizer(tokenArray);
    console.log("token:");
    for (let token of tokenArray) {
        console.log(token);
    }
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

compileAndRun();