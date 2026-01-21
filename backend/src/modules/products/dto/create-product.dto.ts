import { Transform } from "class-transformer";
import { IsNotEmpty, IsNumber, IsString, MaxLength, Min, MinLength } from "class-validator";

export class CreateProductDto {
    @IsString()
    @Transform(({ value }) => value.trim())
    @IsNotEmpty()
    @MinLength(5)
    @MaxLength(60)
    name: string;

    @IsNumber()
    @Transform(({ value }) => Number(value))
    @IsNotEmpty()
    @Min(0)
    price: number;

    @IsNumber()
    @Transform(({ value }) => Number(value))
    @IsNotEmpty()
    @Min(0)
    stock: number;
}
