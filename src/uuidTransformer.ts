import * as ts from "typescript";
import { v4 as uuidv4 } from "uuid";

const uuidMap: Map<string, string> = new Map();

function getOrCreateUUID(name: string): string {
    if (!uuidMap.has(name)) {
        const uuid = uuidv4();
        uuidMap.set(name, uuid);
        process.stdout.write(`Generated new UUID for ${name}: ${uuid}\n`);
    } else {
        process.stdout.write(`Using cached UUID for ${name}: ${uuidMap.get(name)}\n`);
    }
    return uuidMap.get(name)!;
}

function uuidTransformer(program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
    process.stdout.write('Starting transformer...\n');

    return (context: ts.TransformationContext) => {
        return (sourceFile: ts.SourceFile): ts.SourceFile => {
            process.stdout.write(`Processing source file: ${sourceFile.fileName}\n`);

            const visit: ts.Visitor = (node: ts.Node) => {
                if (ts.isEnumDeclaration(node) && node.modifiers?.some(mod => mod.kind === ts.SyntaxKind.ConstKeyword)) {
                    process.stdout.write(`Found const enum: ${node.name.text}\n`);

                    return ts.factory.updateEnumDeclaration(
                        node,
                        node.modifiers, // Keep the modifiers
                        node.name,      // Keep the name
                        ts.factory.createNodeArray(
                            node.members.map(member => {
                                const memberName = (member.name as ts.Identifier).text;
                                process.stdout.write(`Processing enum member: ${memberName}\n`);

                                const uuidValue = getOrCreateUUID(`${node.name.text}_${memberName}`);
                                process.stdout.write(`Updated member ${memberName} with UUID: ${uuidValue}\n`);

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

            const result = ts.visitEachChild(sourceFile, visit, context);
            process.stdout.write(`Finished processing file: ${sourceFile.fileName}\n`);
            return result;
        };
    };
}

export default uuidTransformer;
