export default function nullthrows<T>(
  x: T | null | undefined,
  message = undefined
): T {
  if (x != null) {
    return x;
  }
  throw new Error(message !== undefined ? message : "Got unexpected " + x);
}
