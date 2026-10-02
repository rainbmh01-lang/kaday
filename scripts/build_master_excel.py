import zipfile
import datetime
import os
import sys

def create_master_xlsx(filepath, orders):
    # XML templates for multi-sheet professional workbook
    content_types = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="xml" ContentType="application/xml"/>
    <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
    <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
    <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
    <Override PartName="/xl/worksheets/sheet3.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
    <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>'''

    rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>'''

    workbook_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
    <sheets>
        <sheet name="الطلبات - Commandes" sheetId="1" r:id="rId1"/>
        <sheet name="الإحصائيات - Analytics" sheetId="2" r:id="rId2"/>
        <sheet name="الروابط - Liens &amp; Config" sheetId="3" r:id="rId3"/>
    </sheets>
</workbook>'''

    wb_rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
    <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
    <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/>
    <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>'''

    styles_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
    <fonts count="4">
        <font><name val="Segoe UI"/><sz val="10"/></font>
        <font><b/><color rgb="FFFFFFFF"/><name val="Segoe UI"/><sz val="11"/></font>
        <font><b/><color rgb="FF1E293B"/><name val="Segoe UI"/><sz val="12"/></font>
        <font><b/><color rgb="FF1E293B"/><name val="Segoe UI"/><sz val="16"/></font>
    </fonts>
    <fills count="5">
        <fill><patternFill patternType="none"/></fill>
        <fill><patternFill patternType="gray125"/></fill>
        <fill><patternFill patternType="solid"><fgColor rgb="FF0F172A"/></patternFill></fill>
        <fill><patternFill patternType="solid"><fgColor rgb="FFF8FAFC"/></patternFill></fill>
        <fill><patternFill patternType="solid"><fgColor rgb="FFFEF3C7"/></patternFill></fill>
    </fills>
    <borders count="2">
        <border><left/><right/><top/><bottom/><diagonal/></border>
        <border>
            <left style="thin"><color rgb="FFE2E8F0"/></left>
            <right style="thin"><color rgb="FFE2E8F0"/></right>
            <top style="thin"><color rgb="FFE2E8F0"/></top>
            <bottom style="thin"><color rgb="FFE2E8F0"/></bottom>
        </border>
    </borders>
    <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
    <cellXfs count="5">
        <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0"/>
        <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyAlignment="1">
            <alignment horizontal="center" vertical="center" wrapText="1"/>
        </xf>
        <xf numFmtId="0" fontId="2" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyAlignment="1">
            <alignment horizontal="center" vertical="center"/>
        </xf>
        <xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>
        <xf numFmtId="0" fontId="0" fillId="3" borderId="1" xfId="0"/>
    </cellXfs>
</styleSheet>'''

    headers = [
        "N° Commande / رقم الطلب",
        "Date / التاريخ",
        "Nom & Prénom / الاسم واللقب",
        "Téléphone / رقم الهاتف",
        "الولاية",
        "البلدية / العنوان",
        "Type de livraison / نوع التوصيل",
        "Produit / المنتج",
        "Quantité / الكمية",
        "سعر المنتج",
        "تكلفة الشحن",
        "المجموع الإجمالي",
        "Statut / حالة الطلب",
        "Remarques / ملاحظات"
    ]

    col_widths = [18, 18, 22, 16, 22, 18, 20, 32, 12, 16, 16, 18, 18, 24]

    # Build Sheet 1: Orders
    cols_xml = "".join([f'<col min="{i+1}" max="{i+1}" width="{w}" customWidth="1"/>' for i, w in enumerate(col_widths)])
    
    rows_xml = []
    # Header row
    h_cells = []
    for c_idx, h in enumerate(headers):
        col_letter = get_col_letter(c_idx)
        h_cells.append(f'<c r="{col_letter}1" t="inlineStr" s="1"><is><t>{escape_xml(h)}</t></is></c>')
    rows_xml.append(f'<row r="1" ht="32" customHeight="1">{"".join(h_cells)}</row>')

    # Data rows
    for r_idx, o in enumerate(orders, start=2):
        cells = []
        for c_idx, val in enumerate(o):
            col_letter = get_col_letter(c_idx)
            val_str = escape_xml(str(val))
            cells.append(f'<c r="{col_letter}{r_idx}" t="inlineStr" s="0"><is><t>{val_str}</t></is></c>')
        rows_xml.append(f'<row r="{r_idx}" ht="22" customHeight="1">{"".join(cells)}</row>')

    sheet1_xml = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
    <cols>{cols_xml}</cols>
    <sheetData>{"".join(rows_xml)}</sheetData>
    <autoFilter ref="A1:N{max(len(orders) + 1, 2)}"/>
</worksheet>'''

    # Build Sheet 2: Analytics & Summary
    sheet2_xml = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
    <cols>
        <col min="1" max="1" width="30" customWidth="1"/>
        <col min="2" max="2" width="22" customWidth="1"/>
        <col min="3" max="3" width="22" customWidth="1"/>
    </cols>
    <sheetData>
        <row r="1" ht="30" customHeight="1">
            <c r="A1" t="inlineStr" s="3"><is><t>📊 TABLEAU DE BORD DES VENTES - KADYA DZ</t></is></c>
        </row>
        <row r="2"><c r="A2" t="inlineStr"><is><t>Mis à jour le: {datetime.datetime.now().strftime("%Y-%m-%d %H:%M")}</t></is></c></row>
        <row r="4" ht="25" customHeight="1">
            <c r="A4" t="inlineStr" s="1"><is><t>Indicateur Clé (KPI)</t></is></c>
            <c r="B4" t="inlineStr" s="1"><is><t>Valeur</t></is></c>
            <c r="C4" t="inlineStr" s="1"><is><t>Note</t></is></c>
        </row>
        <row r="5" ht="22" customHeight="1">
            <c r="A5" t="inlineStr" s="0"><is><t>Total Commandes Enregistrées</t></is></c>
            <c r="B5" t="inlineStr" s="2"><is><t>{len(orders)}</t></is></c>
            <c r="C5" t="inlineStr" s="0"><is><t>Base boutique + import</t></is></c>
        </row>
        <row r="6" ht="22" customHeight="1">
            <c r="A6" t="inlineStr" s="0"><is><t>Commandes Nouvelles</t></is></c>
            <c r="B6" t="inlineStr" s="2"><is><t>{sum(1 for o in orders if 'Nouveau' in str(o[12]))}</t></is></c>
            <c r="C6" t="inlineStr" s="0"><is><t>À appeler &amp; confirmer</t></is></c>
        </row>
        <row r="7" ht="22" customHeight="1">
            <c r="A7" t="inlineStr" s="0"><is><t>Commandes Confirmées</t></is></c>
            <c r="B7" t="inlineStr" s="2"><is><t>{sum(1 for o in orders if 'Confirmé' in str(o[12]))}</t></is></c>
            <c r="C7" t="inlineStr" s="0"><is><t>Prêtes pour expédition</t></is></c>
        </row>
        <row r="8" ht="22" customHeight="1">
            <c r="A8" t="inlineStr" s="0"><is><t>En cours de Livraison (Yalidine/ZR)</t></is></c>
            <c r="B8" t="inlineStr" s="2"><is><t>{sum(1 for o in orders if 'livraison' in str(o[12]))}</t></is></c>
            <c r="C8" t="inlineStr" s="0"><is><t>En transit chez le livreur</t></is></c>
        </row>
        <row r="9" ht="22" customHeight="1">
            <c r="A9" t="inlineStr" s="0"><is><t>Colis Livrés &amp; Encaissés</t></is></c>
            <c r="B9" t="inlineStr" s="2"><is><t>{sum(1 for o in orders if 'Livré' in str(o[12]))}</t></is></c>
            <c r="C9" t="inlineStr" s="0"><is><t>Paiement reçu</t></is></c>
        </row>
    </sheetData>
</worksheet>'''

    # Build Sheet 3: Links & Config
    sheet3_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
    <cols>
        <col min="1" max="1" width="28" customWidth="1"/>
        <col min="2" max="2" width="70" customWidth="1"/>
    </cols>
    <sheetData>
        <row r="1" ht="30" customHeight="1">
            <c r="A1" t="inlineStr" s="3"><is><t>🔗 LIENS &amp; CONFIGURATION DU MAGASIN</t></is></c>
        </row>
        <row r="3" ht="25" customHeight="1">
            <c r="A3" t="inlineStr" s="1"><is><t>Service / Destination</t></is></c>
            <c r="B3" t="inlineStr" s="1"><is><t>Lien URL &amp; Identifiants</t></is></c>
        </row>
        <row r="4" ht="22" customHeight="1">
            <c r="A4" t="inlineStr" s="0"><is><t>Boutique Vercel (Live)</t></is></c>
            <c r="B4" t="inlineStr" s="0"><is><t>https://kadya-dz-storefront.vercel.app</t></is></c>
        </row>
        <row r="5" ht="22" customHeight="1">
            <c r="A5" t="inlineStr" s="0"><is><t>Tableau de Bord Admin</t></is></c>
            <c r="B5" t="inlineStr" s="0"><is><t>https://kadya-dz-storefront.vercel.app/dashboard (Login: admin / Pass: kadya2024)</t></is></c>
        </row>
        <row r="6" ht="22" customHeight="1">
            <c r="A6" t="inlineStr" s="0"><is><t>Google Sheet Cloud Officiel</t></is></c>
            <c r="B6" t="inlineStr" s="0"><is><t>https://docs.google.com/spreadsheets/d/1yT77pxncTVPdq2RewH4CZv0oFwbp_NuejTLnUxjXV90/edit?gid=0#gid=0</t></is></c>
        </row>
        <row r="7" ht="22" customHeight="1">
            <c r="A7" t="inlineStr" s="0"><is><t>Flux JSON Commandes API</t></is></c>
            <c r="B7" t="inlineStr" s="0"><is><t>https://kadya-dz-storefront.vercel.app/api/drive-orders</t></is></c>
        </row>
        <row r="8" ht="22" customHeight="1">
            <c r="A8" t="inlineStr" s="0"><is><t>Meta Ads Dataset ID</t></is></c>
            <c r="B8" t="inlineStr" s="0"><is><t>4567517706859412 (Meta Pixel + CAPI Dédupliqué)</t></is></c>
        </row>
        <row r="9" ht="22" customHeight="1">
            <c r="A9" t="inlineStr" s="0"><is><t>Dossier Google Drive Local</t></is></c>
            <c r="B9" t="inlineStr" s="0"><is><t>G:\Mon Drive (Synchronisation PC instantanée)</t></is></c>
        </row>
    </sheetData>
</worksheet>'''

    # Ensure parent dir exists
    os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)

    with zipfile.ZipFile(filepath, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml', content_types)
        z.writestr('_rels/.rels', rels)
        z.writestr('xl/workbook.xml', workbook_xml)
        z.writestr('xl/_rels/workbook.xml.rels', wb_rels)
        z.writestr('xl/styles.xml', styles_xml)
        z.writestr('xl/worksheets/sheet1.xml', sheet1_xml)
        z.writestr('xl/worksheets/sheet2.xml', sheet2_xml)
        z.writestr('xl/worksheets/sheet3.xml', sheet3_xml)

def get_col_letter(col_idx):
    if col_idx < 26:
        return chr(65 + col_idx)
    return chr(65 + col_idx // 26 - 1) + chr(65 + col_idx % 26)

def escape_xml(s):
    return (s.replace('&', '&amp;')
             .replace('<', '&lt;')
             .replace('>', '&gt;')
             .replace('"', '&quot;')
             .replace("'", '&apos;'))

if __name__ == '__main__':
    # Test sample data with the exact 14 columns
    sample_orders = [
        [
            "#1001",
            "2026-10-02 21:55",
            "Hani Test",
            "0550123456",
            "16 - الجزائر (Alger)",
            "Alger Centre",
            "المكتب (Bureau)",
            "Perceuse-Visseuse CROWN 20V CT21055LM",
            "1",
            "12 500,00 DA",
            "600,00 DA",
            "13 100,00 DA",
            "Nouveau (جديد)",
            "Commande test officielle"
        ],
        [
            "#1002",
            "2026-10-02 22:10",
            "Karim Benali",
            "0661987654",
            "31 - وهران (Oran)",
            "Es Senia",
            "المنزل (Domicile)",
            "Niveau Laser INGCO 3D 12 Lignes",
            "1",
            "14 500,00 DA",
            "900,00 DA",
            "15 400,00 DA",
            "Confirmé (مؤكد)",
            "Client confirmé par téléphone"
        ],
        [
            "#1003",
            "2026-10-02 22:25",
            "Youcef Belkacem",
            "0770334455",
            "25 - قسنطينة (Constantine)",
            "El Khroub",
            "المكتب (Bureau)",
            "Meuleuse d’angle INGCO 115mm 1010W",
            "2",
            "13 600,00 DA",
            "600,00 DA",
            "14 200,00 DA",
            "En livraison (قيد التوصيل)",
            "Bordereau Yalidine généré"
        ],
        [
            "#1004",
            "2026-10-02 22:40",
            "Redha Mebarki",
            "0561223344",
            "19 - سطيف (Sétif)",
            "Sétif Ville",
            "المكتب (Bureau)",
            "Poste à souder Inverter MMA 200A",
            "1",
            "20 900,00 DA",
            "600,00 DA",
            "21 500,00 DA",
            "Livré (تم التوصيل)",
            "Colis livré et encaissé"
        ],
        [
            "#1005",
            "2026-10-02 22:50",
            "Sofiane Mansouri",
            "0658443322",
            "09 - البليدة (Blida)",
            "Boufarik",
            "المنزل (Domicile)",
            "Boîte à outils complète 108 pièces BEETRO",
            "1",
            "9 000,00 DA",
            "800,00 DA",
            "9 800,00 DA",
            "Livré (تم التوصيل)",
            "Colis livré et encaissé"
        ]
    ]

    drive_path = r'G:\Mon Drive\KADYA_DZ_COMMANDES_ET_VENTES_PRO.xlsx'
    create_master_xlsx(drive_path, sample_orders)
    print(f"Created master workbook at {drive_path}")

    # Also update KADYA_DZ_COMMANDES_OFFICIEL.xlsx with the 14 columns
    official_path = r'G:\Mon Drive\KADYA_DZ_COMMANDES_OFFICIEL.xlsx'
    create_master_xlsx(official_path, sample_orders)
    print(f"Updated official workbook at {official_path}")
