declare module "bun:test" {
  interface Matchers<T> {
    toBeInTheDocument(): T;
    toBeDisabled(): T;
    toBeChecked(): T;
    toHaveValue(value: string | number | string[]): T;
  }
}
