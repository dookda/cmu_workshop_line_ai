// Create, upload and set the workshop's three-area LINE Rich Menu.
import 'dotenv/config';
import { readFileSync, existsSync } from 'fs';
import { extname } from 'path';
import * as line from '@line/bot-sdk';

const imagePath = process.argv[2];
if (!imagePath) {
    console.error('Usage: node scripts/create_rich_menu.js <path/to/rich-menu.png>');
    process.exit(1);
}
if (!existsSync(imagePath)) {
    console.error(`Image not found: ${imagePath}`);
    process.exit(1);
}

const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
if (!token) {
    console.error('LINE_CHANNEL_ACCESS_TOKEN is required');
    process.exit(1);
}

const richMenuRequest = {
    size: { width: 2500, height: 1686 },
    selected: true,
    name: 'HealthLine AI Workshop',
    chatBarText: 'เมนูสุขภาพ',
    areas: [
        { bounds: { x: 0, y: 0, width: 834, height: 1686 }, action: { type: 'message', label: 'FAQ', text: 'faq' } },
        { bounds: { x: 834, y: 0, width: 833, height: 1686 }, action: { type: 'message', label: 'สถิติ', text: 'สถิติ' } },
        { bounds: { x: 1667, y: 0, width: 833, height: 1686 }, action: { type: 'message', label: 'ช่วยเหลือ', text: 'ช่วยเหลือ' } },
    ],
};

const client = new line.messagingApi.MessagingApiClient({ channelAccessToken: token });
const blobClient = new line.messagingApi.MessagingApiBlobClient({ channelAccessToken: token });

const { richMenuId } = await client.createRichMenu(richMenuRequest);
const contentType = extname(imagePath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
const imageBlob = new Blob([readFileSync(imagePath)], { type: contentType });
await blobClient.setRichMenuImage(richMenuId, imageBlob);
await client.setDefaultRichMenu(richMenuId);

console.log(`Rich Menu ready: ${richMenuId}`);
