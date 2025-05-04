import { IsNotEmpty, IsOptional } from "class-validator";

export class Image {
    data_url: string;
    id: string;
    isExisting: boolean;
}

export class ImagesDto {
    @IsNotEmpty()
    images: Image[];
}