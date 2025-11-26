import { google } from 'googleapis';

const KEY_FILE_PATH = 'C:\\Users\\jeanz\\Downloads\\reforma-maestro-main\\reforma-maestro-mcp-b6cbb65a8a5e.json';
const FOLDER_ID = '1PWaI73jvVt93qrmgYRZf2EuP62CrJhne';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'];

async function main() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE_PATH,
    scopes: SCOPES,
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const drive = google.drive({ version: 'v3', auth });

  console.log('Creating spreadsheet in root...');

  // 1. Create the Spreadsheet (in root first to avoid permission issues)
  const createRes = await sheets.spreadsheets.create({
    requestBody: {
      properties: {
        title: 'Gestor Financeiro de Obras 1.0',
      },
    },
  });

  const spreadsheetId = createRes.data.spreadsheetId;
  if (!spreadsheetId) throw new Error('Failed to create spreadsheet');
  console.log(`Spreadsheet created: ${spreadsheetId}`);

  // 2. Move to the correct folder
  try {
    const file = await drive.files.get({
      fileId: spreadsheetId,
      fields: 'parents',
    });

    const previousParents = file.data.parents?.join(',') || '';

    await drive.files.update({
      fileId: spreadsheetId,
      addParents: FOLDER_ID,
      removeParents: previousParents,
      fields: 'id, parents',
    });
    console.log(`Moved to folder: ${FOLDER_ID}`);
  } catch (error) {
    console.error('Error moving file (check if Service Account has Editor access to folder):', error);
  }

  // 3. Setup Sheets and Structure
  const sheetMetadata = await sheets.spreadsheets.get({ spreadsheetId });
  const defaultSheet = sheetMetadata.data.sheets?.[0];
  const defaultSheetId = defaultSheet?.properties?.sheetId;

  if (defaultSheetId === undefined) throw new Error("Could not find default sheet");

  console.log('Configuring sheets...');

  const requests: any[] = [];

  // Rename default sheet to DASHBOARD and hide gridlines
  requests.push({
    updateSheetProperties: {
      properties: {
        sheetId: defaultSheetId,
        title: 'DASHBOARD',
        gridProperties: { hideGridlines: true }
      },
      fields: 'title,gridProperties.hideGridlines'
    }
  });

  // Add other sheets
  requests.push(
    { addSheet: { properties: { title: 'DB_LANCAMENTOS', gridProperties: { frozenRowCount: 1 } } } },
    { addSheet: { properties: { title: 'CONFIG' } } }
  );

  // Execute structure changes
  const structureRes = await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests },
  });

  const dashId = defaultSheetId;
  const dbId = structureRes.data.replies?.[1]?.addSheet?.properties?.sheetId;
  const configId = structureRes.data.replies?.[2]?.addSheet?.properties?.sheetId;

  if (dbId === undefined || configId === undefined) throw new Error("Failed to get new sheet IDs");

  const requests2: any[] = [];

  // --- DB_LANCAMENTOS Setup ---
  // Headers
  requests2.push({
    updateCells: {
      range: { sheetId: dbId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 8 },
      rows: [{
        values: [
          { userEnteredValue: { stringValue: 'Data' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 } } },
          { userEnteredValue: { stringValue: 'Categoria' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 } } },
          { userEnteredValue: { stringValue: 'Item' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 } } },
          { userEnteredValue: { stringValue: 'Fornecedor' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 } } },
          { userEnteredValue: { stringValue: 'Valor Previsto (R$)' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 } } },
          { userEnteredValue: { stringValue: 'Valor Pago (R$)' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 } } },
          { userEnteredValue: { stringValue: 'Status' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 } } },
          { userEnteredValue: { stringValue: 'Diferença' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 } } },
        ]
      }],
      fields: 'userEnteredValue,userEnteredFormat'
    }
  });

  // Data Validation for Category
  requests2.push({
    setDataValidation: {
      range: { sheetId: dbId, startRowIndex: 1, endRowIndex: 1000, startColumnIndex: 1, endColumnIndex: 2 },
      rule: {
        condition: { type: 'ONE_OF_LIST', values: [{ userEnteredValue: 'Material' }, { userEnteredValue: 'Mão de Obra' }, { userEnteredValue: 'Taxas' }, { userEnteredValue: 'Mobília' }] },
        showCustomUi: true,
        strict: true
      }
    }
  });

  // --- CONFIG Setup ---
  requests2.push({
    updateCells: {
      range: { sheetId: configId, startRowIndex: 0, endRowIndex: 3, startColumnIndex: 0, endColumnIndex: 2 },
      rows: [
        { values: [{ userEnteredValue: { stringValue: 'Parâmetro' }, userEnteredFormat: { textFormat: { bold: true } } }, { userEnteredValue: { stringValue: 'Valor' }, userEnteredFormat: { textFormat: { bold: true } } }] },
        { values: [{ userEnteredValue: { stringValue: 'Orçamento Teto' } }, { userEnteredValue: { numberValue: 50000 } }] },
        { values: [{ userEnteredValue: { stringValue: 'Fundo de Reserva (%)' } }, { userEnteredValue: { numberValue: 0.1 } }] }
      ],
      fields: 'userEnteredValue,userEnteredFormat'
    }
  });

  // --- DASHBOARD Setup ---
  requests2.push({
    updateCells: {
      range: { sheetId: dashId, startRowIndex: 1, endRowIndex: 12, startColumnIndex: 1, endColumnIndex: 5 },
      rows: [
        { values: [{ userEnteredValue: { stringValue: 'DASHBOARD FINANCEIRO' }, userEnteredFormat: { textFormat: { fontSize: 18, bold: true } } }] },
        { values: [] },
        { values: [{ userEnteredValue: { stringValue: 'Orçamento Total' } }, { userEnteredValue: { formulaValue: '=CONFIG!B2' } }] },
        { values: [{ userEnteredValue: { stringValue: 'Total Gasto' } }, { userEnteredValue: { formulaValue: '=SUM(DB_LANCAMENTOS!F:F)' } }] },
        { values: [{ userEnteredValue: { stringValue: 'Saldo Restante' } }, { userEnteredValue: { formulaValue: '=B4-B5' } }] },
        { values: [{ userEnteredValue: { stringValue: '% Utilizado' } }, { userEnteredValue: { formulaValue: '=B5/B4' }, userEnteredFormat: { numberFormat: { type: 'PERCENT' } } }] },
        { values: [] },
        { values: [{ userEnteredValue: { stringValue: 'Gastos por Categoria' }, userEnteredFormat: { textFormat: { bold: true } } }] },
        { values: [{ userEnteredValue: { stringValue: 'Material' } }, { userEnteredValue: { formulaValue: '=SUMIF(DB_LANCAMENTOS!B:B, "Material", DB_LANCAMENTOS!F:F)' } }] },
        { values: [{ userEnteredValue: { stringValue: 'Mão de Obra' } }, { userEnteredValue: { formulaValue: '=SUMIF(DB_LANCAMENTOS!B:B, "Mão de Obra", DB_LANCAMENTOS!F:F)' } }] },
        { values: [{ userEnteredValue: { stringValue: 'Taxas' } }, { userEnteredValue: { formulaValue: '=SUMIF(DB_LANCAMENTOS!B:B, "Taxas", DB_LANCAMENTOS!F:F)' } }] },
        { values: [{ userEnteredValue: { stringValue: 'Mobília' } }, { userEnteredValue: { formulaValue: '=SUMIF(DB_LANCAMENTOS!B:B, "Mobília", DB_LANCAMENTOS!F:F)' } }] },
      ],
      fields: 'userEnteredValue,userEnteredFormat'
    }
  });

  // Add Chart
  requests2.push({
    addChart: {
      chart: {
        spec: {
          title: 'Distribuição de Gastos',
          pieChart: {
            legendPosition: 'RIGHT_LEGEND',
            domain: { sourceRange: { sources: [{ sheetId: dashId, startRowIndex: 9, endRowIndex: 13, startColumnIndex: 1, endColumnIndex: 2 }] } },
            series: { sourceRange: { sources: [{ sheetId: dashId, startRowIndex: 9, endRowIndex: 13, startColumnIndex: 2, endColumnIndex: 3 }] } },
          }
        },
        position: {
          overlayPosition: {
            anchorCell: { sheetId: dashId, rowIndex: 1, columnIndex: 6 },
            widthPixels: 450,
            heightPixels: 300
          }
        }
      }
    }
  });

  // Conditional Formatting (Difference < 0)
  requests2.push({
    addConditionalFormatRule: {
      rule: {
        ranges: [{ sheetId: dbId, startRowIndex: 1, endRowIndex: 1000, startColumnIndex: 7, endColumnIndex: 8 }],
        booleanRule: {
          condition: { type: 'NUMBER_LESS', values: [{ userEnteredValue: '0' }] },
          format: { backgroundColor: { red: 1, green: 0.8, blue: 0.8 }, textFormat: { foregroundColor: { red: 0.8, green: 0, blue: 0 } } }
        }
      },
      index: 0
    }
  });

  // Add formulas to DB_LANCAMENTOS (First 20 rows as demo)
  requests2.push({
    updateCells: {
      range: { sheetId: dbId, startRowIndex: 1, endRowIndex: 21, startColumnIndex: 6, endColumnIndex: 8 },
      rows: Array.from({ length: 20 }, (_, i) => ({
        values: [
          { userEnteredValue: { formulaValue: `=IF(F${i + 2}>0, "Pago", "Pendente")` } },
          { userEnteredValue: { formulaValue: `=E${i + 2}-F${i + 2}` } }
        ]
      })),
      fields: 'userEnteredValue'
    }
  });

  console.log('Applying content updates...');
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: requests2 },
  });

  console.log('Done! Spreadsheet URL: ' + createRes.data.spreadsheetUrl);
}

main().catch(console.error);
