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
