import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
    region: process.env.YANDEX_S3_REGION || 'ru-central1',
    endpoint: process.env.YANDEX_S3_ENDPOINT || 'https://storage.yandexcloud.net',
    credentials: {
        accessKeyId: process.env.YANDEX_S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.YANDEX_S3_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: false,
});

export const uploadToS3 = async (file: Buffer, filename: string): Promise<string> => {
    const key = `recipes/${Date.now()}-${filename}`;

    await s3Client.send(new PutObjectCommand({
        Bucket: process.env.YANDEX_S3_BUCKET!,
        Key: key,
        Body: file,
        ContentType: 'image/jpeg',
        ACL: 'public-read'
    }));

    return `https://${process.env.YANDEX_S3_BUCKET}.storage.yandexcloud.net/${key}`;
};