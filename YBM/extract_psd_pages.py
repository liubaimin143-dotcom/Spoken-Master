import pypdf

pdf_path = r"e:\APP\LanguageMaster\SpokenMaster\YBM\manual_en.pdf"

try:
    reader = pypdf.PdfReader(pdf_path)
    
    # Read pages 2 to 6 (index 1 to 5) to capture the start of instructions
    for i in range(1, 6):
        if i < len(reader.pages):
            print(f"--- Page {i+1} ---\n{reader.pages[i].extract_text()}\n")

except Exception as e:
    print(f"Error: {e}")
