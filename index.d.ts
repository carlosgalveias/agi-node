
export interface AGIRequest {
    request: string;
    channel: string;
    language: string;
    type: "SIP" | string;
    uniqueid: string;
    version: string;
    callerid: string | "unknown";
    calleridname: string | "unknown";
    callingpres: string;
    callingani2: string;
    callington: string;
    callingtns: string;
    dnid: string;
    rdnis: string | "unknown";
    context: string;
    extension: string;
    priority: string;
    enhanced: string;
    accountcode: string;
    threadid: string;
}

export class AGIChannel {
    private constructor(...args: any[]);
    request: AGIRequest;
    cmdId: number;
    answer(): Promise<number>;
    channelStatus(): Promise<ChannelStatus>;
    continueAt(context: string, extension?: string, priority?: number): Promise<void>;
    exec(applicationName: string, applicationParameters): Promise<any>;
    getData(file: string, timeout: number, maxDigits: number): Promise<any>;
    getVariable(variableName: string): Promise<string | null>;
    noop(): Promise<void>;
    recordFile(
        file?: string,
        format?: string,
        escapeDigits?: string,
        timeout?: number,
        silenceSeconds?: number,
        beep?: boolean
    ): Promise<any>;
    setContext(context: string): Promise<any>;
    setExtension(extension): Promise<any>;
    setPriority(priority: number): Promise<any>;
    setVariable(variable, value): Promise<any>;
    streamFile(file: string, escapeDigits?: string): Promise<{
        rawReply: string;
        code: number;
        attributes: {
            result: string;
            endpos: string
        }
    }>;
    hangup(): Promise<any>;
    getFullVariable(): Promise<any | null>;
}

export interface Mapper {
    (channel: AGIChannel): Promise<void>;
}


export class AsyncAGIServer {
    constructor(
        mapper: Mapper | { [scriptName: string]: Mapper },
        amiConnection: any
    );
}

export class AGIServer {
    constructor(
        mapper: Mapper | { [scriptName: string]: Mapper },
        port: number
    );
}

export enum ChannelStatus {
    DOWN_AVAILABLE= 0,
    DOWN_RESERVED= 1,
    OFF_HOOK= 2,
    DIGITS_DIALED= 3,
    LINE_RINGING= 4,
    REMOTE_END_RINGING= 5,
    LINE_UP= 6,
    LINE_BUSY= 7
}
