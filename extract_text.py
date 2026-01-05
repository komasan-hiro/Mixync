import sys

try:
    from pypdf import PdfReader
except ImportError:
    try:
        import PyPDF2 as PdfReader
    except ImportError:
        print("Error: pypdf or PyPDF2 not installed.")
        sys.exit(1)

try:
    reader = PdfReader("Mixync.pdf")
    with open("pdf_content.txt", "w", encoding="utf-8") as f:
        for i, page in enumerate(reader.pages):
            f.write(f"--- Page {i+1} ---\n")
            text = page.extract_text()
            if text:
                f.write(text)
            f.write("\n\n")
    print("Success: Text extracted to pdf_content.txt")
except Exception as e:
    print(f"Error extracting PDF: {e}")
