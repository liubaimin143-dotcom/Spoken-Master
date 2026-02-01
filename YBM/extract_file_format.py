import pypdf

pdf_path = r"e:\APP\LanguageMaster\SpokenMaster\YBM\manual_en.pdf"

try:
    reader = pypdf.PdfReader(pdf_path)
    
    found_content = []
    # Search for specific file format instructions
    keywords = ["format", "pdf", "jpg", "jpeg", "upload", "size", "MB"]
    
    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        if any(keyword in text.lower() for keyword in keywords):
             # Extract the context around the keyword if possible, or just the whole page content 
             # (using full page content for now to minimize missing context)
             found_content.append(f"--- Page {i+1} ---\n{text}\n")

    if found_content:
        print("\n".join(found_content))
    else:
        print("No specific file format instructions found.")

except Exception as e:
    print(f"Error: {e}")
