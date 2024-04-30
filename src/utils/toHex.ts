export function toHex(value: number) {
    let hex = value.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}