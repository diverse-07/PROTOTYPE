import os
import subprocess
import pymupdf

DOCS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "docs"))
os.makedirs(DOCS_DIR, exist_ok=True)
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

COMMON_CSS = """
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600;700&display=swap');

@page {
    size: A4;
    margin: 18mm 16mm 18mm 16mm;
    @bottom-right {
        content: counter(page);
        font-family: 'Inter', sans-serif;
        font-size: 9pt;
        color: #64748B;
    }
    @bottom-left {
        content: "AEGIS-LEWS v2.0 · Government of India / MDoNER / NDMA";
        font-family: 'Inter', sans-serif;
        font-size: 8pt;
        color: #64748B;
    }
}

* {
    box-sizing: border-box;
}

body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #1E293B;
    line-height: 1.55;
    font-size: 10pt;
    margin: 0;
    padding: 0;
    background: #FFFFFF;
}

.cover-page {
    page-break-after: always;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 92vh;
    padding: 20px 10px;
}

.gov-header {
    border-bottom: 2px solid #003B73;
    padding-bottom: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.gov-title-group h2 {
    margin: 0;
    font-size: 13pt;
    font-weight: 800;
    color: #003B73;
    letter-spacing: -0.2px;
}

.gov-title-group h3 {
    margin: 2px 0 0 0;
    font-size: 9.5pt;
    font-weight: 600;
    color: #475569;
}

.doc-badge {
    background: #003B73;
    color: #FFFFFF;
    font-size: 8.5pt;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.cover-body {
    margin: 60px 0;
}

.cover-type {
    font-size: 11pt;
    font-weight: 700;
    color: #DC2626;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin-bottom: 8px;
}

.cover-title {
    font-size: 26pt;
    font-weight: 900;
    color: #0F172A;
    line-height: 1.15;
    letter-spacing: -0.8px;
    margin: 0 0 12px 0;
}

.cover-subtitle {
    font-size: 13pt;
    font-weight: 500;
    color: #475569;
    line-height: 1.4;
    margin: 0 0 30px 0;
}

.cover-meta-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 30px;
    font-size: 9pt;
}

.cover-meta-table td {
    padding: 8px 12px;
    border: 1px solid #E2E8F0;
}

.cover-meta-table td.label {
    background: #F8FAFC;
    font-weight: 700;
    color: #334155;
    width: 25%;
}

.cover-meta-table td.value {
    color: #0F172A;
    font-family: 'JetBrains Mono', monospace;
}

.cover-footer {
    border-top: 1px solid #E2E8F0;
    padding-top: 12px;
    font-size: 8pt;
    color: #64748B;
    display: flex;
    justify-content: space-between;
}

/* Document Body Styling */
h1 {
    font-size: 17pt;
    font-weight: 800;
    color: #003B73;
    border-bottom: 1.5px solid #CBD5E1;
    padding-bottom: 6px;
    margin-top: 28px;
    margin-bottom: 12px;
    page-break-after: avoid;
    letter-spacing: -0.3px;
}

h2 {
    font-size: 13pt;
    font-weight: 700;
    color: #1E293B;
    margin-top: 20px;
    margin-bottom: 8px;
    page-break-after: avoid;
    letter-spacing: -0.2px;
}

h3 {
    font-size: 10.5pt;
    font-weight: 700;
    color: #334155;
    margin-top: 14px;
    margin-bottom: 6px;
    page-break-after: avoid;
}

p {
    margin: 0 0 10px 0;
    text-align: justify;
}

ul, ol {
    margin: 0 0 12px 0;
    padding-left: 20px;
}

li {
    margin-bottom: 4px;
}

/* Tables */
table.data-table {
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0;
    font-size: 8.5pt;
    page-break-inside: avoid;
}

table.data-table th {
    background: #003B73;
    color: #FFFFFF;
    font-weight: 700;
    text-align: left;
    padding: 7px 10px;
    border: 1px solid #002C57;
}

table.data-table td {
    padding: 6px 10px;
    border: 1px solid #E2E8F0;
    vertical-align: top;
}

table.data-table tr:nth-child(even) td {
    background: #F8FAFC;
}

/* Callouts */
.callout {
    border-left: 4px solid #005B9E;
    background: #F0F7FC;
    padding: 10px 14px;
    margin: 14px 0;
    border-radius: 0 6px 6px 0;
    font-size: 9pt;
    page-break-inside: avoid;
}

.callout.danger {
    border-left-color: #DC2626;
    background: #FEF2F2;
}

.callout.warning {
    border-left-color: #D97706;
    background: #FFFBEB;
}

.callout.success {
    border-left-color: #16A34A;
    background: #F0FDF4;
}

.callout-title {
    font-weight: 700;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
}

.callout.danger .callout-title { color: #991B1B; }
.callout.warning .callout-title { color: #92400E; }
.callout.success .callout-title { color: #166534; }
.callout .callout-title { color: #003B73; }

/* Code and Pre */
code {
    font-family: 'JetBrains Mono', Consolas, monospace;
    font-size: 8.5pt;
    background: #F1F5F9;
    padding: 2px 4px;
    border-radius: 3px;
    color: #0F172A;
}

pre {
    background: #0F172A;
    color: #F8FAFC;
    font-family: 'JetBrains Mono', Consolas, monospace;
    font-size: 8pt;
    padding: 12px;
    border-radius: 6px;
    overflow-x: auto;
    margin: 12px 0;
    line-height: 1.4;
    page-break-inside: avoid;
}

.badge {
    display: inline-block;
    padding: 2px 6px;
    font-size: 7.5pt;
    font-weight: 700;
    border-radius: 3px;
    text-transform: uppercase;
}
.badge-red { background: #FEE2E2; color: #991B1B; border: 1px solid #FCA5A5; }
.badge-green { background: #DCFCE7; color: #166534; border: 1px solid #86EFAC; }
.badge-blue { background: #DBEAFE; color: #1E40AF; border: 1px solid #93C5FD; }
.badge-amber { background: #FEF3C7; color: #92400E; border: 1px solid #FCD34D; }

.section-page {
    page-break-before: always;
}

.formula-box {
    background: #F8FAFC;
    border: 1px solid #CBD5E1;
    border-left: 4px solid #003B73;
    padding: 10px 14px;
    margin: 12px 0;
    font-family: 'JetBrains Mono', monospace;
    font-size: 9pt;
    border-radius: 0 4px 4px 0;
    page-break-inside: avoid;
}
"""

def generate_pdf_from_html(html_content, output_pdf_path):
    temp_html_path = output_pdf_path.replace(".pdf", ".html")
    with open(temp_html_path, "w", encoding="utf-8") as f:
        f.write(html_content)

    url = "file:///" + os.path.abspath(temp_html_path).replace("\\", "/")
    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--run-all-compositor-stages-before-draw",
        f"--print-to-pdf={os.path.abspath(output_pdf_path)}",
        url
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"Error compiling {output_pdf_path}: {res.stderr}")
    else:
        doc = pymupdf.open(output_pdf_path)
        print(f"Successfully generated: {os.path.basename(output_pdf_path)} ({len(doc)} pages, {os.path.getsize(output_pdf_path):,} bytes)")
        doc.close()
    return temp_html_path

print("PDF generator engine loaded successfully.")
