// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import fetch from 'node-fetch';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "getman" is now active!');

	const provider = new GetmanViewProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(GetmanViewProvider.viewType, provider));
}

// This method is called when your extension is deactivated
export function deactivate() {}

class GetmanViewProvider implements vscode.WebviewViewProvider {
	private _view?: vscode.WebviewView;

	public static readonly viewType = 'getman.fetch-view';

	constructor(
		private readonly _extensionUri: vscode.Uri,
	) { }

	resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext<unknown>, token: vscode.CancellationToken): void | Thenable<void> {
		this._view = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [
				this._extensionUri
			]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage((data) => {
			switch (data.type) {
				case 'request':
					{
						const { url, method, body, headers, useHost } = data;
						this._makeRequest(url, method, body, headers, useHost);
					}
				case 'debug': {
					console.log(data.message);
				}
			}
		});
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));

		// Do the same for the stylesheet.
		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));

		// Use a nonce to only allow a specific script to be run.
		const nonce = getNonce();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading styles from our extension directory,
					and only allow scripts that have a specific nonce.
					(See the 'webview-sample' extension sample for img-src content security policy examples)
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">
			</head>
			<body>
				<input type="text" id="url" class="styled-input" placeholder="Url" />
				<label for="method">Method</label>
				<select name="method" id="method" class="styled-input"> 
					<option value="GET">GET</option>
					<option value="POST">POST</option>
					<option value="PUT">PUT</option>
					<option value="DELETE">DELETE</option>
				</select>
				<textarea id="body" class="styled-input" placeholder="Body"></textarea>
				<div id="headers">
					<label>Headers</label>
					<input type="text" class="styled-input" disabled id="host" value="Header:<computed on launch>" />
					<input type="text" class="styled-input header" placeholder="Header" value="Accept:*/*" />
					<input type="text" class="styled-input header" placeholder="Header" value="Accept-encoding:gzip,deflate,br" />
					<input type="text" class="styled-input header" placeholder="Header" value="Connection:keep-alive" />
					<input type="text" class="styled-input header" placeholder="Header" value="User-Agent:PostmanRuntime/7.28.4" />
				</div>
				<div class="row">
					<label for="useHost">Use auto computed host header</label>	
					<input type="checkbox" id="useHost" checked/>
				</div>
				<div class="row">
					<button id="add-header">Add header</button>
					<button id="remove-header">Remove header</button>
				</div>
				<button id="fetch">Fetch</button>

				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}

	private async _makeRequest(url: string, method: string, body: string, headers: string[][], useHost : boolean) {
		try {
			if (!url.startsWith("https://") && !url.startsWith("http://")) {
				url = "https://" + url;
			}
			if (useHost) {
				const uri = new URL(url);
				headers.push(['Host', uri.host]);
			}
			const response = await fetch(url, {
				method,
				headers: Object.fromEntries(headers),
				body: method === "GET" ? null : body,
			});
			const document = await vscode.workspace.openTextDocument({ language: 'txt', content: await response.text() });
			await vscode.window.showTextDocument(document, { preview: false });
		} catch (error) {
			vscode.window.showErrorMessage('Error: ' + error);
		}
	}
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}