declare module 'tone' {
    export class Player {
        disconnect(arg0: any) {
            throw new Error("Method not implemented.");
        }
        onerror: (err: Error) => void;
        constructor(option?: {
            url?: string;
            loop?: boolean;
            autostart?: boolean;
            onload?: () => void;
        });
        start(): this;
        stop(): this;
        connect(node: any): this;
        dispose(): this;
    }

    export class Panner {
        constructor(pan?: number);
        connect(node: any): this;
        dispose(): this;
        volume: {
            value: number;
        };
        pan: {
            value: number;
        };
    }

    export class Volume {
        constructor(volume?: number);
        connect(node: any): this;
        toDestination(): this;
        dispose(): this;
        volume: {
            value: number;
        };
        mute: boolean;
    }

    export class Analyser {
        constructor(type?: string, size?: number);
        getValue(): Float32Array;
        dispose(): this;
    }

    export function start(): Promise<void>;

    export const context: {
        state: string;
    };

    export function getContext() {
        throw new Error('Function not implemented.');
    }

    export function getDestination(): any {
        throw new Error('Function not implemented.');
    }
}