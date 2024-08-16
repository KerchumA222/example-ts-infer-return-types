class Something {
    public static ExamplePublicStaticMethod(input: string) {
        return input.toLocaleLowerCase();
    }

    public Example6(input: string) {
        return input.length;
    }

    private NotPublic(input: string) {
        return !input.length;
    }
}