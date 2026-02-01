import sys
import importlib.util

def check_install(package_name):
    spec = importlib.util.find_spec(package_name)
    return spec is not None

# Check for pypdf or PyPDF2
has_pypdf = check_install("pypdf")
has_PyPDF2 = check_install("PyPDF2")

if not has_pypdf and not has_PyPDF2:
    print("MISSING_LIB")
    sys.exit(0)

try:
    if has_pypdf:
        import pypdf
    else:
        import PyPDF2 as pypdf
except ImportError:
    print("Import Error")
    sys.exit(1)

pdf_path = r"e:\APP\LanguageMaster\SpokenMaster\YBM\manual_en.pdf"

try:
    reader = pypdf.PdfReader(pdf_path)
    
    found_content = []
    # extracting text related to PSD
    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        if "PSD" in text or "psd" in text or "certificate" in text.lower(): # looking for PSD or certificate application
            found_content.append(f"--- Page {i+1} ---\n{text}\n")
    
    if found_content:
        # Print only the first 5000 characters to avoid buffer limits, focused on finding the procedure
        full_text = "\n".join(found_content)
        print(full_text[:10000]) 
    else:
        print("No specific 'PSD' text found, dumping first 3 pages to check contents.")
        for i in range(min(3, len(reader.pages))):
             print(f"--- Page {i+1} ---\n{reader.pages[i].extract_text()}\n")

except Exception as e:
    print(f"Error: {e}")
