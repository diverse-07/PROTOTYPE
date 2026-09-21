import os
import sys
import subprocess
import pymupdf

DOCS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "docs"))
os.makedirs(DOCS_DIR, exist_ok=True)
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

def render_cover_page(doc_type, title, subtitle, doc_id, version, classification, author, reviewer, date_str):
    return f"""
    <div class="cover-page">
        <div class="gov-header">
            <div class="gov-title-group">
                <h2>GOVERNMENT OF INDIA · MINISTRY OF DEVELOPMENT OF NORTH EASTERN REGION</h2>
                <h3>National Disaster Management Division · North Eastern Regional Landslide Early Warning System</h3>
            </div>
            <div class="doc-badge">{classification}</div>
        </div>

        <div class="cover-body">
            <div class="cover-type">{doc_type}</div>
            <h1 class="cover-title">{title}</h1>
            <div class="cover-subtitle">{subtitle}</div>

            <table class="cover-meta-table">
                <tr>
                    <td class="label">Document ID</td>
                    <td class="value">{doc_id}</td>
                    <td class="label">Release Version</td>
                    <td class="value">{version}</td>
                </tr>
                <tr>
                    <td class="label">System Designation</td>
                    <td class="value">AEGIS-LEWS v2.0 (Autonomous Geotechnical Early Warning)</td>
                    <td class="label">Release Date</td>
                    <td class="value">{date_str}</td>
                </tr>
                <tr>
                    <td class="label">Author / Lead</td>
                    <td class="value">{author}</td>
                    <td class="label">Reviewed / Approved By</td>
                    <td class="value">{reviewer}</td>
                </tr>
                <tr>
                    <td class="label">Security Clearance</td>
                    <td class="value">NIC-CERT-IN Level-4 · Restricted Official Distribution</td>
                    <td class="label">Target Environments</td>
                    <td class="value">NER 8 States EOC Command &amp; Citizen P2P Mesh</td>
                </tr>
            </table>
        </div>

        <div class="cover-footer">
            <span>National Informatics Centre (NIC) · Disaster Management Cyberinfrastructure</span>
            <span>Emergency Coordination Helpline: 1078 / 112 · Confidential</span>
        </div>
    </div>
    """

def compile_pdf(html_content, output_name):
    pdf_path = os.path.join(DOCS_DIR, output_name)
    html_path = os.path.join(DOCS_DIR, output_name.replace(".pdf", ".html"))
    
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html_content)

    url = "file:///" + html_path.replace("\\", "/")
    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--run-all-compositor-stages-before-draw",
        f"--print-to-pdf={pdf_path}",
        url
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"Failed to generate {output_name}: {res.stderr}")
        return None
    else:
        doc = pymupdf.open(pdf_path)
        pages = len(doc)
        size = os.path.getsize(pdf_path)
        doc.close()
        print(f"[OK] {output_name} -> {pages} pages ({size:,} bytes)")
        return pdf_path

print("Document generator helper initialized.")
