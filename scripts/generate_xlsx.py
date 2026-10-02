import zipfile
import datetime
import os

def create_xlsx(filepath, orders):
    # Minimal valid OpenXML XLSX structure
    workbook_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
    <sheets>
        <sheet name="Commandes KADYA DZ" sheetId="1" r:id="rId1"/>
    </sheets>
</workbook>'''

    content_types = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="xml" ContentType="application/xml"/>
    <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
    <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
    <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>'''

    rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>'''

    wb_rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
    <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>'''

    styles_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
    <fonts count="2">
        <font><name val="Calibri"/><sz val="11"/></font>
        <font><b/><color rgb="FFFFFFFF"/><name val="Calibri"/><sz val="11"/></font>
    </fonts>
    <fills count="3">
        <fill><patternFill patternType="none"/></fill>
        <fill><patternFill patternType="gray125"/></fill>
        <fill><patternFill patternType="solid"><fgColor rgb="FF1E293B"/></patternFill></fill>
    </fills>
    <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
    <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
    <cellXfs count="2">
        <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
        <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1">
            <alignment horizontal="center" vertical="center"/>
        </xf>
    </cellXfs>
</styleSheet>'''

    headers = ["Date", "ID Commande", "Nom Client", "Téléphone", "Wilaya", "Mode Livraison", "Produit", "Quantité", "Total (DZD)", "Statut"]
    
    rows_xml = []
    # Header row
    h_cells = []
    for c_idx, h in enumerate(headers):
        col_letter = chr(65 + c_idx)
        h_cells.append(f'<c r="{col_letter}1" t="inlineStr" s="1"><is><t>{h}</t></is></c>')
    rows_xml.append(f'<row r="1">{"".join(h_cells)}</row>')

    # Data rows
    for r_idx, o in enumerate(orders, start=2):
        cells = []
        for c_idx, val in enumerate(o):
            col_letter = chr(65 + c_idx)
            val_str = str(val).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            if c_idx in [7, 8]:  # Quantite or Total as number
                try:
                    cells.append(f'<c r="{col_letter}{r_idx}"><v>{int(val)}</v></c>')
                except ValueError:
                    cells.append(f'<c r="{col_letter}{r_idx}" t="inlineStr"><is><t>{val_str}</t></is></c>')
            else:
                cells.append(f'<c r="{col_letter}{r_idx}" t="inlineStr"><is><t>{val_str}</t></is></c>')
        rows_xml.append(f'<row r="{r_idx}">{"".join(cells)}</row>')

    sheet1_xml = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
    <cols>
        <col min="1" max="1" width="18" customWidth="1"/>
        <col min="2" max="2" width="15" customWidth="1"/>
        <col min="3" max="3" width="22" customWidth="1"/>
        <col min="4" max="4" width="16" customWidth="1"/>
        <col min="5" max="5" width="20" customWidth="1"/>
        <col min="6" max="6" width="16" customWidth="1"/>
        <col min="7" max="7" width="35" customWidth="1"/>
        <col min="8" max="8" width="10" customWidth="1"/>
        <col min="9" max="9" width="15" customWidth="1"/>
        <col min="10" max="10" width="15" customWidth="1"/>
    </cols>
    <sheetData>
        {"".join(rows_xml)}
    </sheetData>
    <autoFilter ref="A1:J{len(orders) + 1}"/>
</worksheet>'''

    with zipfile.ZipFile(filepath, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml', content_types)
        z.writestr('_rels/.rels', rels)
        z.writestr('xl/workbook.xml', workbook_xml)
        z.writestr('xl/_rels/workbook.xml.rels', wb_rels)
        z.writestr('xl/styles.xml', styles_xml)
        z.writestr('xl/worksheets/sheet1.xml', sheet1_xml)

if __name__ == '__main__':
    now = datetime.datetime.now().strftime("%d/%m/%Y %H:%M")
    sample_orders = [
        [now, "KD-7821", "Karim Benali", "0550123456", "16 - Alger", "Domicile", "Perceuse-Visseuse CROWN 20V CT21055LM", 1, 13100, "Nouveau"],
        [now, "KD-7820", "Youcef Belkacem", "0661987654", "31 - Oran", "Bureau", "Niveau Laser INGCO 3D 12 Lignes", 1, 15400, "Confirmé"],
        [now, "KD-7819", "Amine Djilali", "0770334455", "25 - Constantine", "Domicile", "Meuleuse d’angle INGCO 115mm 1010W", 2, 14200, "En livraison"],
        [now, "KD-7818", "Redha Mebarki", "0561223344", "19 - Sétif", "Bureau", "Poste à souder Inverter MMA 200A", 1, 21500, "Livré"],
        [now, "KD-7817", "Sofiane Mansouri", "0658443322", "09 - Blida", "Domicile", "Boîte à outils complète 108 pièces BEETRO", 1, 9800, "Livré"]
    ]
    out_dir = r"G:\Mon Drive"
    out_path = os.path.join(out_dir, "KADYA_DZ_COMMANDES_OFFICIEL.xlsx")
    create_xlsx(out_path, sample_orders)
    print("Created:", out_path)
