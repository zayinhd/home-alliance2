import { Alert, Platform } from "react-native";

type SharingModule = typeof import("expo-sharing");
type PrintModule = typeof import("expo-print");
type FileSystemModule = typeof import("expo-file-system/legacy");

const getSharingModule = async (): Promise<SharingModule | null> => {
    try {
        return await import("expo-sharing");
    } catch {
        return null;
    }
};

const getPrintModule = async (): Promise<PrintModule | null> => {
    try {
        return await import("expo-print");
    } catch {
        return null;
    }
};

const getFileSystemModule = async (): Promise<FileSystemModule | null> => {
    try {
        return await import("expo-file-system/legacy");
    } catch {
        return null;
    }
};

interface ExportTableAsPdfParams {
    title: string;
    subtitle?: string;
    headers: string[];
    rows: string[][];
    fileName: string;
    successMessage?: string;
}

const escapeHtml = (value: string) =>
    value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

const sanitizeFileName = (value: string) =>
    value.replace(/[^a-zA-Z0-9-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

const buildReportHtml = ({
    title,
    subtitle,
    headers,
    rows,
}: Pick<ExportTableAsPdfParams, "title" | "subtitle" | "headers" | "rows">) => `
<!DOCTYPE html>
<html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
            :root {
                color-scheme: light;
            }

            * {
                box-sizing: border-box;
            }

            body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                margin: 0;
                padding: 32px;
                color: #111827;
                background: #f9fafb;
            }

            .page {
                background: #ffffff;
                border: 1px solid #e5e7eb;
                border-radius: 20px;
                padding: 24px;
            }

            .eyebrow {
                margin: 0 0 8px;
                font-size: 12px;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: #6b7280;
            }

            h1 {
                margin: 0;
                font-size: 28px;
                line-height: 1.2;
            }

            .subtitle {
                margin: 8px 0 0;
                color: #4b5563;
                font-size: 14px;
            }

            .meta {
                margin-top: 14px;
                color: #6b7280;
                font-size: 12px;
            }

            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
            }

            th, td {
                border-bottom: 1px solid #e5e7eb;
                padding: 12px 10px;
                text-align: left;
                vertical-align: top;
                font-size: 12px;
            }

            th {
                background: #f3f4f6;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.06em;
                color: #374151;
            }

            tr:last-child td {
                border-bottom: none;
            }

            .empty {
                padding: 24px 10px;
                color: #6b7280;
            }
        </style>
    </head>
    <body>
        <section class="page">
            <p class="eyebrow">Home Alliance Report</p>
            <h1>${escapeHtml(title)}</h1>
            ${subtitle ? `<p class="subtitle">${escapeHtml(subtitle)}</p>` : ""}
            <div class="meta">Generated on ${escapeHtml(new Date().toLocaleString())}</div>
            <table>
                <thead>
                    <tr>
                        ${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}
                    </tr>
                </thead>
                <tbody>
                    ${rows.length > 0 ? rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("") : `<tr><td class="empty" colspan="${headers.length}">No records found.</td></tr>`}
                </tbody>
            </table>
        </section>
    </body>
</html>
`;

export const exportReportAsPdf = async ({
    title,
    subtitle,
    headers,
    rows,
    fileName,
    successMessage,
}: ExportTableAsPdfParams) => {
    const print = await getPrintModule();

    if (!print) {
        throw new Error(
            "expo-print native module is unavailable in this app binary. Rebuild and reinstall your development build after adding expo-print.",
        );
    }

    const sharing = await getSharingModule();
    const fileSystem = await getFileSystemModule();
    const html = buildReportHtml({ title, subtitle, headers, rows });

    if (Platform.OS === "web") {
        await print.printAsync({ html });
        return;
    }

    try {
        const { uri } = await print.printToFileAsync({ html });
        let pdfUri = uri;

        if (fileSystem?.documentDirectory && fileSystem.copyAsync) {
            const safeName = sanitizeFileName(fileName) || `report-${Date.now()}`;
            const finalName = safeName.toLowerCase().endsWith(".pdf")
                ? safeName
                : `${safeName}.pdf`;
            const destination = `${fileSystem.documentDirectory}${finalName}`;

            await fileSystem.copyAsync({ from: uri, to: destination });
            pdfUri = destination;
        }

        if (sharing && (await sharing.isAvailableAsync())) {
            await sharing.shareAsync(pdfUri, {
                dialogTitle: `Share ${title}`,
                mimeType: "application/pdf",
                UTI: ".pdf",
            });
            return;
        }

        Alert.alert(
            "Download complete",
            successMessage || "Report saved as a PDF.",
        );
        return;
    } catch (error: any) {
        throw new Error(error?.message || "Unable to generate the PDF report.");
    }
};
