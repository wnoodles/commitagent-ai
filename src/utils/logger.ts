import * as vscode from 'vscode';

export class Logger implements vscode.Disposable {
  private readonly channel = vscode.window.createOutputChannel('CommitAgent AI');

  info(message: string): void {
    this.channel.appendLine(`[INFO] ${message}`);
  }

  error(message: string, error?: unknown): void {
    this.channel.appendLine(`[ERROR] ${message}`);
    if (error instanceof Error) {
      this.channel.appendLine(error.stack ?? error.message);
    }
  }

  show(): void {
    this.channel.show(true);
  }

  dispose(): void {
    this.channel.dispose();
  }
}
