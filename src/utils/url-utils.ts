export function getDir(entryId: string): string {
    const normalized = entryId.replace(/\\/g, "/");
    const last = normalized.lastIndexOf("/");
    if (last <= 0) {
        return "";
    }
    return normalized.slice(0, last);
}
