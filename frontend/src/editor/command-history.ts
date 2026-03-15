/**
 * Command pattern for undo/redo support.
 */
export interface Command {
  execute(): void;
  undo(): void;
  readonly description: string;
}

/**
 * Groups multiple commands into a single undoable step.
 */
export class CompositeCommand implements Command {
  readonly description: string;
  private commands: Command[];

  constructor(description: string, commands: Command[]) {
    this.description = description;
    this.commands = commands;
  }

  execute(): void {
    for (const cmd of this.commands) {
      cmd.execute();
    }
  }

  undo(): void {
    // Undo in reverse order
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].undo();
    }
  }
}

/**
 * Manages undo/redo stacks of commands.
 */
export class CommandHistory {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private _onChange?: () => void;

  constructor(onChange?: () => void) {
    this._onChange = onChange;
  }

  /** Execute a command and push it onto the undo stack. Clears redo stack. */
  execute(command: Command): void {
    command.execute();
    this.undoStack.push(command);
    this.redoStack = [];
    this._onChange?.();
  }

  /** Undo the last command. */
  undo(): boolean {
    const command = this.undoStack.pop();
    if (!command) return false;
    command.undo();
    this.redoStack.push(command);
    this._onChange?.();
    return true;
  }

  /** Redo the last undone command. */
  redo(): boolean {
    const command = this.redoStack.pop();
    if (!command) return false;
    command.execute();
    this.undoStack.push(command);
    this._onChange?.();
    return true;
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this._onChange?.();
  }
}
