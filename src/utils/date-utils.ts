export function formatDateToYYYYMMDD(date: Date | string) {
    const value = typeof date === "string" ? new Date(date) : date;
    return value.toISOString().slice(0, 10);
}
