export const getInitials = (
    value?: string
) => {
    if (!value) return "HA";

    return value
        .substring(0, 2)
        .toUpperCase();
};

export const formatDate = (
    date: string
) => {
    return new Date(
        date
    ).toLocaleDateString();
};