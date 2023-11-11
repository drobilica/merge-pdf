"""
This script merges multiple PDF files into a single PDF file.
It supports merging files listed explicitly or specified using a wildcard pattern.
The output file name can be specified with the --output argument.
Recursive search in directories is supported with the -r option.
"""

import sys
import glob
from PyPDF2 import PdfMerger

def merge_pdfs(pdf_files, output_filename):
    """
    Merge multiple PDF files into a single PDF file.

    Args:
        pdf_files (list of str): List of file paths to the PDF files to be merged.
        output_filename (str): The path to the output merged PDF file.
    """
    merger = PdfMerger()

    for pdf in pdf_files:
        with open(pdf, 'rb') as f:
            merger.append(f)

    with open(output_filename, 'wb') as f:
        merger.write(f)
    merger.close()
    print(f"Merged PDF created: {output_filename}")

def expand_wildcards(file_args, recursive):
    """
    Expand wildcard patterns in file arguments to a list of file paths.

    Args:
        file_args (list of str): List of file arguments, which can include wildcards.
        recursive (bool): Whether to search for files recursively.

    Returns:
        list of str: Expanded list of file paths.
    """
    all_files = []
    for arg in file_args:
        if '*' in arg:  # Wildcard detected
            if recursive:
                all_files.extend(glob.glob(arg, recursive=True))
            else:
                all_files.extend(glob.glob(arg))
        else:
            all_files.append(arg)
    return all_files

def main():
    """
    Main function to parse command-line arguments and invoke the PDF merging process.
    """
    args = sys.argv[1:]

    if '--merge' not in args:
        print("df-merge.py --merge file1.pdf file2.pdf [--output merged.pdf] or --merge *.pdf [-r]")
        return

    recursive = '-r' in args
    if recursive:
        args.remove('-r')

    merge_index = args.index('--merge')
    output_index = args.index('--output') if '--output' in args else -1

    if output_index != -1:
        output_pdf = args[output_index + 1]
        files = args[merge_index + 1:output_index]
    else:
        output_pdf = 'merged.pdf'
        files = args[merge_index + 1:]

    expanded_files = expand_wildcards(files, recursive)

    if not all(file.endswith('.pdf') for file in expanded_files):
        print("All files must be PDFs.")
        return

    merge_pdfs(expanded_files, output_pdf)

if __name__ == '__main__':
    main()
