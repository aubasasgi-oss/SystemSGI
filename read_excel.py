import pandas as pd
import json
import sys

try:
    file_path = "C:/Users/sergio.montes/Documents/Codex/2026-06-23/documents-plugin-documents-openai-primary-runtime-3/Indicadores y Metas.xlsx"
    # The user probably uploaded a sheet with multiple tabs or a single main tab.
    # Let's read all sheets and their first few rows.
    excel_data = pd.read_excel(file_path, sheet_name=None, nrows=5)
    
    output = {}
    for sheet_name, df in excel_data.items():
        output[sheet_name] = {
            "columns": list(df.columns),
            "sample_data": df.head(3).to_dict(orient='records')
        }
        
    print(json.dumps(output, indent=2, default=str))
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
