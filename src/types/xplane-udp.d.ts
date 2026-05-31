declare module 'xplane-udp' {
  export class XPlaneClient {
    constructor(port: number);
    start(): void;
    stop?(): void;
    close?(): void;
    on(event: 'updated', handler: (data: any) => void): void;
  }
}
