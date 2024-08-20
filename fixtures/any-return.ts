export function ThisReturnsAny(something: any): any {
    // this method returns implicit any; the tool should not set this to explicit any
    return something;
};
