import { google } from 'googleapis';

const KEY_FILE_PATH = 'C:\\Users\\jeanz\\Downloads\\reforma-maestro-main\\reforma-maestro-mcp-b6cbb65a8a5e.json';
const SPREADSHEET_ID = '1Z_-5J4sHyb-35Jfoy2HoWIP10jJ8u-S1ZLkoykwm5F0';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

async function main() {
    const auth = new google.auth.GoogleAuth({
        keyFile: KEY_FILE_PATH,
        scopes: SCOPES,
    });

    const sheets = google.sheets({ version: 'v4', auth });

    console.log(`Populating spreadsheet: ${SPREADSHEET_ID}`);

    // 1. Get current sheets
    const metadata = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const existingSheets = metadata.data.sheets || [];

    const requests: any[] = [];

    // Helper to find sheet by title
    const findSheet = (title: string) => existingSheets.find(s => s.properties?.title === title);

    let instSheet = findSheet('INSTRUCOES');
    let dashSheet = findSheet('DASHBOARD');
    let dbSheet = findSheet('DB_LANCAMENTOS');
    let configSheet = findSheet('CONFIG');

    // If DASHBOARD is missing but we have a default "Página1" or "Sheet1", rename it
    if (!dashSheet) {
        const defaultSheet = existingSheets.find(s => s.properties?.title?.match(/^(Sheet|Página)\d+$/));
        if (defaultSheet) {
            requests.push({
                updateSheetProperties: {
                    properties: { sheetId: defaultSheet.properties?.sheetId, title: 'DASHBOARD' },
                    fields: 'title'
                }
            });
            // We can't easily update the local 'dashSheet' object to reflect the rename without re-fetching, 
            // but we can assume it will be available after batchUpdate.
        } else {
            requests.push({ addSheet: { properties: { title: 'DASHBOARD' } } });
        }
    }

    if (!instSheet) {
        requests.push({ addSheet: { properties: { title: 'INSTRUCOES', index: 0 } } });
    }
    if (!dbSheet) {
        requests.push({ addSheet: { properties: { title: 'DB_LANCAMENTOS' } } });
    }
    if (!configSheet) {
        requests.push({ addSheet: { properties: { title: 'CONFIG' } } });
    }

    // Execute creations/renames first
    if (requests.length > 0) {
        console.log('Creating/Renaming sheets...');
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            requestBody: { requests }
        });
        // Refresh metadata to get new IDs
        const newMeta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
        const newSheets = newMeta.data.sheets || [];
        instSheet = newSheets.find(s => s.properties?.title === 'INSTRUCOES');
        dashSheet = newSheets.find(s => s.properties?.title === 'DASHBOARD');
        dbSheet = newSheets.find(s => s.properties?.title === 'DB_LANCAMENTOS');
        configSheet = newSheets.find(s => s.properties?.title === 'CONFIG');
    }

    const instId = instSheet?.properties?.sheetId;
    const dashId = dashSheet?.properties?.sheetId;
    const dbId = dbSheet?.properties?.sheetId;
    const configId = configSheet?.properties?.sheetId;

    if (instId === undefined || dashId === undefined || dbId === undefined || configId === undefined) {
        throw new Error("Failed to resolve all sheet IDs");
    }

    console.log(`Sheet IDs - INSTRUCOES: ${instId}, DASHBOARD: ${dashId}, DB: ${dbId}, CONFIG: ${configId}`);

    // Update Grid Properties for all sheets
    const propRequests: any[] = [];
    propRequests.push({ updateSheetProperties: { properties: { sheetId: instId, gridProperties: { hideGridlines: true, rowCount: 50, columnCount: 10 } }, fields: 'gridProperties' } });
    propRequests.push({ updateSheetProperties: { properties: { sheetId: dashId, gridProperties: { hideGridlines: true, rowCount: 100, columnCount: 20 } }, fields: 'gridProperties' } });
    propRequests.push({ updateSheetProperties: { properties: { sheetId: dbId, gridProperties: { frozenRowCount: 1, rowCount: 2000, columnCount: 20 } }, fields: 'gridProperties' } });
    propRequests.push({ updateSheetProperties: { properties: { sheetId: configId, gridProperties: { rowCount: 100, columnCount: 10 } }, fields: 'gridProperties' } });

    await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: { requests: propRequests }
    });

    const contentRequests: any[] = [];

    // --- INSTRUCOES Content ---
    contentRequests.push({
        updateCells: {
            range: { sheetId: instId, startRowIndex: 0, endRowIndex: 25, startColumnIndex: 0, endColumnIndex: 8 },
            rows: [
                { values: [{ userEnteredValue: { stringValue: 'BEM-VINDO AO GESTOR FINANCEIRO DE OBRAS 1.0' }, userEnteredFormat: { textFormat: { fontSize: 14, bold: true, foregroundColor: { red: 0.1, green: 0.3, blue: 0.5 } } } }] },
                { values: [] },
                { values: [{ userEnteredValue: { stringValue: 'Esta planilha foi desenhada para ser simples e direta. Siga os passos abaixo:' } }] },
                { values: [] },
                { values: [{ userEnteredValue: { stringValue: '1. CONFIGURAÇÃO INICIAL (Aba CONFIG)' }, userEnteredFormat: { textFormat: { bold: true } } }] },
                { values: [{ userEnteredValue: { stringValue: '   - Vá até a aba "CONFIG".' } }] },
                { values: [{ userEnteredValue: { stringValue: '   - Defina o seu "Orçamento Teto" (quanto você pode gastar no total).' } }] },
                { values: [{ userEnteredValue: { stringValue: '   - Defina a % do "Fundo de Reserva" (dinheiro para emergências).' } }] },
                { values: [] },
                { values: [{ userEnteredValue: { stringValue: '2. LANÇAMENTOS DIÁRIOS (Aba DB_LANCAMENTOS)' }, userEnteredFormat: { textFormat: { bold: true } } }] },
                { values: [{ userEnteredValue: { stringValue: '   - Use esta aba para registrar TODAS as despesas.' } }] },
                { values: [{ userEnteredValue: { stringValue: '   - Preencha a Data, Item e Fornecedor.' } }] },
                { values: [{ userEnteredValue: { stringValue: '   - Selecione a Categoria (Material, Mão de Obra, etc.) no menu suspenso.' } }] },
                { values: [{ userEnteredValue: { stringValue: '   - Preencha o "Valor Previsto" e, quando pagar, o "Valor Pago".' } }] },
                { values: [{ userEnteredValue: { stringValue: '   - O Status e a Diferença são calculados automaticamente. Não mexa neles!' } }] },
                { values: [] },
                { values: [{ userEnteredValue: { stringValue: '3. ACOMPANHAMENTO (Aba DASHBOARD)' }, userEnteredFormat: { textFormat: { bold: true } } }] },
                { values: [{ userEnteredValue: { stringValue: '   - Aqui você vê o resumo de tudo.' } }] },
                { values: [{ userEnteredValue: { stringValue: '   - Acompanhe o "Saldo Restante" e o "% Utilizado" para não estourar o orçamento.' } }] },
                { values: [{ userEnteredValue: { stringValue: '   - O gráfico mostra onde seu dinheiro está indo.' } }] },
                { values: [] },
                { values: [{ userEnteredValue: { stringValue: 'DICA DE OURO:' }, userEnteredFormat: { textFormat: { bold: true, foregroundColor: { red: 0.8, green: 0.6, blue: 0 } } } }] },
                { values: [{ userEnteredValue: { stringValue: 'Mantenha a planilha atualizada. O controle financeiro só funciona com disciplina!' } }] },
            ],
            fields: 'userEnteredValue,userEnteredFormat'
        }
    });

    // --- DB_LANCAMENTOS Content ---
    // Headers
    contentRequests.push({
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

    // Data Validation
    contentRequests.push({
        setDataValidation: {
            range: { sheetId: dbId, startRowIndex: 1, endRowIndex: 1000, startColumnIndex: 1, endColumnIndex: 2 },
            rule: {
                condition: { type: 'ONE_OF_LIST', values: [{ userEnteredValue: 'Material' }, { userEnteredValue: 'Mão de Obra' }, { userEnteredValue: 'Taxas' }, { userEnteredValue: 'Mobília' }] },
                showCustomUi: true,
                strict: true
            }
        }
    });

    // Examples and Formulas
    const examples = [
        { date: '01/11/2024', cat: 'Material', item: 'Cimento (50 sacos)', prov: 'Leroy Merlin', est: 1500, paid: 1500 },
        { date: '05/11/2024', cat: 'Mão de Obra', item: 'Pedreiro (Semana 1)', prov: 'Sr. João', est: 2000, paid: 2000 },
        { date: '10/11/2024', cat: 'Taxas', item: 'Alvará Prefeitura', prov: 'Prefeitura', est: 500, paid: 0 },
        { date: '15/11/2024', cat: 'Mobília', item: 'Armário Cozinha', prov: 'Marceneiro Top', est: 5000, paid: 2500 },
    ];

    const rows = examples.map((ex, i) => ({
        values: [
            { userEnteredValue: { stringValue: ex.date } },
            { userEnteredValue: { stringValue: ex.cat } },
            { userEnteredValue: { stringValue: ex.item } },
            { userEnteredValue: { stringValue: ex.prov } },
            { userEnteredValue: { numberValue: ex.est } },
            { userEnteredValue: { numberValue: ex.paid } },
            { userEnteredValue: { formulaValue: `=IF(F${i + 2}>0; "Pago"; "Pendente")` } },
            { userEnteredValue: { formulaValue: `=E${i + 2}-F${i + 2}` } }
        ]
    }));

    // Fill remaining rows with empty data but formulas
    for (let i = examples.length; i < 20; i++) {
        rows.push({
            values: [
                { userEnteredValue: { stringValue: '' } },
                { userEnteredValue: { stringValue: '' } },
                { userEnteredValue: { stringValue: '' } },
                { userEnteredValue: { stringValue: '' } },
                { userEnteredValue: { numberValue: 0 } },
                { userEnteredValue: { numberValue: 0 } },
                { userEnteredValue: { formulaValue: `=IF(F${i + 2}>0; "Pago"; "Pendente")` } },
                { userEnteredValue: { formulaValue: `=E${i + 2}-F${i + 2}` } }
            ]
        });
    }

    contentRequests.push({
        updateCells: {
            range: { sheetId: dbId, startRowIndex: 1, endRowIndex: 21, startColumnIndex: 0, endColumnIndex: 8 },
            rows: rows,
            fields: 'userEnteredValue'
        }
    });

    // --- CONFIG Content ---
    contentRequests.push({
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

    // --- DASHBOARD Content ---
    contentRequests.push({
        updateCells: {
            range: { sheetId: dashId, startRowIndex: 1, endRowIndex: 13, startColumnIndex: 1, endColumnIndex: 5 },
            rows: [
                { values: [{ userEnteredValue: { stringValue: 'DASHBOARD FINANCEIRO' }, userEnteredFormat: { textFormat: { fontSize: 18, bold: true } } }] },
                { values: [] },
                { values: [{ userEnteredValue: { stringValue: 'Orçamento Total' } }, { userEnteredValue: { formulaValue: '=CONFIG!B2' } }] },
                { values: [{ userEnteredValue: { stringValue: 'Total Gasto' } }, { userEnteredValue: { formulaValue: '=SUM(DB_LANCAMENTOS!F:F)' } }] },
                { values: [{ userEnteredValue: { stringValue: 'Saldo Restante' } }, { userEnteredValue: { formulaValue: '=B4-B5' } }] },
                { values: [{ userEnteredValue: { stringValue: '% Utilizado' } }, { userEnteredValue: { formulaValue: '=B5/B4' }, userEnteredFormat: { numberFormat: { type: 'PERCENT' } } }] },
                { values: [] },
                { values: [{ userEnteredValue: { stringValue: 'Gastos por Categoria' }, userEnteredFormat: { textFormat: { bold: true } } }] },
                { values: [{ userEnteredValue: { stringValue: 'Material' } }, { userEnteredValue: { formulaValue: '=SUMIF(DB_LANCAMENTOS!B:B; "Material"; DB_LANCAMENTOS!F:F)' } }] },
                { values: [{ userEnteredValue: { stringValue: 'Mão de Obra' } }, { userEnteredValue: { formulaValue: '=SUMIF(DB_LANCAMENTOS!B:B; "Mão de Obra"; DB_LANCAMENTOS!F:F)' } }] },
                { values: [{ userEnteredValue: { stringValue: 'Taxas' } }, { userEnteredValue: { formulaValue: '=SUMIF(DB_LANCAMENTOS!B:B; "Taxas"; DB_LANCAMENTOS!F:F)' } }] },
                { values: [{ userEnteredValue: { stringValue: 'Mobília' } }, { userEnteredValue: { formulaValue: '=SUMIF(DB_LANCAMENTOS!B:B; "Mobília"; DB_LANCAMENTOS!F:F)' } }] },
            ],
            fields: 'userEnteredValue,userEnteredFormat'
        }
    });

    // Chart
    contentRequests.push({
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

    // Conditional Formatting
    contentRequests.push({
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

    console.log('Applying content updates...');
    await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: { requests: contentRequests },
    });

    console.log('Done!');
}

main().catch(console.error);
