export function validateUsername(username: string) {
    return (username.length > 1 && username.length < 24);
}