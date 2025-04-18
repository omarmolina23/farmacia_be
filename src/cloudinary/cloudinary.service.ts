import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryResponse } from './cloudinary-response';
import streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {

    /*
    uploadFile(file: Express.Multer.File): Promise<CloudinaryResponse> {
        console.log('Uploading file to Cloudinary:', file);
        return new Promise<CloudinaryResponse>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                (error, result) => {
                    if (error) return reject(error);
                    if (result) {
                        resolve(result);
                    } else {
                        reject(new Error('Upload result is undefined'));
                    }
                },
            );

            streamifier.createReadStream(file.buffer).pipe(uploadStream);
        });
    }*/

        async uploadFile(file: Express.Multer.File): Promise<CloudinaryResponse> {
            console.log('Uploading file to Cloudinary:', file);
            return new Promise<CloudinaryResponse>((resolve, reject) => {
              cloudinary.uploader.upload(
                // Aquí simplemente pasamos el buffer
                `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
                {
                  public_id: `${file.filename}`, // Usamos el nombre de archivo como el public_id
                  resource_type: 'auto', // Permite que Cloudinary detecte el tipo de archivo automáticamente
                },
                (error, result) => {
                  if (error) return reject(error);
                  if (result) {
                    resolve(result);
                  } else {
                    reject(new Error('Upload result is undefined'));
                  }
                }
              );
            });
          }
}
