import * as ts from "typescript";
import { v4 as uuidv4 } from "uuid";

/**
 * This is the transformer's configuration, the values are passed from the tsconfig.
 */
export interface TransformerConfig {
    _: void;
}

/**
 * This is a utility object to pass around your dependencies.
 * You can also use this object to store state, e.g., UUID mappings.
 */
export class TransformContext {
    public factory: ts.NodeFactory;
    private uuidMap: Map<string, string> = new Map();

    constructor(
        public program: ts.Program,
        public context: ts.TransformationContext,
        public config: TransformerConfig,
    ) {
        this.factory = context.factory;
        process.stdout.write(`TransformContext initialized.\n`);
    }

    /**
     * Transforms the children of the specified node.
     */
    transform<T extends ts.Node>(node: T): T {
        process.stdout.write(`Transforming node: ${ts.SyntaxKind[node.kind]}\n`);
        return ts.visitEachChild(node, (node) => visitNode(this, node), this.context);
    }

    /**
     * Generates or retrieves a UUID for the given enum member.
     */
    getOrCreateUUID(name: string): string {
        if (!this.uuidMap.has(name)) {
            const uuid = uuidv4();
            this.uuidMap.set(name, uuid);
            process.stdout.write(`Generated new UUID for ${name}: ${uuid}\n`);
        } else {
            process.stdout.write(`Using cached UUID for ${name}: ${this.uuidMap.get(name)}\n`);
        }
        return this.uuidMap.get(name)!;
    }
}

function visitEnumDeclaration(context: TransformContext, node: ts.EnumDeclaration): ts.EnumDeclaration | ts.Node[] {
    process.stdout.write(`Visiting enum declaration: ${node.name.text}\n`);
    const isConstEnum = node.modifiers?.some(mod => mod.kind === ts.SyntaxKind.ConstKeyword);

    if (isConstEnum) {
        process.stdout.write(`Processing const enum: ${node.name.text}\n`);
        
        const updatedEnum = context.factory.updateEnumDeclaration(
            node,
            node.modifiers,
            node.name,
            context.factory.createNodeArray(
                node.members.map(member => {
                    const memberName = (member.name as ts.Identifier).text;
                    process.stdout.write(`Processing member: ${memberName}\n`);
                    const uuidValue = context.getOrCreateUUID(`${node.name.text}_${memberName}`);
                    process.stdout.write(`Updated member ${memberName} with UUID: ${uuidValue}\n`);
                    return context.factory.updateEnumMember(
                        member,
                        member.name,
                        context.factory.createStringLiteral(uuidValue)
                    );
                })
            )
        );

        process.stdout.write(`Finished processing const enum: ${node.name.text}\n`);
        return updatedEnum;
    }

    process.stdout.write(`Skipping non-const enum: ${node.name.text}\n`);
    return node;
}

function visitNode(context: TransformContext, node: ts.Node): ts.Node | ts.Node[] {
    process.stdout.write(`Visiting node: ${ts.SyntaxKind[node.kind]}\n`);

    // Skip JSDoc nodes to avoid getting stuck in these nodes
    if (ts.isJSDoc(node) || ts.isJSDocAllType(node)) {
        process.stdout.write(`Skipping JSDoc or JSDocAllType node.\n`);
        return node;
    }

    if (ts.isEnumDeclaration(node)) {
        return visitEnumDeclaration(context, node);
    }

    // Continue traversing the AST
    return context.transform(node);
}
