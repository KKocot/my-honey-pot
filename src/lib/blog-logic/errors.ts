/**
 * Base error class for blog-logic operations
 */
export class WorkerBeeError extends Error {
  public constructor(message: string, public readonly originator?: Error | unknown) {
    super(message);
  }
}
