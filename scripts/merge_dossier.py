import os
import pymupdf

DOCS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "docs"))

DOCUMENTS = [
    ("01_PRD_AEGIS_LEWS.pdf", "1. Product Requirements Document (PRD)"),
    ("02_SRS_AEGIS_LEWS.pdf", "2. Software Requirements Specification (IEEE 830)"),
    ("03_SDD_TDD_AEGIS_LEWS.pdf", "3. Software & Technical Design Document (SDD/TDD)"),
    ("04_API_DOCUMENTATION_AEGIS_LEWS.pdf", "4. API Specification & Interface Control (ICD)"),
    ("05_TEST_PLAN_STRATEGY_AEGIS_LEWS.pdf", "5. Test Plan & QA Strategy (IEEE 829)")
]

def merge_all_docs():
    master_doc = pymupdf.open()
    toc = []
    current_page = 0

    for filename, title in DOCUMENTS:
        filepath = os.path.join(DOCS_DIR, filename)
        if not os.path.exists(filepath):
            print(f"Warning: {filename} not found, skipping.")
            continue

        doc = pymupdf.open(filepath)
        page_count = len(doc)
        
        # Add bookmark/TOC entry (level 1)
        toc.append([1, title, current_page + 1])
        
        # Insert pages into master document
        master_doc.insert_pdf(doc)
        doc.close()
        
        print(f"Merged {filename}: {page_count} pages (starting at page {current_page + 1})")
        current_page += page_count

    master_doc.set_toc(toc)
    
    output_path = os.path.join(DOCS_DIR, "AEGIS_LEWS_MASTER_ENGINEERING_DOSSIER.pdf")
    master_doc.save(output_path)
    final_page_count = len(master_doc)
    file_size = os.path.getsize(output_path)
    master_doc.close()

    print(f"\n[SUCCESS] Master Engineering Dossier created:")
    print(f"Path: {output_path}")
    print(f"Total Pages: {final_page_count}")
    print(f"Total Size: {file_size:,} bytes")
    return output_path

if __name__ == "__main__":
    merge_all_docs()
