type Split<Input extends string, Separator extends string = ""> = 
    Input extends ""
        ? []
        : Input extends `${infer Start}${Separator}${infer End}`
            ? Start extends `${infer Start}\\`
                ? JoinToFirst<`${Start}${Separator}`, Split<End, Separator>>
                : [Start, ...Split<End, Separator>]
            : [Input];

type JoinToFirst<Start extends string, Rest extends readonly string[]> = 
    Rest extends [infer First, ...infer Rest] 
        ? [`${Start}${First & string}`, ...Rest] 
        : [Start];

type Join<A extends unknown[], Sep extends string = ""> = 
    A extends readonly [infer Head, ...infer Rest]
        ? Join<Rest, Sep> extends ""
            ? `${Head & (string | number | bigint | boolean)}`
            : `${Head & (string | number | bigint | boolean)}${Sep}${Join<Rest, Sep>}`
        : "";

type WhiteSpaceCharacter = " " | "\n";
type StringTerminator = "\"" | "'";

type TrimEnd<T extends string> = T extends `${infer Rest}${WhiteSpaceCharacter}` ? TrimEnd<Rest> : T;
type TrimStart<T extends string> = T extends `${WhiteSpaceCharacter}${infer Rest}` ? TrimStart<Rest> : T;
type Trim<T extends string> = TrimEnd<TrimStart<T>>;

type TypeMap = {
    "string": string;
    "number": number;
    "boolean": boolean;
    "date": Date;
    "bigint": bigint;
    "undefined": undefined;
    "null": null;
    "any": string;
    "char": string;
    "duration": number;
    "integer": number;
    "regex": RegExp;
};

type ResolveTypeInternal<T extends string, IsLast extends boolean, InArray extends boolean = false> = 
    T extends keyof TypeMap
        ? TypeMap[T]
        : T extends `${infer Type}[]`
            ? IsLast extends true
                ? InArray extends true
                    ? "SyntaxError: Array types can't be nested."
                    : ResolveTypeInternal<Type, IsLast, true> extends `${infer ErrorType}Error: ${infer ErrorMessage}`
                        ? ResolveTypeInternal<Type, IsLast, true>
                        : ResolveTypeInternal<Type, IsLast, true>[]
                : "SyntaxError: Array types must be last."
            : T extends `"${infer String}"`
                ? String
                : T extends `'${infer String}'`
                    ? String
                    : T extends `${StringTerminator}${string}`
                        ? "SyntaxError: Unterminated string literal."
                        : T extends `${string}${StringTerminator}`
                               ? "SyntaxError: Unterminated string literal."
                                : unknown;

type ResolveTypeHelper<A, IsLast extends boolean> = 
    A extends [infer Head, ...infer Rest] 
        ? [ResolveTypeInternal<Trim<Head & string>, IsLast>, ...ResolveTypeHelper<Rest, IsLast>] 
        : []

type ResolveType<T extends string, IsLast extends boolean> = ResolveTypeHelper<Split<T, "|">, IsLast>;

type ParseOptions = {
    readonly $?: string;
    readonly strict?: boolean;
}

type ParseInternal<S extends string, Options extends ParseOptions, Results extends unknown[] = []> = 
    S extends `[${infer Types}]${infer Rest}`
        ? ParseInternal<Trim<Rest>, Options, [...Results, ResolveType<Types, Rest extends "" ? true : false>[number] | undefined]>
        : S extends `<${infer Types}>${infer Rest}`
            ? ParseInternal<Trim<Rest>, Options, [...Results, ResolveType<Types, Rest extends "" ? true : false>[number]]>
            : S extends `\$${infer Rest}`
                ? Options["$"] extends string
                    ? ParseInternal<Trim<Rest>, Options, [...Results, Options["$"]]>
                    : Options["$"] extends undefined | unknown
                        ? ParseInternal<Trim<Rest>, Options, [...Results, "TypeError: Special symbol '$' requires a value to be used."]>
                        : S extends ""
                            ? Results
                            : [...Results, "SyntaxError: Invalid metasyntax."]
                : S extends ""
                    ? Results
                    : [...Results, "TypeError: Option '$' must be of type string."]

type Parse<S extends string, Options extends ParseOptions = {
    $: undefined;
    strict: true;
}> = ParseInternal<Options["strict"] extends true ? Trim<S> : S, Options>;
