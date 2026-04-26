import json
import sys

def extract_code(ipynb_path):
    with open(ipynb_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    for i, cell in enumerate(data.get('cells', [])):
        if cell.get('cell_type') == 'code':
            print(f"\n--- Cell {i} ---")
            source = "".join(cell.get('source', []))
            print(source.encode('ascii', 'ignore').decode('ascii'))

if __name__ == "__main__":
    extract_code("load.ipynb")
