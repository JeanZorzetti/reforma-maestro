import { google } from 'googleapis';
import path from 'path';

const KEY_FILE_PATH = 'C:\\Users\\jeanz\\Downloads\\reforma-maestro-main\\reforma-maestro-mcp-b6cbb65a8a5e.json';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'];

async function main() {
    const auth = new google.auth.GoogleAuth({
        keyFile: KEY_FILE_PATH,
        scopes: SCOPES,
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const drive = google.drive({ version: 'v3', auth });

    console.log('Authenticating...');
    const authClient = await auth.getClient();
    console.log('Authenticated!');

    // List files in the folder to verify access
    const folderId = '1PWaI73jvVt93qrmgYRZf2EuP62CrJhne';
    console.log(`Listing files in folder: ${folderId}`);

    const res = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'files(id, name, mimeType)',
    });

    const files = res.data.files;
    if (files && files.length > 0) {
        console.log('Files found:');
        files.forEach((file) => {
            console.log(`${file.name} (${file.id})`);
        });
    } else {
        console.log('No files found.');
    }
}

main().catch(console.error);
