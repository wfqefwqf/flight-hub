declare module 'msfs-simconnect-api-wrapper' {
  export class MSFS_API {
    connect(options?: {
      autoReconnect?: boolean;
      retries?: number;
      retryInterval?: number;
      onConnect?: () => void;
      onRetry?: (retriesLeft: number, retryInterval: number) => void;
      onException?: (exceptionName: string) => void;
      host?: string;
      port?: number;
    }): void;

    schedule(
      handler: (data: Record<string, number | string>) => void | Promise<void>,
      interval: number,
      ...propNames: string[]
    ): () => void;
  }
}
