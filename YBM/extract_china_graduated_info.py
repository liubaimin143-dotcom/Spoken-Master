import pypdf

pdf_path = r"e:\APP\LanguageMaster\SpokenMaster\YBM\manual_en.pdf"

try:
    reader = pypdf.PdfReader(pdf_path)
    # Target specific pages for "Since you've selected... Mainland China, Graduated"
    # Based on index/TOC, likely around page 6-10, let's scan a wider range to be safe and grep
    
    found_content = []
    start_page = 6
    end_page = 13
    
    for i in range(start_page, end_page):
        if i < len(reader.pages):
            text = reader.pages[i].extract_text()
            # Simple keyword check to find the relevant section
            if "Mainland China" in text and "Graduated" in text:
                 found_content.append(f"--- Page {i+1} ---\n{text}\n")
            # Also capture the page immediately following a match in case content spills over
            elif found_content and "--- Page" in found_content[-1] and str(i) not in found_content[-1]:
                 found_content.append(f"--- Page {i+1} ---\n{text}\n")

    print("\n".join(found_content))

except Exception as e:
    print(f"Error: {e}")
