export function inject<T = unknown>(array: T[], injectable: T, injection: Partial<T>) {
    return array?.map((item) =>
        item === injectable
            ? {
                ...item,
                ...injection,
            }
            : item,
    );
}


export const waitTime = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));