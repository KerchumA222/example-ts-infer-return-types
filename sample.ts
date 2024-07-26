// Purpose: Sample file for testing 
export const Example = (input: string) => {
    return input.toLocaleLowerCase();
}

const doNotFindThisArrowFunction = (input: string) => {
    return input.toLocaleLowerCase();
}

const doNotFindThisFunction = function(input: string) {
    return input.toLocaleLowerCase();
}

const doNotFindThisVariable = 'doNotFindThisVariable';

export function Example2(input: string) {
    return input.toLocaleLowerCase();
}

export function Example3(input: string) {
    const a = 1;
    return a+input;
}

export function Example4(input: string) {
    return
}

export function ExampleUnion(input: string) {
    if (input === 'a') {
        return input;
    } else if (input === 'b') {
        return 5;
    }
}

type ExampleType = {something: string};
export function ExampleExampleType(input: string): ExampleType {
    return {something: input};
}


class Something {
    public static Example5(input: string) {
        return input.toLocaleLowerCase();
    }
}

export default {
    "I don't care about this object": 0
}