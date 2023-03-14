'use strict';
import * as vscode from 'vscode';
import * as azdata from 'azdata';

export function activate(context: vscode.ExtensionContext) {

  let disposable = vscode.commands.registerCommand('star-unpacker.replaceSelectStar', async () => {

    const editor = vscode.window.activeTextEditor;

    if (editor) {

      if (!await isConnectedToDatabase()) {
        vscode.window.showErrorMessage('You must be connected to a database to use this command');
        return;
      }
            const document = editor.document;
      const selection = editor.selection;
      const text = document.getText(selection);

      const regex = /SELECT\s+\*\s+FROM\s+(\w+)/i;
      const match = regex.exec(text);

      if (match) {
        const tableName = match[1];
        const columns = await getColumns(tableName);

        const newText = text.replace(/\*/, columns.join(', '));
        editor.edit(editBuilder => {
          editBuilder.replace(selection, newText);
        });
      }
    }
  });

  context.subscriptions.push(disposable);
}

async function isConnectedToDatabase(): Promise<boolean> {
  try {
      const connection = await azdata.connection.getCurrentConnection();
      console.log('the connection');
      console.log(connection);
      return !!connection;
  } catch (error) {
      console.error(error);
      return false;
  }
}

async function getColumns(tableName: string): Promise<string[]> {

  const connection = await azdata.connection.getCurrentConnection();
  const provider = azdata.dataprotocol.getProvider<azdata.QueryProvider>(connection.providerId, azdata.DataProviderType.QueryProvider);
  const query = `SELECT column_name FROM information_schema.columns WHERE table_name = '${tableName}'`;
  const result = await provider.runQueryAndReturn(connection.connectionId, query);

  return result.rows.map(row => row[0].displayValue);
}

// this method is called when your extension is deactivated
export function deactivate() {
}