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
    }

    /**
     * Transforms the children of the specified node.
     */
    transform<T extends ts.Node>(node: T): T {
        return ts.visitEachChild(node, (node) => visitNode(this, node), this.context);
    }

    /**
     * Generates or retrieves a UUID for the given enum member.
     */
    getOrCreateUUID(name: string): string {
        if (!this.uuidMap.has(name)) {
            const uuid = uuidv4();
            this.uuidMap.set(name, uuid);
            console.log(`Generated new UUID for ${name}: ${uuid}`);
        }
        return this.uuidMap.get(name)!;
    }
}

function visitEnumDeclaration(context: TransformContext, node: ts.EnumDeclaration): ts.EnumDeclaration | ts.Node[] {
    const isConstEnum = node.modifiers?.some(mod => mod.kind === ts.SyntaxKind.ConstKeyword);
    
    if (isConstEnum) {
        console.log(`Processing const enum: ${node.name.text}`);
        
        return context.factory.updateEnumDeclaration(
            node,
            node.modifiers,
            node.name,
            context.factory.createNodeArray(
                node.members.map(member => {
                    const memberName = (member.name as ts.Identifier).text;
                    const uuidValue = context.getOrCreateUUID(`${node.name.text}_${memberName}`);
                    console.log(`Updated member ${memberName} with UUID: ${uuidValue}`);
                    return context.factory.updateEnumMember(
                        member,
                        member.name,
                        context.factory.createStringLiteral(uuidValue)
                    );
                })
            )
        );
    }
    return node;
}

function visitNode(context: TransformContext, node: ts.Node): ts.Node | ts.Node[] {
    if (ts.isEnumDeclaration(node)) {
        return visitEnumDeclaration(context, node);
    }

    // We encountered a node that we don't handle above,
    // but we should keep iterating the AST in case we find something we want to transform.
    return context.transform(node);
}
