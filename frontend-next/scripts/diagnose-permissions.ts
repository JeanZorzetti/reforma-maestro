import { google } from 'googleapis';

const KEY_FILE_PATH = 'C:\\Users\\jeanz\\Downloads\\reforma-maestro-main\\reforma-maestro-mcp-b6cbb65a8a5e.json';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'];

async function main() {
    const auth = new google.auth.GoogleAuth({
        keyFile: KEY_FILE_PATH,
        scopes: SCOPES,
    });

    const drive = google.drive({ version: 'v3', auth });

    console.log('Checking authentication...');
    const about = await drive.about.get({ fields: 'user,storageQuota' });
    console.log('Authenticated User:', about.data.user);
    console.log('Storage Quota:', about.data.storageQuota);

    console.log('Attempting to create a simple text file in root...');
    try {
        const file = await drive.files.create({
            requestBody: {
                name: 'test-file.txt',
                mimeType: 'text/plain',
            },
            media: {
                mimeType: 'text/plain',
                body: 'Hello World',
            },
        });
        console.log('File created successfully:', file.data.id);

        // Clean up
        await drive.files.delete({ fileId: file.data.id! });
        console.log('File deleted.');
    } catch (error: any) {
        console.error('Failed to create file:', error.message);
        if (error.response) {
            console.error('Error details:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

main().catch(console.error);
