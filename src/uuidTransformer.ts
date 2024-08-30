import * as ts from "typescript";

function uuidTransformer(program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
    return (context: ts.TransformationContext) => {
        return (sourceFile: ts.SourceFile): ts.SourceFile => {
            process.stdout.write(`Processing file: ${sourceFile.fileName}\n`);

            const visit: ts.Visitor = (node: ts.Node) => {
                // Log the kind of every node encountered
                process.stdout.write(`Visiting node: ${ts.SyntaxKind[node.kind]}\n`);

                if (ts.isEnumDeclaration(node)) {
                    const isConstEnum = node.modifiers?.some(mod => mod.kind === ts.SyntaxKind.ConstKeyword);
                    process.stdout.write(`Found enum: ${node.name.text}, isConst: ${isConstEnum}\n`);

                    if (isConstEnum) {
                        process.stdout.write(`Processing const enum: ${node.name.text}\n`);

                        return ts.factory.updateEnumDeclaration(
                            node,
                            node.modifiers,
                            node.name,
                            ts.factory.createNodeArray(
                                node.members.map(member => {
                                    const memberName = (member.name as ts.Identifier).text;
                                    process.stdout.write(`Processing member: ${memberName}\n`);
                                    return ts.factory.updateEnumMember(
                                        member,
                                        member.name,
                                        ts.factory.createStringLiteral(`UUID_${memberName}`)
                                    );
                                })
                            )
                        );
                    }
                }

                return ts.visitEachChild(node, visit, context);
            };

            return ts.visitNode(sourceFile, visit);
        };
    };
}

export default uuidTransformer;
