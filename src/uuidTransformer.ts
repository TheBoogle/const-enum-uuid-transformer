import * as ts from "typescript";

function uuidTransformer(program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
    process.stdout.write('Starting transformer...\n');

    return (context: ts.TransformationContext) => {
        return (sourceFile: ts.SourceFile): ts.SourceFile => {
            process.stdout.write(`Processing source file: ${sourceFile.fileName}\n`);

            const visit: ts.Visitor = (node: ts.Node) => {
                // Log the kind and the text of each node
                const nodeKind = ts.SyntaxKind[node.kind];
                let nodeText = "";
                
                // Only log the first 100 characters of the node text to avoid massive logs
                try {
                    nodeText = node.getText().substring(0, 100);
                } catch {
                    nodeText = "<no text available>";
                }

                process.stdout.write(`Node kind: ${nodeKind}, Node text: ${nodeText}\n`);

                // Continue visiting child nodes
                return ts.visitEachChild(node, visit, context);
            };

            const result = ts.visitNode(sourceFile, visit);
            process.stdout.write(`Finished processing file: ${sourceFile.fileName}\n`);
            return result;
        };
    };
}

export default uuidTransformer;
