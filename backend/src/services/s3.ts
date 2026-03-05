import { S3Client, PutObjectCommand} from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
    region: process.env.YANDEX_S3_REGION || 'ru-central1',
    endpoint: process.env.YANDEX_S3_ENDPOINT || 'https://storage.yandexcloud.net',
    credentials: {
        accessKeyId: process.env.YANDEX_S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.YANDEX_S3_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: false,
});

export const uploadToS3 = async (file: Buffer, filename: string, recipeId?: number): Promise<string> => {
    
    const timestamp = Date.now();
    const cleanName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    const key = recipeId 
        ? `recipes/${recipeId}/${timestamp}-${cleanName}`
        : `recipes/${timestamp}-${cleanName}`;
    const ext = filename.split('.').pop()?.toLowerCase();
    const contentType = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'webp': 'image/webp',
        'gif': 'image/gif'
    }[ext || 'jpg'] || 'image/jpeg';

    await s3Client.send(new PutObjectCommand({
        Bucket: process.env.YANDEX_S3_BUCKET!,
        Key: key,
        Body: file,
        ContentType: contentType,
        ACL: 'public-read'
    }));

    return `https://${process.env.YANDEX_S3_BUCKET}.storage.yandexcloud.net/${key}`;
};