import fs from "fs";

export const readFile = async (fileName: string): Promise<Buffer | NodeJS.ErrnoException> => {
    return new Promise((resolve, reject) => {
        fs.readFile(fileName, (err: NodeJS.ErrnoException | null, data: Buffer) => {
            if (err) {
                reject(err);
            }
            resolve(data);
        });
    });
}