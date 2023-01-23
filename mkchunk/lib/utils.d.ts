export declare function getArgs(): {
    [x: string]: unknown;
    _: (string | number)[];
    $0: string;
};
export declare function prompt(data: any): Promise<any>;
export declare function chunkString(str: string, length: number): string[];
export declare function byteSizeOfString(str: string): number;
