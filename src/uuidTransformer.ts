import * as ts from "typescript";
import { v4 as uuidv4 } from "uuid";

const uuidMap: Map<string, string> = new Map();

function getOrCreateUUID(name: string): string {
    if (!uuidMap.has(name)) {
        uuidMap.set(name, uuidv4());
    }
    return uuidMap.get(name)!;
}

function uuidTransformer(program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
    return (context: ts.TransformationContext) => {
        return (sourceFile: ts.SourceFile): ts.SourceFile => {
            const visit: ts.Visitor = (node: ts.Node) => {
                if (ts.isEnumDeclaration(node) && node.modifiers?.some(mod => mod.kind === ts.SyntaxKind.ConstKeyword)) {
                    return ts.factory.updateEnumDeclaration(
                        node,
                        node.modifiers, // Keep the modifiers
                        node.name,      // Keep the name
                        ts.factory.createNodeArray(
                            node.members.map(member => {
                                const memberName = (member.name as ts.Identifier).text;
                                const uuidValue = getOrCreateUUID(`${node.name.text}_${memberName}`);
                                return ts.factory.updateEnumMember(
                                    member,
                                    member.name,
                                    ts.factory.createStringLiteral(uuidValue)
                                );
                            })
                        )
                    );
                }
                return ts.visitEachChild(node, visit, context);
            };

            return ts.visitEachChild(sourceFile, visit, context);
        };
    };
}

export default uuidTransformer;
