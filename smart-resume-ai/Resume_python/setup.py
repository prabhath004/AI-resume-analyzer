from setuptools import setup, find_packages

setup(
    name="resume-matcher",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "spacy>=3.0.0",
        "fastapi",
        "python-multipart",
        "uvicorn",
        "python-docx",
        "PyPDF2",
        "pandas",
    ],
    python_requires=">=3.8",
)

# Add post-install script to download spacy model
import spacy.cli

try:
    spacy.cli.download("en_core_web_md")
except Exception as e:
    print(f"Error downloading spaCy model: {e}")
    print("Please run: python -m spacy download en_core_web_md") 